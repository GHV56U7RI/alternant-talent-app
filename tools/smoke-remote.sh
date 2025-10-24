#!/usr/bin/env bash
set -euo pipefail

DB_NAME="${D1_REMOTE_DB:-${DB_NAME:-alternance_db}}"

# Outils requis
command -v wrangler >/dev/null || { echo "❌ wrangler manquant"; exit 2; }
if command -v jq >/dev/null; then JQ=1; else JQ=0; fi

# Connexion Cloudflare ?
if ! wrangler whoami >/dev/null 2>&1; then
  echo "ℹ️  Non connecté à Cloudflare via wrangler."
  echo "👉  Exécute 'wrangler login' si nécessaire, puis relance ce script."
fi

echo "=== SMOKE REMOTE (D1) → $DB_NAME ==="
wrangler d1 execute "$DB_NAME" --remote --command 'CREATE TABLE IF NOT EXISTS __health_probe (id INTEGER PRIMARY KEY AUTOINCREMENT, ts TEXT NOT NULL);'
wrangler d1 execute "$DB_NAME" --remote --command 'INSERT INTO __health_probe (ts) VALUES (CURRENT_TIMESTAMP);'

# Lecture du compteur
OUT="$(wrangler d1 execute "$DB_NAME" --remote --command 'SELECT COUNT(*) AS c FROM __health_probe;' --json 2>/dev/null || true)"
if [ -n "$OUT" ]; then
  if [ "$JQ" -eq 1 ]; then
    ROWS="$(printf '%s' "$OUT" | jq -r '.[0].results[0].c' 2>/dev/null || echo '?')"
  else
    ROWS="$(printf '%s' "$OUT" | sed -n 's/.*"c":[[:space:]]*\([0-9][0-9]*\).*/\1/p' | head -n1)"
    [ -z "$ROWS" ] && ROWS="?"
  fi
  echo "Rows: $ROWS"
else
  echo "ℹ️  Lecture JSON non dispo, tentative sortie texte:"
  wrangler d1 execute "$DB_NAME" --remote --command 'SELECT COUNT(*) AS c FROM __health_probe;'
fi
