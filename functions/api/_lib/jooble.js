export async function fetchJooble(env, { what="alternance", page=1 } = {}) {
  if (!env.JOOBLE_KEY) return [];
  const res = await fetch(`https://jooble.org/api/${env.JOOBLE_KEY}`, {
    method: 'POST',
    headers: {'content-type':'application/json'},
    body: JSON.stringify({ keywords: what, page })
  });
  if (!res.ok) return [];
  const data = await res.json().catch(()=> ({}));
  const list = data.jobs || [];
  return list.map((it, i) => ({
    id: `jooble:${(it.id || i)}`,
    title: it.title || 'Sans titre',
    company: it.company || 'Entreprise',
    location: it.location || '',
    tags: [],
    url: it.link || '#',
    source: 'jooble',
    created_at: it.updated || new Date().toISOString()
  }));
}

