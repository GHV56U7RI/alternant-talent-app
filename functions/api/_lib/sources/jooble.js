import { stableId } from "../id.js";

export async function fetchJooble({ env, pages = 1, limit = 50 }) {
  const key = env.JOOBLE_KEY;
  if (!key) return { source: 'jooble', jobs: [], ok: false, reason: 'missing_key' };

  const all = [];
  for (let page = 1; page <= pages; page++) {
    const res = await fetch(`https://jooble.org/api/${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keywords: 'alternance OR apprenticeship',
        location: 'France',
        page, // 1..n
        searchMode: 1,
        radius: 0,
        limit
      })
    });
    if (!res.ok) break;
    const json = await res.json();
    const jobs = Array.isArray(json.jobs) ? json.jobs : [];
    for (const r of jobs) {
      const id = await stableId('jooble', r.link || r.id || r.title);
      all.push({
        id,
        title: r.title || 'Sans titre',
        company: r.company || 'Entreprise',
        location: r.location || '',
        tags: (r.tags || r.category ? [r.category] : []).filter(Boolean),
        url: r.link || '#',
        source: 'jooble',
        created_at: r.updated || r.pubDate || new Date().toISOString(),
      });
    }
    if (jobs.length < limit) break;
  }
  return { source: 'jooble', jobs: all, ok: true };
}

