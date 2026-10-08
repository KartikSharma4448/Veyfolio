const configuredUrl = process.env.REACT_APP_SITE_URL || 'https://veyfolio.thekartiksharma.in';
const parsedUrl = new URL(configuredUrl);
if (!['https:', 'http:'].includes(parsedUrl.protocol)) {
  throw new Error('REACT_APP_SITE_URL must be an HTTP or HTTPS URL');
}
export const SITE_URL = parsedUrl.origin;
export const HOME_TITLE = 'Veyfolio Resume Builder | Create Your CV Online';
export const HOME_DESCRIPTION = 'Create your resume with two professional templates, live preview, projects, optional AI suggestions, job keyword checks, and PDF export. No signup required.';
export const SOCIAL_IMAGE = `${SITE_URL}/veyfolio-social-preview.png`;
export const HOME_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Veyfolio',
  description: HOME_DESCRIPTION,
  url: `${SITE_URL}/`,
  image: SOCIAL_IMAGE,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web browser',
  browserRequirements: 'Requires JavaScript for the resume editor',
  featureList: ['Live resume preview', 'Two resume templates', 'Projects section', 'PDF export', 'Job-description keyword checks'],
};
