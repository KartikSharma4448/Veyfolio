import { jsPDF } from 'jspdf';
import { renderPdfProjects } from './pdfProjects';

it.each(['letter', 'a4'])('repeats the project heading and keeps text inside %s page margins', format => {
  const pdf = new jsPDF('p', 'mm', format);
  const text = jest.spyOn(pdf, 'text');
  const height = pdf.internal.pageSize.getHeight();
  renderPdfProjects(pdf, [{ name: 'Customer Insights', techStack: 'React', link: 'https://example.com', description: Array.from({ length: 45 }, (_, i) => `Achievement ${i + 1}: Delivered searchable dashboards and accessible customer feedback workflows across teams.`).join('\n') }], {
    y: height - 70, marginLeft: 15, marginRight: 15, marginTop: 15, marginBottom: 15,
    sectionHeader: (title, y) => { pdf.text(title, 15, y); return y + 8; },
  });
  expect(pdf.getNumberOfPages()).toBeGreaterThan(1);
  expect(text.mock.calls.some(([value]) => value === 'PROJECTS (CONTINUED)')).toBe(true);
  expect(text.mock.calls.some(([value]) => Array.isArray(value) && value.join(' ').includes('Customer Insights (continued)'))).toBe(true);
  const body = text.mock.calls.map(([value]) => Array.isArray(value) ? value.join(' ') : value).join(' ');
  for (let i = 1; i <= 45; i++) expect(body).toContain(`Achievement ${i}:`);
  for (const [, , y] of text.mock.calls) {
    expect(y).toBeGreaterThanOrEqual(15);
    expect(y).toBeLessThanOrEqual(height - 15);
  }
});

it('splits a single oversized bullet without losing text or crossing the bottom margin', () => {
  const pdf = new jsPDF();
  const text = jest.spyOn(pdf, 'text');
  renderPdfProjects(pdf, [{ name: 'Long Project', description: 'delivery '.repeat(3000) + 'END_MARKER' }], {
    y: 20, marginLeft: 15, marginRight: 15, marginTop: 15, marginBottom: 15,
    sectionHeader: (_, y) => y,
  });
  expect(pdf.getNumberOfPages()).toBeGreaterThan(1);
  expect(text.mock.calls.some(([value]) => String(value).includes('END_MARKER'))).toBe(true);
  for (const [, , y] of text.mock.calls) expect(y).toBeLessThanOrEqual(282);
});
