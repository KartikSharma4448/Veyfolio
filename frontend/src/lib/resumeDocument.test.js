import { buildResumeDocument } from './resumeDocument';
import { createPreviewPdf } from './previewPdf';

const cv = {
  personalInfo: { fullName: 'Demo Candidate', title: 'Frontend Engineer', summary: 'Builds accessible applications.' },
  experience: [{ id: 'e1', company: 'Example', position: 'Engineer', startDate: '2020-01', current: true, description: 'Delivered accessible interfaces' }],
  education: [], skills: ['React', 'JavaScript'], projects: [],
};

it.each(['modern', 'clean'])('uses the PDF pages and content as the %s preview source', template => {
  const document = buildResumeDocument(cv, template);
  expect(document.pages).toBe(document.pdf.previewPages);
  expect(document.pages.length).toBe(document.pdf.getNumberOfPages());
  const texts = document.pages.flat().filter(command => command.type === 'text');
  expect(texts.map(command => command.text)).toEqual(expect.arrayContaining(['Frontend Engineer', 'Delivered accessible interfaces']));
  expect(texts.some(command => command.text.includes('Jan 2020'))).toBe(true);
  expect(texts.every(command => command.family.includes(template === 'clean' ? 'Times' : 'Arial'))).toBe(true);
  expect(document.pdf.output()).toContain('Frontend Engineer');
});

it.each(['modern', 'clean'])('keeps multi-page projects in the same %s preview and PDF pages', template => {
  const projects = Array.from({ length: 24 }, (_, index) => ({
    id: String(index), name: `Project ${index}`, techStack: 'React, JavaScript',
    description: 'Built accessible search interfaces\nAdded reliable filtering and tests',
  }));
  const document = buildResumeDocument({ ...cv, projects }, template);
  expect(document.pages.length).toBeGreaterThan(1);
  expect(document.pages.length).toBe(document.pdf.getNumberOfPages());
  document.pages.forEach(page => {
    expect(page.some(command => command.type === 'text')).toBe(true);
    page.filter(command => command.type === 'text').forEach(command => {
      expect(command.y).toBeGreaterThan(0);
      expect(command.y).toBeLessThan(document.height - 10);
    });
  });
  expect(document.pages.flat().some(command => command.text === 'Project 23')).toBe(true);
});

it('captures PDF alignment, multiline spacing and rule widths exactly', () => {
  const pdf = createPreviewPdf('a4', 'modern');
  pdf.setFontSize(10);
  pdf.text(['First', 'Second'], 105, 20, { align: 'center' });
  pdf.setLineWidth(0.4);
  pdf.line(10, 30, 200, 30);
  const [first, second, line] = pdf.previewPages[0];
  expect(first.x).toBeCloseTo(105 - pdf.getTextWidth('First') / 2);
  expect(second.y - first.y).toBeCloseTo(10 / pdf.internal.scaleFactor * pdf.getLineHeightFactor());
  expect(line.width).toBe(0.4);
});

it('wraps flat Clean skills into compact rows instead of one bullet per skill', () => {
  const skills = ['Product Strategy', 'Agile/Scrum', 'User Research', 'Data Analysis', 'A/B Testing', 'Roadmap Planning', 'Stakeholder Management', 'SQL', 'Jira', 'Figma', 'Google Analytics', 'Product-Led Growth'];
  const document = buildResumeDocument({ ...cv, skills }, 'clean');
  const commands = document.pages.flat();
  const start = commands.findIndex(command => command.text === 'TECHNICAL SKILLS');
  const end = commands.findIndex(command => command.text === 'EXPERIENCE');
  const rows = commands.slice(start + 1, end).filter(command => command.type === 'text');
  expect(rows.length).toBeLessThanOrEqual(3);
  expect(rows.map(row => row.text).join(' ')).toContain('SQL, Jira, Figma');
  expect(rows.every(row => !row.text.includes('\u2022'))).toBe(true);
  expect(commands[end].y - commands[start].y).toBeLessThan(25);
});

it('preserves bold Clean skill categories and safely wraps long labels', () => {
  const skills = ['Languages: JavaScript, Python', 'An exceptionally long technical skill category label covering multiple disciplines: React, Node.js'];
  const document = buildResumeDocument({ ...cv, skills }, 'clean');
  const texts = document.pages.flat().filter(command => command.type === 'text');
  expect(texts.find(command => command.text === 'Languages:').bold).toBe(true);
  expect(texts.some(command => command.text === 'React, Node.js')).toBe(true);
  expect(texts.every(command => command.x + command.width <= document.width - 18)).toBe(true);
});
