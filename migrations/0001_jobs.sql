CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  posted TEXT,
  posted_at TEXT,
  created_at TEXT,
  url TEXT,
  tags TEXT,
  type TEXT,
  contract TEXT,
  source TEXT DEFAULT 'd1',
  logo_domain TEXT,
  logo_url TEXT
);
CREATE INDEX IF NOT EXISTS idx_jobs_search ON jobs(title, company, location, tags);
