import { isAlternanceLike } from '../_lib/ingest.js';

/**
 * ATTENTION: Workday varie selon le tenant.
 * Exemple d'endpoint courant:
 *   POST https://{host}/wday/cxs/{tenant}/{site}/jobs
 * avec body JSON {limit, offset, searchText}
 */
export async function collectWorkday({ host, tenant, site, search = "alternance", companyLabel, limit = 50 }) {
  const url = `https://${host}/wday/cxs/${tenant}/${site}/jobs`;
  const body = { limit, offset: 0, searchText: search };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'accept': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) return [];
  const data = await res.json().catch(()=> ({}));
  const list = data.jobPostings || [];
  return list
    .filter(p => isAlternanceLike(p.title) || isAlternanceLike(p.locations?.join(' ')))
    .map(p => ({
      id: `workday:${p.jobPostingId || p.externalPath || crypto.randomUUID()}`,
      title: p.title || 'Sans titre',
      company: companyLabel || (p.company || 'Entreprise'),
      location: (p.locations || []).join(' · '),
      tags: [],
      url: p.externalPath ? `https://${host}${p.externalPath}` : '#',
      source: 'workday',
      created_at: p.postedOn || new Date().toISOString()
    }));
}

