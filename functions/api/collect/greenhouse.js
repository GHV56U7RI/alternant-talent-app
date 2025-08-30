import { filterFranceAlternance, insertMany } from '../_lib/ingest.js';

export async function collectGreenhouse({ board, companyLabel }, env) {
  if (!board) return 0;
  const url = `https://${board}.greenhouse.io/api/v1/boards/${board}/jobs?content=true`;
  const r = await fetch(url, { headers: { accept: 'application/json' }});
  if (!r.ok) return 0;
  const data = await r.json().catch(() => ({}));
  const rows = (data.jobs || []).map(j => ({
    id: `greenhouse:${j.id}`,
    title: j.title,
    company: companyLabel || 'Entreprise',
    location: j.location?.name || '',
    tags: (j.metadata || []).map(m => `${m.name}:${m.value}`),
    url: j.absolute_url,
    source: 'greenhouse',
    created_at: j.updated_at || j.internal_job_id
  }));
  const kept = filterFranceAlternance(rows);
  return insertMany(env, kept);
}
