const fs = require('fs');
const file = 'functions/api/jobs.js';
let src = fs.readFileSync(file, 'utf8');

function replaceBlock(name, code) {
  const re = new RegExp(
    String.raw`async function ${name}\\([\\s\\S]*?\\n\\s*}\\n`,
    'm'
  );
  if (!re.test(src)) {
    console.error(`❌ Bloc ${name} introuvable`);
    process.exit(1);
  }
  src = src.replace(re, code + '\n');
}

const remoteNew = `
async function fromRemote({q, where, limit, offset}) {
  if (!env.REMOTE_API_TOKEN) return [];
  const base = env.REMOTE_API_BASE || "https://api.apprentissage.beta.gouv.fr/api/job/v1/search";
  const u = new URL(base);

  const q2 = (q && q.trim()) || 'alternance apprentissage "contrat de professionnalisation" alternant';
  const w2 = (where && where.trim()) || "France";
  u.searchParams.set("what", q2);
  u.searchParams.set("q", q2);
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

const joobleNew = `
async function fromJooble({q, where, limit, offset}) {
  if (!env.JOOBLE_KEY) return [];
  const per  = Math.max(1, (limit|0) || 10);
  const page = Math.floor(((offset|0) || 0)/per) + 1;

  const body = {
    keywords: (q && q.trim()) || 'alternance OR apprentissage OR "contrat pro" OR "contrat de professionnalisation" OR alternant',
    location: (where && where.trim()) || "France",
    page
  };
  const r = await fetch(\`https://jooble.org/api/\${env.JOOBLE_KEY}\`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify(body)
  });
  if (!r.ok) return [];
  const j = await r.json();
  const arr = j.jobs || [];
  return arr.slice(0, per).map(massageJob("jooble"));
}
`;

replaceBlock('fromRemote', remoteNew.trim());
replaceBlock('fromJooble', joobleNew.trim());

fs.writeFileSync(file, src, 'utf8');
console.log('✅ Defaults ajoutés pour fromRemote & fromJooble');
