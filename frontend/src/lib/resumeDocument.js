import { renderPdfProjects } from './pdfProjects';
import { createPreviewPdf } from './previewPdf';

// Both preview and download consume this single, text-based PDF layout.
export function buildResumeDocument(cvData, selectedTemplate = 'modern') {
  // A4 paper for clean template, Letter for modern
  const paperSize = selectedTemplate === 'clean' ? 'a4' : 'letter';
  const pdf = createPreviewPdf(paperSize, selectedTemplate);
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const marginLeft = selectedTemplate === 'clean' ? 19 : 12.7;
  const marginRight = selectedTemplate === 'clean' ? 19 : 12.7;
  const marginTop = selectedTemplate === 'clean' ? 19 : 12.7;
  const marginBottom = selectedTemplate === 'clean' ? 19 : 12.7;
  const contentWidth = pageWidth - marginLeft - marginRight;
  let y = marginTop;

  // --- Utility helpers ---
  const checkPageBreak = (needed) => {
    if (y + needed > pageHeight - marginBottom) {
      pdf.addPage();
      y = marginTop;
    }
  };

  // Draw text right-aligned
  const textRight = (text, yPos) => {
    const w = pdf.getTextWidth(text);
    pdf.text(text, pageWidth - marginRight - w, yPos);
  };

  // Draw a section header with underline (matches \titleformat{\section})
  const sectionHeader = (title) => {
    checkPageBreak(10);
    y += 3;
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text(title.toUpperCase(), marginLeft, y);
    y += 1.5;
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.4);
    pdf.line(marginLeft, y, pageWidth - marginRight, y);
    y += 4;
  };

  // Draw a bullet point item with word wrap
  const bulletItem = (text, indent = 4) => {
    if (!text || !text.trim()) return;
    pdf.setFontSize(9.5);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    const bulletX = marginLeft + indent;
    const textX = bulletX + 3;
    const maxW = contentWidth - indent - 3;
    const lines = pdf.splitTextToSize(text.trim(), maxW);
    checkPageBreak(lines.length * 3.8 + 1);
    // Bullet character
    pdf.text('\u2022', bulletX, y);
    pdf.text(lines, textX, y);
    y += lines.length * 3.8 + 0.5;
  };

  // ============================================================
  // TEMPLATE BRANCHING
  // ============================================================

  // Date formatter
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month] = dateStr.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[parseInt(month) - 1]} ${year}`;
  };

  if (selectedTemplate === 'clean') {
    // ---- CLEAN TEMPLATE (cv_template.tex style) ----
    // A4, 0.75in margins, serif-like feel, single-line headers

    // HEADING
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    const name = (cvData.personalInfo.fullName || 'Your Name').toUpperCase();
    const nameWidth = pdf.getTextWidth(name);
    pdf.text(name, (pageWidth - nameWidth) / 2, y);
    y += 6;
    if (cvData.personalInfo.title?.trim()) {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const titleLines = pdf.splitTextToSize(cvData.personalInfo.title.trim(), contentWidth);
      pdf.text(titleLines, pageWidth / 2, y, { align: 'center' });
      y += titleLines.length * 4 + 1;
    }

    // Contact line 1: location | phone | email
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    const contact1 = [cvData.personalInfo.location, cvData.personalInfo.phone, cvData.personalInfo.email].filter(Boolean).join('  |  ');
    if (contact1) {
      const c1w = pdf.getTextWidth(contact1);
      pdf.text(contact1, (pageWidth - c1w) / 2, y);
      y += 4;
    }
    // Contact line 2: portfolio | linkedin | github
    const contact2 = [cvData.personalInfo.portfolio, cvData.personalInfo.linkedinUrl].filter(Boolean).join('  |  ');
    if (contact2) {
      const c2w = pdf.getTextWidth(contact2);
      pdf.text(contact2, (pageWidth - c2w) / 2, y);
      y += 4;
    }

    // SUMMARY
    if (cvData.personalInfo.summary && cvData.personalInfo.summary.trim()) {
      sectionHeader('Summary');
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const lines = pdf.splitTextToSize(cvData.personalInfo.summary.trim(), contentWidth);
      checkPageBreak(lines.length * 4);
      pdf.text(lines, marginLeft, y);
      y += lines.length * 4 + 2;
    }

    // Compact rows: flat skills wrap together; categories retain bold labels.
    if (cvData.skills && cvData.skills.length > 0) {
      sectionHeader('Technical Skills');
      pdf.setFontSize(10);
      const skills = cvData.skills.map(skill => skill.trim()).filter(Boolean);
      const rows = [];
      for (const skill of skills) {
        if (!skill.includes(':') && rows.length && !rows[rows.length - 1].includes(':')) {
          rows[rows.length - 1] += ', ' + skill;
        } else {
          rows.push(skill);
        }
      }
      const writeSkillLines = (lines, x) => {
        for (const line of lines) {
          checkPageBreak(4);
          pdf.text(line, x, y);
          y += 4;
        }
      };
      for (const skill of rows) {
        checkPageBreak(4);
        const colonIdx = skill.indexOf(':');
        if (colonIdx > -1) {
          pdf.setFont('helvetica', 'bold');
          const cat = skill.substring(0, colonIdx + 1);
          const catW = pdf.getTextWidth(cat + ' ');
          if (catW > contentWidth * 0.6) {
            writeSkillLines(pdf.splitTextToSize(cat, contentWidth), marginLeft);
            pdf.setFont('helvetica', 'normal');
            writeSkillLines(pdf.splitTextToSize(skill.substring(colonIdx + 1).trim(), contentWidth), marginLeft);
            continue;
          }
          pdf.text(cat, marginLeft, y);
          pdf.setFont('helvetica', 'normal');
          const val = skill.substring(colonIdx + 1).trim();
          const valLines = pdf.splitTextToSize(val, contentWidth - catW);
          writeSkillLines(valLines.length ? valLines : [''], marginLeft + catW);
        } else {
          pdf.setFont('helvetica', 'normal');
          writeSkillLines(pdf.splitTextToSize(skill, contentWidth), marginLeft);
        }
      }
      y += 1;
    }

    // EXPERIENCE
    if (cvData.experience && cvData.experience.length > 0) {
      sectionHeader('Experience');
      for (const exp of cvData.experience) {
        checkPageBreak(16);
        // Bold position left, italic dates right
        pdf.setFontSize(10.5);
        pdf.setFont('helvetica', 'bold');
        pdf.text(exp.position || '', marginLeft, y);
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(9.5);
        const dateStr = [formatDate(exp.startDate), exp.current ? 'Present' : formatDate(exp.endDate)].filter(Boolean).join(' – ');
        textRight(dateStr, y);
        y += 4.2;
        // Italic company, location
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(9.5);
        pdf.text([exp.company, exp.location].filter(Boolean).join(', '), marginLeft, y);
        y += 4.5;
        // Bullets
        if (exp.description) {
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(9.5);
          const bullets = exp.description.split('\n').filter(b => b.trim());
          for (const b of bullets) {
            const clean = b.replace(/^[\s\-•◦⁃*]+/, '').trim();
            if (clean) bulletItem(clean, 2);
          }
        }
        y += 3;
      }
    }

    // EDUCATION
    if (cvData.education && cvData.education.length > 0) {
      sectionHeader('Education');
      for (const edu of cvData.education) {
        checkPageBreak(12);
        pdf.setFontSize(10.5);
        pdf.setFont('helvetica', 'bold');
        const degLine = [edu.degree, edu.field].filter(Boolean).join(' in ') || edu.institution;
        pdf.text(degLine, marginLeft, y);
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(9.5);
        const eduDate = [formatDate(edu.startDate), formatDate(edu.endDate)].filter(Boolean).join(' – ');
        textRight(eduDate, y);
        y += 4.2;
        if (edu.degree) {
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(9.5);
          pdf.text(edu.institution || '', marginLeft, y);
          y += 4;
        }
        if (edu.gpa) {
          pdf.text('GPA: ' + edu.gpa, marginLeft, y);
          y += 4;
        }
        y += 2;
      }
    }

  } else {
  // ============================================================
  // MODERN TEMPLATE (Jake Ryan style) — default
  // ============================================================

  // HEADING — Centered name, contact line with pipes
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  const name = cvData.personalInfo.fullName || 'Your Name';
  const nameWidth = pdf.getTextWidth(name);
  pdf.text(name, (pageWidth - nameWidth) / 2, y);
  y += 7;
  if (cvData.personalInfo.title?.trim()) {
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const titleLines = pdf.splitTextToSize(cvData.personalInfo.title.trim(), contentWidth);
    pdf.text(titleLines, pageWidth / 2, y, { align: 'center' });
    y += titleLines.length * 4 + 1;
  }

  // Contact info line — centered, separated by |
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(0, 0, 0);
  const contactItems = [
    cvData.personalInfo.phone,
    cvData.personalInfo.email,
    cvData.personalInfo.portfolio,
    cvData.personalInfo.linkedinUrl,
  ].filter(Boolean);
  if (contactItems.length) {
    const contactLine = contactItems.join('  |  ');
    const contactW = pdf.getTextWidth(contactLine);
    pdf.text(contactLine, (pageWidth - contactW) / 2, y);
    y += 4;
  }
  // Location line if present
  if (cvData.personalInfo.location) {
    const locW = pdf.getTextWidth(cvData.personalInfo.location);
    pdf.text(cvData.personalInfo.location, (pageWidth - locW) / 2, y);
    y += 3;
  }

  // ============================================================
  // PROFESSIONAL SUMMARY
  // ============================================================
  if (cvData.personalInfo.summary && cvData.personalInfo.summary.trim()) {
    sectionHeader('Professional Summary');
    pdf.setFontSize(9.5);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    const summaryLines = pdf.splitTextToSize(cvData.personalInfo.summary.trim(), contentWidth);
    checkPageBreak(summaryLines.length * 3.8);
    pdf.text(summaryLines, marginLeft, y);
    y += summaryLines.length * 3.8 + 2;
  }

  // ============================================================
  // TECHNICAL SKILLS — category: values format
  // ============================================================
  if (cvData.skills && cvData.skills.length > 0) {
    sectionHeader('Technical Skills');
    pdf.setFontSize(9.5);

    // Try to group skills by category if they contain colons (e.g. "Languages: Python, JS")
    // Otherwise render as a single "Skills:" line
    const isGrouped = cvData.skills.some(s => s.includes(':'));
    if (isGrouped) {
      // Skills are already in "Category: value1, value2" format
      for (const skillLine of cvData.skills) {
        checkPageBreak(5);
        const colonIdx = skillLine.indexOf(':');
        if (colonIdx > -1) {
          const category = skillLine.substring(0, colonIdx + 1);
          const values = skillLine.substring(colonIdx + 1).trim();
          pdf.setFont('helvetica', 'bold');
          pdf.text(category, marginLeft + 2, y);
          const catW = pdf.getTextWidth(category + ' ');
          pdf.setFont('helvetica', 'normal');
          const valLines = pdf.splitTextToSize(values, contentWidth - 2 - catW);
          pdf.text(valLines[0] || '', marginLeft + 2 + catW, y);
          if (valLines.length > 1) {
            for (let i = 1; i < valLines.length; i++) {
              y += 3.8;
              checkPageBreak(4);
              pdf.text(valLines[i], marginLeft + 2 + catW, y);
            }
          }
          y += 4.2;
        } else {
          pdf.setFont('helvetica', 'normal');
          const lines = pdf.splitTextToSize(skillLine, contentWidth - 2);
          pdf.text(lines, marginLeft + 2, y);
          y += lines.length * 3.8 + 1;
        }
      }
    } else {
      // Flat array of skills — render as "Skills: skill1, skill2, ..."
      pdf.setFont('helvetica', 'bold');
      const label = 'Skills: ';
      pdf.text(label, marginLeft + 2, y);
      const labelW = pdf.getTextWidth(label);
      pdf.setFont('helvetica', 'normal');
      const skillsStr = cvData.skills.join(', ');
      const skillLines = pdf.splitTextToSize(skillsStr, contentWidth - 2 - labelW);
      pdf.text(skillLines[0] || '', marginLeft + 2 + labelW, y);
      if (skillLines.length > 1) {
        for (let i = 1; i < skillLines.length; i++) {
          y += 3.8;
          checkPageBreak(4);
          pdf.text(skillLines[i], marginLeft + 2 + labelW, y);
        }
      }
      y += 4.2;
    }
    y += 1;
  }

  // ============================================================
  // WORK EXPERIENCE
  // ============================================================
  if (cvData.experience && cvData.experience.length > 0) {
    sectionHeader('Work Experience');

    for (const exp of cvData.experience) {
      checkPageBreak(18);

      // Line 1: Company/Org bold left, Dates right
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      const companyName = exp.company || '';
      pdf.text(companyName, marginLeft + 2, y);

    const dateStr = [formatDate(exp.startDate), exp.current ? 'Present' : formatDate(exp.endDate)].filter(Boolean).join(' - ');
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9.5);
      textRight(dateStr, y);
      y += 4.2;

      // Line 2: Position italic left, Location italic right
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(9.5);
      pdf.text(exp.position || '', marginLeft + 2, y);

      if (exp.location) {
        const savedFont = pdf.getFont();
        pdf.setFont('helvetica', 'italic');
        textRight(exp.location, y);
        pdf.setFont(savedFont.fontName, savedFont.fontStyle);
      }
      y += 4.5;

      // Bullet points from description (split by newlines)
      if (exp.description) {
        const bullets = exp.description.split('\n').filter(b => b.trim());
        for (const bullet of bullets) {
          // Strip leading bullet chars/dashes if present
          const cleanBullet = bullet.replace(/^[\s\-\u2022\u2023\u25E6\u2043*]+/, '').trim();
          if (cleanBullet) {
            bulletItem(cleanBullet, 4);
          }
        }
      }
      y += 2;
    }
  }

  // ============================================================
  // EDUCATION
  // ============================================================
  if (cvData.education && cvData.education.length > 0) {
    sectionHeader('Education');

    for (const edu of cvData.education) {
      checkPageBreak(14);

      // Line 1: Degree bold left, Dates right
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      const degreeLine = [edu.degree, edu.field].filter(Boolean).join(' in ');
      pdf.text(degreeLine || edu.institution || '', marginLeft + 2, y);

    const eduDateStr = [formatDate(edu.startDate), formatDate(edu.endDate)].filter(Boolean).join(' - ');
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9.5);
      textRight(eduDateStr, y);
      y += 4.2;

      // Line 2: Institution italic left, Location italic right (if available)
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(9.5);
      if (degreeLine) {
        pdf.text(edu.institution || '', marginLeft + 2, y);
      }
      y += 4.5;

      // GPA as bullet if present
      if (edu.gpa) {
        bulletItem(`GPA: ${edu.gpa}`, 4);
      }
      y += 1.5;
    }
  }

  // ============================================================
  // PROJECTS for both templates.
  // ============================================================
  } // end else (modern template)

  y = renderPdfProjects(pdf, cvData.projects || [], {
    y, marginLeft, marginRight, marginTop, marginBottom,
    sectionHeader: (title, startY) => { y = startY; sectionHeader(title); return y; },
  });


  return { pdf, pages: pdf.previewPages, width: pageWidth, height: pageHeight };
}
