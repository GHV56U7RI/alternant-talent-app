const fs = require('fs');
const file = 'functions/api/jobs.js';
let src = fs.readFileSync(file, 'utf8');

/* ---- Fix fromRemote: POST to LBA + GET fallback, like /api/health ---- */
src = src.replace(
/async function fromRemote\(\{q, where, limit, offset\}\) \{[\s\S]*?\n\}/g,
`async function fromRemote({q, where, limit, offset}) {
  if (!env.REMOTE_API_TOKEN) return [];
  const base = env.REMOTE_API_BASE || "https://api.apprentissage.beta.gouv.fr/api/job/v1/search";
  const headers = {
    "Accept":"application/json",
    "Content-Type":"application/json",
    "Authorization": \`Bearer \${env.REMOTE_API_TOKEN}\`
  };

  // Defaults if no filters: same spirit as /api/health
  const latitude = 48.8566, longitude = 2.3522, radius = 30;
  const romes = ["M1805","M1802"];
  const body = {
    latitude, longitude, radius, romes,
    caller: env.REMOTE_API_CALLER || "alternant-talent.app"
  };

  // Try POST first
  let r = await fetch(base, { method:"POST", headers, body: JSON.stringify(body) });

  // Fallback GET
  if (!r.ok) {
    const u = new URL(base);
    u.searchParams.set("latitude",  String(latitude));
    u.searchParams.set("longitude", String(longitude));
    u.searchParams.set("radius",    String(radius));
    u.searchParams.set("romes",     romes.join(","));
    u.searchParams.set("caller",    env.REMOTE_API_CALLER || "alternant-talent.app");
    r = await fetch(u.toString(), {
      headers: { "Accept":"application/json", "Authorization": \`Bearer \${env.REMOTE_API_TOKEN}\` }
    });
  }

  if (!r.ok) return [];
  const j = await r.json();
  const arr = Array.isArray(j.jobs) ? j.jobs : (j.results || j.items || []);
  return arr.slice(0, Math.max(1, limit|0)).map(massageJob("remote"));
}`
);

/* ---- Fix fromJooble: add safe defaults when q/where are empty ---- */
src = src.replace(
/async function fromJooble\(\{q, where, limit, offset\}\) \{[\s\S]*?\n\}/g,
`async function fromJooble({q, where, limit, offset}) {
  if (!env.JOOBLE_KEY) return [];
  const per  = Math.max(1, (limit|0) || 10);
  const page = Math.floor(((offset|0) || 0)/per) + 1;

  // Strong defaults only when user didn't provide filters
  const keywords = (q && q.trim()) || 'alternance OR apprentissage OR "contrat pro" OR "contrat de professionnalisation" OR alternant';
  const location = (where && where.trim()) || "France";

  const r = await fetch(\`https://jooble.org/api/\${env.JOOBLE_KEY}\`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ keywords, location, country:"fr", page })
  });
  if (!r.ok) return [];
  const j = await r.json();
  const arr = j.jobs || [];
  return arr.slice(0, per).map(massageJob("jooble"));
}`
);

fs.writeFileSync(file, src, 'utf8');
console.log('✅ Patched functions/api/jobs.js');
