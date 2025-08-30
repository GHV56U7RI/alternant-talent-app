CREATE TABLE IF NOT EXISTS job_clicks (
  id         TEXT PRIMARY KEY,
  job_id     TEXT NOT NULL,
  created_at TEXT NOT NULL,
  referrer   TEXT,
  user_agent TEXT,
  ip_hash    TEXT
);
CREATE INDEX IF NOT EXISTS idx_job_clicks_job ON job_clicks(job_id);
CREATE INDEX IF NOT EXISTS idx_job_clicks_created ON job_clicks(created_at);
