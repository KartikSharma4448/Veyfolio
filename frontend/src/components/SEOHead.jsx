import { useEffect } from 'react';
import { SITE_URL, SOCIAL_IMAGE } from '../seoConfig';

const DEFAULT_KEYWORDS = 'resume builder, CV maker, AI resume, professional resume, ATS optimization';

/**
 * SEOHead component that programmatically sets document title and meta tags.
 * Manages description, keywords, Open Graph, and Twitter Card meta tags.
 *
 * @param {object} props
 * @param {string} props.title - Page title
 * @param {string} props.description - Page meta description
 * @param {string} props.path - Page path (e.g. "/" or "/create")
 */
export default function SEOHead({ title, description, path, noindex = path !== '/' }) {
  useEffect(() => {
    // Set document title
    document.title = title;

    // Helper to create or update a meta tag
    const setMeta = (attribute, key, content) => {
      let element = document.querySelector(`meta[${attribute}="${key}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Standard meta tags
    setMeta('name', 'description', description);
    setMeta('name', 'keywords', DEFAULT_KEYWORDS);
    setMeta('name', 'robots', noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large');
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = new URL(path, SITE_URL).href;

    // Open Graph meta tags
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:image', SOCIAL_IMAGE);
    setMeta('property', 'og:image:alt', 'Veyfolio resume builder and live resume workspace');
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:site_name', 'Veyfolio');
    setMeta('property', 'og:locale', 'en_US');
    setMeta('property', 'og:url', new URL(path, SITE_URL).href);

    // Twitter Card meta tags
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', SOCIAL_IMAGE);
    setMeta('name', 'twitter:image:alt', 'Veyfolio resume builder and live resume workspace');
  }, [title, description, path, noindex]);

  return null;
}
