import { mockLinkedInData } from '../mock/mockData';

export const DRAFT_KEY = 'veyfolio.resume-draft.v1';

export function loadResumeDraft() {
  const fallback = { cvData: { ...JSON.parse(JSON.stringify(mockLinkedInData)), projects: [] }, template: 'modern' };
  try {
    const saved = JSON.parse(localStorage.getItem(DRAFT_KEY));
    const cv = saved?.cvData;
    if (!cv || !cv.personalInfo || typeof cv.personalInfo !== 'object' ||
        !['experience', 'education', 'skills'].every(key => Array.isArray(cv[key])) ||
        !cv.skills.every(skill => typeof skill === 'string')) return fallback;
    const personalInfo = {};
    for (const key of Object.keys(mockLinkedInData.personalInfo)) {
      if (cv.personalInfo[key] != null && typeof cv.personalInfo[key] !== 'string') return fallback;
      personalInfo[key] = cv.personalInfo[key] || '';
    }
    const projects = cv.projects ?? [];
    if (!Array.isArray(projects)) return fallback;
    for (const entry of [...cv.experience, ...cv.education, ...projects]) {
      if (!entry || typeof entry !== 'object' || typeof entry.id !== 'string' ||
          !Object.entries(entry).every(([key, value]) => key === 'current' ? typeof value === 'boolean' : typeof value === 'string')) return fallback;
    }
    return { cvData: { ...cv, personalInfo, projects }, template: saved.template === 'clean' ? 'clean' : 'modern' };
  } catch {
    return fallback;
  }
}

export function saveResumeDraft(cvData, template) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify({ cvData, template }));
}

export function resumeToText(cv) {
  return [
    Object.values(cv.personalInfo || {}).join('\n'),
    ...(cv.experience || []).map(e => [e.position, e.company, e.location, e.startDate, e.current ? 'Present' : e.endDate, e.description].filter(Boolean).join('\n')),
    ...(cv.education || []).map(e => [e.degree, e.field, e.institution, e.location, e.startDate, e.endDate, e.gpa].filter(Boolean).join('\n')),
    (cv.skills || []).join(', '),
    ...(cv.projects || []).map(p => [p.name, p.techStack, p.link, p.description].filter(Boolean).join('\n')),
  ].filter(Boolean).join('\n\n');
}
