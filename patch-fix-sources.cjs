const fs = require('fs');

const file = 'functions/api/jobs.js';
let src = fs.readFileSync(file, 'utf8');

const fromRemoteNew = `
async function fromRemote({ q, where, limit, offset }) {
  if (!env.REMOTE_API_TOKEN) return [];
  const base = env.REMOTE_API_BASE || "https://api.apprentissage.beta.gouv.fr/api/job/v1/search";
  const u = new URL(base);

  // Défauts doux: si q/where vides on met "alternance"/"France" pour garantir des résultats
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

  const _status = r.status;
  let j = {};
  try { j = await r.json(); } catch {}
  const keys = Object.keys(j||{});
  // Essaye plusieurs clés possibles
  const arr = j.results || j.items || j.hits || j.peJobs || j.data || [];

  if (!Array.isArray(arr) || !arr.length) {
    console.log("fromRemote empty", { url: u.toString(), status: _status, keys });
    return [];
  }
  return arr.slice(0, per).map(massageJob("remote"));
}
`;

const fromJoobleNew = `
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

  const _status = r.status;
  let j = {};
  try { j = await r.json(); } catch {}
  const keys = Object.keys(j||{});
  const arr = j.jobs || j.items || j.results || [];

  if (!Array.isArray(arr) || !arr.length) {
    console.log("fromJooble empty", { status: _status, keys, note:"Check JOOBLE_KEY + payload" });
    return [];
  }
  return arr.slice(0, per).map(massageJob("jooble"));
}
`;

// Remplace les fonctions existantes par les nouvelles
src = src.replace(/async function fromRemote\([\s\S]*?\}\s*\n(?=async function fromJooble)/, fromRemoteNew + '\n');
src = src.replace(/async function fromJooble\([\s\S]*?\}\s*\n(?=async function fromAdzuna)/, fromJoobleNew + '\n');

fs.writeFileSync(file, src, 'utf8');
console.log('✅ fromRemote/fromJooble mis à jour.');
