// server.js — Alternant Talent App (ESM)
// Démarrage: npm run dev   → http://localhost:8787
// ENV requis (voir .env.example): PORT, ADMIN_TOKEN, ADZUNA_*, JOOBLE_*, RUN_TTL_MS, DIRECTIFY_*

import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import express from 'express';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

// ---------------------- Paths & helpers ----------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = path.join(__dirname, 'data');

ensureDirSync(DATA_DIR);

function ensureDirSync(p) {
  try {
    fs.mkdirSync(p, { recursive: true });
  } catch {
    // ignore
  }
}

async function readJSON(file, fallback = null) {
  try { return JSON.parse(await fsp.readFile(file, 'utf8')); }
  catch { return fallback; }
}

async function writeJSON(file, obj) {
  await fsp.writeFile(file, JSON.stringify(obj, null, 2), 'utf8');
}

function hash(str) {
  return crypto.createHash('sha1').update(String(str || '')).digest('hex');
}

function nowIso() { return new Date().toISOString(); }

// ---------------------- Config (ENV) ----------------------
const PORT = parseInt(process.env.PORT || '8787', 10);
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
const RUN_TTL_MS = parseInt(process.env.RUN_TTL_MS || String(5 * 60 * 1000), 10);

const DIRECTIFY_ENABLED = String(process.env.DIRECTIFY_ENABLED || '1') === '1';
const DIRECTIFY_ALLOWED = String(process.env.DIRECTIFY_ALLOWED || 'adzuna,jooble')
  .split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

// Collecteurs
const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID || '';
const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY || '';
const ADZUNA_PAGES = parseInt(process.env.ADZUNA_PAGES || '0', 10);
const JOOBLE_KEY = process.env.JOOBLE_KEY || '';
const JOOBLE_PAGES = parseInt(process.env.JOOBLE_PAGES || '0', 10);

// Geo (facultatif)
const GEO_ENABLED = String(process.env.GEO_ENABLED || '1') === '1';
const OSRM_URL = process.env.OSRM_URL || 'https://router.project-osrm.org';

// Logos (facultatif)
const LOGODEV_TOKEN = process.env.LOGODEV_TOKEN || '';

// ---------------------- App & state ----------------------
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Simple CORS pour dev local (désactivez-le si inutile)
if (process.env.CORS_DEV === '1') {
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    if (req.method === 'OPTIONS') return res.status(204).end();
    next();
  });
}

// ---- Jobs cache
const JOBS_CACHE_PATH = path.join(DATA_DIR, 'jobs-cache.json');
let JOBS_CACHE = [];             // tableau d’offres normalisées
let CACHE_UPDATED_AT = new Date(0);

// ---- SSE clients
const sseClients = new Set();

// ---- Auth store (SQLite optionnel)
const AUTH_DB_PATH = path.join(DATA_DIR, 'auth.db');
let useSQLite = false;
let DB = null;                   // better-sqlite3 instance
let usersJson = { users: [] };   // fallback JSON
const AUTH_JSON_PATH = path.join(DATA_DIR, 'auth.json');

// ---------------------- Init ----------------------
await initAuthStore();
await bootJobsCache();
scheduleAutoRefresh();

// ---------------------- Static ----------------------
app.use(express.static(PUBLIC_DIR, {
  setHeaders(res, filePath) {
    if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
  }
}));

// ---------------------- Health ----------------------
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    updated_at: CACHE_UPDATED_AT.toISOString(),
    jobs_count: JOBS_CACHE.length,
    time: nowIso()
  });
});

// ---------------------- SSE events ----------------------
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const client = res;
  sseClients.add(client);

  // ping
  const iv = setInterval(() => {
    client.write(`event: ping\ndata: ${Date.now()}\n\n`);
  }, 25000);

  // initial hello
  client.write(`event: hello\ndata: ${JSON.stringify({ updated_at: CACHE_UPDATED_AT.toISOString() })}\n\n`);

  req.on('close', () => {
    clearInterval(iv);
    sseClients.delete(client);
  });
});

function broadcast(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try { client.write(payload); } catch { /* ignore */ }
  }
}

// ---------------------- Jobs API ----------------------
app.get('/api/jobs', (req, res) => {
  const {
    limit = '20',
    offset = '0',
    q = '',
    days = '', // ex: 30 → ≤ 30 jours
    source = '', // ex: adzuna,jooble
  } = req.query;

  const lim = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 200);
  const off = Math.max(parseInt(offset, 10) || 0, 0);
  const qlc = String(q || '').trim().toLowerCase();
  const maxAgeDays = parseInt(days || '0', 10) || 0;
  const sourceFilter = String(source || '').trim().toLowerCase();

  let items = JOBS_CACHE;

  if (qlc) {
    items = items.filter(j =>
      (j.title || '').toLowerCase().includes(qlc) ||
      (j.company || '').toLowerCase().includes(qlc) ||
      (j.location_city || '').toLowerCase().includes(qlc)
    );
  }

  if (maxAgeDays > 0) {
    const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
    items = items.filter(j => new Date(j.posted_at || 0).getTime() >= cutoff);
  }

  if (sourceFilter) {
    items = items.filter(j => String(j.source || '').toLowerCase() === sourceFilter);
  }

  const total = items.length;
  const slice = items.slice(off, off + lim);

  const hasNewForProfile = (Date.now() - CACHE_UPDATED_AT.getTime()) < (2 * 60 * 60 * 1000);

  res.json({
    count: total,
    jobs: slice,
    updated_at: CACHE_UPDATED_AT.toISOString(),
    has_new_for_profile: hasNewForProfile
  });
});

// ---------------------- Refresh (admin) ----------------------
app.post('/api/refresh', async (req, res) => {
  try {
    const auth = String(req.headers.authorization || '');
    if (!auth.startsWith('Bearer ') || auth.slice(7) !== ADMIN_TOKEN) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }
    const started_at = Date.now();
    const { updated, count } = await refreshAll();
    return res.json({
      ok: true,
      count,
      updated_at: CACHE_UPDATED_AT.toISOString(),
      ms: Date.now() - started_at,
      sources: updated
    });
  } catch (e) {
    console.error('refresh error:', e);
    res.status(500).json({ ok: false, error: String(e && e.message || e) });
  }
});

// ---------------------- Direct apply redirection ----------------------
// GET /api/direct?url=...
// POST { url }
app.all('/api/direct', async (req, res) => {
  try {
    const target = (req.method === 'POST') ? (req.body?.url || '') : String(req.query.url || '');
    const finalUrl = await resolveDirectUrl(target);
    if (!finalUrl) return res.status(400).json({ ok: false, error: 'Invalid URL' });
    return res.redirect(302, finalUrl);
  } catch (e) {
    console.error('direct error:', e);
    res.status(500).json({ ok: false, error: 'direct_failed' });
  }
});

async function resolveDirectUrl(input) {
  try {
    const url = new URL(String(input || ''));
    if (!/^https?:$/i.test(url.protocol)) return null;

    // Optionnel: filtrer seulement si allowlist
    if (DIRECTIFY_ENABLED) {
      const host = url.hostname.toLowerCase();
      const allow = DIRECTIFY_ALLOWED.some(tag => host.includes(tag));
      if (!allow) {
        // Pas un agrégateur autorisé: renvoyer tel quel
        return url.toString();
      }
    }

    // 1) HEAD d’abord (beaucoup d’apps posent un Location)
    let r = await fetch(url, { method: 'HEAD', redirect: 'manual' });
    let loc = r.headers.get('location');
    if (loc) return new URL(loc, url).toString();

    // 2) GET (suivre meta refresh si présent)
    r = await fetch(url, { method: 'GET', redirect: 'manual' });
    loc = r.headers.get('location');
    if (loc) return new URL(loc, url).toString();

    const html = await r.text();
    const metaRefreshMatch = html.match(/<meta[^>]*http-equiv=["']?refresh["']?[^>]*content=["']?[^"']*url=([^"'>\s]+)["']?[^>]*>/i);
    if (metaRefreshMatch) {
      const next = metaRefreshMatch[1];
      return new URL(next, url).toString();
    }
    // fallback
    return url.toString();
  } catch {
    return null;
  }
}

// ---------------------- Auth ----------------------
// Cookies: sid (session id). Sessions en mémoire pour simplifier.
const sessions = new Map(); // sid -> { user_id, created_at }

function requireAuth(req, res, next) {
  const sid = req.cookies?.sid || '';
  const sess = sid && sessions.get(sid);
  if (!sess) return res.status(401).json({ ok: false, error: 'not_authenticated' });
  req.user_id = sess.user_id;
  next();
}

app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password || String(password).length < 6) {
    return res.status(400).json({ ok: false, error: 'invalid_input' });
  }
  try {
    const existing = await authGetUserByEmail(email);
    if (existing) return res.status(409).json({ ok: false, error: 'email_exists' });

    const hash = await bcrypt.hash(String(password), 10);
    const user = await authCreateUser({ email, password_hash: hash });
    const sid = crypto.randomUUID();
    sessions.set(sid, { user_id: user.id, created_at: Date.now() });
    res.cookie('sid', sid, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 3600 * 1000
    });
    res.json({ ok: true, user: { id: user.id, email: user.email } });
  } catch (e) {
    console.error('register error:', e);
    res.status(500).json({ ok: false, error: 'register_failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ ok: false, error: 'invalid_input' });
  try {
    const user = await authGetUserByEmail(email);
    if (!user) return res.status(401).json({ ok: false, error: 'invalid_credentials' });
    const ok = await bcrypt.compare(String(password), user.password_hash);
    if (!ok) return res.status(401).json({ ok: false, error: 'invalid_credentials' });

    const sid = crypto.randomUUID();
    sessions.set(sid, { user_id: user.id, created_at: Date.now() });
    res.cookie('sid', sid, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 3600 * 1000
    });
    res.json({ ok: true, user: { id: user.id, email: user.email } });
  } catch (e) {
    console.error('login error:', e);
    res.status(500).json({ ok: false, error: 'login_failed' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  const sid = req.cookies?.sid || '';
  sessions.delete(sid);
  res.clearCookie('sid');
  res.json({ ok: true });
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
  const user = await authGetUserById(req.user_id);
  if (!user) return res.status(404).json({ ok: false, error: 'not_found' });
  res.json({ ok: true, user: { id: user.id, email: user.email, profile: parseMaybeJson(user.profile) || {} } });
});

// Profil
app.get('/api/profile', requireAuth, async (req, res) => {
  const user = await authGetUserById(req.user_id);
  if (!user) return res.status(404).json({ ok: false, error: 'not_found' });
  res.json({ ok: true, profile: parseMaybeJson(user.profile) || {} });
});

app.post('/api/profile', requireAuth, async (req, res) => {
  const profile = req.body || {};
  await authUpdateProfile(req.user_id, profile);
  res.json({ ok: true });
});

function parseMaybeJson(v) {
  if (v == null) return null;
  if (typeof v === 'object') return v;
  try { return JSON.parse(String(v)); } catch { return null; }
}

// ---------------------- (Optionnel) Commute / OSRM ----------------------
app.get('/api/commute', async (req, res) => {
  if (!GEO_ENABLED) return res.status(501).json({ ok: false, error: 'geo_disabled' });
  // ?from=lon,lat&to=lon,lat
  const from = String(req.query.from || '').trim();
  const to = String(req.query.to || '').trim();
  if (!/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(from) || !/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(to)) {
    return res.status(400).json({ ok: false, error: 'invalid_coords' });
  }
  try {
    const url = `${OSRM_URL}/route/v1/driving/${from};${to}?overview=false`;
    const r = await fetch(url);
    const j = await r.json();
    const route = j?.routes?.[0] || null;
    // IMPORTANT: clé 'osrm' sans point (pas `.osrm`)
    res.json({ ok: true, osrm: route });
  } catch {
    res.status(500).json({ ok: false, error: 'osrm_failed' });
  }
});

// ---------------------- Boot / Refresh logic ----------------------
async function bootJobsCache() {
  // 1) Charger cache existant si présent
  const cached = await readJSON(JOBS_CACHE_PATH, null);
  if (cached && Array.isArray(cached.jobs) && cached.updated_at) {
    JOBS_CACHE = cached.jobs;
    CACHE_UPDATED_AT = new Date(cached.updated_at);
    console.log(`[boot] Loaded cache: ${JOBS_CACHE.length} offers @ ${CACHE_UPDATED_AT.toISOString()}`);
    return;
  }

  // 2) Sinon: tenter seed depuis 2025-08-*.json (s'ils existent à la racine projet)
  const seedFiles = ['2025-08-found.json', '2025-08-manual.json']
    .map(f => path.join(__dirname, f))
    .filter(p => fs.existsSync(p));

  let seed = [];
  for (const file of seedFiles) {
    try {
      const arr = await readJSON(file, []);
      if (Array.isArray(arr)) seed.push(...arr);
    } catch { /* ignore */ }
  }
  if (seed.length) {
    const norm = normalizeJobs(seed);
    updateCache(norm);
    await persistJobsCache();
    console.log(`[boot] Seeded ${norm.length} offers from ${seedFiles.map(p => path.basename(p)).join(', ')}`);
  } else {
    // vide mais valide
    updateCache([]);
    await persistJobsCache();
    console.log('[boot] No cache, no seed → empty cache initialized.');
  }
}

async function persistJobsCache() {
  await writeJSON(JOBS_CACHE_PATH, {
    updated_at: CACHE_UPDATED_AT.toISOString(),
    jobs: JOBS_CACHE
  });
}

function updateCache(newJobs) {
  JOBS_CACHE = Array.isArray(newJobs) ? newJobs : [];
  CACHE_UPDATED_AT = new Date();
  broadcast('cache:update', { updated_at: CACHE_UPDATED_AT.toISOString(), count: JOBS_CACHE.length });
}

// Dedup simple: apply_url || (company|title|city)
function dedupe(jobs) {
  const seen = new Map();
  for (const j of jobs) {
    const key = j.apply_url ? `u:${j.apply_url}` :
      `t:${(j.title||'').toLowerCase()}|c:${(j.company||'').toLowerCase()}|l:${(j.location_city||'').toLowerCase()}`;
    if (!seen.has(key)) seen.set(key, j);
  }
  // IMPORTANT: spread correct
  return [...seen.values()];
}

function normalizeJobs(arr) {
  const out = [];
  for (const x of (arr || [])) {
    if (!x) continue;
    const title = x.title || x.position || '';
    const company = x.company || x.company_name || '';
    const city = x.location_city || x.city || (x.location && (x.location.city || x.location.name)) || '';
    const country = x.location_country || x.country || 'FR';
    const url = x.apply_url || x.redirect_url || x.url || '';
    const posted = x.posted_at || x.created || x.date || x.created_at || nowIso();
    const description_html = x.description_html || x.description || '';
    const source = (x.source || '').toString() || guessSource(url);
    const tags = x.tags || x.categories || [];

    const item = {
      id: x.id || hash(`${title}|${company}|${city}|${url}`),
      title: String(title || '').trim(),
      company: String(company || '').trim(),
      location_city: String(city || '').trim(),
      location_country: String(country || '').trim(),
      remote: Boolean(x.remote) || /remote|télétravail/i.test(description_html || ''),
      salary_min: toNumOrNull(x.salary_min),
      salary_max: toNumOrNull(x.salary_max),
      posted_at: new Date(posted || Date.now()).toISOString(),
      apply_url: String(url || '').trim(),
      description_html: String(description_html || ''),
      source,
      tags: Array.isArray(tags) ? tags : []
    };

    // logo heuristique (option LOGODEV)
    item.logo_url = logoFor(item.company, x.company_website || x.company_website_url || x.website || '');

    out.push(item);
  }
  return dedupe(out).sort((a, b) => new Date(b.posted_at) - new Date(a.posted_at));
}

function toNumOrNull(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function guessSource(u) {
  try {
    const h = new URL(String(u)).hostname.toLowerCase();
    if (h.includes('adzuna')) return 'adzuna';
    if (h.includes('jooble')) return 'jooble';
    return 'web';
  } catch { return 'web'; }
}

function logoFor(name, website) {
  if (LOGODEV_TOKEN) {
    const query = encodeURIComponent(name || '');
    return `https://img.logo.dev/${query}?token=${encodeURIComponent(LOGODEV_TOKEN)}&size=80`;
  }
  // fallback Google S2
  try {
    const host = website ? new URL(website).hostname : null;
    if (host) return `https://www.google.com/s2/favicons?domain=${host}&sz=64`;
  } catch { /* ignore */ }
  return '';
}

// ---------------------- Refresh all (collecteurs) ----------------------
let lastRun = 0;
let running = false;

async function refreshAll() {
  if (running) return { updated: [], count: JOBS_CACHE.length };
  if (Date.now() - lastRun < RUN_TTL_MS) {
    return { updated: [], count: JOBS_CACHE.length };
  }
  running = true;
  lastRun = Date.now();
  try {
    const sources = [];

    // Chargement dynamique des collecteurs si fichiers présents
    const jobs = [];

    if (ADZUNA_APP_ID && ADZUNA_APP_KEY && ADZUNA_PAGES > 0) {
      try {
        const mod = await import(pathToFileUrlIfExists(path.join(__dirname, 'adzuna.js')));
        if (typeof mod.searchAdzuna === 'function') {
          const res = await mod.searchAdzuna({ appId: ADZUNA_APP_ID, appKey: ADZUNA_APP_KEY, pages: ADZUNA_PAGES });
          for (const j of (res || [])) jobs.push({ ...j, source: 'adzuna' });
          sources.push('adzuna');
        }
      } catch (e) { console.warn('[adzuna] skipped:', e?.message || e); }
    }

    if (JOOBLE_KEY && JOOBLE_PAGES > 0) {
      try {
        const mod = await import(pathToFileUrlIfExists(path.join(__dirname, 'jooble.js')));
        if (typeof mod.searchJooble === 'function') {
          const res = await mod.searchJooble({ key: JOOBLE_KEY, pages: JOOBLE_PAGES });
          for (const j of (res || [])) jobs.push({ ...j, source: 'jooble' });
          sources.push('jooble');
        }
      } catch (e) { console.warn('[jooble] skipped:', e?.message || e); }
    }

    const normalized = normalizeJobs(jobs);
    updateCache(normalized);
    await persistJobsCache();
    console.log(`[refresh] ${normalized.length} offers from [${sources.join(', ')}]`);
    return { updated: sources, count: normalized.length };
  } finally {
    running = false;
  }
}

function pathToFileUrlIfExists(p) {
  if (!fs.existsSync(p)) throw new Error(`missing file: ${p}`);
  return pathToFileURL(p).href;
}
function pathToFileURL(p) {
  const { URL } = requireUrlCompat();
  const u = new URL('file:');
  const pathname = path.resolve(p).replace(/\\/g, '/');
  u.pathname = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return u;
}
function requireUrlCompat() {
  // Node 18+ a global URL, mais on protège si bundling exotique
  return { URL: globalThis.URL };
}

function scheduleAutoRefresh() {
  // refresh toutes les 30min (ajustable)
  const interval = parseInt(process.env.REFRESH_INTERVAL_MS || String(30 * 60 * 1000), 10);
  setInterval(() => {
    refreshAll().catch(() => {});
  }, interval).unref?.();
}

// ---------------------- Auth store impl ----------------------
async function initAuthStore() {
  try {
    // Essayer SQLite
    const mod = await import('better-sqlite3').catch(() => null);
    if (mod && mod.default) {
      const Database = mod.default;
      DB = new Database(AUTH_DB_PATH);
      DB.pragma('journal_mode = wal');
      DB.prepare(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          profile TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `).run();
      useSQLite = true;
      console.log('[auth] using SQLite');
      return;
    }
  } catch (e) {
    console.warn('[auth] sqlite unavailable:', e?.message || e);
  }
  // Fallback JSON
  usersJson = await readJSON(AUTH_JSON_PATH, { users: [] });
  console.log('[auth] using JSON fallback');
}

async function authGetUserByEmail(email) {
  if (useSQLite) {
    const row = DB.prepare('SELECT * FROM users WHERE email = ?').get(email);
    return row || null;
  } else {
    return (usersJson.users || []).find(u => u.email === email) || null;
  }
}
async function authGetUserById(id) {
  if (useSQLite) {
    const row = DB.prepare('SELECT * FROM users WHERE id = ?').get(id);
    return row || null;
  } else {
    return (usersJson.users || []).find(u => u.id === id) || null;
  }
}
async function authCreateUser({ email, password_hash }) {
  const ts = nowIso();
  if (useSQLite) {
    const info = DB.prepare(
      'INSERT INTO users (email, password_hash, profile, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
    ).run(email, password_hash, JSON.stringify({}), ts, ts);
    return { id: info.lastInsertRowid, email, password_hash, profile: '{}', created_at: ts, updated_at: ts };
  } else {
    const id = (usersJson.users.reduce((m, u) => Math.max(m, u.id || 0), 0) || 0) + 1;
    const user = { id, email, password_hash, profile: '{}', created_at: ts, updated_at: ts };
    usersJson.users.push(user);
    await writeJSON(AUTH_JSON_PATH, usersJson);
    return user;
  }
}
async function authUpdateProfile(id, profileObj) {
  const ts = nowIso();
  const profileStr = JSON.stringify(profileObj || {});
  if (useSQLite) {
    DB.prepare('UPDATE users SET profile = ?, updated_at = ? WHERE id = ?').run(profileStr, ts, id);
  } else {
    const u = (usersJson.users || []).find(x => x.id === id);
    if (u) {
      u.profile = profileStr;
      u.updated_at = ts;
      await writeJSON(AUTH_JSON_PATH, usersJson);
    }
  }
}

// ---------------------- Start server ----------------------
app.listen(PORT, () => {
  console.log(`✅ Server listening on http://localhost:${PORT}`);
});
