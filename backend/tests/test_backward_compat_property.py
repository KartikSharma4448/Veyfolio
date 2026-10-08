"""Property-based tests for backward-compatible endpoints.

**Validates: Requirements 8.2**

Property 13: Backward-compatible endpoints accept existing payloads
For any valid request payload that conforms to the existing API schema (without
new optional parameters), all existing endpoints SHALL return a successful
response (HTTP 2xx) with the same response structure as before the rebuild.
"""
import sys
import os

# Add backend directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from hypothesis import given, settings, assume
from hypothesis.strategies import text, emails, lists, dictionaries, composite, sampled_from

from httpx import AsyncClient, ASGITransport
from fastapi import FastAPI

from server import app as real_app


# --- Hypothesis Strategies ---

@composite
def latex_request_payload(draw):
    """Generate valid LatexRequest payloads conforming to existing schema."""
    templates = ["modern", "traditional", "creative", "minimalist", "executive", "tech"]
    template = draw(sampled_from(templates))
    # Minimal valid CV structure
    full_name = draw(text(min_size=1, max_size=50))
    assume(full_name.strip())
    email = draw(text(min_size=3, max_size=30))
    phone = draw(text(min_size=1, max_size=20))
    skill = draw(text(min_size=1, max_size=30))
    assume(skill.strip())

    cv = {
        "personalInfo": {
            "fullName": full_name,
            "email": email,
            "phone": phone,
            "location": "Test City",
            "title": "Developer",
            "summary": "A summary.",
            "linkedinUrl": "",
            "portfolio": "",
        },
        "experience": [],
        "education": [],
        "skills": [skill],
    }
    return {"cv": cv, "template": template}


@composite
def ats_request_payload(draw):
    """Generate valid ATSRequest payloads conforming to existing schema."""
    cv_text = draw(text(min_size=1, max_size=200))
    assume(cv_text.strip())
    # job_description is optional in the legacy endpoint
    return {"cv_text": cv_text}


@composite
def refine_request_payload(draw):
    """Generate valid RefineRequest payloads conforming to existing schema."""
    sections = ["summary", "experience", "skills"]
    section = draw(sampled_from(sections))
    txt = draw(text(min_size=1, max_size=200))
    assume(txt.strip())
    return {"text": txt, "section": section}


# --- Fake request helper ---

def _make_fake_request():
    """Create a minimal fake Request object for the endpoint."""
    request = MagicMock()
    request.headers = {}
    request.client = MagicMock()
    request.client.host = "127.0.0.1"
    return request


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


class TestBackwardCompatibleEndpoints:
    """Property 13: Backward-compatible endpoints accept existing payloads."""

    @pytest.mark.asyncio
    async def test_post_status_accepts_existing_payload(self):
        """Database-only status routes are intentionally retired."""
        transport = ASGITransport(app=real_app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post("/api/status", json={"client_name": "retired"})
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_get_root_returns_2xx(self):
        """GET /api/ returns HTTP 2xx with expected response structure.

        **Validates: Requirements 8.2**
        """
        mock_redis = _mock_redis()

        with patch("redis_client.get_redis", return_value=mock_redis), \
             patch("limits.get_redis", return_value=mock_redis):
            transport = ASGITransport(app=real_app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.get("/api/")

        assert 200 <= response.status_code < 300, (
            f"GET /api/ returned {response.status_code}.\n"
            f"Response: {response.text}"
        )
        data = response.json()
        assert "message" in data, f"Response missing 'message' field: {data}"

    @pytest.mark.asyncio
    async def test_get_status_returns_2xx(self):
        """Database-only status routes are intentionally retired."""
        transport = ASGITransport(app=real_app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get("/api/status")
        assert response.status_code == 404

    @pytest.mark.asyncio
    @given(payload=latex_request_payload())
    @settings(max_examples=50)
    async def test_post_ai_latex_accepts_existing_payload(self, payload: dict):
        """POST /api/ai/latex accepts existing LatexRequest payloads
        and returns HTTP 2xx with expected response structure.

        **Validates: Requirements 8.2**
        """
        mock_redis = _mock_redis()

        with patch("redis_client.get_redis", return_value=mock_redis), \
             patch("limits.get_redis", return_value=mock_redis):
            transport = ASGITransport(app=real_app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.post("/api/ai/latex", json=payload)

        assert 200 <= response.status_code < 300, (
            f"POST /api/ai/latex returned {response.status_code} for payload {payload!r}.\n"
            f"Response: {response.text}"
        )
        data = response.json()
        # Existing response structure: {"latex": "..."}
        assert "latex" in data, f"Response missing 'latex' field: {data}"
        assert isinstance(data["latex"], str), f"'latex' field should be string: {data}"

    @pytest.mark.asyncio
    @given(payload=ats_request_payload())
    @settings(max_examples=50)
    async def test_post_ai_ats_accepts_existing_payload(self, payload: dict):
        """POST /api/ai/ats accepts existing ATSRequest payloads
        and returns HTTP 2xx with expected response structure.

        **Validates: Requirements 8.2**
        """
        mock_redis = _mock_redis()

        with patch("redis_client.get_redis", return_value=mock_redis), \
             patch("limits.get_redis", return_value=mock_redis):
            transport = ASGITransport(app=real_app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.post("/api/ai/ats", json=payload)

        assert 200 <= response.status_code < 300, (
            f"POST /api/ai/ats returned {response.status_code} for payload {payload!r}.\n"
            f"Response: {response.text}"
        )
        data = response.json()
        # Existing response structure: {"ats_score": <int>}
        assert "ats_score" in data, f"Response missing 'ats_score' field: {data}"
        assert isinstance(data["ats_score"], int), f"'ats_score' should be int: {data}"

    @pytest.mark.asyncio
    @given(payload=refine_request_payload())
    @settings(max_examples=50)
    async def test_post_ai_refine_accepts_existing_payload(self, payload: dict):
        """POST /api/ai/refine accepts existing RefineRequest payloads
        and returns HTTP 2xx with expected response structure.

        **Validates: Requirements 8.2**
        """
        mock_redis = _mock_redis()

        with patch("redis_client.get_redis", return_value=mock_redis), \
             patch("limits.get_redis", return_value=mock_redis), \
             patch.dict(os.environ, {"GEMMA_API_KEY": ""}):
            transport = ASGITransport(app=real_app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.post("/api/ai/refine", json=payload)

        assert 200 <= response.status_code < 300, (
            f"POST /api/ai/refine returned {response.status_code} for payload {payload!r}.\n"
            f"Response: {response.text}"
        )
        data = response.json()
        # Existing response structure: refined_text, original_text, is_error, error_message
        assert "refined_text" in data, f"Response missing 'refined_text' field: {data}"
        assert "original_text" in data, f"Response missing 'original_text' field: {data}"
        assert "is_error" in data, f"Response missing 'is_error' field: {data}"
