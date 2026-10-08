"""
Template Engine for CVCraft - generates LaTeX source from structured CV data.

Supports six distinct professional templates: modern, traditional, creative,
minimalist, executive, and tech. All use standard fonts (Computer Modern,
Latin Modern) for ATS parseability.
"""
from typing import Dict, Any, List


SUPPORTED_TEMPLATES = [
    "modern", "traditional", "creative",
    "minimalist", "executive", "tech"
]


def escape_latex(text: str) -> str:
    r"""Escape LaTeX special characters: & % $ # _ { } ~ ^ \

    Returns empty string for None input.
    """
    if text is None:
        return ""
    out = str(text)
    # Use null-byte placeholders for chars whose LaTeX replacements
    # contain braces, to prevent double-escaping.
    out = out.replace('\\', '\x00BS\x00')
    out = out.replace('~', '\x00TI\x00')
    out = out.replace('^', '\x00CA\x00')
    # Escape simple characters
    out = out.replace('&', '\\&')
    out = out.replace('%', '\\%')
    out = out.replace('$', '\\$')
    out = out.replace('#', '\\#')
    out = out.replace('_', '\\_')
    out = out.replace('{', '\\{')
    out = out.replace('}', '\\}')
    # Now replace placeholders (braces in these won't be re-escaped)
    out = out.replace('\x00BS\x00', '\\textbackslash{}')
    out = out.replace('\x00TI\x00', '\\textasciitilde{}')
    out = out.replace('\x00CA\x00', '\\textasciicircum{}')
    return out


def render_template(cv: Dict[str, Any], template: str = "modern") -> str:
    """Generate complete LaTeX document from CV data and template name."""
    if template not in SUPPORTED_TEMPLATES:
        raise ValueError(f"Unknown template: {template}")
    escaped = _escape_cv_data(cv)
    dispatch = {
        "modern": _render_modern,
        "traditional": _render_traditional,
        "creative": _render_creative,
        "minimalist": _render_minimalist,
        "executive": _render_executive,
        "tech": _render_tech,
    }
    document = dispatch[template](escaped)
    projects = escaped["projects"]
    if projects:
        lines = [r"\section*{Projects}"]
        for project in projects:
            if not any(project.values()):
                continue
            if project["name"]:
                lines.append(r"\noindent\textbf{" + project["name"] + r"}\par")
            if project["techStack"]:
                lines.append(r"\noindent\textit{" + project["techStack"] + r"}\par")
            if project["link"]:
                lines.append(r"\noindent " + project["link"] + r"\par")
            bullets = [line.strip() for line in project["description"].splitlines() if line.strip()]
            if bullets:
                lines.append(r"\begin{itemize}")
                for bullet in bullets:
                    lines.append(r"\item " + bullet.lstrip(" -*\u2022"))
                lines.append(r"\end{itemize}")
        document = document.replace(r"\end{document}", "\n".join(lines) + "\n" + r"\end{document}")
    return document


def _escape_cv_data(cv: Dict[str, Any]) -> Dict[str, Any]:
    """Escape all string fields in CV data structure."""
    pi = cv.get("personalInfo", {})
    escaped_pi = {
        "fullName": escape_latex(pi.get("fullName", "")),
        "email": escape_latex(pi.get("email", "")),
        "phone": escape_latex(pi.get("phone", "")),
        "location": escape_latex(pi.get("location", "")),
        "title": escape_latex(pi.get("title", "")),
        "summary": escape_latex(pi.get("summary", "")),
        "linkedinUrl": escape_latex(pi.get("linkedinUrl", "")),
        "portfolio": escape_latex(pi.get("portfolio", "")),
    }
    escaped_exp = []
    for exp in cv.get("experience", []):
        escaped_exp.append({
            "company": escape_latex(exp.get("company", "")),
            "position": escape_latex(exp.get("position", "")),
            "location": escape_latex(exp.get("location", "")),
            "startDate": escape_latex(exp.get("startDate", "")),
            "endDate": escape_latex(exp.get("endDate", "")),
            "current": exp.get("current", False),
            "description": escape_latex(exp.get("description", "")),
        })
    escaped_edu = []
    for edu in cv.get("education", []):
        escaped_edu.append({
            "institution": escape_latex(edu.get("institution", "")),
            "degree": escape_latex(edu.get("degree", "")),
            "field": escape_latex(edu.get("field", "")),
            "startDate": escape_latex(edu.get("startDate", "")),
            "endDate": escape_latex(edu.get("endDate", "")),
            "gpa": escape_latex(edu.get("gpa", "")),
        })
    escaped_skills = [escape_latex(s) for s in cv.get("skills", [])]
    return {
        "personalInfo": escaped_pi,
        "experience": escaped_exp,
        "education": escaped_edu,
        "skills": escaped_skills,
        "projects": [{key: escape_latex(project.get(key, ""))
                      for key in ("name", "techStack", "link", "description")}
                     for project in cv.get("projects", [])
                     if any(project.get(key) for key in ("name", "techStack", "link", "description"))],
    }


def _date_range(start: str, end: str, current: bool = False) -> str:
    """Format a date range string."""
    end_str = "Present" if current else end
    if start and end_str:
        return f"{start} -- {end_str}"
    return start or end_str or ""


def _join_nonempty(parts: List[str], sep: str) -> str:
    """Join non-empty strings with a separator."""
    return sep.join(p for p in parts if p)


def _render_modern(data: Dict[str, Any]) -> str:
    """Modern template: Clean lines, blue accents, sans-serif headings."""
    pi = data["personalInfo"]
    lines = []
    lines.append("\\documentclass[11pt,a4paper]{article}")
    lines.append("\\usepackage[margin=0.75in]{geometry}")
    lines.append("\\usepackage[T1]{fontenc}")
    lines.append("\\usepackage{lmodern}")
    lines.append("\\usepackage{enumitem}")
    lines.append("\\usepackage{xcolor}")
    lines.append("\\usepackage{titlesec}")
    lines.append("")
    lines.append("\\definecolor{modernblue}{RGB}{41,98,255}")
    lines.append("\\titleformat{\\section}{\\large\\bfseries\\sffamily\\color{modernblue}}{}{0em}{}[\\titlerule]")
    lines.append("\\titlespacing*{\\section}{0pt}{12pt}{6pt}")
    lines.append("\\setlist{nosep,leftmargin=*}")
    lines.append("\\pagestyle{empty}")
    lines.append("")
    lines.append("\\begin{document}")
    lines.append("")
    # Header
    lines.append("\\begin{center}")
    lines.append("{\\LARGE\\bfseries\\sffamily " + pi["fullName"] + "}")
    if pi["title"]:
        lines.append("\\\\ {\\large\\color{modernblue} " + pi["title"] + "}")
    contact = _join_nonempty([pi["email"], pi["phone"], pi["location"]], " $\\cdot$ ")
    if contact:
        lines.append("\\\\ \\vspace{2pt}")
        lines.append(contact)
    links = _join_nonempty([pi["linkedinUrl"], pi["portfolio"]], " $\\cdot$ ")
    if links:
        lines.append("\\\\")
        lines.append(links)
    lines.append("\\end{center}")
    lines.append("")
    # Summary
    if pi["summary"]:
        lines.append("\\section*{Professional Summary}")
        lines.append(pi["summary"])
        lines.append("")
    # Experience
    if data["experience"]:
        lines.append("\\section*{Experience}")
        for exp in data["experience"]:
            dr = _date_range(exp["startDate"], exp["endDate"], exp["current"])
            lines.append("\\noindent\\textbf{" + exp["position"] + "} \\hfill " + dr + "\\\\")
            loc = " -- " + exp["location"] if exp["location"] else ""
            lines.append("\\textit{" + exp["company"] + loc + "}\\\\")
            if exp["description"]:
                lines.append(exp["description"])
            lines.append("\\vspace{6pt}")
            lines.append("")
    # Education
    if data["education"]:
        lines.append("\\section*{Education}")
        for edu in data["education"]:
            dr = _date_range(edu["startDate"], edu["endDate"])
            degree = edu["degree"]
            if edu["field"]:
                degree += " in " + edu["field"]
            lines.append("\\noindent\\textbf{" + degree + "} \\hfill " + dr + "\\\\")
            gpa_part = " \\hfill GPA: " + edu["gpa"] if edu["gpa"] else ""
            lines.append("\\textit{" + edu["institution"] + "}" + gpa_part + "\\\\")
            lines.append("\\vspace{6pt}")
            lines.append("")
    # Skills
    if data["skills"]:
        lines.append("\\section*{Skills}")
        lines.append(", ".join(data["skills"]))
        lines.append("")
    lines.append("\\end{document}")
    return "\n".join(lines)


def _render_traditional(data: Dict[str, Any]) -> str:
    """Traditional template: Classic serif, formal headings, horizontal rules."""
    pi = data["personalInfo"]
    lines = []
    lines.append("\\documentclass[11pt,a4paper]{article}")
    lines.append("\\usepackage[margin=1in]{geometry}")
    lines.append("\\usepackage[T1]{fontenc}")
    lines.append("\\usepackage{lmodern}")
    lines.append("\\usepackage{enumitem}")
    lines.append("")
    lines.append("\\newcommand{\\ressection}[1]{\\vspace{10pt}\\noindent{\\large\\bfseries\\scshape #1}\\vspace{2pt}\\hrule\\vspace{6pt}}")
    lines.append("\\setlist{nosep,leftmargin=*}")
    lines.append("\\pagestyle{empty}")
    lines.append("")
    lines.append("\\begin{document}")
    lines.append("")
    # Header
    lines.append("{\\LARGE\\bfseries " + pi["fullName"] + "}")
    if pi["title"]:
        lines.append("\\\\ {\\large\\itshape " + pi["title"] + "}")
    lines.append("\\vspace{4pt}")
    contact = _join_nonempty([pi["email"], pi["phone"], pi["location"]], " | ")
    if contact:
        lines.append("\\\\")
        lines.append(contact)
    links = _join_nonempty([pi["linkedinUrl"], pi["portfolio"]], " | ")
    if links:
        lines.append("\\\\")
        lines.append(links)
    lines.append("")
    # Summary
    if pi["summary"]:
        lines.append("\\ressection{Professional Summary}")
        lines.append(pi["summary"])
        lines.append("")
    # Experience
    if data["experience"]:
        lines.append("\\ressection{Professional Experience}")
        for exp in data["experience"]:
            dr = _date_range(exp["startDate"], exp["endDate"], exp["current"])
            lines.append("\\noindent\\textbf{" + exp["position"] + "} \\hfill " + dr + "\\\\")
            loc = ", " + exp["location"] if exp["location"] else ""
            lines.append("\\textit{" + exp["company"] + loc + "}\\\\")
            if exp["description"]:
                lines.append(exp["description"])
            lines.append("\\vspace{8pt}")
            lines.append("")
    # Education
    if data["education"]:
        lines.append("\\ressection{Education}")
        for edu in data["education"]:
            dr = _date_range(edu["startDate"], edu["endDate"])
            lines.append("\\noindent\\textbf{" + edu["institution"] + "} \\hfill " + dr + "\\\\")
            degree = edu["degree"]
            if edu["field"]:
                degree += " in " + edu["field"]
            gpa_part = " \\hfill GPA: " + edu["gpa"] if edu["gpa"] else ""
            lines.append(degree + gpa_part + "\\\\")
            lines.append("\\vspace{8pt}")
            lines.append("")
    # Skills
    if data["skills"]:
        lines.append("\\ressection{Skills}")
        lines.append("\\begin{itemize}")
        for skill in data["skills"]:
            lines.append("\\item " + skill)
        lines.append("\\end{itemize}")
        lines.append("")
    lines.append("\\end{document}")
    return "\n".join(lines)


def _render_creative(data: Dict[str, Any]) -> str:
    """Creative template: Two-column, purple/red accents, bold colors."""
    pi = data["personalInfo"]
    lines = []
    lines.append("\\documentclass[11pt,a4paper]{article}")
    lines.append("\\usepackage[margin=0.5in]{geometry}")
    lines.append("\\usepackage[T1]{fontenc}")
    lines.append("\\usepackage{lmodern}")
    lines.append("\\usepackage{enumitem}")
    lines.append("\\usepackage{xcolor}")
    lines.append("\\usepackage{titlesec}")
    lines.append("\\usepackage{multicol}")
    lines.append("")
    lines.append("\\definecolor{creativepurple}{RGB}{102,45,145}")
    lines.append("\\definecolor{creativeaccent}{RGB}{220,50,50}")
    lines.append("\\titleformat{\\section}{\\large\\bfseries\\color{creativepurple}}{}{0em}{}[\\color{creativeaccent}\\titlerule]")
    lines.append("\\titlespacing*{\\section}{0pt}{10pt}{4pt}")
    lines.append("\\setlist{nosep,leftmargin=*}")
    lines.append("\\pagestyle{empty}")
    lines.append("")
    lines.append("\\begin{document}")
    lines.append("")
    # Header
    lines.append("\\begin{center}")
    lines.append("{\\Huge\\bfseries\\color{creativepurple} " + pi["fullName"] + "}")
    if pi["title"]:
        lines.append("\\\\ {\\Large\\color{creativeaccent} " + pi["title"] + "}")
    lines.append("\\\\ \\vspace{4pt}")
    contact = _join_nonempty([pi["email"], pi["phone"], pi["location"]], " $\\diamond$ ")
    if contact:
        lines.append(contact)
    links = _join_nonempty([pi["linkedinUrl"], pi["portfolio"]], " $\\diamond$ ")
    if links:
        lines.append("\\\\")
        lines.append(links)
    lines.append("\\end{center}")
    lines.append("")
    # Summary
    if pi["summary"]:
        lines.append("\\section*{About Me}")
        lines.append("\\textit{" + pi["summary"] + "}")
        lines.append("")
    # Two-column layout
    lines.append("\\begin{multicols}{2}")
    # Experience
    if data["experience"]:
        lines.append("\\section*{Experience}")
        for exp in data["experience"]:
            dr = _date_range(exp["startDate"], exp["endDate"], exp["current"])
            lines.append("\\noindent\\textbf{" + exp["position"] + "}\\\\")
            lines.append("{\\color{creativepurple}\\textit{" + exp["company"] + "}} \\hfill {\\small " + dr + "}\\\\")
            if exp["description"]:
                lines.append(exp["description"] + "\\\\")
            lines.append("\\vspace{6pt}")
            lines.append("")
    lines.append("\\columnbreak")
    # Education
    if data["education"]:
        lines.append("\\section*{Education}")
        for edu in data["education"]:
            dr = _date_range(edu["startDate"], edu["endDate"])
            degree = edu["degree"]
            if edu["field"]:
                degree += " in " + edu["field"]
            lines.append("\\noindent\\textbf{" + degree + "}\\\\")
            lines.append("\\textit{" + edu["institution"] + "} \\hfill {\\small " + dr + "}\\\\")
            if edu["gpa"]:
                lines.append("GPA: " + edu["gpa"] + "\\\\")
            lines.append("\\vspace{6pt}")
            lines.append("")
    # Skills
    if data["skills"]:
        lines.append("\\section*{Skills}")
        lines.append(" $\\bullet$ ".join(data["skills"]))
        lines.append("")
    lines.append("\\end{multicols}")
    lines.append("\\end{document}")
    return "\n".join(lines)


def _render_minimalist(data: Dict[str, Any]) -> str:
    """Minimalist template: Maximum whitespace, minimal formatting."""
    pi = data["personalInfo"]
    lines = []
    lines.append("\\documentclass[11pt,a4paper]{article}")
    lines.append("\\usepackage[margin=1.2in]{geometry}")
    lines.append("\\usepackage[T1]{fontenc}")
    lines.append("\\usepackage{lmodern}")
    lines.append("\\usepackage{enumitem}")
    lines.append("")
    lines.append("\\setlist{nosep,leftmargin=*}")
    lines.append("\\pagestyle{empty}")
    lines.append("\\setlength{\\parindent}{0pt}")
    lines.append("\\setlength{\\parskip}{6pt}")
    lines.append("")
    lines.append("\\begin{document}")
    lines.append("")
    # Header
    lines.append("{\\Large " + pi["fullName"] + "}")
    lines.append("")
    if pi["title"]:
        lines.append(pi["title"])
        lines.append("")
    contact = _join_nonempty([pi["email"], pi["phone"], pi["location"]], " / ")
    if contact:
        lines.append(contact)
        lines.append("")
    links = _join_nonempty([pi["linkedinUrl"], pi["portfolio"]], " / ")
    if links:
        lines.append(links)
        lines.append("")
    lines.append("\\vspace{12pt}")
    lines.append("")
    # Summary
    if pi["summary"]:
        lines.append(pi["summary"])
        lines.append("")
        lines.append("\\vspace{8pt}")
        lines.append("")
    # Experience
    if data["experience"]:
        lines.append("{\\bfseries Experience}")
        lines.append("")
        for exp in data["experience"]:
            dr = _date_range(exp["startDate"], exp["endDate"], exp["current"])
            loc = ", " + exp["location"] if exp["location"] else ""
            lines.append("\\textbf{" + exp["position"] + "}, " + exp["company"] + loc + " \\hfill " + dr)
            lines.append("")
            if exp["description"]:
                lines.append(exp["description"])
                lines.append("")
    # Education
    if data["education"]:
        lines.append("{\\bfseries Education}")
        lines.append("")
        for edu in data["education"]:
            dr = _date_range(edu["startDate"], edu["endDate"])
            degree = edu["degree"]
            if edu["field"]:
                degree += " in " + edu["field"]
            lines.append("\\textbf{" + degree + "}, " + edu["institution"] + " \\hfill " + dr)
            lines.append("")
            if edu["gpa"]:
                lines.append("GPA: " + edu["gpa"])
                lines.append("")
    # Skills
    if data["skills"]:
        lines.append("{\\bfseries Skills}")
        lines.append("")
        lines.append(", ".join(data["skills"]))
        lines.append("")
    lines.append("\\end{document}")
    return "\n".join(lines)


def _render_executive(data: Dict[str, Any]) -> str:
    """Executive template: Dark styling, gold accents, serif fonts, formal."""
    pi = data["personalInfo"]
    lines = []
    lines.append("\\documentclass[12pt,a4paper]{article}")
    lines.append("\\usepackage[margin=0.9in]{geometry}")
    lines.append("\\usepackage[T1]{fontenc}")
    lines.append("\\usepackage{lmodern}")
    lines.append("\\usepackage{enumitem}")
    lines.append("\\usepackage{xcolor}")
    lines.append("\\usepackage{titlesec}")
    lines.append("")
    lines.append("\\definecolor{execnavy}{RGB}{0,32,63}")
    lines.append("\\definecolor{execgold}{RGB}{183,135,38}")
    lines.append("\\titleformat{\\section}{\\Large\\bfseries\\color{execnavy}\\scshape}{}{0em}{}[\\color{execgold}\\rule{\\textwidth}{1pt}]")
    lines.append("\\titlespacing*{\\section}{0pt}{14pt}{8pt}")
    lines.append("\\setlist{nosep,leftmargin=*}")
    lines.append("\\pagestyle{empty}")
    lines.append("")
    lines.append("\\begin{document}")
    lines.append("")
    # Header
    lines.append("\\begin{center}")
    lines.append("{\\Huge\\bfseries\\scshape " + pi["fullName"] + "}")
    if pi["title"]:
        lines.append("\\\\ {\\Large\\itshape " + pi["title"] + "}")
    lines.append("\\\\ \\vspace{4pt}")
    lines.append("{\\color{execgold}\\rule{0.6\\textwidth}{1.5pt}}")
    lines.append("\\\\ \\vspace{4pt}")
    contact = _join_nonempty([pi["email"], pi["phone"], pi["location"]], " \\quad $\\bullet$ \\quad ")
    if contact:
        lines.append(contact)
    links = _join_nonempty([pi["linkedinUrl"], pi["portfolio"]], " \\quad $\\bullet$ \\quad ")
    if links:
        lines.append("\\\\")
        lines.append(links)
    lines.append("\\end{center}")
    lines.append("")
    # Summary
    if pi["summary"]:
        lines.append("\\section*{Executive Summary}")
        lines.append(pi["summary"])
        lines.append("")
    # Experience
    if data["experience"]:
        lines.append("\\section*{Professional Experience}")
        for exp in data["experience"]:
            dr = _date_range(exp["startDate"], exp["endDate"], exp["current"])
            lines.append("\\noindent{\\large\\textbf{" + exp["position"] + "}} \\hfill " + dr + "\\\\")
            loc = ", " + exp["location"] if exp["location"] else ""
            lines.append("\\textit{" + exp["company"] + loc + "}\\\\")
            if exp["description"]:
                lines.append(exp["description"])
            lines.append("\\vspace{10pt}")
            lines.append("")
    # Education
    if data["education"]:
        lines.append("\\section*{Education}")
        for edu in data["education"]:
            dr = _date_range(edu["startDate"], edu["endDate"])
            degree = edu["degree"]
            if edu["field"]:
                degree += " in " + edu["field"]
            lines.append("\\noindent\\textbf{" + degree + "} \\hfill " + dr + "\\\\")
            gpa_part = " \\hfill GPA: " + edu["gpa"] if edu["gpa"] else ""
            lines.append("\\textit{" + edu["institution"] + "}" + gpa_part + "\\\\")
            lines.append("\\vspace{8pt}")
            lines.append("")
    # Skills
    if data["skills"]:
        lines.append("\\section*{Core Competencies}")
        lines.append(" --- ".join(data["skills"]))
        lines.append("")
    lines.append("\\end{document}")
    return "\n".join(lines)


def _render_tech(data: Dict[str, Any]) -> str:
    """Tech template: Monospace accents, terminal-inspired, code-style."""
    pi = data["personalInfo"]
    lines = []
    lines.append("\\documentclass[11pt,a4paper]{article}")
    lines.append("\\usepackage[margin=0.75in]{geometry}")
    lines.append("\\usepackage[T1]{fontenc}")
    lines.append("\\usepackage{lmodern}")
    lines.append("\\usepackage{enumitem}")
    lines.append("\\usepackage{xcolor}")
    lines.append("\\usepackage{titlesec}")
    lines.append("")
    lines.append("\\definecolor{techgreen}{RGB}{0,180,0}")
    lines.append("\\definecolor{techgray}{RGB}{60,60,60}")
    lines.append("\\titleformat{\\section}{\\normalsize\\ttfamily\\bfseries\\color{techgreen}}{\\$>}{0.5em}{}[\\color{techgray}\\titlerule]")
    lines.append("\\titlespacing*{\\section}{0pt}{12pt}{6pt}")
    lines.append("\\setlist{nosep,leftmargin=*}")
    lines.append("\\pagestyle{empty}")
    lines.append("")
    lines.append("\\begin{document}")
    lines.append("")
    # Header
    lines.append("{\\Large\\ttfamily\\bfseries " + pi["fullName"] + "}")
    if pi["title"]:
        lines.append("\\\\ {\\ttfamily\\color{techgreen} " + pi["title"] + "}")
    lines.append("\\vspace{4pt}")
    contact = _join_nonempty([pi["email"], pi["phone"], pi["location"]], " | ")
    if contact:
        lines.append("\\\\ {\\small\\ttfamily " + contact + "}")
    links = _join_nonempty([pi["linkedinUrl"], pi["portfolio"]], " | ")
    if links:
        lines.append("\\\\ {\\small\\ttfamily " + links + "}")
    lines.append("\\vspace{8pt}")
    lines.append("")
    # Summary
    if pi["summary"]:
        lines.append("\\section*{README}")
        lines.append(pi["summary"])
        lines.append("")
    # Experience
    if data["experience"]:
        lines.append("\\section*{work\\_history}")
        for exp in data["experience"]:
            dr = _date_range(exp["startDate"], exp["endDate"], exp["current"])
            lines.append("{\\ttfamily\\bfseries " + exp["position"] + "} @ " + exp["company"])
            lines.append("\\hfill {\\small\\ttfamily " + dr + "}\\\\")
            if exp["location"]:
                lines.append("{\\small " + exp["location"] + "}\\\\")
            if exp["description"]:
                lines.append(exp["description"] + "\\\\")
            lines.append("\\vspace{6pt}")
            lines.append("")
    # Education
    if data["education"]:
        lines.append("\\section*{education}")
        for edu in data["education"]:
            dr = _date_range(edu["startDate"], edu["endDate"])
            degree = edu["degree"]
            if edu["field"]:
                degree += " in " + edu["field"]
            lines.append("{\\ttfamily " + degree + "} @ " + edu["institution"] + " \\hfill {\\small\\ttfamily " + dr + "}\\\\")
            if edu["gpa"]:
                lines.append("{\\small GPA: " + edu["gpa"] + "}\\\\")
            lines.append("\\vspace{4pt}")
            lines.append("")
    # Skills
    if data["skills"]:
        lines.append("\\section*{tech\\_stack}")
        lines.append(" $\\cdot$ ".join(["{\\ttfamily " + s + "}" for s in data["skills"]]))
        lines.append("")
    lines.append("\\end{document}")
    return "\n".join(lines)
