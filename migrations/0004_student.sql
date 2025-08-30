CREATE TABLE IF NOT EXISTS student_profiles (
  account_id TEXT PRIMARY KEY,
  full_name  TEXT,
  location   TEXT,
  bio        TEXT,
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY(account_id) REFERENCES student_accounts(id)
);

CREATE TABLE IF NOT EXISTS student_alerts (
  id         TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  query      TEXT NOT NULL,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY(account_id) REFERENCES student_accounts(id)
);
CREATE INDEX IF NOT EXISTS idx_student_alerts_account ON student_alerts(account_id);

CREATE TABLE IF NOT EXISTS student_favorites (
  account_id TEXT NOT NULL,
  job_id     TEXT NOT NULL,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY(account_id, job_id),
  FOREIGN KEY(account_id) REFERENCES student_accounts(id)
);
CREATE INDEX IF NOT EXISTS idx_student_favorites_account ON student_favorites(account_id);
