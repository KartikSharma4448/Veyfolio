import { renderToStaticMarkup } from 'react-dom/server';
import CVPreview from './CVPreview';

const cvData = {
  personalInfo: { fullName: 'Demo Candidate', title: 'Frontend Engineer' },
  skills: [], experience: [], education: [],
  projects: [{ id: 'p1', name: 'Travel App', techStack: 'React', link: 'https://example.com', description: 'Built trip search\nAdded filters' }],
};

it.each(['modern', 'clean'])('renders title and project details in %s preview', template => {
  const html = renderToStaticMarkup(<CVPreview cvData={cvData} template={template} />);
  for (const text of ['Frontend Engineer', 'PROJECTS', 'Travel App', 'React', 'https://example.com', 'Built trip search', 'Added filters']) expect(html).toContain(text);
});

it('omits a completely empty project entry', () => {
  const html = renderToStaticMarkup(<CVPreview cvData={{ ...cvData, projects: [{ id: 'empty', name: '', description: '' }] }} template="modern" />);
  expect(html).not.toContain('PROJECTS');
});
