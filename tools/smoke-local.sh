#!/usr/bin/env bash
set -euo pipefail
DB_NAME="${DB_NAME:-alternance_db}"

echo "=== SMOKE LOCAL (D1) ==="
wrangler d1 execute "$DB_NAME" --local --command 'CREATE TABLE IF NOT EXISTS __health_probe (id INTEGER PRIMARY KEY AUTOINCREMENT, ts TEXT NOT NULL);'
wrangler d1 execute "$DB_NAME" --local --command 'INSERT INTO __health_probe (ts) VALUES (CURRENT_TIMESTAMP);'
wrangler d1 execute "$DB_NAME" --local --command 'SELECT COUNT(*) AS c FROM __health_probe;'
