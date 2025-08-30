import { filterFranceAlternance, insertMany } from '../_lib/ingest.js';

export async function collectSmartRecruiters({ company, companyLabel, limit = 100 }, env) {
  if (!company) return 0;
  const url = `https://api.smartrecruiters.com/v1/companies/${company}/postings?limit=${limit}`;
  const r = await fetch(url, { headers: { accept: 'application/json' }});
  if (!r.ok) return 0;
  const data = await r.json().catch(() => ({}));
  const rows = (data.content || []).map(p => ({
    id: `smart:${p.id}`,
    title: p.name,
    company: companyLabel || 'Entreprise',
    location: [p.location?.city, p.location?.country].filter(Boolean).join(', '),
    tags: (p.function ? [p.function] : []),
    url: p.ref || p.applyUrl || '#',
    source: 'smartrecruiters',
    created_at: p.createdOn || p.updatedOn
  }));
  const kept = filterFranceAlternance(rows);
  return insertMany(env, kept);
}
