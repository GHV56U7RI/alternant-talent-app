import { isAlternanceLike } from '../_lib/ingest.js';

export async function collectSmartRecruiters({ company, companyLabel, limit = 100 }) {
  // https://api.smartrecruiters.com/v1/companies/{company}/postings?limit=100
  const url = `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(company)}/postings?limit=${limit}`;
  const res = await fetch(url, { headers: { accept: 'application/json' }});
  if (!res.ok) return [];
  const data = await res.json().catch(()=> ({}));
  const list = data.content || [];
  return list
    .filter(p => isAlternanceLike(p.name) || isAlternanceLike(p.location?.city))
    .map(p => ({
      id: `smartrecruiters:${p.id}`,
      title: p.name || 'Sans titre',
      company: companyLabel || p.company?.identifier || 'Entreprise',
      location: [p.location?.city, p.location?.country].filter(Boolean).join(', '),
      tags: [],
      url: p.ref ? `https://careers.smartrecruiters.com/${p.ref.replace(/^\/+/, '')}` : '#',
      source: 'smartrecruiters',
      created_at: p.releasedDate || new Date().toISOString()
    }));
}

