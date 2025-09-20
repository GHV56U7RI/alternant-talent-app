export async function fetchAdzuna(env, { what="alternance", where="France", results=20 } = {}) {
  if (!env.ADZUNA_APP_ID || !env.ADZUNA_APP_KEY) return [];
  const url = new URL(`https://api.adzuna.com/v1/api/jobs/fr/search/1`);
  url.searchParams.set('app_id', env.ADZUNA_APP_ID);
  url.searchParams.set('app_key', env.ADZUNA_APP_KEY);
  url.searchParams.set('what', what);
  url.searchParams.set('where', where);
  url.searchParams.set('results_per_page', results);
  url.searchParams.set('content-type','application/json');

  const res = await fetch(url, { headers: { 'accept': 'application/json' }});
  if (!res.ok) return [];
  const data = await res.json().catch(()=> ({}));
  const list = data.results || [];
  return list.map(it => ({
    id: `adzuna:${it.id}`,
    title: it.title || 'Sans titre',
    company: it.company?.display_name || 'Entreprise',
    location: it.location?.display_name || '',
    tags: [],
    url: it.redirect_url || '#',
    source: 'adzuna',
    created_at: it.created || new Date().toISOString()
  }));
}

