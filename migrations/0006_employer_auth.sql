CREATE TABLE IF NOT EXISTS employer_accounts (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_employer_accounts_email ON employer_accounts(email);

CREATE TABLE IF NOT EXISTS employer_sessions (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  expires_at INTEGER NOT NULL,
  FOREIGN KEY(account_id) REFERENCES employer_accounts(id)
);
CREATE INDEX IF NOT EXISTS idx_employer_sessions_account ON employer_sessions(account_id);
