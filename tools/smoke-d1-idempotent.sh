#!/usr/bin/env bash
set -euo pipefail
SCOPE="${1:-local}"   # local | remote
DB="${DB_NAME:-alternance_db}"
FLAG="--local"; [ "$SCOPE" = "remote" ] && FLAG="--remote"

echo "=== D1 ${SCOPE} (idempotent ping) → ${DB} ==="
wrangler d1 execute "$DB" $FLAG --command 'CREATE TABLE IF NOT EXISTS __health_single (k TEXT PRIMARY KEY, ts TEXT NOT NULL);'
wrangler d1 execute "$DB" $FLAG --command 'INSERT INTO __health_single(k, ts) VALUES ("ping", CURRENT_TIMESTAMP) ON CONFLICT(k) DO UPDATE SET ts=excluded.ts;'
wrangler d1 execute "$DB" $FLAG --command 'SELECT COUNT(*) AS c FROM __health_single;'
