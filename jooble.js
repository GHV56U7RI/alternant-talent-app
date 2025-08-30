// jooble.js — Collecteur Jooble (ESM)
// Usage côté serveur :
//   import { searchJooble } from './jooble.js'
//   const jobs = await searchJooble({ key: JOOBLE_KEY, pages: 3, what: 'alternance', where: 'Paris' })
//
// ENV support (fallback si non passés en args) :
//   process.env.JOOBLE_KEY
//   process.env.JOOBLE_PAGES
//   process.env.JOOBLE_ENDPOINT  (optionnel, défaut: https://jooble.org/api/)
//
// NB : L’API Jooble se consomme en POST sur `${endpoint}${key}` avec un body JSON.
// Les champs typiques de réponse incluent `jobs` (tableau), chaque job ayant
// `title`, `company`, `location`, `link`, `snippet` (HTML/texte), `updated` (date).
// Le serveur normalise encore ensuite.

const DEFAULT_RESULTS_PER_PAGE = 50; // Jooble ne documente pas tjs un param RPP ; on plafonne côté client
const DEFAULT_ENDPOINT = (process.env.JOOBLE_ENDPOINT || 'https://jooble.org/api/').replace(/\/+$/, '/') + ''; // …/api/

export async function searchJooble(opts = {}) {
  const key = opts.key || process.env.JOOBLE_KEY;
  const pages = toInt(opts.pages ?? process.env.JOOBLE_PAGES ?? 1, 1);
  const what = String(opts.what || '').trim();     // mots-clés
  const where = String(opts.where || '').trim();   // ville / région
  const country = String(opts.country || 'fr').toLowerCase(); // info indicative pour mapping
  const endpoint = String(opts.endpoint || DEFAULT_ENDPOINT);
  const maxResults = toInt(opts.maxResults ?? 1000, 1000);
  const resultsPerPage = clamp(toInt(opts.resultsPerPage ?? DEFAULT_RESULTS_PER_PAGE, 50), 1, 50);

  if (!key) throw new Error('Missing Jooble API key');

  const out = [];

  for (let p = 1; p <= pages; p++) {
    // Corps POST ; Jooble comprend généralement "keywords", "location", "page"
    const body = {
      keywords: what || undefined,
      location: where || undefined,
      page: p
      // Certains endpoints tolèrent "searchMode", "radius", etc. On reste minimal.
    };

    const url = endpoint + encodeURIComponent(key);

    const json = await fetchJsonWithRetry(url, {
      method: 'POST',
      tries: 3,
      minDelayMs: 400,
      factor: 1.7,
      body
    });

    const jobs = Array.isArray(json?.jobs) ? json.jobs : [];

    for (const j of jobs) {
      const item = mapJoobleJob(j, country);
      if (item) out.push(item);
      if (out.length >= maxResults) break;
      // On coupe si une page renvoie > RPP ; simple garde-fou
      if (out.length >= p * resultsPerPage) break;
    }
    if (out.length >= maxResults) break;

    // pause polie entre pages
    if (p < pages) await sleep(200);
  }

  return out;
}

// -------------------------- Helpers --------------------------

async function fetchJsonWithRetry(url, { method = 'POST', tries = 3, minDelayMs = 300, factor = 2, body = {} } = {}) {
  let lastErr;
  const payload = JSON.stringify(cleanUndefined(body));
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, {
        method,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          // UA gentille ; certains proxys apprécient :
          'User-Agent': 'alternant-talent-app/1.0 (+https://alternant-talent.pages.dev)'
        },
        body: payload
      });
      if (!r.ok) {
        // Retry sur 429 / 5xx
        if (r.status === 429 || (r.status >= 500 && r.status <= 599)) {
          const delay = Math.round(minDelayMs * Math.pow(factor, i));
          await sleep(delay);
          continue;
        }
        const text = await safeText(r);
        throw new Error(`Jooble HTTP ${r.status} — ${text?.slice(0, 200)}`);
      }
      const j = await r.json();
      return j;
    } catch (e) {
      lastErr = e;
      const delay = Math.round(minDelayMs * Math.pow(factor, i));
      await sleep(delay);
    }
  }
  throw lastErr || new Error('Jooble fetch failed');
}

function mapJoobleJob(x, fallbackCountry = 'fr') {
  if (!x) return null;

  // Champs usuels Jooble
  const title = str(x.title);
  const company = str(x.company);
  const applyUrl = str(x.link || x.url);
  const snippet = str(x.snippet || x.description || '');
  const updated = iso(x.updated || x.date || x.created || Date.now());
  const locationRaw = str(x.location);

  // Tenter d’extraire une "ville" : on prend la première partie avant virgule
  const city = locationRaw.split(',')[0].trim();
  const isRemote = /remote|télétravail|teletravail/i.test(snippet) || /remote/i.test(locationRaw);

  // Salaire : Jooble renvoie parfois `salary` sous forme de texte ; on laisse null si non numérique
  const salaryMin = numOrNull(x.salary_min ?? extractNumeric(snippet));
  const salaryMax = numOrNull(x.salary_max);

  return {
    id: str(x.id || applyUrl || `${title}|${company}|${city}`),
    title,
    company,
    location_city: city,
    location_country: (str(x.country) || fallbackCountry || 'fr').toUpperCase(),
    remote: isRemote,
    salary_min: salaryMin,
    salary_max: salaryMax,
    posted_at: updated,
    apply_url: applyUrl,
    description_html: snippet, // on laisse tel quel ; server.js re-normalise
    source: 'jooble',
    tags: Array.isArray(x.category) ? x.category : []
  };
}

function extractNumeric(txt) {
  // Petite heuristique : récupère un nombre dans un texte salaire (ex: "€35k–40k")
  const m = String(txt || '').match(/(\d[\d\s.,]{2,})/);
  if (!m) return null;
  const n = Number(m[1].replace(/[^\d.,]/g, '').replace(',', '.').replace(/\s+/g, ''));
  return Number.isFinite(n) ? n : null;
}

function str(v) { return (v == null ? '' : String(v)).trim(); }
function numOrNull(v) { const n = Number(v); return Number.isFinite(n) ? n : null; }
function iso(v) { try { return new Date(v || Date.now()).toISOString(); } catch { return new Date().toISOString(); } }
function toInt(v, d = 0) { const n = parseInt(v, 10); return Number.isFinite(n) ? n : d; }
function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function cleanUndefined(o) {
  const out = {};
  for (const [k, v] of Object.entries(o || {})) if (v !== undefined) out[k] = v;
  return out;
}
async function safeText(res) { try { return await res.text(); } catch { return ''; } }

export default { searchJooble };
