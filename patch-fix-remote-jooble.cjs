const fs = require('fs');

const file = 'functions/api/jobs.js';
let src = fs.readFileSync(file, 'utf8');

// ---- Nouvelle version de fromRemote (LBA) ----
const fromRemoteFixed = `
async function fromRemote({ q, where, limit, offset }) {
  if (!env.REMOTE_API_TOKEN) return [];
  const base = env.REMOTE_API_BASE || "https://api.apprentissage.beta.gouv.fr/api/job/v1/search";
  const u = new URL(base);

  const q2 = (q && q.trim()) || "alternance";
  const w2 = (where && where.trim()) || "France";
  if (q2) u.searchParams.set("what", q2);
  if (w2) u.searchParams.set("where", w2);
  u.searchParams.set("caller", env.REMOTE_API_CALLER || "alternant-talent.app");

  const per  = Math.max(1, (limit|0) || 10);
  const page = Math.floor(((offset|0) || 0)/per) + 1;
  u.searchParams.set("results_per_page", String(per));
  u.searchParams.set("page", String(page));

  const r = await fetch(u.toString(), {
    headers: { "Accept":"application/json", "Authorization": "Bearer " + env.REMOTE_API_TOKEN }
  });

  const status = r.status;
  let j = {};
  try { j = await r.json(); } catch {}
  const keys = Object.keys(j||{});

  // Supporte les formes LBA: peJobs.results, lbaJobs, matchas, results, items, hits, data
  let arr = [];
  if (Array.isArray(j.results)) arr = j.results;
  else if (Array.isArray(j.items)) arr = j.items;
  else if (Array.isArray(j.hits)) arr = j.hits;
  else if (j.peJobs && Array.isArray(j.peJobs.results)) arr = j.peJobs.results;
  else if (Array.isArray(j.lbaJobs)) arr = j.lbaJobs;
  else if (Array.isArray(j.matchas)) arr = j.matchas;
  else if (Array.isArray(j.data)) arr = j.data;

  if (!Array.isArray(arr) || arr.length === 0) {
    console.log("fromRemote empty", { status, url: u.toString(), keys });
    return [];
  }

  try {
    return arr.slice(0, per).map(massageJob("remote"));
  } catch (e) {
    console.log("fromRemote map error", { e: String(e) });
    return [];
  }
}
`;

// ---- Version Jooble avec logs si vide ----
const fromJoobleFixed = `
async function fromJooble({ q, where, limit, offset }) {
  if (!env.JOOBLE_KEY) return [];
  const per  = Math.max(1, (limit|0) || 10);
  const page = Math.floor(((offset|0) || 0)/per) + 1;

  const body = {
    keywords: (q && q.trim()) || "alternance",
    location: (where && where.trim()) || "France",
    page
  };

  const r = await fetch("https://jooble.org/api/" + env.JOOBLE_KEY, {
    method: "POST",
    headers: { "Content-Type":"application/json" },
    body: JSON.stringify(body)
  });

  const status = r.status;
  let j = {};
  try { j = await r.json(); } catch {}
  const keys = Object.keys(j||{});
  const arr = j.jobs || j.items || j.results || [];

  if (!Array.isArray(arr) || arr.length === 0) {
    console.log("fromJooble empty", { status, keys, note:"vérifie JOOBLE_KEY, payload et quota" });
    return [];
  }

  try {
    return arr.slice(0, per).map(massageJob("jooble"));
  } catch (e) {
    console.log("fromJooble map error", { e: String(e) });
    return [];
  }
}
`;

// Remplacement dans le fichier
src = src.replace(
  /async function fromRemote\([\s\S]*?\}\s*\n(?=async function fromJooble)/,
  fromRemoteFixed + '\n'
);
src = src.replace(
  /async function fromJooble\([\s\S]*?\}\s*\n(?=async function fromAdzuna)/,
  fromJoobleFixed + '\n'
);

fs.writeFileSync(file, src, 'utf8');
console.log('✅ fromRemote + fromJooble corrigés.');
