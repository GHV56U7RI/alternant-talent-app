PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE companies (
  id TEXT PRIMARY KEY,
  name TEXT,
  domain TEXT,
  website TEXT,
  logo_url TEXT
);
CREATE TABLE jobs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT,
  location TEXT,
  tags TEXT,
  url TEXT,
  source TEXT,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
INSERT INTO jobs VALUES('job-1','Alternant·e Développeur Frontend','Back Market','Paris','["JavaScript","HTML","CSS"]','https://example.com/offre-frontend','seed','2025-08-01T10:00:00Z');
INSERT INTO jobs VALUES('job-2','Alternant·e Data Analyst','Doctolib','Nantes','["SQL","Python","PowerBI"]','https://example.com/offre-data','seed','2025-08-03T09:30:00Z');
CREATE TABLE d1_migrations(
		id         INTEGER PRIMARY KEY AUTOINCREMENT,
		name       TEXT UNIQUE,
		applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
INSERT INTO d1_migrations VALUES(1,'0000_bootstrap_jobs.sql','2025-08-29 23:08:22');
INSERT INTO d1_migrations VALUES(2,'0001_init.sql','2025-08-29 23:08:22');
INSERT INTO d1_migrations VALUES(3,'0002_auth_employer.sql','2025-08-29 23:08:23');
INSERT INTO d1_migrations VALUES(4,'0003_events_stats.sql','2025-08-29 23:08:23');
INSERT INTO d1_migrations VALUES(5,'0004_student.sql','2025-08-29 23:08:23');
INSERT INTO d1_migrations VALUES(6,'init.sql','2025-08-29 23:08:23');
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE TABLE profiles (
  user_id INTEGER PRIMARY KEY,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
DELETE FROM sqlite_sequence;
INSERT INTO sqlite_sequence VALUES('d1_migrations',6);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);
CREATE VIEW v_company_week_counts AS
  SELECT company AS company, COUNT(*) AS offers_count
  FROM jobs
  WHERE datetime(created_at) >= datetime('now','-7 days')
  GROUP BY company
  ORDER BY offers_count DESC;
