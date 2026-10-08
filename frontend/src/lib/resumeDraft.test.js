import { DRAFT_KEY, loadResumeDraft, saveResumeDraft, resumeToText } from './resumeDraft';

beforeEach(() => localStorage.clear());

it('restores draft changes and template after a fresh load', () => {
  const { cvData } = loadResumeDraft();
  cvData.personalInfo = { ...cvData.personalInfo, title: 'Frontend Engineer' };
  cvData.projects = [{ id: 'project-1', name: 'Travel App', techStack: 'React', link: 'https://example.com', description: 'Built trip search' }];
  saveResumeDraft(cvData, 'clean');
  expect(loadResumeDraft()).toEqual({ cvData, template: 'clean' });
});

it('recovers from corrupt storage and supports drafts without projects', () => {
  localStorage.setItem(DRAFT_KEY, '{broken');
  expect(loadResumeDraft().cvData.projects).toEqual([]);
  const { cvData } = loadResumeDraft();
  delete cvData.projects;
  cvData.personalInfo.profilePhoto = 'obsolete';
  saveResumeDraft(cvData, 'modern');
  expect(loadResumeDraft().cvData.projects).toEqual([]);
  expect(loadResumeDraft().cvData.personalInfo).not.toHaveProperty('profilePhoto');
});

it('rejects invalid field values rather than crashing the editor', () => {
  const { cvData } = loadResumeDraft();
  cvData.personalInfo = { ...cvData.personalInfo, title: { invalid: true } };
  saveResumeDraft(cvData, 'modern');
  expect(typeof loadResumeDraft().cvData.personalInfo.title).toBe('string');
});

it('includes education, skills, project details, title and contacts in ATS text', () => {
  const text = resumeToText({
    personalInfo: { fullName: 'Demo', title: 'Engineer', email: 'demo@example.com', summary: 'API developer' },
    experience: [{ company: 'Example Company', position: 'Developer', description: 'Built APIs' }],
    education: [{ institution: 'Example College', degree: 'BCA', field: 'Computer Science' }],
    skills: ['TypeScript'],
    projects: [{ name: 'Trip App', techStack: 'React', link: 'https://example.com', description: 'Route planning' }],
  });
  for (const term of ['Engineer', 'demo@example.com', 'Example Company', 'BCA', 'Computer Science', 'TypeScript', 'Trip App', 'React', 'Route planning']) expect(text).toContain(term);
});
