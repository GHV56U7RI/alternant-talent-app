import { filterFranceAlternance, insertMany } from '../ingest.js';

export async function collectFromAdzuna(env, { what = "alternance", results = 50 }) {
  const appId = env.ADZUNA_APP_ID, appKey = env.ADZUNA_APP_KEY;
  if (!appId || !appKey) return { from_adzuna: 0 };

  const url = new URL(`https://api.adzuna.com/v1/api/jobs/fr/search/1`);
  url.searchParams.set('app_id', appId);
  url.searchParams.set('app_key', appKey);
  url.searchParams.set('what', what);
  url.searchParams.set('results_per_page', String(Math.min(results, 50)));
  url.searchParams.set('content-type', 'application/json');

  const r = await fetch(url, { headers: { accept: 'application/json' }});
  if (!r.ok) return { from_adzuna: 0 };
  const data = await r.json().catch(() => ({}));

  const rows = (data.results || []).map(x => ({
    id: `adzuna:${x.id}`,
    title: x.title,
    company: x.company?.display_name,
    location: x.location?.display_name || x.location?.area?.join(', ') || '',
    tags: (x.category?.label ? [x.category.label] : []),
    url: x.redirect_url,
    source: 'adzuna',
    created_at: x.created
  }));

  const kept = filterFranceAlternance(rows);
  const n = await insertMany(env, kept);
  return { from_adzuna: n };
}
