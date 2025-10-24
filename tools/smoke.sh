#!/usr/bin/env bash
set -euo pipefail

DB_NAME="${DB_NAME:-alternance_db}"

# === Charge .dev.vars (clés autorisées uniquement) ===
if [ -f ".dev.vars" ]; then
  while IFS= read -r line || [ -n "$line" ]; do
    line="${line%$'\r'}"
    case "$line" in
      ADZUNA_APP_ID=*|ADZUNA_APP_KEY=*|JOOBLE_KEY=*|REMOTE_API_BASE=*|REMOTE_API_CALLER=*|REMOTE_API_TOKEN=*)
        key="${line%%=*}"
        val="${line#*=}"
        val="${val%\"}"; val="${val#\"}"
        export "$key=$val"
      ;;
    esac
  done < .dev.vars
fi

command -v curl >/dev/null || { echo "❌ curl manquant"; exit 2; }
command -v wrangler >/dev/null || { echo "❌ wrangler manquant"; exit 2; }
if command -v jq >/dev/null; then JQ=1; else JQ=0; fi

line() { printf '%s\n' "------------------------------------------------------------"; }
box() {
  title="$1"; shift
  line; echo "$title"; line
  for l in "$@"; do printf '%s\n' "$l"; done
  echo
}

STATUS_ANY_ERROR=0

# === D1 ===
test_d1() {
  start=$(date +%s); status="ok"
  wrangler d1 execute "$DB_NAME" --local --command 'CREATE TABLE IF NOT EXISTS __health_single (k TEXT PRIMARY KEY, ts TEXT NOT NULL);' 2> .d1_err.log >/dev/null || { echo 'D1 ERR:'; cat .d1_err.log; status='error'; }
  if [ "$status" = "ok" ]; then
    wrangler d1 execute "$DB_NAME" --local --command 'INSERT INTO __health_single(k, ts) VALUES ("ping", CURRENT_TIMESTAMP) ON CONFLICT(k) DO UPDATE SET ts=excluded.ts;' 2>> .d1_err.log >/dev/null || { echo 'D1 ERR:'; tail -n 20 .d1_err.log; status='error'; }
  fi
  count="?"
  if out_json="$(wrangler d1 execute "$DB_NAME" --local --command 'SELECT COUNT(*) AS c FROM __health_single;' --json 2>/dev/null)"; then
    if [ "$JQ" -eq 1 ]; then
      count="$(printf '%s' "$out_json" | jq -r '.[0].results[0].c' 2>/dev/null || echo '?')"
    else
      count="$(printf '%s' "$out_json" | sed -n 's/.*"c":[[:space:]]*\([0-9][0-9]*\).*/\1/p' | head -n1)"
      [ -z "$count" ] && count="?"
    fi
  else
    out_txt="$(wrangler d1 execute "$DB_NAME" --local --command 'SELECT COUNT(*) AS c FROM __health_single;' 2>/dev/null || true)"
    count="$(printf '%s' "$out_txt" | awk -F'|' '/\|/ {gsub(/ /,"",$2); if($2 ~ /^[0-9]+$/) print $2}' | tail -n1)"
    [ -z "$count" ] && count="?"
  fi
  dur=$(( $(date +%s) - start ))
  [ "$status" != "ok" ] && STATUS_ANY_ERROR=1
  box "D1 / $DB_NAME" \
    "Status   : $status" \
    "Upsert   : $( [ "$status" = "ok" ] && echo ok || echo fail )" \
    "Rows     : $count" \
    "Durée    : ${dur}s"
}

# === Adzuna ===
test_adzuna() {
  start=$(date +%s)
  if [ -z "${ADZUNA_APP_ID:-}" ] || [ -z "${ADZUNA_APP_KEY:-}" ]; then
    box "Adzuna" "Status   : skipped (identifiants manquants)"; return
  fi
  url="https://api.adzuna.com/v1/api/jobs/fr/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&results_per_page=1&what=alternance"
  tmp="$(mktemp)"
  code_time="$(curl -sS -o "$tmp" -w "%{http_code} %{time_total}" "$url" || echo "000 0")"
  code="${code_time%% *}"
  status="ok"; [ "$code" != "200" ] && status="error"
  count="n/a"; title="n/a"
  if [ "$status" = "ok" ] && [ "$JQ" -eq 1 ]; then
    count="$(jq -r '.results|length' "$tmp" 2>/dev/null || echo n/a)"
    title="$(jq -r '.results[0].title // "n/a"' "$tmp" 2>/dev/null || echo n/a)"
  fi
  rm -f "$tmp"
  dur=$(( $(date +%s) - start ))
  [ "$status" != "ok" ] && STATUS_ANY_ERROR=1
  box "Adzuna" \
    "HTTP     : $code" \
    "Status   : $status" \
    "Count    : $count" \
    "Sample   : $title" \
    "Durée    : ${dur}s"
}

# === Jooble ===
test_jooble() {
  start=$(date +%s)
  if [ -z "${JOOBLE_KEY:-}" ]; then
    box "Jooble" "Status   : skipped (clé manquante)"; return
  fi
  tmp="$(mktemp)"
  code_time="$(curl -sS -o "$tmp" -w "%{http_code} %{time_total}" \
    -X POST "https://jooble.org/api/${JOOBLE_KEY}" \
    -H "Content-Type: application/json" \
    -d '{"keywords":"alternance","location":"France","page":1}' || echo "000 0")"
  code="${code_time%% *}"
  status="ok"; [ "$code" != "200" ] && status="error"
  count="n/a"; title="n/a"
  if [ "$status" = "ok" ] && [ "$JQ" -eq 1 ]; then
    count="$(jq -r '.jobs|length' "$tmp" 2>/dev/null || echo n/a)"
    title="$(jq -r '.jobs[0].title // "n/a"' "$tmp" 2>/dev/null || echo n/a)"
  fi
  rm -f "$tmp"
  dur=$(( $(date +%s) - start ))
  [ "$status" != "ok" ] && STATUS_ANY_ERROR=1
  box "Jooble" \
    "HTTP     : $code" \
    "Status   : $status" \
    "Count    : $count" \
    "Sample   : $title" \
    "Durée    : ${dur}s"
}

# === Remote API (fix: headers via array) ===
test_remote() {
  start=$(date +%s)
  if [ -z "${REMOTE_API_BASE:-}" ]; then
    box "Remote API" "Status   : skipped (REMOTE_API_BASE manquant)"; return
  fi
  base="${REMOTE_API_BASE%/}"
  tmp="$(mktemp)"

  CURL_FLAGS=()
  [ -n "${REMOTE_API_TOKEN:-}"  ] && CURL_FLAGS+=(-H "Authorization: Bearer ${REMOTE_API_TOKEN}")
  [ -n "${REMOTE_API_CALLER:-}" ] && CURL_FLAGS+=(-H "X-Caller: ${REMOTE_API_CALLER}")

  code_time="$(curl -sS -o "$tmp" -w "%{http_code} %{time_total}" "${CURL_FLAGS[@]}" "${base}/health" || echo "000 0")"
  code="${code_time%% *}"
  if [ "$code" = "000" ] || [ "$code" = "404" ]; then
    code_time="$(curl -sS -o "$tmp" -w "%{http_code} %{time_total}" "${CURL_FLAGS[@]}" "${base}" || echo "000 0")"
    code="${code_time%% *}"
  fi

  status="warning"
  [ "$code" = "200" ] && status="ok"
  case "$code" in 401|403|404) status="warning";; 000) status="error";; esac

  sample="$(head -c 250 "$tmp" | tr '\n' ' ')"
  rm -f "$tmp"
  dur=$(( $(date +%s) - start ))
  [ "$status" = "error" ] && STATUS_ANY_ERROR=1
  token_str="(none)"; [ -n "${REMOTE_API_TOKEN:-}" ] && token_str="***"
  box "Remote API" \
    "HTTP     : $code" \
    "Status   : $status" \
    "Caller   : ${REMOTE_API_CALLER:-"(none)"}" \
    "Token    : $token_str" \
    "Body     : ${sample:-"(vide)"}" \
    "Durée    : ${dur}s"
}

echo "====================================================="
echo "  SMOKE TEST - D1 / Adzuna / Jooble / Remote API"
echo "  $(date)"
echo "====================================================="

test_d1
test_adzuna
test_jooble
test_remote

echo
echo "==================== RÉCAP =========================="
echo "Si un bloc affiche Status: error → code de sortie ≠ 0."
echo "====================================================="
exit $STATUS_ANY_ERROR
