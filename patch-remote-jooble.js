const fs = require('fs');

const file = 'functions/api/jobs.js';
let src = fs.readFileSync(file, 'utf8');

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

// Remplace les fonctions existantes par lookahead sur la suivante
const reRemote = /async function fromRemote\([\s\S]*?\}\s*\n(?=async function fromJooble)/;
const reJooble = /async function fromJooble\([\s\S]*?\}\s*\n(?=async function fromAdzuna)/;

if (!reRemote.test(src)) {
  console.error('⚠️  fromRemote introuvable (regex non match).');
  process.exit(1);
}
if (!reJooble.test(src)) {
  console.error('⚠️  fromJooble introuvable (regex non match).');
  process.exit(1);
}

src = src.replace(reRemote, fromRemoteNew + '\n');
src = src.replace(reJooble, fromJoobleNew + '\n');

fs.writeFileSync(file, src, 'utf8');
console.log('✅ Patch appliqué: fromRemote & fromJooble mis à jour.');
