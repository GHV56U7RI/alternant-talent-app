import { filterFranceAlternance, insertMany } from '../ingest.js';

export async function collectFromJooble(env, { keywords = "alternance", location = "France", limit = 50 }) {
  const key = env.JOOBLE_KEY;
  if (!key) return { from_jooble: 0 };
  const url = `https://jooble.org/api/${encodeURIComponent(key)}`;
  const body = { keywords, location, page: 1, radius: 100, searchMode: 1 };
  const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) return { from_jooble: 0 };
  const data = await r.json().catch(() => ({}));

  const rows = (data.jobs || []).slice(0, limit).map(x => ({
    id: `jooble:${x.id || x.link}`,
    title: x.title,
    company: x.company,
    location: x.location,
    tags: [],
    url: x.link,
    source: 'jooble',
    created_at: x.updated || x.posted || x.date
  }));

  const kept = filterFranceAlternance(rows);
  const n = await insertMany(env, kept);
  return { from_jooble: n };
}
