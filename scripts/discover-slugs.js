// discover-slugs.js — Découverte d'endpoints carrière/ATS par entreprise
// Usage:
//   node discover-slugs.js
//   node discover-slugs.js --input companies.txt --out found-slugs.json --sources greenhouse,lever,ashby,workable,personio,recruitee,teamtailor,smartrecruiters --concurrency 6
//
// Par défaut, le script tente d'extraire des entreprises depuis :
//   - companies.txt   (ligne par entreprise, optionnellement "Nom | domaine.com")
//   - slugs.json      (structure libre, on tente d'en extraire des noms/domaine/slug)
//   - 2025-08-found.json / 2025-08-manual.json (tableaux d'offres: .company, .company_website, .website)
//
// Sortie (par défaut): found-slugs.json
//
// Requiert Node 18+ (fetch global) et "type":"module" dans package.json.

import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// ------------------------------- Paths & setup -------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_INPUTS = [
  path.join(__dirname, 'companies.txt'),
  path.join(__dirname, 'slugs.json'),
  path.join(__dirname, '2025-08-found.json'),
  path.join(__dirname, '2025-08-manual.json'),
];

const DEFAULT_OUT = path.join(__dirname, 'found-slugs.json');
const DEFAULT_SOURCES = ['greenhouse','lever','ashby','workable','personio','recruitee','teamtailor','smartrecruiters'];
const DEFAULT_CONCURRENCY = 6;

// ------------------------------- CLI parsing ---------------------------------
const argv = parseArgv(process.argv.slice(2));
const INPUTS = (argv.input ? String(argv.input).split(',') : DEFAULT_INPUTS).map(a => path.resolve(__dirname, a));
const OUTFILE = path.resolve(__dirname, argv.out || DEFAULT_OUT);
const SOURCES = (argv.sources ? String(argv.sources).split(',') : DEFAULT_SOURCES).map(s=>s.trim().toLowerCase()).filter(Boolean);
const CONCURRENCY = clamp(int(argv.concurrency, DEFAULT_CONCURRENCY), 1, 16);
const MAX_CANDIDATES = clamp(int(argv.maxCandidates, 6), 1, 20);
const TIMEOUT_MS = clamp(int(argv.timeout, 10000), 2000, 30000);
const DRY = bool(argv['dry-run'] || argv.dry);

// ------------------------------- Main ----------------------------------------
await main().catch(err => {
  console.error('[discover-slugs] fatal:', err?.stack || err);
  process.exit(1);
});

async function main() {
  const companies = await gatherCompanies(INPUTS);
  if (!companies.length) {
    console.warn('[discover-slugs] Aucun nom d’entreprise trouvé. Fournis companies.txt ou des JSON 2025-08-*.');
    await writeJSONSafe(OUTFILE, { generated_at: new Date().toISOString(), count: 0, entries: [] });
    return;
  }

  console.log(`[discover-slugs] Entreprises à sonder: ${companies.length}`);
  const results = await pMap(companies, async (c) => {
    const candidates = buildSlugCandidates(c.name, c.domain, MAX_CANDIDATES);
    const detected = [];
    for (const src of SOURCES) {
      const trial = await probeSource(src, candidates, { timeoutMs: TIMEOUT_MS });
      if (trial) detected.push(trial);
    }
    const best = pickBest(detected, SOURCES);
    return {
      company: c.name,
      domain: c.domain || null,
      candidates,
      detected,
      best
    };
  }, { concurrency: CONCURRENCY, delayBetween: 80 });

  const entries = results.filter(r => r.detected.length > 0);
  const out = {
    generated_at: new Date().toISOString(),
    count: entries.length,
    sources_tried: SOURCES,
    entries
  };

  if (DRY) {
    console.log(JSON.stringify(out, null, 2));
  } else {
    await writeJSONSafe(OUTFILE, out);
    console.log(`[discover-slugs] Écrit: ${OUTFILE} (${out.count} endpoints détectés)`);
  }
}

// --------------------------- Company gathering -------------------------------
async function gatherCompanies(files) {
  const set = new Map(); // key: normalized name -> {name, domain}
  for (const p of files) {
    if (!fs.existsSync(p)) continue;
    try {
      if (p.endsWith('.txt')) {
        for (const item of await parseCompaniesTxt(p)) {
          const key = normKey(item.name);
          if (!set.has(key)) set.set(key, item);
          else set.set(key, mergeCompany(set.get(key), item));
        }
      } else if (p.endsWith('.json')) {
        for (const item of await parseCompaniesFromJson(p)) {
          if (!item?.name) continue;
          const key = normKey(item.name);
          if (!set.has(key)) set.set(key, item);
          else set.set(key, mergeCompany(set.get(key), item));
        }
      }
    } catch (e) {
      console.warn(`[discover-slugs] Skip ${path.basename(p)}:`, e?.message || e);
    }
  }
  // Filtrer entrées trop courtes
  return [...set.values()].filter(c => c.name && c.name.replace(/\s+/g,'').length >= 2);
}

function mergeCompany(a, b) {
  return {
    name: a.name || b.name,
    domain: a.domain || b.domain || null
  };
}

async function parseCompaniesTxt(file) {
  const s = await fsp.readFile(file, 'utf8');
  const out = [];
  for (const raw of s.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    let name = line;
    let domain = null;
    // "Nom | domaine.com" ou "Nom, domaine.com"
    const m = line.match(/^\s*([^|,]+)\s*[,|]\s*([A-Za-z0-9.-]+\.[A-Za-z]{2,})\s*$/);
    if (m) { name = m[1].trim(); domain = m[2].toLowerCase(); }
    else {
      const d = extractDomain(line);
      if (d) { name = line.replace(d,'').replace(/[,|]/g,' ').trim(); domain = d; }
    }
    out.push({ name: fixName(name), domain });
  }
  return out;
}

async function parseCompaniesFromJson(file) {
  const j = JSON.parse(await fsp.readFile(file, 'utf8'));
  const out = [];
  if (Array.isArray(j)) {
    for (const x of j) {
      const name = fixName(x?.company || x?.company_name || x?.name);
      if (!name) continue;
      const domain = extractDomain(x?.company_website || x?.company_website_url || x?.website || x?.url || '');
      out.push({ name, domain });
    }
  } else if (j && typeof j === 'object') {
    // slugs.json format libre: on tente de lire { company, name, domain, slug }
    if (Array.isArray(j.entries)) {
      for (const e of j.entries) {
        const name = fixName(e?.company || e?.name || e?.slug);
        if (!name) continue;
        const domain = extractDomain(e?.domain || e?.website || e?.url || '');
        out.push({ name, domain });
      }
    } else {
      // fallback: chercher clés "company"/"name"
      for (const [k,v] of Object.entries(j)) {
        const name = fixName(v?.company || v?.name || k);
        if (!name) continue;
        const domain = extractDomain(v?.domain || v?.website || '');
        out.push({ name, domain });
      }
    }
  }
  return out;
}

// --------------------------- Candidate slugs ---------------------------------
function buildSlugCandidates(name, domain, max = 6) {
  const set = new Set();

  const n = normalizeName(name);
  const baseTokens = tokenizeName(n);
  const compact = baseTokens.join('');
  const hyph = baseTokens.join('-');

  if (compact) set.add(compact);
  if (hyph && hyph !== compact) set.add(hyph);

  // Variantes sans "groupe"/"group", formes juridiques, articles fréquents
  const trimmed = dropStopWords(baseTokens);
  if (trimmed.length) {
    set.add(trimmed.join(''));
    set.add(trimmed.join('-'));
  }

  // Depuis le domaine (partie SLD)
  const sld = domainToBase(domain);
  if (sld) {
    set.add(sld);
    if (!set.has(`${sld}-fr`)) set.add(`${sld}-fr`);
  }

  // Heuristiques supplémentaires : enlever accents réduits, alias "collective"->"vestiairecollective" se couvre déjà
  // Version limitée au max demandé
  return [...set].slice(0, max);
}

function normalizeName(s) {
  return String(s || '')
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/&/g, ' and ')
    .replace(/[’'`]+/g, ' ')
    .replace(/[^a-zA-Z0-9\s.-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}
function tokenizeName(n) {
  return n.split(/[\s.-]+/).filter(Boolean);
}
function dropStopWords(tokens) {
  const stop = new Set(['the','group','groupe','sa','sas','sasu','sarl','spa','spa','ag','gmbh','inc','co','company','limited','ltd','corp','nv','bv','ab','plc','pte','kk','llc','llp','and','et','de','du','des','la','le','les']);
  return tokens.filter(t => !stop.has(t));
}
function domainToBase(domain) {
  if (!domain) return '';
  const d = String(domain).toLowerCase().replace(/^https?:\/\//,'').replace(/\/.*$/,'');
  const bits = d.split('.').filter(Boolean);
  if (bits.length <= 2) return bits[0] || '';
  // heuristique co.uk → renvoie la première étiquette
  return bits[bits.length - 3] || bits[0] || '';
}

// ------------------------------- Probers -------------------------------------
async function probeSource(source, candidates, { timeoutMs=10000 } = {}) {
  for (const cand of candidates) {
    const res = await probeBySource(source, cand, { timeoutMs });
    if (res?.ok) return res;
  }
  return null;
}

async function probeBySource(source, slug, { timeoutMs }) {
  switch (source) {
    case 'greenhouse': return probeGreenhouse(slug, timeoutMs);
    case 'lever': return probeLever(slug, timeoutMs);
    case 'ashby': return probeAshby(slug, timeoutMs);
    case 'workable': return probeWorkable(slug, timeoutMs);
    case 'personio': return probePersonio(slug, timeoutMs);
    case 'recruitee': return probeRecruitee(slug, timeoutMs);
    case 'teamtailor': return probeTeamtailor(slug, timeoutMs);
    case 'smartrecruiters': return probeSmartRecruiters(slug, timeoutMs);
    default: return null;
  }
}

async function probeGreenhouse(slug, timeoutMs) {
  // https://boards.greenhouse.io/{slug}
  const url = `https://boards.greenhouse.io/${encodeURIComponent(slug)}`;
  const r = await httpGet(url, timeoutMs);
  if (r.ok && r.status === 200 && !/page not found|not found/i.test(r.body)) {
    return { source:'greenhouse', url, status:r.status, ok:true };
  }
  return { source:'greenhouse', url, status:r.status, ok:false };
}

async function probeLever(slug, timeoutMs) {
  // https://jobs.lever.co/{slug} (HTML) — et API JSON en bonus
  const htmlUrl = `https://jobs.lever.co/${encodeURIComponent(slug)}`;
  const r = await httpGet(htmlUrl, timeoutMs);
  if (r.ok && r.status === 200) {
    return { source:'lever', url: htmlUrl, status: r.status, ok:true };
  }
  // API JSON (limite 1) — succès si 200 et tableau
  const apiUrl = `https://api.lever.co/v0/postings/${encodeURIComponent(slug)}?limit=1`;
  const j = await httpGet(apiUrl, timeoutMs);
  if (j.ok && j.status === 200 && /^\s*\[/.test(j.body || '')) {
    return { source:'lever', url: htmlUrl, status: 200, ok:true };
  }
  return { source:'lever', url: htmlUrl, status: r.status, ok:false };
}

async function probeAshby(slug, timeoutMs) {
  // https://jobs.ashbyhq.com/{slug}
  const url = `https://jobs.ashbyhq.com/${encodeURIComponent(slug)}`;
  const r = await httpGet(url, timeoutMs);
  if (r.ok && r.status === 200) {
    return { source:'ashby', url, status:r.status, ok:true };
  }
  return { source:'ashby', url, status:r.status, ok:false };
}

async function probeWorkable(slug, timeoutMs) {
  // https://apply.workable.com/{slug}/
  const url = `https://apply.workable.com/${encodeURIComponent(slug)}/`;
  const r = await httpGet(url, timeoutMs);
  if (r.ok && r.status === 200 && !/could not be found|not found/i.test(r.body)) {
    return { source:'workable', url, status:r.status, ok:true };
  }
  return { source:'workable', url, status:r.status, ok:false };
}

async function probePersonio(slug, timeoutMs) {
  // Essayer .com puis .de
  const urls = [
    `https://${slug}.jobs.personio.com/`,
    `https://${slug}.jobs.personio.de/`
  ];
  for (const url of urls) {
    const r = await httpGet(url, timeoutMs);
    if (r.ok && r.status === 200) {
      return { source:'personio', url, status:r.status, ok:true };
    }
  }
  return { source:'personio', url: urls[0], status: 0, ok:false };
}

async function probeRecruitee(slug, timeoutMs) {
  // https://{slug}.recruitee.com/
  const url = `https://${slug}.recruitee.com/`;
  const r = await httpGet(url, timeoutMs);
  if (r.ok && r.status === 200) {
    return { source:'recruitee', url, status:r.status, ok:true };
  }
  return { source:'recruitee', url, status:r.status, ok:false };
}

async function probeTeamtailor(slug, timeoutMs) {
  // https://{slug}.teamtailor.com/
  const url = `https://${slug}.teamtailor.com/`;
  const r = await httpGet(url, timeoutMs);
  if (r.ok && r.status === 200) {
    return { source:'teamtailor', url, status:r.status, ok:true };
  }
  return { source:'teamtailor', url, status:r.status, ok:false };
}

async function probeSmartRecruiters(slug, timeoutMs) {
  // https://careers.smartrecruiters.com/{SlugSansTiretsEspaces}
  const path = slug.replace(/[\s-]+/g,'');
  const url = `https://careers.smartrecruiters.com/${encodeURIComponent(path)}`;
  const r = await httpGet(url, timeoutMs);
  if (r.ok && r.status === 200) {
    return { source:'smartrecruiters', url, status:r.status, ok:true };
  }
  return { source:'smartrecruiters', url, status:r.status, ok:false };
}

// --------------------------- HTTP helper -------------------------------------
async function httpGet(url, timeoutMs = 10000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'Accept': 'text/html,application/json',
        'User-Agent': 'alternant-talent-app/slug-prober/1.0'
      },
      signal: ctrl.signal
    });
    const status = r.status;
    const ok = r.ok;
    const ct = r.headers.get('content-type') || '';
    let body = '';
    if (/application\/json/i.test(ct)) {
      body = await r.text(); // suffisant pour check rapide
    } else if (/text\/html/i.test(ct)) {
      body = (await r.text()).slice(0, 5000);
    } else {
      body = '';
    }
    return { ok, status, body };
  } catch (e) {
    return { ok: false, status: 0, body: String(e?.message || e) };
  } finally {
    clearTimeout(timer);
  }
}

// --------------------------- Selection logic ---------------------------------
function pickBest(detected, priorityOrder) {
  if (!detected || !detected.length) return null;
  const bySource = new Map(detected.map(d => [d.source, d]));
  for (const s of priorityOrder) {
    const x = bySource.get(s);
    if (x && x.ok) return { source: x.source, url: x.url, status: x.status };
  }
  // fallback: premier ok
  const firstOk = detected.find(d => d.ok);
  return firstOk ? { source: firstOk.source, url: firstOk.url, status: firstOk.status } : null;
}

// ------------------------------ pMap -----------------------------------------
async function pMap(list, mapper, { concurrency = 6, delayBetween = 0 } = {}) {
  const results = new Array(list.length);
  let index = 0;
  const workers = new Array(concurrency).fill(0).map(async () => {
    while (true) {
      const i = index++;
      if (i >= list.length) break;
      try {
        results[i] = await mapper(list[i], i);
      } catch (e) {
        results[i] = null;
      }
      if (delayBetween) await sleep(delayBetween);
    }
  });
  await Promise.all(workers);
  return results;
}

// ------------------------------ Utils ----------------------------------------
function parseArgv(args) {
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const [k, v] = a.split('=');
      const key = k.replace(/^--/, '');
      if (v !== undefined) out[key] = v;
      else if (i + 1 < args.length && !args[i + 1].startsWith('--')) out[key] = args[++i];
      else out[key] = true;
    }
  }
  return out;
}

function extractDomain(s) {
  if (!s) return null;
  const str = String(s).toLowerCase();
  const m = str.match(/([a-z0-9.-]+\.[a-z]{2,})(?:[\/\s]|$)/i);
  return m ? m[1] : null;
}

function fixName(s) {
  if (!s) return '';
  return String(s).replace(/\s+/g,' ').trim();
}

function normKey(s) {
  return normalizeName(s).replace(/\s+/g,' ');
}

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
function int(v, d=0){ const n = parseInt(v,10); return Number.isFinite(n)?n:d; }
function bool(v){ return v === true || v === 'true' || v === '1'; }
function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

async function writeJSONSafe(file, obj) {
  await fsp.writeFile(file, JSON.stringify(obj, null, 2), 'utf8');
}
