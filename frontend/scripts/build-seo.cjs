process.env.NODE_ENV = 'production';
require('react-scripts/config/env');
const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');
const { JSDOM } = require('jsdom');
const sourceRoot = path.resolve(__dirname, '../src');
const buildRoot = path.resolve(__dirname, '../build');
const originalLoader = require.extensions['.js'];

// Transpile only our source files; dependencies keep their normal Node loader.
function sourceLoader(module, filename) {
  if (!filename.startsWith(sourceRoot + path.sep)) return originalLoader(module, filename);
  const result = babel.transformFileSync(filename, {
    babelrc: false, configFile: false,
    presets: [[require.resolve('@babel/preset-env'), { targets: { node: 'current' } }], require.resolve('@babel/preset-react')],
    plugins: [() => ({ visitor: { ImportDeclaration(nodePath) {
      const value = nodePath.node.source.value;
      if (value.startsWith('@/')) nodePath.node.source.value = path.join(sourceRoot, value.slice(2));
    } } })],
  });
  module._compile(result.code, filename);
}
require.extensions['.js'] = sourceLoader;
require.extensions['.jsx'] = sourceLoader;
const React = require('react');
const { renderToString } = require('react-dom/server');
const { StaticRouter } = require('react-router-dom');
const Home = require('../src/pages/Home.jsx').default;
const { SITE_URL, SOCIAL_IMAGE, HOME_TITLE, HOME_DESCRIPTION, HOME_SCHEMA } = require('../src/seoConfig');
const template = fs.readFileSync(path.join(buildRoot, 'index.html'), 'utf8');

function page({ title, description, route, noindex, markup = '', schema }) {
  const dom = new JSDOM(template);
  const document = dom.window.document;
  document.title = title;
  function meta(attribute, key, content) {
    const nodes = [...document.querySelectorAll(`meta[${attribute}="${key}"]`)];
    const element = nodes.shift() || document.createElement('meta');
    nodes.forEach(node => node.remove());
    element.setAttribute(attribute, key);
    element.setAttribute('content', content);
    document.head.appendChild(element);
  }
  const url = new URL(route, SITE_URL).href;
  meta('name', 'description', description);
  meta('name', 'robots', noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large');
  for (const [key, value] of Object.entries({ title, description, url, image: SOCIAL_IMAGE, type: 'website', site_name: 'Veyfolio', locale: 'en_US', 'image:alt': 'Veyfolio resume builder and live resume workspace' })) meta('property', `og:${key}`, value);
  for (const [key, value] of Object.entries({ card: 'summary_large_image', title, description, image: SOCIAL_IMAGE, 'image:alt': 'Veyfolio resume builder and live resume workspace' })) meta('name', `twitter:${key}`, value);
  document.querySelectorAll('link[rel="canonical"]').forEach(node => node.remove());
  const canonical = document.createElement('link');
  canonical.rel = 'canonical';
  canonical.href = url;
  document.head.appendChild(canonical);
  document.querySelectorAll('script[type="application/ld+json"]').forEach(node => node.remove());
  if (schema) {
    const script = document.createElement('script');
    script.id = 'veyfolio-schema';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema).replace(/</g, '\\u003c');
    document.head.appendChild(script);
  }
  document.getElementById('root').innerHTML = markup;
  document.querySelector('noscript').textContent = 'Enable JavaScript to edit your resume and export a PDF.';
  const output = dom.serialize();
  dom.window.close();
  return output;
}

const markup = renderToString(React.createElement(StaticRouter, { location: '/' }, React.createElement(Home)));
fs.writeFileSync(path.join(buildRoot, 'index.html'), page({ title: HOME_TITLE, description: HOME_DESCRIPTION, route: '/', markup, schema: HOME_SCHEMA }));
fs.mkdirSync(path.join(buildRoot, 'create'), { recursive: true });
fs.writeFileSync(path.join(buildRoot, 'create/index.html'), page({ title: 'Create Your CV - Veyfolio', description: 'Build your resume with live preview, two professional templates, optional AI refinement, and PDF export.', route: '/create', noindex: true }));
fs.writeFileSync(path.join(buildRoot, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
fs.writeFileSync(path.join(buildRoot, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${SITE_URL.replace(/&/g, '&amp;')}/</loc></url></urlset>\n`);
console.log(`SEO build ready: prerendered home, noindex editor, robots and sitemap for ${SITE_URL}`);
