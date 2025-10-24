CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  title TEXT,
  company TEXT,
  location TEXT,
  posted TEXT,
  posted_at INTEGER,
  url TEXT,
  tags TEXT,
  type TEXT,
  contract TEXT,
  source TEXT,
  logo_domain TEXT,
  logo_url TEXT
);
