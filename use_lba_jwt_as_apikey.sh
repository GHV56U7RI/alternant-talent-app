#!/usr/bin/env bash
set -euo pipefail

red(){ printf "\033[31m%s\033[0m\n" "$*" >&2; }
grn(){ printf "\033[32m%s\033[0m\n" "$*"; }
ylw(){ printf "\033[33m%s\033[0m\n" "$*"; }

PORT="${PORT:-8789}"

# 1) Demande ton jeton JWT (celui qui commence par eyJ…)
read -r -p "Colle ton JETON (JWT eyJ...): " JWT
JWT="$(printf "%s" "$JWT" | tr -d '[:space:]')"
if [[ -z "$JWT" ]]; then red "❌ Jeton vide"; exit 1; fi
if [[ "${JWT}" != eyJ* ]]; then red "❌ Ce n'est pas un JWT (ne commence pas par eyJ)"; exit 1; fi

# 2) Extrait la clé d'API depuis le payload (champ api_key)
API_KEY="$(
python3 - "$JWT" <<'PY' 2>/dev/null || true
import sys, base64, json
jwt=sys.argv[1]
try:
    payload=jwt.split('.')[1]
    payload += '='*(-len(payload)%4)
    data=json.loads(base64.urlsafe_b64decode(payload.encode()).decode())
    print(data.get('api_key',""))
except Exception as e:
    print("")
PY
)"

if [[ -z "$API_KEY" ]]; then
  red "❌ Impossible d'extraire api_key du JWT. Vérifie que c'est bien le jeton fourni par LBA."
  exit 1
fi
grn "✅ Clé extraite depuis le JWT."

# 3) Mets à jour .dev.vars (base, caller, et REMOTE_API_TOKEN = vraie clé)
[[ -f .dev.vars ]] || touch .dev.vars
/usr/bin/sed -i '' 's#^REMOTE_API_BASE=.*#REMOTE_API_BASE="https://api.apprentissage.beta.gouv.fr/api/job/v1/search"#' .dev.vars 2>/dev/null || true
/usr/bin/sed -i '' 's#^REMOTE_API_CALLER=.*#REMOTE_API_CALLER="alternant-talent.app"#' .dev.vars 2>/dev/null || true
grep -q '^REMOTE_API_BASE=' .dev.vars || echo 'REMOTE_API_BASE="https://api.apprentissage.beta.gouv.fr/api/job/v1/search"' >> .dev.vars
grep -q '^REMOTE_API_CALLER=' .dev.vars || echo 'REMOTE_API_CALLER="alternant-talent.app"' >> .dev.vars
/usr/bin/sed -i '' "s#^REMOTE_API_TOKEN=.*#REMOTE_API_TOKEN=\"${API_KEY}\"#" .dev.vars 2>/dev/null || true
grep -q '^REMOTE_API_TOKEN=' .dev.vars || echo "REMOTE_API_TOKEN=\"${API_KEY}\"" >> .dev.vars
grn "✅ .dev.vars mis à jour (REMOTE_API_TOKEN = api_key)."

# 4) Patch headers dans functions/api/jobs.js : envoyer api-key/x-api-key, jamais Authorization
if [[ -f functions/api/jobs.js ]]; then
  node - <<'NODE'
const fs=require('fs'); const p='functions/api/jobs.js';
let s=fs.readFileSync(p,'utf8');
// retire tout header Authorization
s=s.replace(/headers\[['"]Authorization['"]\]\s*=\s*[^;]+;/g,'');
// assure la construction des headers
if(!/const headers\s*=\s*\{/.test(s)){
  s=s.replace(/const u = new URL\(env\.REMOTE_API_BASE\);/,'const headers = { "Accept": "application/json" };\n$&');
}
// force api-key
s=s.replace(
  /if\s*\(\s*env\.REMOTE_API_TOKEN\s*\)\s*\{[\s\S]*?}/m,
`if (env.REMOTE_API_TOKEN) {
  const t = String(env.REMOTE_API_TOKEN);
  headers['api-key'] = t;
  headers['x-api-key'] = t;
}`
);
fs.writeFileSync(p,s); console.log('✅ Patch headers LBA appliqué.');
NODE
else
  ylw "ℹ️ functions/api/jobs.js introuvable, patch ignoré."
fi

# 5) Redémarre Wrangler sur un port libre
ylw "🔁 Redémarrage du serveur dev…"
pkill -f "wrangler pages dev" 2>/dev/null || true
nohup wrangler pages dev public --port "$PORT" >/tmp/wrangler_dev.log 2>&1 &
PID=$!
ylw "⏳ Démarrage (pid=$PID, port=$PORT)…"
for i in {1..40}; do
  curl -sSf "http://localhost:${PORT}/" >/dev/null 2>&1 && break
  sleep 0.25
done
grn "✅ Prêt: http://localhost:${PORT}"

# 6) Test API LBA en direct (GET puis POST) avec la clé extraite
ylw "🔎 Test direct LBA (GET, departements=75, romes=M1806)…"
curl -sS -D - -o /tmp/lba_get.json \
  -H 'Accept: application/json' \
  -H "api-key: ${API_KEY}" \
  "https://api.apprentissage.beta.gouv.fr/api/job/v1/search?departements=75&romes=M1806&radius=30" \
  | awk 'BEGIN{IGNORECASE=1}/^(http|content-type)/{print}'

ylw "🔎 Test direct LBA (POST JSON)…"
curl -sS -D - -o /tmp/lba_post.json \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' \
  -H "api-key: ${API_KEY}" \
  -d '{"departements":["75"],"romes":["M1806"],"radius":30}' \
  "https://api.apprentissage.beta.gouv.fr/api/job/v1/search" \
  | awk 'BEGIN{IGNORECASE=1}/^(http|content-type)/{print}'

if command -v jq >/dev/null 2>&1; then
  echo "GET count:"  $(jq '.jobs|length'  /tmp/lba_get.json  2>/dev/null || echo "?")
  echo "POST count:" $(jq '.jobs|length'  /tmp/lba_post.json 2>/dev/null || echo "?")
fi

# 7) Test via ton endpoint LIVE
ylw "🎯 Test via Worker (LIVE)…"
curl -sS "http://localhost:${PORT}/api/jobs?live=1&city=Paris&limit=10&radius=50&romes=M1806" \
| (command -v jq >/dev/null 2>&1 && jq '{source, total, items: (.items|length)}' || cat)

grn "✔ Terminé."
