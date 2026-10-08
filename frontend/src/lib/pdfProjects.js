export function renderPdfProjects(pdf, projects, layout) {
  const { marginLeft, marginRight, marginTop, marginBottom, sectionHeader } = layout;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - marginLeft - marginRight - 4;
  const bottom = pageHeight - marginBottom;
  let y = layout.y;
  const entries = projects.filter(p => [p.name, p.techStack, p.link, p.description].some(value => value?.trim()));
  if (!entries.length) return y;

  const newPage = () => {
    pdf.addPage();
    y = marginTop;
  };
  const nameLines = name => {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    return pdf.splitTextToSize(name, contentWidth);
  };
  const continuedHeading = name => {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);
    pdf.text('PROJECTS (CONTINUED)', marginLeft, y);
    y += 5;
    pdf.setDrawColor(0, 0, 0);
    pdf.line(marginLeft, y - 2, pageWidth - marginRight, y - 2);
    y += 4;
    const lines = nameLines(`${name || 'Project'} (continued)`);
    pdf.text(lines, marginLeft + 2, y);
    y += lines.length * 4 + 3;
  };
  const writeLines = (lines, name, { bullet = false, italic = false, size = 9.5 } = {}) => {
    const lineHeight = 3.8;
    if (lines.length * lineHeight + 1 <= bottom - marginTop - 18 && y + lines.length * lineHeight + 1 > bottom) {
      newPage();
      continuedHeading(name);
    }
    lines.forEach((line, index) => {
      if (y + lineHeight > bottom) {
        newPage();
        continuedHeading(name);
      }
      pdf.setFont('helvetica', italic ? 'italic' : 'normal');
      pdf.setFontSize(size);
      pdf.setTextColor(0, 0, 0);
      if (bullet && index === 0) pdf.text('\u2022', marginLeft + 4, y);
      pdf.text(line, marginLeft + (bullet ? 7 : 2), y);
      y += lineHeight;
    });
    y += 0.8;
  };

  entries.forEach((project, index) => {
    const name = project.name || 'Project';
    const names = nameLines(name);
    const bullets = (project.description || '').split('\n').map(line => line.replace(/^[\s\-*\u2022\u2023\u25E6\u2043]+/, '').trim()).filter(Boolean);
    // Keep each new project heading with its metadata and first description line.
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9.5);
    const techLines = project.techStack ? pdf.splitTextToSize(project.techStack, contentWidth) : [];
    pdf.setFontSize(9);
    const linkLines = project.link ? pdf.splitTextToSize(project.link, contentWidth) : [];
    const needed = names.length * 4 + (techLines.length + linkLines.length + (bullets.length ? 2 : 0)) * 3.8 + 8;
    if (y + needed > bottom) newPage();
    if (index === 0) y = sectionHeader('Projects', y);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    pdf.text(names, marginLeft + 2, y);
    y += names.length * 4 + 1;
    if (techLines.length) writeLines(techLines, name, { italic: true });
    if (linkLines.length) writeLines(linkLines, name, { size: 9 });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9.5);
    for (const bullet of bullets) {
      const lines = pdf.splitTextToSize(bullet, contentWidth - 5);
      writeLines(lines, name, { bullet: true });
    }
    y += 3;
  });
  return y;
}
