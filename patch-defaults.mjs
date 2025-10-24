import fs from 'fs';

const file = 'functions/api/jobs.js';
let src = fs.readFileSync(file, 'utf8');

function replaceBlock(name, replacement) {
  const re = new RegExp(
    `async\\s+function\\s+${name}\\s*\\(\\{[^}]*\\}\\)\\s*\\{[\\s\\S]*?\\n\\}`,
    'm'
  );
  if (!re.test(src)) {
    console.error(`⚠️  Bloc ${name} introuvable; abandon.`);
    process.exit(1);
  }
  src = src.replace(re, replacement.trim());
}

// --- Nouveau fromRemote : valeurs de secours seulement si q et where vides ---
replaceBlock('fromRemote', `
async function fromRemote({ q, where, limit, offset }) {
  try {
    if (!env.REMOTE_API_TOKEN) return [];
    const base = env.REMOTE_API_BASE || "https://api.apprentissage.beta.gouv.fr/api/job/v1/search";
    const u = new URL(base);
    const per  = Math.max(1, limit);
    const page = Math.floor(offset / per) + 1;

    const useDefaults = !q && !where;
    const q2 = useDefaults ? "alternance" : (q || "");
    const w2 = useDefaults ? "France"     : (where || "");

    if (q2) u.searchParams.set("what", q2);
    if (w2) u.searchParams.set("where", w2);
    u.searchParams.set("caller", env.REMOTE_API_CALLER || "alternant-talent.app");
    u.searchParams.set("results_per_page", String(per));
    u.searchParams.set("page", String(page));

    const r = await fetch(u.toString(), {
      headers: { "Accept":"application/json", "Authorization": \`Bearer \${env.REMOTE_API_TOKEN}\` }
    });
    if (!r.ok) return [];
    const j = await r.json();
    const arr = j.results || j.items || j.hits || [];
    return arr.slice(0, per).map(massageJob("remote"));
  } catch (_) { return []; }
}
`);

// --- Nouveau fromJooble : mêmes valeurs de secours conditionnelles ---
replaceBlock('fromJooble', `
async function fromJooble({ q, where, limit, offset }) {
  try {
    if (!env.JOOBLE_KEY) return [];
    const per  = Math.max(1, limit);
    const page = Math.floor(offset / per) + 1;

    const useDefaults = !q && !where;
    const body = {
      keywords: useDefaults ? "alternance" : (q || ""),
      location: useDefaults ? "France"     : (where || ""),
      page
    };

    const r = await fetch(\`https://jooble.org/api/\${env.JOOBLE_KEY}\`, {
      method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(body)
    });
    if (!r.ok) return [];
    const j = await r.json();
    const arr = j.jobs || j.items || [];
    return arr.slice(0, per).map(massageJob("jooble"));
  } catch (_) { return []; }
}
`);

fs.writeFileSync(file, src, 'utf8');
console.log('✅ Patch defaults appliqué.');
