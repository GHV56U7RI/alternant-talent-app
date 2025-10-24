#!/usr/bin/env bash
set -euo pipefail

# Vérifs rapides
[ -f "package.json" ] || { echo "❌ Lance ce script à la racine du repo (où est package.json)"; exit 1; }
[ -f "functions/api/jobs.js" ] || { echo "❌ Fichier manquant: functions/api/jobs.js"; exit 1; }

# 1) Écrit .dev.vars (⚠️ ne pas commit !)
cat > .dev.vars <<'EOF'
# === Alternant & Talent — .dev.vars (LOCAL) ===
# ⚠️ Ne pas commit ce fichier (.gitignore)

# Adzuna
ADZUNA_APP_ID="0db63270"
ADZUNA_APP_KEY="d15a8808965974c88ff20e4a0b4faee9"
ADZUNA_PAGES="1"

# Jooble
JOOBLE_KEY="9ad45f9a-dab4-4071-8213-55453bbfcd42"
JOOBLE_PAGES="1"
# JOOBLE_ENDPOINT="https://jooble.org/api/"

# La Bonne Alternance (LIVE)
# Remplace REMOTE_API_BASE si ton endpoint est différent, sinon garde cet exemple.
REMOTE_API_BASE="https://labonnealternance.apprentissage.beta.gouv.fr/api/v1/jobs"
REMOTE_API_CALLER="alternant-talent.app"
REMOTE_API_TOKEN="eyJhbGciOiJIUzI1NiJ9.eyJfaWQiOiI2OGNmNmNkNjgxZGY5MmFiYTc2MDNhODUiLCJhcGlfa2V5IjoiT1piZmNSdlNoeXkzWFBiaHF3REJ6aGFqRVdTQ3V6bFlFNU9raVVlZS9IST0iLCJvcmdhbmlzYXRpb24iOm51bGwsImVtYWlsIjoiYWx0ZXJuYW50LnRhbGVudC5wLTk4YmRAb3V0bG9vay5jb20iLCJpc3MiOiJhcGkiLCJpYXQiOjE3NTg0Mzk5MDYsImV4cCI6MTc4OTk2MDQwOH0.1GVWwx1P2j62g2WjwSoYPcRzRbmqiDa75KdEWvJEf7E"
EOF

echo "✅ .dev.vars écrit."

# 2) Patch du LIVE fetch dans functions/api/jobs.js (headers Authorization/x-api-key + garde REMOTE_API_BASE)
node - <<'NODE'
const fs = require('fs');
const path = 'functions/api/jobs.js';
if (!fs.existsSync(path)) {
  console.error('❌ Introuvable:', path);
  process.exit(1);
}
let s = fs.readFileSync(path, 'utf8');

// Ajoute un garde si REMOTE_API_BASE manquant (juste avant la construction de l’URL)
if (!/if\s*\(!env\.REMOTE_API_BASE\)/.test(s) && s.includes('const u = new URL(env.REMOTE_API_BASE);')) {
  s = s.replace(
    'const u = new URL(env.REMOTE_API_BASE);',
    "if (!env.REMOTE_API_BASE) { return json({ items: [], total: 0, limit, offset, source: 'remote_misconfig', error: 'REMOTE_API_BASE manquant' }, 500); }\n      const u = new URL(env.REMOTE_API_BASE);"
  );
}

// Remplace le fetch simple par un fetch avec headers dynamiques
const FETCH_RE = /const\s+resp\s*=\s*await\s*fetch\s*\(\s*u\.toString\(\)\s*,\s*\{\s*headers\s*:\s*\{\s*'Accept'\s*:\s*'application\/json'\s*\}\s*\}\s*\)\s*;/m;
if (FETCH_RE.test(s)) {
  s = s.replace(
    FETCH_RE,
`const headers = { 'Accept': 'application/json' };
      if (env.REMOTE_API_TOKEN) {
        const t = String(env.REMOTE_API_TOKEN);
        headers['Authorization'] = t.startsWith('Bearer ') ? t : \`Bearer \${t}\`;
        headers['x-api-key'] = t; // certains endpoints utilisent x-api-key
      }
      const resp = await fetch(u.toString(), { headers });`
  );
} else {
  console.warn("⚠️ Motif du fetch LIVE non trouvé. Vérifie le fichier si rien ne change.");
}

fs.writeFileSync(path, s);
console.log('✅ Patch appliqué sur', path);
NODE

echo "✅ Patch appliqué."

# 3) Petit diff si Git est présent (facultatif)
if command -v git >/dev/null 2>&1; then
  git diff -- functions/api/jobs.js || true
fi

# 4) Conseils de test (à exécuter APRES avoir lancé wrangler en local)
cat <<'TIP'

Lance ton serveur local puis teste :
  curl -X POST "http://localhost:8797/api/refresh?q=alternance&city=Paris&country=fr&limit=50"
  curl "http://localhost:8797/api/jobs?q=data&city=Paris&limit=10"
  curl "http://localhost:8797/api/jobs?live=1&q=data&city=Paris&limit=10"

Si tu viens de modifier .dev.vars, relance la commande de dev pour recharger les variables.
TIP
