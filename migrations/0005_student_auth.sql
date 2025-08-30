CREATE TABLE IF NOT EXISTS student_accounts (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_accounts_email ON student_accounts(email);

CREATE TABLE IF NOT EXISTS student_sessions (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  expires_at INTEGER NOT NULL,
  FOREIGN KEY(account_id) REFERENCES student_accounts(id)
);
CREATE INDEX IF NOT EXISTS idx_student_sessions_account ON student_sessions(account_id);
