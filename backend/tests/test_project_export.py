from template_engine import render_template


def test_modern_export_preserves_title_projects_and_escaping():
    document = render_template({
        "personalInfo": {"fullName": "Demo", "title": "Frontend Engineer"},
        "projects": [{"name": "Travel & Maps", "techStack": "React", "link": "https://example.com/demo_app", "description": "Built search\nAdded filters"}],
    }, "modern")
    assert "Frontend Engineer" in document
    assert r"\section*{Projects}" in document
    assert r"Travel \& Maps" in document
    assert r"demo\_app" in document
    assert "Built search" in document
    assert document.index("Built search") < document.index(r"\end{document}")


def test_empty_projects_do_not_create_an_empty_section():
    document = render_template({"personalInfo": {"fullName": "Demo"}, "projects": [{"name": ""}]}, "modern")
    assert r"\section*{Projects}" not in document
