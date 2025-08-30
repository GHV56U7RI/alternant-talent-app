// functions/api/refresh.js
import { fetchAdzuna } from './_lib/adzuna.js';
import { fetchJooble } from './_lib/jooble.js';

/**
 * Upsert d'un tableau d'annonces dans D1.
 * - id stable: row.id sinon basé sur l'URL (évite les doublons à chaque refresh)
 * - tags: JSON stringifié
 */
async function saveJobs(env, list = [], fallbackSource = 'seed') {
  let n = 0;
  for (const row of list) {
    const stableId = row?.id || (row?.url ? `url:${row.url}` : crypto.randomUUID());
    const created = row?.created_at || new Date().toISOString();
    const tags = JSON.stringify(row?.tags || []);

    await env.DB.prepare(
      `INSERT OR REPLACE INTO jobs
        (id, title, company, location, tags, url, source, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        stableId,
        row?.title || 'Sans titre',
        row?.company || 'Entreprise',
        row?.location || '',
        tags,
        row?.url || '#',
        row?.source || fallbackSource,
        created
      )
      .run();

    n++;
  }
  return n;
}

export async function onRequest(context) {
  const { request, env } = context;

  // 0) Méthode + Auth
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
      status: 405,
      headers: { 'content-type': 'application/json' },
    });
  }

  const auth = request.headers.get('authorization') || '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!bearer || !env.ADMIN_TOKEN || bearer !== env.ADMIN_TOKEN) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    });
  }

  // 1) SEED (toujours)
  const origin = new URL(request.url).origin;
  const assetUrl = new URL('/data/seed.json', origin);
  const assetRes = await env.ASSETS.fetch(new Request(assetUrl, { method: 'GET' }));

  let seed = [];
  try {
    if (assetRes.ok) seed = await assetRes.json();
  } catch {}
  if (!Array.isArray(seed)) seed = [];

  // 2) Adzuna / Jooble (si secrets, sinon [])
  const [adzuna, jooble] = await Promise.all([
    fetchAdzuna(env).catch(() => []),
    fetchJooble(env).catch(() => []),
  ]);

  // 3) Careers (Greenhouse/Lever/SmartRecruiters/Workday…)
  //    → marche seulement si tu as ajouté functions/api/collect/** + public/data/sources.json
  let careers = [];
  try {
    const mod = await import('./collect/index.js'); // dynamic import = safe si fichiers absents
    if (mod?.collectFromSources) {
      careers = await mod.collectFromSources(env, request);
      if (!Array.isArray(careers)) careers = [];
    }
  } catch {
    careers = []; // pas de collecteurs, on ignore
  }

  // 4) Upsert en base, par lot (compteurs séparés)
  const from_seed = await saveJobs(env, seed, 'seed');
  const from_adzuna = await saveJobs(env, adzuna, 'adzuna');
  const from_jooble = await saveJobs(env, jooble, 'jooble');
  const from_careers = await saveJobs(env, careers, 'careers');

  const inserted_total = from_seed + from_adzuna + from_jooble + from_careers;

  return new Response(
    JSON.stringify({
      ok: true,
      inserted_total,
      from_seed,
      from_adzuna,
      from_jooble,
      from_careers,
    }),
    { headers: { 'content-type': 'application/json' } }
  );
}

