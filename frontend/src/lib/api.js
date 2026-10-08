const BASE = process.env.REACT_APP_BACKEND_URL || '';

async function postJson(path, body) {
  const token = localStorage.getItem('cvcraft_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error: ${res.status} ${text}`);
  }
  return res.json();
}

export async function generateText(prompt, max_tokens = 256) {
  return postJson('/api/ai/generate', { prompt, max_tokens });
}

export async function atsScore(cv_text, job_description = '') {
  return postJson('/api/ai/ats', { cv_text, job_description });
}

export async function makeLatex(cv, template = 'modern') {
  return postJson('/api/ai/latex', { cv, template });
}

export async function embedTexts(texts) {
  return postJson('/api/ai/embed', { texts });
}

export async function rerank(query, candidates) {
  return postJson('/api/ai/rerank', { query, candidates });
}

export async function refineText(text, section = 'summary') {
  return postJson('/api/ai/refine', { text, section });
}

export async function compilePDF(cv, template = 'modern') {
  const token = localStorage.getItem('cvcraft_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}/api/pdf/compile`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ cv, template }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error: ${res.status} ${text}`);
  }
  const blob = await res.blob();
  return blob;
}

export async function getATSScore(cv_text, job_description) {
  return postJson('/api/ats/score', { cv_text, job_description });
}

export default { generateText, atsScore, makeLatex, embedTexts, rerank };
