const fs = require('fs');
const file = 'functions/api/jobs.js';
let src = fs.readFileSync(file, 'utf8');

function replaceHandleLive(src) {
  const start = src.indexOf('async function handleLive');
  if (start === -1) {
    // Insérer avant l’export onRequestGet
    const hook = 'export const onRequestGet';
    const i = src.indexOf(hook);
    if (i === -1) throw new Error('onRequestGet introuvable');
    return (
`async function handleLive({ url, env }) {
  const source = (url.searchParams.get('source') || '').trim();
  const limit  = Math.max(1, parseInt(url.searchParams.get('limit') || '10', 10));
  const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0', 10));
  const q      = (url.searchParams.get('q') || '').trim();
  const where  = (url.searchParams.get('where') || '').trim();

  const normDate = v => {
    if (!v) return 0;
    const t = Date.parse(v);
    return Number.isFinite(t) ? t : 0;
  };

  const massageJob = (srcName) => (j) => ({
    id: j.id || j._id || j.jobId || j.reference || j.ref || (j.url ? btoa(j.url).slice(0, 16) : undefined),
    title: j.title || j.jobTitle || j.position || j.name || '—',
    company: j.company || j.company_name || j.companyName || j.employer || (j.company && j.company.name) || '',
    location: j.location || j.city || j.place || j.area || '',
    posted: j.posted || j.created || j.created_at || j.publication_date || j.date || '',
    url: j.url || j.redirect_url || j.link || '',
    source: srcName,
  });

  async function fromRemote({ q, where, limit, offset }) {
    if (!env.REMOTE_API_TOKEN) return [];
    const base = env.REMOTE_API_BASE || "https://api.apprentissage.beta.gouv.fr/api/job/v1/search";
    const headers = {
      "Accept":"application/json",
      "Content-Type":"application/json",
      "Authorization": \`Bearer \${env.REMOTE_API_TOKEN}\`
    };

    // Défauts solides (comme /api/health)
    const latitude = 48.8566, longitude = 2.3522, radius = 30;
    const romes = ["M1805","M1802"];

    // Pagination simple côté client
    const per  = Math.max(1, (limit|0) || 10);

    // POST prioritaire
    const body = {
      latitude, longitude, radius, romes,
      caller: env.REMOTE_API_CALLER || "alternant-talent.app"
    };
    let r = await fetch(base, { method: "POST", headers, body: JSON.stringify(body) });

    // Fallback GET si POST échoue
    if (!r.ok) {
      const u = new URL(base);
      u.searchParams.set("latitude",  String(latitude));
      u.searchParams.set("longitude", String(longitude));
      u.searchParams.set("radius",    String(radius));
      u.searchParams.set("romes",     romes.join(","));
      u.searchParams.set("caller",    env.REMOTE_API_CALLER || "alternant-talent.app");
      r = await fetch(u.toString(), { headers: { "Accept":"application/json", "Authorization": \`Bearer \${env.REMOTE_API_TOKEN}\` } });
    }

    if (!r.ok) return [];
    const j = await r.json();
    const arr = Array.isArray(j.jobs) ? j.jobs : (j.results || j.items || []);
    return (arr || []).slice(0, per).map(massageJob("remote"));
  }

  async function fromJooble({ q, where, limit, offset }) {
    if (!env.JOOBLE_KEY) return [];
    const per  = Math.max(1, (limit|0) || 10);
    const page = Math.floor(((offset|0) || 0) / per) + 1;

    const keywords = (q && q.trim()) || 'alternance OR apprentissage OR "contrat pro" OR "contrat de professionnalisation" OR alternant';
    const location = (where && where.trim()) || 'France';

    const r = await fetch(\`https://jooble.org/api/\${env.JOOBLE_KEY}\`, {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({ keywords, location, country: "fr", page })
    });
    if (!r.ok) return [];
    const j = await r.json();
    const arr = j.jobs || [];
    return (arr || []).slice(0, per).map(massageJob("jooble"));
  }

  async function fromAdzuna({ q, where, limit, offset }) {
    if (!env.ADZUNA_APP_ID || !env.ADZUNA_APP_KEY) return [];
    const per  = Math.max(1, (limit|0) || 10);
    const page = Math.floor(((offset|0) || 0) / per) + 1;

    const u = new URL(\`https://api.adzuna.com/v1/api/jobs/fr/search/\${page}\`);
    u.searchParams.set("app_id",  env.ADZUNA_APP_ID);
    u.searchParams.set("app_key", env.ADZUNA_APP_KEY);
    u.searchParams.set("results_per_page", String(per));
    if (q)     u.searchParams.set("what",  q);
    if (where) u.searchParams.set("where", where);

    const r = await fetch(u.toString(), { headers: { "Accept":"application/json" } });
    if (!r.ok) return [];
    const j = await r.json();
    const arr = j.results || [];
    return (arr || []).map(massageJob("adzuna"));
  }

  async function fromD1({ q, where, limit, offset }) {
    if (!env.DB) return [];
    const per = Math.max(1, (limit|0) || 10);
    const off = Math.max(0, (offset|0) || 0);
    // simple fallback: dernières offres
    const rs = await env.DB.prepare('SELECT id, title, company, location, created_at AS posted, url FROM jobs ORDER BY created_at DESC LIMIT ? OFFSET ?').bind(per, off).all();
    const rows = (rs && (rs.results || rs.rows)) || [];
    return rows.map(r => ({
      id: r.id, title: r.title, company: r.company, location: r.location, posted: r.posted, url: r.url, source: 'd1'
    }));
  }

  const map = { remote: fromRemote, jooble: fromJooble, adzuna: fromAdzuna, d1: fromD1 };

  try {
    if (source && map[source]) {
      const items = await map[source]({ q, where, limit, offset });
      return new Response(JSON.stringify({ total: items.length, items }), { headers: { "content-type": "application/json" } });
    }

    // Agrégat: 4 sources équilibrées
    const per = Math.max(1, Math.floor(limit / 4));
    const [a, b, c, d] = await Promise.all([
      fromRemote({ q, where, limit: per, offset: 0 }),
      fromJooble({ q, where, limit: per, offset: 0 }),
      fromAdzuna({ q, where, limit: per, offset: 0 }),
      fromD1({ q, where, limit: per, offset: 0 }),
    ]);

    const seen = new Set();
    const merged = [];
    for (const it of ([]).concat(a, b, c, d)) {
      if (!it) continue;
      const k = it.id || it.url;
      if (!k || seen.has(k)) continue;
      seen.add(k);
      merged.push(it);
    }
    merged.sort((x, y) => normDate(y.posted || y.created_at || y.posted_at) - normDate(x.posted || x.created_at || x.posted_at));
    const out = merged.slice(0, limit);

    return new Response(JSON.stringify({ total: out.length, items: out }), { headers: { "content-type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ total: 0, items: [], error: String(e && e.message || e) }), { status: 200, headers: { "content-type": "application/json" } });
  }
}

` + src.slice(i)
    );
  }

  // Sinon remplacer le bloc entier par comptage d’accolades
  const braceStart = src.indexOf('{', start);
  if (braceStart === -1) throw new Error('accolade de départ non trouvée');
  let i = braceStart, depth = 0;
  for (; i < src.length; i++) {
    const ch = src[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) { i++; break; }
    }
  }
  if (depth !== 0) throw new Error('bloc handleLive non équilibré');

  const before = src.slice(0, start);
  const after  = src.slice(i);

  const replacement =
`async function handleLive({ url, env }) {
  const source = (url.searchParams.get('source') || '').trim();
  const limit  = Math.max(1, parseInt(url.searchParams.get('limit') || '10', 10));
  const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0', 10));
  const q      = (url.searchParams.get('q') || '').trim();
  const where  = (url.searchParams.get('where') || '').trim();

  const normDate = v => {
    if (!v) return 0;
    const t = Date.parse(v);
    return Number.isFinite(t) ? t : 0;
  };

  const massageJob = (srcName) => (j) => ({
    id: j.id || j._id || j.jobId || j.reference || j.ref || (j.url ? btoa(j.url).slice(0, 16) : undefined),
    title: j.title || j.jobTitle || j.position || j.name || '—',
    company: j.company || j.company_name || j.companyName || j.employer || (j.company && j.company.name) || '',
    location: j.location || j.city || j.place || j.area || '',
    posted: j.posted || j.created || j.created_at || j.publication_date || j.date || '',
    url: j.url || j.redirect_url || j.link || '',
    source: srcName,
  });

  async function fromRemote({ q, where, limit, offset }) {
    if (!env.REMOTE_API_TOKEN) return [];
    const base = env.REMOTE_API_BASE || "https://api.apprentissage.beta.gouv.fr/api/job/v1/search";
    const headers = {
      "Accept":"application/json",
      "Content-Type":"application/json",
      "Authorization": \`Bearer \${env.REMOTE_API_TOKEN}\`
    };
    const latitude = 48.8566, longitude = 2.3522, radius = 30;
    const romes = ["M1805","M1802"];
    const per  = Math.max(1, (limit|0) || 10);
    const body = { latitude, longitude, radius, romes, caller: env.REMOTE_API_CALLER || "alternant-talent.app" };
    let r = await fetch(base, { method: "POST", headers, body: JSON.stringify(body) });
    if (!r.ok) {
      const u = new URL(base);
      u.searchParams.set("latitude",  String(latitude));
      u.searchParams.set("longitude", String(longitude));
      u.searchParams.set("radius",    String(radius));
      u.searchParams.set("romes",     romes.join(","));
      u.searchParams.set("caller",    env.REMOTE_API_CALLER || "alternant-talent.app");
      r = await fetch(u.toString(), { headers: { "Accept":"application/json", "Authorization": \`Bearer \${env.REMOTE_API_TOKEN}\` } });
    }
    if (!r.ok) return [];
    const j = await r.json();
    const arr = Array.isArray(j.jobs) ? j.jobs : (j.results || j.items || []);
    return (arr || []).slice(0, per).map(massageJob("remote"));
  }

  async function fromJooble({ q, where, limit, offset }) {
    if (!env.JOOBLE_KEY) return [];
    const per  = Math.max(1, (limit|0) || 10);
    const page = Math.floor(((offset|0) || 0) / per) + 1;
    const keywords = (q && q.trim()) || 'alternance OR apprentissage OR "contrat pro" OR "contrat de professionnalisation" OR alternant';
    const location = (where && where.trim()) || 'France';
    const r = await fetch(\`https://jooble.org/api/\${env.JOOBLE_KEY}\`, {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({ keywords, location, country: "fr", page })
    });
    if (!r.ok) return [];
    const j = await r.json();
    const arr = j.jobs || [];
    return (arr || []).slice(0, per).map(massageJob("jooble"));
  }

  async function fromAdzuna({ q, where, limit, offset }) {
    if (!env.ADZUNA_APP_ID || !env.ADZUNA_APP_KEY) return [];
    const per  = Math.max(1, (limit|0) || 10);
    const page = Math.floor(((offset|0) || 0) / per) + 1;
    const u = new URL(\`https://api.adzuna.com/v1/api/jobs/fr/search/\${page}\`);
    u.searchParams.set("app_id",  env.ADZUNA_APP_ID);
    u.searchParams.set("app_key", env.ADZUNA_APP_KEY);
    u.searchParams.set("results_per_page", String(per));
    if (q)     u.searchParams.set("what",  q);
    if (where) u.searchParams.set("where", where);
    const r = await fetch(u.toString(), { headers: { "Accept":"application/json" } });
    if (!r.ok) return [];
    const j = await r.json();
    const arr = j.results || [];
    return (arr || []).map(massageJob("adzuna"));
  }

  async function fromD1({ q, where, limit, offset }) {
    if (!env.DB) return [];
    const per = Math.max(1, (limit|0) || 10);
    const off = Math.max(0, (offset|0) || 0);
    const rs = await env.DB.prepare('SELECT id, title, company, location, created_at AS posted, url FROM jobs ORDER BY created_at DESC LIMIT ? OFFSET ?').bind(per, off).all();
    const rows = (rs && (rs.results || rs.rows)) || [];
    return rows.map(r => ({
      id: r.id, title: r.title, company: r.company, location: r.location, posted: r.posted, url: r.url, source: 'd1'
    }));
  }

  const map = { remote: fromRemote, jooble: fromJooble, adzuna: fromAdzuna, d1: fromD1 };

  try {
    if (source && map[source]) {
      const items = await map[source]({ q, where, limit, offset });
      return new Response(JSON.stringify({ total: items.length, items }), { headers: { "content-type": "application/json" } });
    }
    const per = Math.max(1, Math.floor(limit / 4));
    const [a, b, c, d] = await Promise.all([
      fromRemote({ q, where, limit: per, offset: 0 }),
      fromJooble({ q, where, limit: per, offset: 0 }),
      fromAdzuna({ q, where, limit: per, offset: 0 }),
      fromD1({ q, where, limit: per, offset: 0 }),
    ]);
    const seen = new Set(); const merged = [];
    for (const it of ([]).concat(a, b, c, d)) {
      if (!it) continue; const k = it.id || it.url; if (!k || seen.has(k)) continue; seen.add(k); merged.push(it);
    }
    merged.sort((x, y) => normDate(y.posted || y.created_at || y.posted_at) - normDate(x.posted || x.created_at || x.posted_at));
    const out = merged.slice(0, limit);
    return new Response(JSON.stringify({ total: out.length, items: out }), { headers: { "content-type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ total: 0, items: [], error: String(e && e.message || e) }), { status: 200, headers: { "content-type": "application/json" } });
  }
}
`;
  return before + replacement + after;
}

try {
  src = replaceHandleLive(src);

  // S’assure que onRequestGet renvoie handleLive quand live=1
  if (src.includes('const url = new URL(request.url);') && !src.includes('return await handleLive({ url, env })')) {
    src = src.replace(
      /const\s+url\s*=\s*new\s+URL\s*\(\s*request\.url\s*\)\s*;/,
      (m) => m + `\n  const live = url.searchParams.get('live');\n  if (live) { return await handleLive({ url, env }); }\n`
    );
  }

  fs.writeFileSync(file, src, 'utf8');
  console.log('✅ handleLive réécrit sans erreurs de syntaxe.');
} catch (e) {
  console.error('❌ Patch failed:', e.message);
  process.exit(1);
}
