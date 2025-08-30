#!/usr/bin/env bash
set -euo pipefail
shopt -s nullglob

# ---------------------------------------------
# Config via variables d'environnement
# ---------------------------------------------
# Fichiers JSON possibles contenant des slugs :
# - slugs.json : { "greenhouse": ["slug1",...], "lever": [...], ... }
# - found-slugs.json : structure libre (ici on ne l'exploite que pour .<source>[] si présent)
# Vous pouvez aussi passer FILES="chemin1.json,chemin2.json"
FILES="${FILES:-slugs.json,found-slugs.json,seeds/slugs.json,seeds/found-slugs.json}"
# Sources à sonder
SOURCES="${SOURCES:-greenhouse,lever,workable,recruitee,ashby,personio,join}"
# Limite de slugs affichés/probés par source
LIMIT="${LIMIT:-10}"
# Timeout réseau (s)
TIMEOUT="${TIMEOUT:-10}"
# Retries curl (faibles)
RETRIES="${RETRIES:-1}"

# ---------------------------------------------
# Dépendances
# ---------------------------------------------
need() { command -v "$1" >/dev/null 2>&1 || { echo "❌ '$1' requis" >&2; exit 1; }; }
need curl
need jq
need grep
need sort
need head

# ---------------------------------------------
# Résolution des fichiers existants
# ---------------------------------------------
IFS=',' read -r -a _files <<<"$FILES"
JSON_FILES=()
for f in "${_files[@]}"; do
  [[ -f "$f" ]] && JSON_FILES+=("$f")
done
if [[ ${#JSON_FILES[@]} -eq 0 ]]; then
  echo "ℹ️  Aucun des fichiers suivants n'existe : $FILES" >&2
  echo "    → créez un slugs.json avec, par ex.:" >&2
  cat >&2 <<'EOF'
{
  "greenhouse": ["aircall", "qonto"],
  "lever": ["algolia", "ledger"],
  "recruitee": ["doctolib"],
  "workable": ["backmarket"],
  "ashby": ["ulysses"],
  "personio": ["heetch"],
  "join": ["swile"]
}
EOF
  exit 1
fi

# ---------------------------------------------
# Helpers
# ---------------------------------------------
jq_list () {
  # extrait .<key>[] depuis tous les JSON fournis, dédoublonne, tronque à LIMIT
  local key="$1" ; local n="${2:-$LIMIT}"
  jq -r ".${key}[]?" "${JSON_FILES[@]}" 2>/dev/null | sort -u | head -n "$n"
}

curl_json () {
  # curl JSON silencieux avec timeout/retries
  local url="$1"
  curl -sS -L --max-time "$TIMEOUT" --retry "$RETRIES" --retry-all-errors \
       -H 'Accept: application/json,text/plain,*/*' \
       "$url"
}

curl_text () {
  # curl texte/HTML silencieux
  local url="$1"
  curl -sS -L --max-time "$TIMEOUT" --retry "$RETRIES" --retry-all-errors \
       -H 'Accept: text/html,application/xml;q=0.9,*/*;q=0.8' \
       "$url"
}

# ---------------------------------------------
# Probe par source (compte le nb d'offres)
# ---------------------------------------------
probe_one () {
  local source="$1"
  local slug="$2"

  case "$source" in
    greenhouse)
      # API publique Greenhouse
      # https://boards-api.greenhouse.io/v1/boards/<slug>/jobs
      curl_json "https://boards-api.greenhouse.io/v1/boards/${slug}/jobs" \
        | jq -r '.jobs|length // 0' 2>/dev/null || echo 0
      ;;

    lever)
      # API publique Lever
      # https://api.lever.co/v0/postings/<slug>?limit=1 (ou plus)
      curl_json "https://api.lever.co/v0/postings/${slug}?limit=1" \
        | jq -r 'length // 0' 2>/dev/null || echo 0
      ;;

    workable)
      # API (non contractuelle) Workable
      # https://apply.workable.com/api/v3/accounts/<slug>/jobs?limit=1
      curl_json "https://apply.workable.com/api/v3/accounts/${slug}/jobs?limit=1" \
        | jq -r '.results|length // .jobs|length // 0' 2>/dev/null || echo 0
      ;;

    recruitee)
      # API publique Recruitee
      # https://<slug>.recruitee.com/api/offers/?limit=1
      curl_json "https://${slug}.recruitee.com/api/offers/?limit=1" \
        | jq -r '.offers|length // 0' 2>/dev/null || echo 0
      ;;

    ashby)
      # Heuristique Ashby : endpoint d'embed (souvent utilisé)
      # https://jobs.ashbyhq.com/api/app/embed/organization/<slug>/jobs?onlyPublished=true
      curl_json "https://jobs.ashbyhq.com/api/app/embed/organization/${slug}/jobs?onlyPublished=true" \
        | jq -r 'length // 0' 2>/dev/null || echo 0
      ;;

    personio)
      # Flux XML Personio (FR/DE). On compte les <position>
      # .com d'abord, puis fallback .de
      local n
      n=$(curl_text "https://${slug}.jobs.personio.com/xml" | grep -c '<position>' || true)
      if [[ "${n:-0}" -eq 0 ]]; then
        n=$(curl_text "https://${slug}.jobs.personio.de/xml" | grep -c '<position>' || true)
      fi
      echo "${n:-0}"
      ;;

    join)
      # API publique JOIN
      # https://api.join.com/users/<slug>/jobs (tableau)
      curl_json "https://api.join.com/users/${slug}/jobs" \
        | jq -r 'length // 0' 2>/dev/null || echo 0
      ;;

    *)
      echo "0"
      ;;
  esac
}

# ---------------------------------------------
# Boucle principale
# ---------------------------------------------
IFS=',' read -r -a _sources <<<"$SOURCES"

for src in "${_sources[@]}"; do
  src="${src// /}" # trim spaces
  slugs=( $(jq_list "$src" "$LIMIT") )
  if [[ ${#slugs[@]} -eq 0 ]]; then
    echo "— Aucun slug pour '$src' (dans: ${JSON_FILES[*]})" >&2
    continue
  fi

  for s in "${slugs[@]}"; do
    # format : "<source> <slug> -> <count>"
    printf "%-12s %-24s -> " "$src" "$s"
    probe_one "$src" "$s" || echo "0"
  done
done
