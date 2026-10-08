import { jsPDF } from 'jspdf';

// Capture the same vector drawing operations sent to the PDF, not a screenshot.
export function createPreviewPdf(format, template) {
  const pdf = new jsPDF('p', 'mm', format);
  const pages = [[]];
  pdf.previewPages = pages;
  const originalText = pdf.text.bind(pdf);
  const originalLine = pdf.line.bind(pdf);
  const originalAddPage = pdf.addPage.bind(pdf);
  const originalSetFont = pdf.setFont.bind(pdf);
  pdf.setFont = (name, style, ...args) => originalSetFont(template === 'clean' && name === 'helvetica' ? 'times' : name, style, ...args);
  pdf.addPage = (...args) => {
    originalAddPage(...args);
    pages.push([]);
    return pdf;
  };
  pdf.text = (value, x, y, options = {}) => {
    originalText(value, x, y, options);
    const font = pdf.getFont();
    const size = pdf.getFontSize() / pdf.internal.scaleFactor;
    const lineHeight = size * (options.lineHeightFactor || pdf.getLineHeightFactor());
    const lines = Array.isArray(value) ? value : String(value).split('\n');
    lines.forEach((text, index) => {
      const width = pdf.getTextWidth(text);
      const left = options.align === 'center' ? x - width / 2 : options.align === 'right' ? x - width : x;
      pages[pages.length - 1].push({ type: 'text', text, x: left, y: y + index * lineHeight, size, width,
        family: font.fontName === 'times' ? 'Times New Roman, serif' : 'Arial, Helvetica, sans-serif',
        bold: font.fontStyle.includes('bold'), italic: font.fontStyle.includes('italic'), color: pdf.getTextColor() });
    });
    return pdf;
  };
  pdf.line = (x1, y1, x2, y2, ...args) => {
    originalLine(x1, y1, x2, y2, ...args);
    pages[pages.length - 1].push({ type: 'line', x1, y1, x2, y2, width: pdf.getLineWidth(), color: pdf.getDrawColor() });
    return pdf;
  };
  return pdf;
}
