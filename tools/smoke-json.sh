#!/usr/bin/env bash
set -euo pipefail

# --- Options ---
ONLY="d1,adzuna,jooble,remote"
TIMEOUT=10
STRICT=0   # si 1 => "warning" compte comme erreur

while [[ $# -gt 0 ]]; do
  case "$1" in
    --only) ONLY="$2"; shift 2;;
    --timeout) TIMEOUT="$2"; shift 2;;
    --strict) STRICT=1; shift;;
    *) echo "Usage: $0 [--only d1,adzuna,jooble,remote] [--timeout SEC] [--strict]"; exit 2;;
  esac
done

# --- Import .dev.vars (sélectif) ---
if [[ -f .dev.vars ]]; then
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%$'\r'}"
    case "$line" in
      ADZUNA_APP_ID=*|ADZUNA_APP_KEY=*|JOOBLE_KEY=*|REMOTE_API_BASE=*|REMOTE_API_CALLER=*|REMOTE_API_TOKEN=*)
        key="${line%%=*}"; val="${line#*=}"
        val="${val%\"}"; val="${val#\"}"
        export "$key=$val"
      ;;
    esac
  done < .dev.vars
fi

command -v wrangler >/dev/null || { echo '{"error":"wrangler not found"}'; exit 2; }
HAVE_JQ=0; command -v jq >/dev/null && HAVE_JQ=1

contains() { [[ ",$1," == *",$2,"* ]]; }
json_escape() { printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g; s/\n/\\n/g'; }
to_int_or0() { [[ "$1" =~ ^[0-9]+$ ]] && printf '%s' "$1" || printf '0'; }

STATUS_ANY_ERROR=0

# ---------- D1 (local, idempotent) ----------
d1_json='null'
if contains "$ONLY" "d1"; then
  start=$(date +%s)
  status="ok"
  db="${DB_NAME:-alternance_db}"
  if ! wrangler d1 execute "$db" --local --command 'CREATE TABLE IF NOT EXISTS __health_single (k TEXT PRIMARY KEY, ts TEXT NOT NULL);' >/dev/null 2>&1; then status="error"; fi
  if [[ "$status" == "ok" ]] && ! wrangler d1 execute "$db" --local --command 'INSERT INTO __health_single(k, ts) VALUES ("ping", CURRENT_TIMESTAMP) ON CONFLICT(k) DO UPDATE SET ts=excluded.ts;' >/dev/null 2>&1; then status="error"; fi
  rows="0"
  if out="$(wrangler d1 execute "$db" --local --command 'SELECT COUNT(*) AS c FROM __health_single;' --json 2>/dev/null)"; then
    if [[ $HAVE_JQ -eq 1 ]]; then rows="$(printf '%s' "$out" | jq -r '.[0].results[0].c' 2>/dev/null || echo 0)"
    else rows="$(printf '%s' "$out" | sed -n 's/.*"c":[[:space:]]*\([0-9][0-9]*\).*/\1/p' | head -n1)"; [[ -z "$rows" ]] && rows="0"; fi
  fi
  dur=$(( $(date +%s) - start ))
  [[ "$status" != "ok" ]] && STATUS_ANY_ERROR=1
  d1_json=$(printf '{"status":"%s","rows":%s,"duration_s":%s}' "$status" "$(to_int_or0 "$rows")" "$dur")
fi

# ---------- Adzuna ----------
adzuna_json='null'
if contains "$ONLY" "adzuna"; then
  start=$(date +%s)
  status="skipped"; code=0; count=0; sample=""
  if [[ -n "${ADZUNA_APP_ID:-}" && -n "${ADZUNA_APP_KEY:-}" ]]; then
    url="https://api.adzuna.com/v1/api/jobs/fr/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&results_per_page=1&what=alternance"
    tmp="$(mktemp)"
    code_time="$(curl -sS -m "$TIMEOUT" -o "$tmp" -w "%{http_code} %{time_total}" "$url" || echo "000 0")"
    code="${code_time%% *}"
    if [[ "$code" == "200" ]]; then
      status="ok"
      if [[ $HAVE_JQ -eq 1 ]]; then
        count="$(jq -r '.results|length' "$tmp" 2>/dev/null || echo 0)"
        sample="$(jq -r '.results[0].title // ""' "$tmp" 2>/dev/null || echo "")"
      fi
    else
      status="error"
    fi
    rm -f "$tmp"
  fi
  dur=$(( $(date +%s) - start ))
  adzuna_json=$(printf '{"status":"%s","http":%s,"count":%s,"sample":"%s","duration_s":%s}' "$status" "${code:-0}" "$(to_int_or0 "$count")" "$(json_escape "$sample")" "$dur")
  [[ "$status" == "error" ]] && STATUS_ANY_ERROR=1
fi

# ---------- Jooble ----------
jooble_json='null'
if contains "$ONLY" "jooble"; then
  start=$(date +%s)
  status="skipped"; code=0; count=0; sample=""
  if [[ -n "${JOOBLE_KEY:-}" ]]; then
    tmp="$(mktemp)"
    code_time="$(curl -sS -m "$TIMEOUT" -o "$tmp" -w "%{http_code} %{time_total}" \
      -X POST "https://jooble.org/api/${JOOBLE_KEY}" \
      -H "Content-Type: application/json" \
      -d '{"keywords":"alternance","location":"France","page":1}' || echo "000 0")"
    code="${code_time%% *}"
    if [[ "$code" == "200" ]]; then
      status="ok"
      if [[ $HAVE_JQ -eq 1 ]]; then
        count="$(jq -r '.jobs|length' "$tmp" 2>/dev/null || echo 0)"
        sample="$(jq -r '.jobs[0].title // ""' "$tmp" 2>/dev/null || echo "")"
      fi
    else
      status="error"
    fi
    rm -f "$tmp"
  fi
  dur=$(( $(date +%s) - start ))
  jooble_json=$(printf '{"status":"%s","http":%s,"count":%s,"sample":"%s","duration_s":%s}' "$status" "${code:-0}" "$(to_int_or0 "$count")" "$(json_escape "$sample")" "$dur")
  [[ "$status" == "error" ]] && STATUS_ANY_ERROR=1
fi

# ---------- Remote API ----------
remote_json='null'
if contains "$ONLY" "remote"; then
  start=$(date +%s)
  base="${REMOTE_API_BASE:-}"
  status="skipped"; code=0; body=""
  if [[ -n "$base" ]]; then
    base="${base%/}"
    CURL_FLAGS=()
    [[ -n "${REMOTE_API_TOKEN:-}"  ]] && CURL_FLAGS+=(-H "Authorization: Bearer ${REMOTE_API_TOKEN}")
    [[ -n "${REMOTE_API_CALLER:-}" ]] && CURL_FLAGS+=(-H "X-Caller: ${REMOTE_API_CALLER}")
    tmp="$(mktemp)"
    code_time="$(curl -sS -m "$TIMEOUT" -o "$tmp" -w "%{http_code} %{time_total}" "${CURL_FLAGS[@]}" "$base/health" || echo "000 0")"
    code="${code_time%% *}"
    if [[ "$code" == "000" || "$code" == "404" ]]; then
      code_time="$(curl -sS -m "$TIMEOUT" -o "$tmp" -w "%{http_code} %{time_total}" "${CURL_FLAGS[@]}" "$base" || echo "000 0")"
      code="${code_time%% *}"
    fi
    if [[ "$code" == "200" ]]; then status="ok"
    elif [[ "$code" =~ ^(401|403|404)$ ]]; then status="warning"
    else status="error"; fi
    body="$(head -c 200 "$tmp" | tr '\n' ' ')"
    rm -f "$tmp"
  fi
  dur=$(( $(date +%s) - start ))
  remote_json=$(printf '{"status":"%s","http":%s,"preview":"%s","duration_s":%s}' "$status" "${code:-0}" "$(json_escape "$body")" "$dur")
  if [[ "$status" == "error" || ( $STRICT -eq 1 && "$status" == "warning" ) ]]; then STATUS_ANY_ERROR=1; fi
fi

# --- Assemble JSON ---
out='{'
first=1
for k in d1 adzuna jooble remote; do
  v="${k}_json"
  eval "val=\${$v}"
  [[ "$val" == "null" ]] && continue
  [[ $first -eq 0 ]] && out+=","
  first=0
  out+="\"$k\":$val"
done
out+='}'

if [[ $HAVE_JQ -eq 1 ]]; then
  printf '%s\n' "$out" | jq .
else
  printf '%s\n' "$out"
fi

exit $STATUS_ANY_ERROR
