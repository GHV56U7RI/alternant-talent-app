// adzuna.js — Collecteur Adzuna (ESM)
// Usage côté serveur :
//   import { searchAdzuna } from './adzuna.js'
//   const jobs = await searchAdzuna({ appId: ADZUNA_APP_ID, appKey: ADZUNA_APP_KEY, pages: 3 })
//
// ENV fallback possible si non passés en arguments :
//   process.env.ADZUNA_APP_ID, process.env.ADZUNA_APP_KEY, process.env.ADZUNA_PAGES
//
// Docs API : https://developer.adzuna.com/overview

const DEFAULT_RESULTS_PER_PAGE = 50;

/**
 * Recherche d'offres Adzuna.
 * @param {Object} opts
 * @param {string} opts.appId - Adzuna App ID
 * @param {string} opts.appKey - Adzuna App Key
 * @param {number} [opts.pages=1] - Nombre de pages à parcourir (1..N)
 * @param {string} [opts.country='fr'] - Code pays (ex: 'fr', 'gb', 'us')
 * @param {number} [opts.resultsPerPage=50] - Résultats par page (max 50 côté API)
 * @param {string} [opts.what=''] - Mots-clés
 * @param {string} [opts.where=''] - Lieu (ex: 'Paris')
 * @param {number} [opts.maxResults=1000] - Sécurité: plafond local de résultats
 * @returns {Promise<Array<Object>>} tableau d’offres (semi-normalisées)
 */
export async function searchAdzuna(opts = {}) {
  const appId = opts.appId || process.env.ADZUNA_APP_ID;
  const appKey = opts.appKey || process.env.ADZUNA_APP_KEY;
  const pages = toInt(opts.pages ?? process.env.ADZUNA_PAGES ?? 1, 1);
  const country = String(opts.country || 'fr').toLowerCase();
  const resultsPerPage = clamp(toInt(opts.resultsPerPage ?? DEFAULT_RESULTS_PER_PAGE, 50), 1, 50);
  const what = String(opts.what || '').trim();
  const where = String(opts.where || '').trim();
  const maxResults = toInt(opts.maxResults ?? 1000, 1000);

  if (!appId || !appKey) throw new Error('Missing Adzuna credentials (appId/appKey)');

  const out = [];
  for (let p = 1; p <= pages; p++) {
    const url = buildAdzunaUrl({
      country,
      page: p,
      appId,
      appKey,
      resultsPerPage,
      what,
      where
    });

    const json = await fetchJsonWithRetry(url, { tries: 3, minDelayMs: 400, factor: 1.7 });

    const results = Array.isArray(json?.results) ? json.results : [];
    for (const r of results) {
      const item = mapAdzunaJob(r, country);
      if (item) out.push(item);
      if (out.length >= maxResults) break;
    }
    if (out.length >= maxResults) break;

    // Petite pause entre pages pour rester poli
    if (p < pages) await sleep(200);
  }

  return out;
}

// -------------------------- Helpers --------------------------

function buildAdzunaUrl({ country, page, appId, appKey, resultsPerPage, what, where }) {
  const base = `https://api.adzuna.com/v1/api/jobs/${encodeURIComponent(country)}/search/${page}`;
  const params = {
    app_id: appId,
    app_key: appKey,
    results_per_page: String(resultsPerPage),
    content_type: 'application/json'
  };
  if (what) params.what = what;
  if (where) params.where = where;

  return `${base}?${toQuery(params)}`;
}

function toQuery(obj) {
  const q = [];
  for (const [k, v] of Object.entries(obj || {})) {
    if (v == null || v === '') continue;
    q.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  }
  return q.join('&');
}

async function fetchJsonWithRetry(url, { tries = 3, minDelayMs = 300, factor = 2 } = {}) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      if (!r.ok) {
        // 4xx: pas de retry sauf 429; 5xx: retry
        if (r.status === 429 || (r.status >= 500 && r.status <= 599)) {
          const delay = Math.round(minDelayMs * Math.pow(factor, i));
          await sleep(delay);
          continue;
        }
        const text = await safeText(r);
        throw new Error(`Adzuna HTTP ${r.status} — ${text?.slice(0, 200)}`);
      }
      const j = await r.json();
      return j;
    } catch (e) {
      lastErr = e;
      const delay = Math.round(minDelayMs * Math.pow(factor, i));
      await sleep(delay);
    }
  }
  throw lastErr || new Error('Adzuna fetch failed');
}

function mapAdzunaJob(x, country) {
  if (!x) return null;

  const title = str(x.title);
  const company = str(x.company?.display_name);
  const applyUrl = str(x.redirect_url || x.adref_url || x.url);
  const created = iso(x.created);
  const desc = str(x.description);
  const category = str(x.category?.label);
  const salaryMin = numOrNull(x.salary_min);
  const salaryMax = numOrNull(x.salary_max);

  // Ville : on prend en priorité la dernière "area" si dispo, sinon display_name
  const locDisplay = str(x.location?.display_name);
  const areas = Array.isArray(x.location?.area) ? x.location.area : [];
  const city = str(areas[areas.length - 1] || locDisplay);

  // Tag remote basique si description contient remote / télétravail
  const isRemote = /remote|télétravail|teletravail/i.test(desc);

  const tags = [];
  if (category) tags.push(category);

  return {
    // Le server.js recalcule un id, mais on en propose un "stable-ish"
    id: str(x.id || x.adref || applyUrl || `${title}|${company}|${city}`),
    title,
    company,
    location_city: city,
    location_country: (str(x.location?.country) || country || 'fr').toUpperCase(),
    remote: isRemote,
    salary_min: salaryMin,
    salary_max: salaryMax,
    posted_at: created,
    apply_url: applyUrl,
    description_html: desc, // on laisse HTML/texte tel quel, server.js saura gérer
    source: 'adzuna',
    tags
  };
}

function str(v) { return (v == null ? '' : String(v)).trim(); }
function numOrNull(v) { const n = Number(v); return Number.isFinite(n) ? n : null; }
function iso(v) { try { return new Date(v || Date.now()).toISOString(); } catch { return new Date().toISOString(); } }
function toInt(v, d = 0) { const n = parseInt(v, 10); return Number.isFinite(n) ? n : d; }
function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
async function safeText(res) { try { return await res.text(); } catch { return ''; } }

export default { searchAdzuna };
