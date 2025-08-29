CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  name TEXT,
  domain TEXT,
  website TEXT,
  logo_url TEXT
);
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT,
  location TEXT,
  tags TEXT,
  url TEXT,
  source TEXT,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
CREATE VIEW IF NOT EXISTS v_company_week_counts AS
  SELECT company AS company, COUNT(*) AS offers_count
  FROM jobs
  WHERE datetime(created_at) >= datetime('now','-7 days')
  GROUP BY company
  ORDER BY offers_count DESC;
