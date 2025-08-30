import { isAlternanceLike } from '../_lib/ingest.js';

export async function collectGreenhouse({ board, companyLabel }) {
  // https://boards-api.greenhouse.io/v1/boards/{board}/jobs?content=true
  const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(board)}/jobs?content=true`;
  const res = await fetch(url, { headers: { accept: 'application/json' }});
  if (!res.ok) return [];
  const data = await res.json().catch(()=> ({}));
  const list = data.jobs || [];

  return list
    .filter(j => isAlternanceLike(j.title) || isAlternanceLike(j.location?.name) || isAlternanceLike(j.content))
    .map(j => ({
      id: `greenhouse:${j.id}`,
      title: j.title || 'Sans titre',
      company: companyLabel || (j.departments?.[0]?.name || 'Entreprise'),
      location: j.location?.name || '',
      tags: (j.metadata || []).map(m => m.value).filter(Boolean),
      url: j.absolute_url || j.updated_at || '#',
      source: 'greenhouse',
      created_at: j.updated_at || new Date().toISOString()
    }));
}

