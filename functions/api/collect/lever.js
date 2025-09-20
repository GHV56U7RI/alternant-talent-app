import { isAlternanceLike } from '../_lib/ingest.js';

export async function collectLever({ company, companyLabel }) {
  if (!company) return [];
  const url = `https://api.lever.co/v0/postings/${encodeURIComponent(company)}?mode=json`;
  const res = await fetch(url, { headers: { accept: 'application/json' }});
  if (!res.ok) return [];
  const list = await res.json().catch(() => []);
  return (list || [])
    .filter(j =>
      isAlternanceLike(j.text) ||
      isAlternanceLike(j.title) ||
      isAlternanceLike(j.categories?.location) ||
      isAlternanceLike(j.categories?.commitment)
    )
    .map(j => ({
      id: `lever:${j.id}`,
      title: j.text || j.title || 'Sans titre',
      company: companyLabel || 'Entreprise',
      location: j.categories?.location || '',
      tags: (j.categories ? Object.values(j.categories) : []).filter(Boolean),
      url: j.hostedUrl || j.applyUrl || '#',
      source: 'lever',
      created_at: j.createdAt ? new Date(j.createdAt).toISOString() : new Date().toISOString()
    }));
}
