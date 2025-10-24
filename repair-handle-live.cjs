const fs = require('fs');
const file = 'functions/api/jobs.js';
let src = fs.readFileSync(file, 'utf8');

const reBlock = /async\s+function\s+handleLive\s*\(\s*{\s*url\s*,\s*env\s*}\s*\)\s*{[\s\S]*?}\s*\n(?=export\s+const\s+onRequestGet)/m;
if (!reBlock.test(src)) {
  console.error('⚠️  Bloc handleLive introuvable ou pattern non reconnu.');
  process.exit(1);
}

const replacement = `async function handleLive({ url, env }) {
  const source = (url.searchParams.get('source') || '').trim();
  const limit  = parseInt(url.searchParams.get('limit') || '10', 10);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);
  const q      = (url.searchParams.get('q') || '').trim();
  const where  = (url.searchParams.get('where') || '').trim();

  const massageJob = (src) => (it) => {
    const u = it.url || it.redirect_url || it.apply_url || it.link || '';
    let logoDomain = '';
    try { if (u) logoDomain = new URL(u).hostname; } catch {}
    return {
      id: it.id || it._id || it.guid || it.reference || u,
      title: it.title || it.name || it.jobTitle || '',
      company: it.company || it.company_name || it.companyName || it.employer || (it.company && it.company.name) || '',
      location: it.location || it.city || it.town || (it.locations && it.locations[0]) || '',
      url: u,
      posted: it.posted || it.created_at || it.date || it.published_at || it.publishedAt || '',
      source: src,
      logoUrl: it.logoUrl || it.company_logo || it.companyLogo || '',
      logoDomain
    };
  };

  async function fromRemote({ q, where, limit, offset }) {
    if (!env.REMOTE_API_TOKEN) return [];
    try {
      const base = env.REMOTE_API_BASE || 'https://api.apprentissage.beta.gouv.fr/api/job/v1/search';
      const u = new URL(base);
      if (q) u.searchParams.set('what', q);
      if (where) u.searchParams.set('where', where);
      u.searchParams.set('caller', env.REMOTE_API_CALLER || 'alternant-talent.app');
      const per  = Math.max(1, (limit|0) || 10);
      const page = Math.floor(((offset|0) || 0)/per) + 1;
      u.searchParams.set('results_per_page', String(per));
      u.searchParams.set('page', String(page));
      const r = await fetch(u.toString(), { headers: { 'Accept':'application/json', 'Authorization': 'Bearer ' + env.REMOTE_API_TOKEN }});
      if (!r.ok) return [];
      const j = await r.json();
      const arr = j.results || j.items || j.hits || [];
      return arr.map(massageJob('remote'));
    } catch (e) { return []; }
  }

  async function fromJooble({ q, where, limit, offset }) {
    if (!env.JOOBLE_KEY) return [];
    try {
      const per  = Math.max(1, (limit|0) || 10);
      const page = Math.floor(((offset|0) || 0)/per) + 1;
      const body = { page };
      if (q) body.keywords = q;
      if (where) body.location = where;
      const r = await fetch('https://jooble.org/api/' + env.JOOBLE_KEY, {
        method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(body)
      });
      if (!r.ok) return [];
      const j = await r.json();
      const arr = j.jobs || j.items || [];
      return arr.slice(0, per).map(massageJob('jooble'));
    } catch (e) { return []; }
  }

  async function fromAdzuna({ q, where, limit, offset }) {
    if (!env.ADZUNA_APP_ID || !env.ADZUNA_APP_KEY) return [];
    try {
      const per  = Math.max(1, (limit|0) || 10);
      const page = Math.floor(((offset|0) || 0)/per) + 1;
      const u = new URL('https://api.adzuna.com/v1/api/jobs/fr/search/' + page);
      u.searchParams.set('app_id', env.ADZUNA_APP_ID);
      u.searchParams.set('app_key', env.ADZUNA_APP_KEY);
      u.searchParams.set('results_per_page', String(per));
      if (q) u.searchParams.set('what', q);
      if (where) u.searchParams.set('where', where);
      const r = await fetch(u.toString(), { headers: { 'Accept':'application/json' } });
      if (!r.ok) return [];
      const j = await r.json();
      const arr = j.results || j.items || [];
      return arr.map(massageJob('adzuna'));
    } catch (e) { return []; }
  }

  async function fromD1({ q, where, limit, offset }) {
    if (!env.DB) return [];
    try {
      const per  = Math.max(1, (limit|0) || 10);
      const off  = Math.max(0, (offset|0) || 0);
      const rs = await env.DB.prepare(
        'SELECT id,title,company,location,url,created_at AS posted, logo_url AS logoUrl, source FROM jobs ORDER BY datetime(created_at) DESC LIMIT ? OFFSET ?'
      ).bind(per, off).all();
      const rows = (rs && (rs.results || rs)) || [];
      return rows.map(massageJob('d1'));
    } catch (e) { return []; }
  }

  const map = { remote: fromRemote, jooble: fromJooble, adzuna: fromAdzuna, d1: fromD1 };

  if (source && map[source]) {
    const items = await map[source]({ q, where, limit, offset });
    return new Response(JSON.stringify({ total: items.length, items }), { headers: { 'Content-Type':'application/json' }});
  }

  const per = Math.max(1, Math.floor((limit|0) / 4) || 1);
  const [a,b,c,d] = await Promise.all([
    map.remote({ q, where, limit: per, offset: 0 }),
    map.jooble({ q, where, limit: per, offset: 0 }),
    map.adzuna({ q, where, limit: per, offset: 0 }),
    map.d1({ q, where, limit: per, offset: 0 })
  ]);

  const dedup = (list) => {
    const seen = new Set(); const out = [];
    for (const it of list) { const k = it.id || it.url; if (!k || seen.has(k)) continue; seen.add(k); out.push(it); }
    return out;
  };

  const items = dedup([].concat(a,b,c,d)).sort((x,y)=>{
    const tx = Date.parse(x.posted || x.created_at || 0) || 0;
    const ty = Date.parse(y.posted || y.created_at || 0) || 0;
    return ty - tx;
  });

  return new Response(JSON.stringify({ total: items.length, items }), { headers: { 'Content-Type':'application/json' }});
}
`;

src = src.replace(reBlock, replacement + '\n');
fs.writeFileSync(file, src, 'utf8');
console.log('✅ handleLive remplacé (accolades & catch OK).');
