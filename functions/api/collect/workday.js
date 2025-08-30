import { filterFranceAlternance, insertMany } from '../_lib/ingest.js';

export async function collectWorkday({ host, tenant, site, search = "alternance", companyLabel, limit = 50 }, env) {
  if (!host || !tenant) return 0;
  const base = `https://${host}/wday/cxs/${tenant}/${site || 'careers'}/jobs`;
  const query = { appliedFacets: { locationCountry: ["FR"] }, limit, offset: 0, searchText: search };
  const r = await fetch(base, { method: 'POST', headers: { 'content-type':'application/json' }, body: JSON.stringify(query) });
  if (!r.ok) return 0;
  const data = await r.json().catch(() => ({}));
  const rows = (data.jobPostings || []).map(p => ({
    id: `workday:${p.jobPostingId}`,
    title: p.title,
    company: companyLabel || 'Entreprise',
    location: p.locations?.[0]?.shortName || p.locations?.[0]?.name || '',
    tags: p.categories || [],
    url: `https://${host}${p.externalPath || p.externalUrl || ''}`,
    source: 'workday',
    created_at: p.postedOn || p.postedDateTime
  }));
  const kept = filterFranceAlternance(rows);
  return insertMany(env, kept);
}
