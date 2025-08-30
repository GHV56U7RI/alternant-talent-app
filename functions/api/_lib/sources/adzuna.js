import { stableId } from "../id.js";

export async function fetchAdzuna({ env, pages = 1, perPage = 50 }) {
  const appId = env.ADZUNA_APP_ID, appKey = env.ADZUNA_APP_KEY;
  if (!appId || !appKey) return { source: 'adzuna', jobs: [], ok: false, reason: 'missing_keys' };

  const all = [];
  for (let page = 1; page <= pages; page++) {
    const u = new URL(`https://api.adzuna.com/v1/api/jobs/fr/search/${page}`);
    u.searchParams.set('app_id', appId);
    u.searchParams.set('app_key', appKey);
    u.searchParams.set('what', 'alternance OR apprentissage');
    u.searchParams.set('where', 'France');
    u.searchParams.set('results_per_page', String(perPage));
    u.searchParams.set('content-type', 'application/json');

    const res = await fetch(u, { cf: { cacheTtl: 60 } });
    if (!res.ok) break;
    const json = await res.json();
    const results = Array.isArray(json.results) ? json.results : [];
    for (const r of results) {
      all.push({
        id: r.id ? `adzuna-${r.id}` : await stableId('adzuna', r.redirect_url || r.title),
        title: r.title || 'Sans titre',
        company: r.company?.display_name || 'Entreprise',
        location: r.location?.display_name || '',
        tags: [r.category?.label, r.contract_time, r.contract_type].filter(Boolean),
        url: r.redirect_url || r.url || '#',
        source: 'adzuna',
        created_at: r.created || new Date().toISOString(),
      });
    }
    if (results.length < perPage) break;
  }
  return { source: 'adzuna', jobs: all, ok: true };
}

