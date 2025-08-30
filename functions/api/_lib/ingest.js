export function isAlternanceLike(text = "") {
  const t = (text || "").toLowerCase();
  return /\balternanc(e|e?s?)\b|\balternant(e)?\b|\bapprentissage\b|\bapprent(i|)ssage\b|\bintern(ship)?\b/.test(t);
}

// Normalise vers ton schéma jobs (D1): id, title, company, location, tags(JSON), url, source, created_at
export async function saveJobs(env, arr = []) {
  let n = 0;
  for (const j of arr) {
    const id = j.id || crypto.randomUUID();
    const created = j.created_at || new Date().toISOString();
    const tags = JSON.stringify(j.tags || []);
    await env.DB.prepare(
      `INSERT OR REPLACE INTO jobs
        (id,title,company,location,tags,url,source,created_at)
       VALUES (?,?,?,?,?,?,?,?)`
    ).bind(
      id, j.title || 'Sans titre', j.company || 'Entreprise',
      j.location || '', tags, j.url || '#', j.source || 'careers', created
    ).run();
    n++;
  }
  return n;
}

