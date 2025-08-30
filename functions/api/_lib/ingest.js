// Helpers ingestion: FR/DOM-TOM + alternance + normalisation + insertMany
// ⚠️ Version Worker-friendly: pas de node:crypto

import { getDB } from '../../_utils/db.js';

const DOMTOM = [
  "Guadeloupe","Martinique","Guyane","La Réunion","Réunion","Mayotte",
  "Polynésie française","Nouvelle-Calédonie","Saint-Pierre-et-Miquelon",
  "Wallis-et-Futuna","Saint-Barthélemy","Saint-Martin"
];

export function isAlternanceLike(s) {
  if (!s) return false;
  const t = String(s).toLowerCase();
  return /\balternance\b|\balternant[e]?\b|\bapprent/i.test(t);
}

export function isFranceOrDomTom(loc) {
  if (!loc) return false;
  const s = String(loc);
  const t = s.toLowerCase();
  if (/\bfrance\b|\bfr\b/.test(t)) return true;
  if (/(paris|lyon|marseille|nantes|lille|toulouse|bordeaux|rennes|nice|strasbourg)/i.test(s)) return true;
  return DOMTOM.some(n => s.includes(n));
}

export function isoDate(x) {
  try { return new Date(x).toISOString(); } catch { return new Date().toISOString(); }
}

// Petit hash déterministe (FNV-1a 32-bit) compatible Workers
function fnv1aHex(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

export function stableId(source, urlOrTitle, company = '', extra = '') {
  const raw = [source || '', urlOrTitle || '', company || '', extra || ''].join('|');
  return `${source}:${fnv1aHex(raw)}`;
}

export function normalizeJob(j) {
  return {
    id: j.id || stableId(j.source || 'src', j.url || j.title, j.company, j.location),
    title: j.title?.trim() || 'Sans titre',
    company: j.company?.trim() || 'Entreprise',
    location: j.location || '',
    tags: Array.isArray(j.tags) ? j.tags.slice(0,12) : [],
    url: j.url || '#',
    source: j.source || 'seed',
    created_at: isoDate(j.created_at || Date.now())
  };
}

export function filterFranceAlternance(arr) {
  return (arr || [])
    .filter(j =>
      isAlternanceLike(j.title) || isAlternanceLike(j.description) || isAlternanceLike(j.category) ||
      isAlternanceLike(j.commitment) || isAlternanceLike(j.text)
    )
    .filter(j => isFranceOrDomTom(j.location) || isFranceOrDomTom(j.country) || /france/i.test(j.country || ''));
}

export async function insertMany(env, list) {
  if (!list?.length) return 0;
  const db = getDB(env);
  let n = 0;
  const stmt = db.prepare(
    `INSERT OR REPLACE INTO jobs
      (id,title,company,location,tags,url,source,created_at)
     VALUES (?,?,?,?,?,?,?,?)`
  );
  for (const j of list.map(normalizeJob)) {
    const tags = JSON.stringify(j.tags || []);
    await stmt.bind(j.id, j.title, j.company, j.location, tags, j.url, j.source, j.created_at).run();
    n++;
  }
  return n;
}
