const like = (q="") => `%${q}%`;
const isTrue = v => v === '1' || v === 'true';

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const q = url.searchParams.get('q') || '';
  const limit = Math.min(parseInt(url.searchParams.get('limit')||'20',10), 50);
  const offset = Math.max(parseInt(url.searchParams.get('offset')||'0',10), 0);
  const world = isTrue(url.searchParams.get('world') || '0'); // world=1 pour désactiver le filtre FR

  const clauses = [];
  const params  = [];
  if (q) { clauses.push(`(title LIKE ? OR company LIKE ? OR location LIKE ? OR tags LIKE ?)`); params.push(like(q), like(q), like(q), like(q)); }
  if (!world) { clauses.push(`(location LIKE '%France%' OR location REGEXP '(Guadeloupe|Martinique|Guyane|Réunion|Mayotte|Polynésie|Nouvelle-Calédonie|Saint-Pierre|Wallis|Barthélemy|Saint-Martin)')`); }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const rs = await env.DB.prepare(
    `SELECT id,title,company,location,tags,url,source,created_at
     FROM jobs
     ${where}
     ORDER BY datetime(created_at) DESC
     LIMIT ? OFFSET ?`
  ).bind(...params, limit, offset).all();

  const jobs = (rs.results || []).map(r => ({ ...r, tags: (()=>{ try { return JSON.parse(r.tags||'[]'); } catch { return []; } })() }));
  const last = await env.DB.prepare(`SELECT MAX(created_at) AS u FROM jobs ${where}`).bind(...params).all();
  const updated_at = last.results?.[0]?.u || new Date().toISOString();

  return new Response(JSON.stringify({ count: jobs.length, jobs, updated_at }), { headers: { 'content-type': 'application/json' } });
}
