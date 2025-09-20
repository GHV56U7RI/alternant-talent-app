CREATE TABLE IF NOT EXISTS employer_offers (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY(account_id) REFERENCES employer_accounts(id)
);
CREATE INDEX IF NOT EXISTS idx_employer_offers_account ON employer_offers(account_id);

CREATE TABLE IF NOT EXISTS employer_candidates (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  offer_id TEXT,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY(account_id) REFERENCES employer_accounts(id),
  FOREIGN KEY(offer_id) REFERENCES employer_offers(id)
);
CREATE INDEX IF NOT EXISTS idx_employer_candidates_account ON employer_candidates(account_id);

CREATE TABLE IF NOT EXISTS employer_groups (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY(account_id) REFERENCES employer_accounts(id)
);
CREATE INDEX IF NOT EXISTS idx_employer_groups_account ON employer_groups(account_id);

CREATE TABLE IF NOT EXISTS employer_group_members (
  group_id TEXT NOT NULL,
  candidate_id TEXT NOT NULL,
  added_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY(group_id,candidate_id),
  FOREIGN KEY(group_id) REFERENCES employer_groups(id),
  FOREIGN KEY(candidate_id) REFERENCES employer_candidates(id)
);
CREATE INDEX IF NOT EXISTS idx_employer_group_members_group ON employer_group_members(group_id);
