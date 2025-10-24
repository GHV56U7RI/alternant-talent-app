const fs = require('fs');
const file = 'functions/api/jobs.js';
let src = fs.readFileSync(file, 'utf8');

function inject(name, re, replacement){
  if(!re.test(src)){ console.error(`⚠️  bloc ${name} introuvable (regex non-match)`); process.exit(1); }
  src = src.replace(re, replacement + '\n');
}

// -- (A) fromRemote avec défauts q/where + pagination
const fromRemoteNew = `
async function fromRemote({q, where, limit, offset}) {
  if (!env.REMOTE_API_TOKEN) return [];
  const base = env.REMOTE_API_BASE || "https://api.apprentissage.beta.gouv.fr/api/job/v1/search";
  const u = new URL(base);
  const q2 = (q && q.trim()) || "alternance";
  const w2 = (where && where.trim()) || "France";
  u.searchParams.set("what", q2);
  u.searchParams.set("where", w2);
  u.searchParams.set("caller", env.REMOTE_API_CALLER || "alternant-talent.app");
  const per  = Math.max(1, (limit|0) || 10);
  const page = Math.floor(((offset|0) || 0)/per) + 1;
  u.searchParams.set("results_per_page", String(per));
  u.searchParams.set("page", String(page));
  const r = await fetch(u.toString(), {
    headers: { "Accept":"application/json", "Authorization": \`Bearer \${env.REMOTE_API_TOKEN}\` }
  });
  if (!r.ok) return [];
  const j = await r.json();
  const arr = j.results || j.items || j.hits || [];
  return arr.map(massageJob("remote"));
}
`;

// -- (B) fromJooble en POST avec défauts q/where + pagination
const fromJoobleNew = `
async function fromJooble({q, where, limit, offset}) {
  if (!env.JOOBLE_KEY) return [];
  const per  = Math.max(1, (limit|0) || 10);
  const page = Math.floor(((offset|0) || 0)/per) + 1;
  const body = {
    keywords: (q && q.trim()) || "alternance",
    location: (where && where.trim()) || "France",
    page
  };
  const r = await fetch("https://jooble.org/api/"+env.JOOBLE_KEY, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify(body)
  });
  if (!r.ok) return [];
  const j = await r.json();
  const arr = j.jobs || j.items || [];
  return arr.slice(0, per).map(massageJob("jooble"));
}
`;

// -- (C) handleLive: route live=1 (par source ou agrégée)
const handleLiveFn = `
async function handleLive({ url, env }) {
  const q = (url.searchParams.get('q') || '').trim();
  const where = (url.searchParams.get('where') || '').trim();
  const source = (url.searchParams.get('source') || '').trim();
  const limit = parseInt(url.searchParams.get('limit') || '10', 10);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);

  try {
    const respond = (items) =>
      new Response(JSON.stringify({ total: items.length, items }), { headers: { "content-type": "application/json" } });

    if (source === 'remote')  return respond(await fromRemote({ q, where, limit, offset }));
    if (source === 'jooble')  return respond(await fromJooble({ q, where, limit, offset }));
    if (source === 'adzuna')  return respond(await fromAdzuna({ q, where, limit, offset }));
    if (source === 'd1')      return respond(await fromD1({ q, where, limit, offset }));

    const per = Math.max(1, Math.floor(limit / 4) || 1);
    const [a,b,c,d] = await Promise.all([
      fromRemote({ q, where, limit: per, offset: 0 }),
      fromJooble({ q, where, limit: per, offset: 0 }),
      fromAdzuna({ q, where, limit: per, offset: 0 }),
      fromD1({ q, where, limit: per, offset: 0 }),
    ]);

    const dedup = (arr) => {
      const seen = new Set(); const out = [];
      for (const it of arr) { const k = it.id || it.url; if (!k || seen.has(k)) continue; seen.add(k); out.push(it); }
      return out;
    };

    const items = dedup([].concat(a,b,c,d)).sort((x,y)=>{
      const tx = Date.parse(x.posted_at||x.posted||x.created_at||0) || 0;
      const ty = Date.parse(y.posted_at||y.posted||y.created_at||0) || 0;
      return ty - tx;
    });
    return respond(items);
  } catch (e) {
    return new Response(JSON.stringify({ total:0, items:[], error: (e && (e.stack||e.message)) || String(e) }), {
      status: 500, headers: { "content-type": "application/json" }
    });
  }
}
`;

// -- (1) Remplacer fromRemote (repère: juste avant fromJooble)
const reRemote = /async function fromRemote\([\s\S]*?\}\s*\n(?=async function fromJooble)/;
if (reRemote.test(src)) src = src.replace(reRemote, fromRemoteNew + '\n');

// -- (2) Remplacer fromJooble (repère: juste avant fromAdzuna)
const reJooble = /async function fromJooble\([\s\S]*?\}\s*\n(?=async function fromAdzuna)/;
if (reJooble.test(src)) src = src.replace(reJooble, fromJoobleNew + '\n');

// -- (3) Injecter handleLive si absent (avant l'export de onRequestGet)
if (!/function handleLive\s*\(/.test(src)) {
  const reExport = /export\s+const\s+onRequestGet\s*=\s*async\s*\(\s*{\s*request\s*,\s*env\s*}\s*\)\s*=>/;
  if (!reExport.test(src)) { console.error('⚠️  onRequestGet introuvable'); process.exit(1); }
  src = src.replace(reExport, handleLiveFn + '\n\nexport const onRequestGet = async ({ request, env }) =>');
}

// -- (4) Early return: si live=1, on passe par handleLive
const reUrlLine = /const\s+url\s*=\s*new\s+URL\s*\(\s*request\.url\s*\)\s*;/;
if (reUrlLine.test(src) && !/handleLive\(\{\s*url,\s*env\s*\}\)/.test(src)) {
  src = src.replace(reUrlLine, match => match + `
  const live = url.searchParams.get('live');
  if (live) {
    return await handleLive({ url, env });
  }`);
}

fs.writeFileSync(file, src, 'utf8');
console.log('✅ Patch live appliqué/validé.');
