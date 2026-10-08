"""Integration tests for end-to-end API flows.

Tests the full FastAPI application with mocked external services (Redis,
NVIDIA API) to verify:
- Refine endpoint returns valid response structure
- PDF compile endpoint returns PDF content-type on valid input
- ATS score endpoint returns bounded score with term breakdown
- Existing endpoints still work with original payloads

Validates: Requirements 8.1, 8.2, 8.4
"""
import sys
import os
import json
import subprocess
from unittest.mock import patch, AsyncMock, MagicMock

# Add backend directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from httpx import AsyncClient, ASGITransport

from server import app as real_app


# --- Mock helpers ---


def _mock_redis():
    """Create a mock Redis client that supports async operations."""
    mock_redis = AsyncMock()
    mock_redis.get = AsyncMock(return_value=None)
    mock_redis.set = AsyncMock(return_value=True)
    mock_redis.incr = AsyncMock(return_value=1)
    mock_redis.expire = AsyncMock(return_value=True)
    mock_redis.keys = AsyncMock(return_value=[])
    mock_redis.hincrby = AsyncMock(return_value=1)
    return mock_redis


@pytest.fixture
def mock_redis_fixture():
    """Provide a mock Redis instance and patch it into the app."""
    return _mock_redis()


@pytest.fixture
def sample_cv():
    """Valid CV data for testing."""
    return {
        "personalInfo": {
            "fullName": "Jane Smith",
            "email": "jane@example.com",
            "phone": "+1-555-0199",
            "location": "San Francisco, CA",
            "title": "Senior Software Engineer",
            "summary": "Experienced full-stack developer with 8 years in Python and React.",
            "linkedinUrl": "linkedin.com/in/janesmith",
            "portfolio": "janesmith.dev",
        },
        "experience": [
            {
                "company": "Acme Corp",
                "position": "Lead Engineer",
                "location": "San Francisco, CA",
                "startDate": "2019-03",
                "endDate": "2024-01",
                "current": False,
                "description": "Led a team of 10 engineers building microservices.",
            }
        ],
        "education": [
            {
                "institution": "Stanford University",
                "degree": "Master of Science",
                "field": "Computer Science",
                "startDate": "2014-09",
                "endDate": "2016-06",
                "gpa": "3.9",
            }
        ],
        "skills": ["Python", "React", "Docker", "Kubernetes", "AWS"],
    }


# --- Integration Tests: Refine Endpoint ---


class TestRefineEndpointIntegration:
    """Integration tests for POST /api/ai/refine end-to-end flow."""

    @pytest.mark.asyncio
    async def test_refine_returns_valid_response_structure(self):
        """Refine endpoint returns response with refined_text, original_text,
        is_error, and error_message fields.

        Validates: Requirements 8.1, 8.2
        """
        mock_redis = _mock_redis()
        payload = {"text": "Managed a team of developers", "section": "experience"}

        # Mock NVIDIA API to return a refined response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.raise_for_status = MagicMock()
        mock_response.json = MagicMock(return_value={
            "generated_text": "Led and mentored a cross-functional team of software engineers"
        })

        mock_http_client = AsyncMock()
        mock_http_client.post = AsyncMock(return_value=mock_response)
        mock_http_client.__aenter__ = AsyncMock(return_value=mock_http_client)
        mock_http_client.__aexit__ = AsyncMock(return_value=False)

        with patch("redis_client.get_redis", return_value=mock_redis), \
             patch("limits.get_redis", return_value=mock_redis), \
             patch.dict(os.environ, {"GEMMA_API_KEY": "test-key"}), \
             patch("ai_router.GEMMA_KEY", "test-key"), \
             patch("httpx.AsyncClient", return_value=mock_http_client):

            transport = ASGITransport(app=real_app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.post("/api/ai/refine", json=payload)

        assert response.status_code == 200
        data = response.json()
        # Verify response structure
        assert "refined_text" in data
        assert "original_text" in data
        assert "is_error" in data
        assert "error_message" in data
        # Verify content
        assert data["original_text"] == "Managed a team of developers"
        assert data["is_error"] is False
        assert isinstance(data["refined_text"], str)
        assert len(data["refined_text"]) > 0

    @pytest.mark.asyncio
    async def test_refine_error_fallback_returns_original_text(self):
        """When NVIDIA API is unavailable, refine returns original text with error flag.

        Validates: Requirements 8.1
        """
        mock_redis = _mock_redis()
        payload = {"text": "Built REST APIs", "section": "experience"}

        with patch("redis_client.get_redis", return_value=mock_redis), \
             patch("limits.get_redis", return_value=mock_redis), \
             patch.dict(os.environ, {"GEMMA_API_KEY": ""}), \
             patch("ai_router.GEMMA_KEY", ""):

            transport = ASGITransport(app=real_app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.post("/api/ai/refine", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert data["refined_text"] == "Built REST APIs"
        assert data["original_text"] == "Built REST APIs"
        assert data["is_error"] is True
        assert data["error_message"] is not None

    @pytest.mark.asyncio
    async def test_refine_validates_section_field(self):
        """Refine endpoint rejects invalid section values.

        Validates: Requirements 8.1
        """
        mock_redis = _mock_redis()
        payload = {"text": "Some text", "section": "invalid_section"}

        with patch("redis_client.get_redis", return_value=mock_redis), \
             patch("limits.get_redis", return_value=mock_redis):

            transport = ASGITransport(app=real_app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.post("/api/ai/refine", json=payload)

        # Should return 422 for invalid section (Pydantic validation)
        assert response.status_code == 422


# --- Integration Tests: PDF Compile Endpoint ---


class TestPDFCompileEndpointIntegration:
    """Integration tests for POST /api/pdf/compile end-to-end flow."""

    @pytest.mark.asyncio
    async def test_pdf_compile_returns_pdf_content_type(self, sample_cv):
        """PDF compile endpoint returns application/pdf content-type on valid input.

        Validates: Requirements 8.1
        """
        fake_pdf_bytes = b"%PDF-1.4 fake pdf content for integration test"

        mock_proc = MagicMock()
        mock_proc.returncode = 0
        mock_proc.stdout = ""
        mock_proc.stderr = ""

        with patch("pdf_router.subprocess.run", return_value=mock_proc), \
             patch("pdf_router.os.path.exists", return_value=True), \
             patch("pdf_router.tempfile.mkdtemp", return_value="/tmp/cvcraft_integ"), \
             patch("pdf_router.shutil.rmtree"):

            def open_side_effect(path, *args, **kwargs):
                if "rb" in args or kwargs.get("mode") == "rb":
                    read_mock = MagicMock()
                    read_mock.__enter__ = MagicMock(return_value=read_mock)
                    read_mock.__exit__ = MagicMock(return_value=False)
                    read_mock.read = MagicMock(return_value=fake_pdf_bytes)
                    return read_mock
                else:
                    write_mock = MagicMock()
                    write_mock.__enter__ = MagicMock(return_value=write_mock)
                    write_mock.__exit__ = MagicMock(return_value=False)
                    return write_mock

            with patch("builtins.open", side_effect=open_side_effect):
                transport = ASGITransport(app=real_app)
                async with AsyncClient(transport=transport, base_url="http://test") as client:
                    response = await client.post(
                        "/api/pdf/compile",
                        json={"cv": sample_cv, "template": "modern"},
                    )

        assert response.status_code == 200
        assert response.headers["content-type"] == "application/pdf"
        assert response.content == fake_pdf_bytes

    @pytest.mark.asyncio
    async def test_pdf_compile_with_all_templates(self, sample_cv):
        """PDF compile endpoint works with all supported templates.

        Validates: Requirements 8.1
        """
        templates = ["modern", "traditional", "creative", "minimalist", "executive", "tech"]
        fake_pdf_bytes = b"%PDF-1.4 template test"

        mock_proc = MagicMock()
        mock_proc.returncode = 0
        mock_proc.stdout = ""
        mock_proc.stderr = ""

        for template in templates:
            with patch("pdf_router.subprocess.run", return_value=mock_proc), \
                 patch("pdf_router.os.path.exists", return_value=True), \
                 patch("pdf_router.tempfile.mkdtemp", return_value="/tmp/cvcraft_tmpl"), \
                 patch("pdf_router.shutil.rmtree"):

                def open_side_effect(path, *args, **kwargs):
                    if "rb" in args or kwargs.get("mode") == "rb":
                        read_mock = MagicMock()
                        read_mock.__enter__ = MagicMock(return_value=read_mock)
                        read_mock.__exit__ = MagicMock(return_value=False)
                        read_mock.read = MagicMock(return_value=fake_pdf_bytes)
                        return read_mock
                    else:
                        write_mock = MagicMock()
                        write_mock.__enter__ = MagicMock(return_value=write_mock)
                        write_mock.__exit__ = MagicMock(return_value=False)
                        return write_mock

                with patch("builtins.open", side_effect=open_side_effect):
                    transport = ASGITransport(app=real_app)
                    async with AsyncClient(transport=transport, base_url="http://test") as client:
                        response = await client.post(
                            "/api/pdf/compile",
                            json={"cv": sample_cv, "template": template},
                        )

                assert response.status_code == 200, (
                    f"Template '{template}' failed with status {response.status_code}"
                )
                assert response.headers["content-type"] == "application/pdf"

    @pytest.mark.asyncio
    async def test_pdf_compile_invalid_template_returns_400(self, sample_cv):
        """PDF compile endpoint returns 400 for invalid template name.

        Validates: Requirements 8.1
        """
        transport = ASGITransport(app=real_app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                "/api/pdf/compile",
                json={"cv": sample_cv, "template": "nonexistent"},
            )

        assert response.status_code == 400


# --- Integration Tests: ATS Score Endpoint ---


class TestATSScoreEndpointIntegration:
    """Integration tests for POST /api/ats/score end-to-end flow."""

    @pytest.mark.asyncio
    async def test_ats_score_returns_bounded_score_with_term_breakdown(self):
        """ATS score endpoint returns score in [0, 100] with matched/missing terms.

        Validates: Requirements 8.1, 8.4
        """
        mock_redis = _mock_redis()
        payload = {
            "cv_text": "Experienced Python developer with React and Docker skills. "
                       "Built microservices and REST APIs. Familiar with AWS and CI/CD.",
            "job_description": "Looking for a senior engineer with Python, React, "
                               "Kubernetes, and AWS experience. Must have CI/CD knowledge.",
        }

        with patch("redis_client.get_redis", return_value=mock_redis), \
             patch("limits.get_redis", return_value=mock_redis), \
             patch("ats_router.EMBED_KEY", ""), \
             patch("ats_router.RERANK_KEY", ""):

            transport = ASGITransport(app=real_app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.post("/api/ats/score", json=payload)

        assert response.status_code == 200
        data = response.json()

        # Score is bounded between 0 and 100
        assert "score" in data
        assert isinstance(data["score"], int)
        assert 0 <= data["score"] <= 100

        # Term breakdown is present
        assert "matched_terms" in data
        assert "missing_terms" in data
        assert isinstance(data["matched_terms"], list)
        assert isinstance(data["missing_terms"], list)

        # Method is reported
        assert "method" in data
        assert data["method"] in ("semantic", "heuristic")

    @pytest.mark.asyncio
    async def test_ats_score_heuristic_fallback_on_missing_keys(self):
        """ATS score falls back to heuristic when API keys are not configured.

        Validates: Requirements 8.1, 8.4
        """
        mock_redis = _mock_redis()
        payload = {
            "cv_text": "Software engineer with Java and Spring Boot experience.",
            "job_description": "Need Java developer with Spring Boot and microservices.",
        }

        with patch("redis_client.get_redis", return_value=mock_redis), \
             patch("limits.get_redis", return_value=mock_redis), \
             patch("ats_router.EMBED_KEY", ""), \
             patch("ats_router.RERANK_KEY", ""):

            transport = ASGITransport(app=real_app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.post("/api/ats/score", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert data["method"] == "heuristic"
        assert 0 <= data["score"] <= 100

    @pytest.mark.asyncio
    async def test_ats_score_with_semantic_scoring(self):
        """ATS score uses semantic method when embedding/reranking services are available.

        Validates: Requirements 8.1
        """
        mock_redis = _mock_redis()
        payload = {
            "cv_text": "Python developer experienced in machine learning and data science.",
            "job_description": "Looking for ML engineer with Python and deep learning.",
        }

        # Mock embedding response
        mock_embed_response = MagicMock()
        mock_embed_response.status_code = 200
        mock_embed_response.raise_for_status = MagicMock()
        mock_embed_response.json = MagicMock(return_value={
            "data": [
                {"embedding": [0.1] * 128},
                {"embedding": [0.2] * 128},
            ]
        })

        # Mock rerank response
        mock_rerank_response = MagicMock()
        mock_rerank_response.status_code = 200
        mock_rerank_response.raise_for_status = MagicMock()
        mock_rerank_response.json = MagicMock(return_value={
            "scores": [0.75, 0.60, 0.80]
        })

        call_count = [0]

        async def mock_post(url, **kwargs):
            call_count[0] += 1
            if "embeddings" in url:
                return mock_embed_response
            elif "score" in url:
                return mock_rerank_response
            return mock_embed_response

        mock_http_client = AsyncMock()
        mock_http_client.post = mock_post
        mock_http_client.__aenter__ = AsyncMock(return_value=mock_http_client)
        mock_http_client.__aexit__ = AsyncMock(return_value=False)

        with patch("redis_client.get_redis", return_value=mock_redis), \
             patch("limits.get_redis", return_value=mock_redis), \
             patch("ats_router.EMBED_KEY", "test-embed-key"), \
             patch("ats_router.RERANK_KEY", "test-rerank-key"), \
             patch("httpx.AsyncClient", return_value=mock_http_client):

            transport = ASGITransport(app=real_app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.post("/api/ats/score", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert data["method"] == "semantic"
        assert 0 <= data["score"] <= 100
        assert isinstance(data["matched_terms"], list)
        assert isinstance(data["missing_terms"], list)

    @pytest.mark.asyncio
    async def test_ats_score_empty_job_description(self):
        """ATS score handles empty job description gracefully.

        Validates: Requirements 8.1
        """
        mock_redis = _mock_redis()
        payload = {
            "cv_text": "Python developer with 5 years experience.",
            "job_description": "",
        }

        with patch("redis_client.get_redis", return_value=mock_redis), \
             patch("limits.get_redis", return_value=mock_redis), \
             patch("ats_router.EMBED_KEY", ""), \
             patch("ats_router.RERANK_KEY", ""):

            transport = ASGITransport(app=real_app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.post("/api/ats/score", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert 0 <= data["score"] <= 100
        assert isinstance(data["matched_terms"], list)
        assert isinstance(data["missing_terms"], list)


# --- Integration Tests: Existing Endpoints Backward Compatibility ---


class TestExistingEndpointsIntegration:
    """Integration tests verifying existing endpoints still work with original payloads.

    Validates: Requirements 8.2, 8.4
    """

    @pytest.mark.asyncio
    async def test_get_root_endpoint(self):
        """GET /api/ returns expected response structure.

        Validates: Requirements 8.2
        """
        mock_redis = _mock_redis()

        with patch("redis_client.get_redis", return_value=mock_redis), \
             patch("limits.get_redis", return_value=mock_redis):

            transport = ASGITransport(app=real_app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.get("/api/")

        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["message"] == "Hello World"

    @pytest.mark.asyncio
    async def test_post_status_endpoint(self):
        """Database-only status routes are intentionally retired."""
        transport = ASGITransport(app=real_app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post("/api/status", json={"client_name": "retired"})
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_get_status_endpoint(self):
        """Database-only status routes are intentionally retired."""
        transport = ASGITransport(app=real_app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get("/api/status")
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_post_ai_latex_endpoint(self):
        """POST /api/ai/latex returns LaTeX source with original payload format.

        Validates: Requirements 8.2
        """
        mock_redis = _mock_redis()
        payload = {
            "cv": {
                "personalInfo": {
                    "fullName": "Test User",
                    "email": "test@test.com",
                    "phone": "555-1234",
                    "location": "NYC",
                    "title": "Dev",
                    "summary": "A developer.",
                },
                "experience": [
                    {
                        "company": "TestCo",
                        "position": "Engineer",
                        "description": "Built things.",
                    }
                ],
                "education": [],
                "skills": ["Python", "JavaScript"],
            },
            "template": "modern",
        }

        with patch("redis_client.get_redis", return_value=mock_redis), \
             patch("limits.get_redis", return_value=mock_redis):

            transport = ASGITransport(app=real_app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.post("/api/ai/latex", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert "latex" in data
        assert isinstance(data["latex"], str)
        assert len(data["latex"]) > 0

    @pytest.mark.asyncio
    async def test_post_ai_ats_legacy_endpoint(self):
        """POST /api/ai/ats (legacy) returns ats_score with original payload format.

        Validates: Requirements 8.2, 8.4
        """
        mock_redis = _mock_redis()
        payload = {"cv_text": "Python developer with 5 years experience in web development."}

        with patch("redis_client.get_redis", return_value=mock_redis), \
             patch("limits.get_redis", return_value=mock_redis):

            transport = ASGITransport(app=real_app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.post("/api/ai/ats", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert "ats_score" in data
        assert isinstance(data["ats_score"], int)
        assert 0 <= data["ats_score"] <= 100

    @pytest.mark.asyncio
    async def test_post_ai_ats_legacy_with_job_description(self):
        """POST /api/ai/ats (legacy) works with optional job_description parameter.

        Validates: Requirements 8.2, 8.4
        """
        mock_redis = _mock_redis()
        payload = {
            "cv_text": "Python developer experienced in React and AWS cloud services.",
            "job_description": "Looking for Python and React developer with AWS.",
        }

        with patch("redis_client.get_redis", return_value=mock_redis), \
             patch("limits.get_redis", return_value=mock_redis):

            transport = ASGITransport(app=real_app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.post("/api/ai/ats", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert "ats_score" in data
        assert isinstance(data["ats_score"], int)
        assert 0 <= data["ats_score"] <= 100

    @pytest.mark.asyncio
    async def test_rate_limiting_preserved(self):
        """Rate limiting behavior is preserved for existing endpoints.

        Validates: Requirements 8.4
        """
        mock_redis = _mock_redis()
        # Simulate rate limit exceeded (incr returns value > limit)
        mock_redis.incr = AsyncMock(return_value=100)

        with patch("redis_client.get_redis", return_value=mock_redis), \
             patch("limits.get_redis", return_value=mock_redis):

            transport = ASGITransport(app=real_app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.post(
                    "/api/ai/ats",
                    json={"cv_text": "test"},
                )

        # Should be rate limited (429)
        assert response.status_code == 429
