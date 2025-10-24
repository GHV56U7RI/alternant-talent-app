const fs = require('fs');

const file = 'functions/api/jobs.js';
let src = fs.readFileSync(file, 'utf8');

// --- Nouveau handleLive (auto-contenu) ---
const HANDLE_LIVE = `
async function handleLive({ url, env }) {
  const q        = (url.searchParams.get('q') || '').trim();
  const where    = (url.searchParams.get('where') || '').trim();
  const limit    = Math.max(1, parseInt(url.searchParams.get('limit') || '10', 10));
  const offset   = Math.max(0, parseInt(url.searchParams.get('offset') || '0', 10));
  const source   = (url.searchParams.get('source') || '').trim();
  const bothEmpty = !q && !where; // défauts pour remote & jooble uniquement

  // --- Normalise un job minimal ---
  const normalize = (j, src) => ({
    id: j.id || j.job_id || j.slug || j.reference || j.url,
    title: j.title || j.job_title || j.position || '',
    company: j.company || j.company_name || j.company_display_name || (j.employer && j.employer.name) || '',
    location: j.location || j.city || (j.location_display || ''),
    url: j.url || j.redirect_url || j.apply_url || '',
    posted: j.posted || j.created_at || j.publication_date || j.date || '',
    source: src
  });

  // --- REMOTE (La Bonne Alternance / LBA) via GET what/where ---
  async function fromRemote({ q, where, limit, offset }) {
    if (!env.REMOTE_API_TOKEN) return [];
    const base = env.REMOTE_API_BASE || 'https://api.apprentissage.beta.gouv.fr/api/job/v1/search';
    const per  = Math.max(1, (limit|0) || 10);
    const page = Math.floor(((offset|0) || 0) / per) + 1;

    const u = new URL(base);
    const qq = q || (bothEmpty ? 'alternance' : '');
    const ww = where || (bothEmpty ? 'France' : '');
    if (qq) u.searchParams.set('what', qq);
    if (ww) u.searchParams.set('where', ww);
    u.searchParams.set('results_per_page', String(per));
    u.searchParams.set('page', String(page));
    u.searchParams.set('caller', env.REMOTE_API_CALLER || 'alternant-talent.app');

    const r = await fetch(u.toString(), {
      headers: { 'Accept':'application/json', 'Authorization': \`Bearer \${env.REMOTE_API_TOKEN}\` }
    });
    if (!r.ok) return [];
    const j = await r.json();
    const arr = j.results || j.items || j.hits || j.jobs || [];
    return arr.slice(0, per).map(x => normalize(x, 'remote'));
  }

  // --- JOOBLE (POST) ---
  async function fromJooble({ q, where, limit, offset }) {
    if (!env.JOOBLE_KEY) return [];
    const per  = Math.max(1, (limit|0) || 10);
    const page = Math.floor(((offset|0) || 0) / per) + 1;

    const body = {
      keywords: q || (bothEmpty ? 'alternance' : ''),
      location: where || (bothEmpty ? 'France' : ''),
      page
    };
    const r = await fetch(\`https://jooble.org/api/\${env.JOOBLE_KEY}\`, {
      method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(body)
    });
    if (!r.ok) return [];
    const j = await r.json();
    const arr = j.jobs || j.items || [];
    return arr.slice(0, per).map(x => normalize(x, 'jooble'));
  }

  // --- ADZUNA (GET) ---
  async function fromAdzuna({ q, where, limit, offset }) {
    if (!env.ADZUNA_APP_ID || !env.ADZUNA_APP_KEY) return [];
    const per  = Math.max(1, (limit|0) || 10);
    const page = Math.floor(((offset|0) || 0) / per) + 1;

    const u = new URL(\`https://api.adzuna.com/v1/api/jobs/fr/search/\${page}\`);
    u.searchParams.set('app_id',  env.ADZUNA_APP_ID);
    u.searchParams.set('app_key', env.ADZUNA_APP_KEY);
    u.searchParams.set('results_per_page', String(per));
    if (q)     u.searchParams.set('what', q);
    if (where) u.searchParams.set('where', where);

    const r = await fetch(u.toString(), { headers: { 'Accept':'application/json' }});
    if (!r.ok) return [];
    const j = await r.json();
    const arr = j.results || j.items || [];
    return arr.slice(0, per).map(x => normalize(x, 'adzuna'));
  }

  // --- D1 (SQLite) ---
  async function fromD1({ q, where, limit, offset }) {
    if (!env.DB) return [];
    const per = Math.max(1, (limit|0) || 10);
    const off = Math.max(0, (offset|0) || 0);
    let sql = 'SELECT id, title, company, location, url, created_at AS posted FROM jobs';
    const params = [];
    const conds = [];
    if (q)     { conds.push('(title LIKE ? OR company LIKE ? OR location LIKE ?)'); params.push(\`%\${q}%\`, \`%\${q}%\`, \`%\${q}%\`); }
    if (where) { conds.push('(location LIKE ?)'); params.push(\`%\${where}%\`); }
    if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(per, off);

    const res = await env.DB.prepare(sql).bind(...params).all();
    const rows = (res && (res.results || res)) || [];
    return rows.map(x => ({
      id: x.id, title: x.title, company: x.company, location: x.location,
      url: x.url, posted: x.posted, source: 'd1'
    }));
  }

  const map = { remote: fromRemote, jooble: fromJooble, adzuna: fromAdzuna, d1: fromD1 };

  // Si une source est demandée explicitement -> mono-source
  if (source && map[source]) {
    const items = await map[source]({ q, where, limit, offset });
    return new Response(JSON.stringify({ total: items.length, items }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Agrégat 4 sources (ex: limit=40 -> 10 par source)
  const per = Math.max(1, Math.floor(limit / 4) || 1);
  const [a,b,c,d] = await Promise.all([
    fromRemote({ q, where, limit: per, offset: 0 }),
    fromJooble({ q, where, limit: per, offset: 0 }),
    fromAdzuna({ q, where, limit: per, offset: 0 }),
    fromD1({ q, where, limit: per, offset: 0 })
  ]);

  // Dédup + tri récent
  const seen = new Set();
  const items = [...a, ...b, ...c, ...d].filter(it => {
    const k = it.id || it.url;
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  }).sort((x,y) => {
    const tx = Date.parse(x.posted || 0) || 0;
    const ty = Date.parse(y.posted || 0) || 0;
    return ty - tx;
  });

  return new Response(JSON.stringify({ total: items.length, items }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
`.trim() + '\n';

// 1) Supprimer ancien handleLive s'il existe
src = src.replace(/async\s+function\s+handleLive\s*\([\s\S]*?\}\s*\n(?=\S)/m, '');

// 2) Injecter avant l'export onRequestGet
const reExport = /export\s+const\s+onRequestGet\s*=\s*async\s*\(\s*\{\s*request\s*,\s*env\s*\}\s*\)\s*=>/;
if (!reExport.test(src)) {
  console.error('⚠️  onRequestGet introuvable.');
  process.exit(1);
}
src = src.replace(reExport, HANDLE_LIVE + '\n\nexport const onRequestGet = async ({ request, env }) =>');

// 3) Early return live=1 juste après "const url = new URL(request.url);"
const reUrl = /const\s+url\s*=\s*new\s+URL\s*\(\s*request\.url\s*\)\s*;\s*/;
if (reUrl.test(src) && !/return\s+await\s+handleLive\(\{\s*url\s*,\s*env\s*\}\)/.test(src)) {
  src = src.replace(reUrl, match => match + `
  if (url.searchParams.get('live')) {
    return await handleLive({ url, env });
  }
`);
}

fs.writeFileSync(file, src, 'utf8');
console.log('✅ handleLive remplacé et branché (live=1).');
