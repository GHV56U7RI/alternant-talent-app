export async function ensureAuthSchema(db) {
  // users: email unique, password_hash, optional password_salt, created_at
  try { await db.prepare(`ALTER TABLE users ADD COLUMN password_salt TEXT`).run(); } catch { /* ignore */ }
  try { await db.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)`).run(); } catch { /* ignore */ }

  // sessions: user_id, token unique, created_at, expires_at (unix ts)
  await db.prepare(`CREATE TABLE IF NOT EXISTS sessions(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT NOT NULL UNIQUE,
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    expires_at INTEGER
  )`).run();
  try { await db.prepare(`ALTER TABLE sessions ADD COLUMN expires_at INTEGER`).run(); } catch { /* ignore */ }
  try {
    await db.prepare(`DELETE FROM sessions WHERE expires_at IS NOT NULL AND expires_at <= unixepoch()`).run();
  } catch { /* ignore */ }
}

export async function ensureEventsSchema(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS events(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,       -- 'view' | 'click' | 'apply'
    job_id TEXT NOT NULL,
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  )`).run();
}

