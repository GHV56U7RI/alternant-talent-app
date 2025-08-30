import { insertMany } from './_lib/ingest.js';
import { collectFromSources } from './collect/index.js';

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'POST')
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405, headers: { 'content-type': 'application/json' } });

  const auth = request.headers.get('authorization') || '';
  if (!auth.startsWith('Bearer ') || !env.ADMIN_TOKEN || auth.slice(7) !== env.ADMIN_TOKEN)
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } });

  // 1) seed JSON
  const origin = new URL(request.url).origin;
  const seedRes = await env.ASSETS.fetch(new Request(new URL('/data/seed.json', origin), { method: 'GET' }));
  let seed = []; try { if (seedRes.ok) seed = await seedRes.json(); } catch {}
  const from_seed = await insertMany(env, Array.isArray(seed) ? seed : []);

  // 2) agrégateurs + careers FR
  const { from_adzuna = 0, from_jooble = 0, from_careers = 0 } = await collectFromSources(env, request);

  return new Response(JSON.stringify({
    ok: true,
    inserted_total: from_seed + from_adzuna + from_jooble + from_careers,
    from_seed, from_adzuna, from_jooble, from_careers
  }), { headers: { 'content-type': 'application/json' } });
}
