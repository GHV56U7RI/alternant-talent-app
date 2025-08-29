export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
      status: 405, headers: { 'content-type': 'application/json' }
    });
  }

  const auth = request.headers.get('authorization') || '';
  if (!auth.startsWith('Bearer ') || !env.ADMIN_TOKEN || auth.slice(7) !== env.ADMIN_TOKEN) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401, headers: { 'content-type': 'application/json' }
    });
  }

  // ⚠️ Pages ASSETS: FORCER GET (sinon 405) + URL absolue
  const origin = new URL(request.url).origin;
  const assetUrl = new URL('/data/seed.json', origin);
  const assetRes = await env.ASSETS.fetch(new Request(assetUrl, { method: 'GET' }));

  let payload = [];
  try { if (assetRes.ok) payload = await assetRes.json(); } catch {}
  if (!Array.isArray(payload)) payload = [];

  let inserted = 0;
  for (const row of payload) {
    const id = row.id || crypto.randomUUID();
    const created = row.created_at || new Date().toISOString();
    const tags = JSON.stringify(row.tags || []);
    await env.DB.prepare(
      `INSERT OR REPLACE INTO jobs
        (id,title,company,location,tags,url,source,created_at)
       VALUES (?,?,?,?,?,?,?,?)`
    ).bind(
      id, row.title || 'Sans titre', row.company || 'Entreprise',
      row.location || '', tags, row.url || '#', row.source || 'seed', created
    ).run();
    inserted++;
  }

  return new Response(JSON.stringify({ ok: true, inserted }), {
    headers: { 'content-type': 'application/json' }
  });
}
