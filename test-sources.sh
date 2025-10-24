#!/bin/bash

echo "=== 🔎 TEST SOURCES DE DONNÉES ==="

# --- 1) ADZUNA ---
echo -e "\n👉 Test Adzuna..."
curl -s "https://api.adzuna.com/v1/api/jobs/fr/search/1?app_id=$ADZUNA_APP_ID&app_key=$ADZUNA_APP_KEY&results_per_page=1" \
| jq '.results[0] | {title:.title, company:.company.display_name, location:.location.display_name}' || echo "❌ Adzuna KO"

# --- 2) JOOBLE ---
echo -e "\n👉 Test Jooble..."
curl -s -X POST "https://jooble.org/api/$JOOBLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"keywords":"alternance data","location":"Paris","country":"fr"}' \
| jq '{totalCount, firstJob:{title:.jobs[0].title, company:.jobs[0].company, location:.jobs[0].location}}' || echo "❌ Jooble KO"

# --- 3) LBA ---
echo -e "\n👉 Test La Bonne Alternance (LBA)..."
curl -s -X GET "https://api.apprentissage.beta.gouv.fr/api/job/v1/search?latitude=48.8566&longitude=2.3522&radius=30&romes=M1805,M1802&caller=alternant-talent.app" \
  -H "Authorization: Bearer $REMOTE_API_TOKEN" \
| jq '{total:(.jobs|length), firstJob:{title:.jobs[0].offer.title, company:.jobs[0].workplace.name, city:(.jobs[0].workplace.location.address // "N/A")}}' \
|| echo "❌ LBA KO"


# --- 4) BASE LOCALE D1 ---
echo -e "\n👉 Test base D1 locale..."
wrangler d1 execute alternance_db --local --command "SELECT COUNT(*) as total FROM jobs;" \
| tail -n +5 || echo "❌ D1 KO"

