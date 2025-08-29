const like = (q="") => `%${q}%`;

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const q = url.searchParams.get('q') || '';
  const limit = Math.min(parseInt(url.searchParams.get('limit')||'20',10), 50);
  const offset = Math.max(parseInt(url.searchParams.get('offset')||'0',10), 0);

  const where = q ? `WHERE title LIKE ? OR company LIKE ? OR location LIKE ? OR tags LIKE ?` : '';
  const params = q ? [like(q), like(q), like(q), like(q), limit, offset] : [limit, offset];

  const rs = await env.DB.prepare(
      `SELECT id,title,company,location,tags,url,source,created_at
         FROM jobs
         ${where}
         ORDER BY datetime(created_at) DESC
         LIMIT ? OFFSET ?`
    ).bind(...params).all();

  const jobs = (rs.results || []).map(r => ({
    ...r,
    tags: (()=>{ try { return JSON.parse(r.tags||'[]'); } catch { return []; } })()
  }));

  const last = await env.DB.prepare(`SELECT MAX(created_at) AS u FROM jobs`).all();
  const updated_at = last.results?.[0]?.u || new Date().toISOString();

  return new Response(JSON.stringify({ count: jobs.length, jobs, updated_at }), {
    headers: { 'content-type': 'application/json' }
  });
}
