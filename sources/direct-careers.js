/**
 * Source d'offres directement sur les ATS des grandes entreprises.
 * S'inspire du principe de https://github.com/umur957/hiring-cafe-job-scraper :
 *   - liste d'entreprises + ATS supportés,
 *   - récupération des offres via les API publiques (Greenhouse, Lever, SmartRecruiters, Workday),
 *   - filtrage sur les offres d'alternance françaises,
 *   - normalisation et déduplication.
 *
 * Version améliorée avec:
 *   - Résolution d'URLs intelligente (patterns ATS)
 *   - Validation IA 100% gratuite (Ollama → Gemini → Groq)
 *   - Monitoring et statistiques détaillées
 */

import { FreeURLResolver } from './url-resolver-free.js';
import { FreeAIValidator } from './ai-validator-free.js';
import { FreeMonitoring } from './monitoring-free.js';

const DEFAULT_COMPANIES = [
  // --- GREENHOUSE (Tech & Startups) - VÉRIFIÉS ✅ ---
  { name: 'Doctolib', careers: 'https://careers.doctolib.com', greenhouse: { board: 'doctolib' } },
  { name: 'Datadog', careers: 'https://careers.datadoghq.com', greenhouse: { board: 'datadog' } },
  { name: 'Algolia', careers: 'https://www.algolia.com/careers', greenhouse: { board: 'algolia' } },
  { name: 'Stripe', careers: 'https://stripe.com/jobs', greenhouse: { board: 'stripe' } },
  { name: 'TheFork', careers: 'https://careers.thefork.com', greenhouse: { board: 'thefork' } },
  { name: 'Artefact', careers: 'https://www.artefact.com/careers', greenhouse: { board: 'artefact' } },
  { name: 'Valtech', careers: 'https://www.valtech.com/careers', greenhouse: { board: 'valtech' } },

  // --- LEVER (Startups & Scaleups) ---
  { name: 'Qonto', careers: 'https://qonto.com/careers', lever: { company: 'qonto' } },
  { name: 'Spendesk', careers: 'https://www.spendesk.com/careers', lever: { company: 'spendesk' } },
  // Lydia, Yousign, Luko, Shift Technology → 404, retirés
  { name: 'Doctrine', careers: 'https://www.doctrine.fr/careers', lever: { company: 'doctrine' } },
  { name: 'Veepee', careers: 'https://careers.veepee.com', lever: { company: 'veepee' } },
  { name: 'Scaleway', careers: 'https://www.scaleway.com/en/careers', lever: { company: 'scaleway' } },
  { name: 'Pigment', careers: 'https://www.pigment.com/careers', lever: { company: 'pigment' } },
  { name: 'Kickmaker', careers: 'https://kickmaker.net/careers', lever: { company: 'kickmaker' } },
  { name: 'Verkor', careers: 'https://verkor.com/careers', lever: { company: 'verkor' } },
  { name: 'Lucca', careers: 'https://www.lucca.fr/carrieres', lever: { company: 'lucca' } },
  { name: 'Brevo', careers: 'https://www.brevo.com/careers', lever: { company: 'brevo' } },

  // Lever - Nouvelles entreprises
  { name: 'Pennylane', careers: 'https://www.pennylane.com/careers', lever: { company: 'pennylane' } },
  { name: 'Swile', careers: 'https://www.swile.co/careers', lever: { company: 'swile' } },

  // --- SMARTRECRUITERS (Large Groups) ---
  { name: 'Ubisoft', careers: 'https://www.ubisoft.com/en-us/careers', smart: { company: 'Ubisoft2' } },
  { name: 'Accor', careers: 'https://careers.accor.com', smart: { company: 'AccorGroup' } },
  { name: 'Publicis', careers: 'https://www.publicisgroupe.com/en/careers', smart: { company: 'PublicisGroupe' } },
  { name: 'Celonis', careers: 'https://www.celonis.com/careers', smart: { company: 'Celonis' } }

  // COMMENT AJOUTER UNE NOUVELLE ENTREPRISE:
  // 1. Greenhouse: Tester avec curl "https://boards-api.greenhouse.io/v1/boards/BOARD_ID/jobs"
  // 2. Lever: Tester avec curl "https://api.lever.co/v0/postings/COMPANY_ID?mode=json"
  // 3. SmartRecruiters: Tester avec curl "https://api.smartrecruiters.com/v1/companies/COMPANY_ID/postings"
  // 4. Ajouter ici avec le bon format
];

const ALTERNANCE_REGEX = /\b(alternance|alternant|apprentissage|apprentice|apprenticeship|work[-\s]?study|coop|co-op)\b/i;
const FR_KEYWORDS = [
  'france', 'fr', 'paris', 'lyon', 'marseille', 'nantes', 'lille', 'toulouse', 'bordeaux', 'rennes',
  'nice', 'strasbourg', 'montpellier', 'tours', 'angers', 'grenoble', 'dijon', 'reims', 'clermont',
  'guadeloupe', 'martinique', 'guyane', 'réunion', 'mayotte', 'polynésie', 'nouvelle-calédonie'
];

const TRUSTED_ATS_HOSTS = [
  'smartrecruiters.com',
  'lever.co',
  'greenhouse.io',
  'job-boards.greenhouse.io',
  'myworkdayjobs.com',
  'workdayjobs.com',
  'wd3.myworkdayjobs.com',
  'workable.com'
];

const AGGREGATOR_HINTS = [
  'indeed.',
  'linkedin.',
  'jooble',
  'hellowork',
  'meteojob',
  'monster',
  'apec',
  'jobteaser',
  'optioncarriere',
  'glassdoor',
  'regionsjob',
  'francetravail',
  'pole-emploi'
];

const GENERIC_PATH_HINTS = [
  'jobs',
  'job',
  'careers',
  'career',
  'recrutement',
  'offres',
  'emploi',
  'apply',
  'alternance',
  'apprentissage'
];
const JOB_DETAIL_HINTS = [
  'alternance',
  'apprentissage',
  'stage',
  'intern',
  'dev',
  'marketing',
  'chef',
  'project',
  'engineer',
  'manager'
];

const DEFAULT_OLLAMA_MODEL = 'mistral';
const SECONDARY_MODEL_DEFAULT = 'qwen2.5';
const MAX_AI_REVIEWS = 40;
const HTTP_PROBE_LIMIT = 500; // Augmenté pour valider plus d'URLs
const HTTP_PROBE_TIMEOUT = 5000; // Augmenté pour éviter les faux négatifs

const COMPANY_STRATEGIES = {
  'telegram': 'off',
  'dachser france': 'html'
};

function getCompanyStrategy(company) {
  const custom = company.strategy || COMPANY_STRATEGIES[(company.name || '').toLowerCase()];
  return custom || 'ats';
}

export async function fetchDirectCareersJobs({ query = 'alternance', location = 'France', limit = 100, env }) {
  console.log('[Direct Careers] Collecte via ATS entreprises (mode gratuit amélioré)...');

  // Initialise les nouveaux systèmes gratuits
  const urlResolver = new FreeURLResolver();
  const skipAIValidation = (env?.SKIP_AI_VALIDATION === '1') || (env?.DIRECT_CAREERS_SKIP_AI === '1');
  const aiValidator = skipAIValidation ? null : new FreeAIValidator({
    ollamaEndpoint: env?.OLLAMA_ENDPOINT,
    geminiKey: env?.GEMINI_API_KEY,
    groqKey: env?.GROQ_API_KEY
  });
  const monitoring = new FreeMonitoring();

  const companies = await loadCompanySources(env);
  if (!companies.length) {
    console.warn('[Direct Careers] Aucun connecteur configuré');
    return [];
  }

  const normalizedLimit = Math.max(1, Math.min(limit, 1000));
  const collectorOptions = { query, location, limit: normalizedLimit };
  const jobs = [];
  const providerStatus = {
    smartrecruiters: { label: 'SmartRecruiters', tested: false, success: false, count: 0 },
    lever: { label: 'Lever', tested: false, success: false, count: 0 },
    greenhouse: { label: 'Greenhouse', tested: false, success: false, count: 0 },
    workday: { label: 'Workday', tested: false, success: false, count: 0 }
  };
  const urlStats = { total: 0, generic: 0, broken: 0, ok: 0 };

  for (const company of companies) {
    if (jobs.length >= normalizedLimit) break;
    const strategy = getCompanyStrategy(company);
    if (strategy !== 'ats') {
      console.log(`[Direct Careers] ${company.name}: stratégie ${strategy}, ignoré pour ATS`);
      continue;
    }
    const remaining = normalizedLimit - jobs.length;
    try {
      const companyJobs = await fetchCompanyJobs(company, { ...collectorOptions, limit: remaining }, providerStatus);
      jobs.push(...companyJobs);
    } catch (error) {
      console.error(`[Direct Careers] ${company.name}: ${error.message}`);
    }
  }

  let uniqueJobs = dedupeJobs(jobs).slice(0, normalizedLimit);

  // NOUVEAU: Log des jobs collectés pour monitoring
  for (const job of uniqueJobs) {
    const urlType = urlResolver.isDetailURL(job.apply_url) ? 'detail' :
      urlResolver.isGenericURL(job.apply_url) ? 'generic' : 'unknown';
    monitoring.logJobCollected(job, urlType);
  }

  // NOUVEAU: Résolution intelligente des URLs génériques
  console.log('[Direct Careers] Résolution intelligente des URLs...');
  for (const job of uniqueJobs) {
    if (urlResolver.isGenericURL(job.apply_url)) {
      const resolved = await urlResolver.resolve(job.apply_url, {
        jobId: job.rawId,
        title: job.title,
        company: job.company
      });

      if (resolved.confidence > 0.5) {
        job.apply_url = resolved.url;
        job.__url_resolved = true;
        job.__url_method = resolved.method;
      }

      monitoring.logURLResolution(resolved);
    }
  }

  uniqueJobs = chooseBestCandidates(uniqueJobs, urlStats);
  await probeJobUrls(uniqueJobs, urlStats);

  const beforeFilter = uniqueJobs.length;
  uniqueJobs = uniqueJobs.filter((job) => !job.__discarded && !job.url_health?.isBroken && job.apply_url && looksLikeJobDetail(job.apply_url));
  const filteredOut = beforeFilter - uniqueJobs.length;
  console.log(`[Direct Careers] Filtrage URLs: ${filteredOut} offres retirées (404 ou invalides), ${uniqueJobs.length} conservées`);

  // NOUVEAU: Validation IA gratuite au lieu de l'ancien système
  const aiReviewed = [];
  if (!skipAIValidation) {
    console.log('[Direct Careers] Validation IA gratuite (Ollama → Gemini → Groq)...');
    for (const job of uniqueJobs) {
      const validation = await aiValidator.validate(job);

      job.__ai_validation = {
        tier: validation.tier,
        verdict: validation.verdict,
        confidence: validation.confidence,
        reason: validation.reason
      };

      monitoring.logAIValidation(validation, job);

      if (validation.verdict === 'VALID' && validation.confidence > 0.5) {
        aiReviewed.push(job);
        monitoring.logJobValidated(job);
      } else {
        monitoring.logJobRejected(job, validation.reason);
      }
    }
  } else {
    console.log('[Direct Careers] Validation IA désactivée (SKIP_AI_VALIDATION=1) → heuristique simple.');
    for (const job of uniqueJobs) {
      job.__ai_validation = {
        tier: 'skipped',
        verdict: 'VALID',
        confidence: 0.5,
        reason: 'ai_validation_skipped'
      };
      aiReviewed.push(job);
      monitoring.logJobValidated(job);
    }
  }

  const filtered = aiReviewed.filter((job) => job.apply_url && looksLikeJobDetail(job.apply_url));
  urlStats.ok += filtered.length;

  // NOUVEAU: Affichage du rapport de monitoring
  const report = monitoring.generateTextReport();
  console.log(report);

  // Sauvegarde la session
  await monitoring.saveSession().catch(() => null);

  console.log(`[Direct Careers] ${filtered.length} offres collectées (${companies.length} entreprises analysées, ${aiReviewed.length - filtered.length} liens génériques/KO)`);

  const payload = filtered.map(stripInternalFields);
  payload.meta = {
    ai_reviewed: aiReviewed.length,
    ai_rejected: uniqueJobs.length - aiReviewed.length,
    providers: providerStatus,
    url_stats: urlStats,
    url_resolver_stats: urlResolver.getStats(),
    ai_validator_stats: aiValidator ? aiValidator.getStats() : { skipped: true },
    monitoring_stats: monitoring.getCurrentStats()
  };
  return payload;
}

async function loadCompanySources(env) {
  if (env?.DIRECT_CAREERS_SOURCES) {
    try {
      const parsed = JSON.parse(env.DIRECT_CAREERS_SOURCES);
      if (Array.isArray(parsed) && parsed.length) {
        return parsed;
      }
    } catch (error) {
      console.warn('[Direct Careers] Impossible de parser DIRECT_CAREERS_SOURCES:', error.message);
    }
  }
  return DEFAULT_COMPANIES;
}

async function fetchCompanyJobs(company, options, providerStatus) {
  const collectors = [];
  if (company.smart?.company) {
    collectors.push({
      provider: 'smartrecruiters',
      run: () => fetchSmartRecruitersJobs(company, options)
    });
  }
  if (company.lever?.company) {
    collectors.push({
      provider: 'lever',
      run: () => fetchLeverJobs(company, options)
    });
  }
  if (company.greenhouse?.board) {
    collectors.push({
      provider: 'greenhouse',
      run: () => fetchGreenhouseJobs(company, options)
    });
  }
  if (company.workday?.host && company.workday?.tenant) {
    collectors.push({
      provider: 'workday',
      run: () => fetchWorkdayJobs(company, options)
    });
  }

  if (!collectors.length) {
    console.warn(`[Direct Careers] ${company.name}: aucun ATS supporté configuré`);
    return [];
  }

  const jobs = [];
  for (const collector of collectors) {
    try {
      if (!providerStatus[collector.provider]) {
        providerStatus[collector.provider] = { label: collector.provider, tested: false, success: false, count: 0 };
      }
      providerStatus[collector.provider].tested = true;
      const dataset = await collector.run();
      if (dataset?.length) {
        providerStatus[collector.provider].success = true;
        providerStatus[collector.provider].count += dataset.length;
      }
      jobs.push(...dataset);
    } catch (error) {
      console.error(`[Direct Careers] ${company.name} (${collector.provider}): ${error.message}`);
    }
  }
  return jobs;
}

async function fetchSmartRecruitersJobs(company, options) {
  const limit = Math.min(options.limit || 200, 200);
  const url = `https://api.smartrecruiters.com/v1/companies/${company.smart.company}/postings?limit=${limit}`;
  const response = await fetch(url, { headers: { accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`SmartRecruiters HTTP ${response.status}`);
  }
  const payload = await response.json().catch(() => ({}));
  const content = Array.isArray(payload?.content) ? payload.content : [];
  return content
    .map((posting) => {
      const description = posting.jobAd?.sections?.jobDescription?.text || posting.jobAd?.sections?.qualifications?.text || '';
      const tags = [posting.function, posting.department, posting.industry].filter(Boolean);
      const location = [
        posting.location?.city,
        posting.location?.region,
        posting.location?.country
      ].filter(Boolean).join(', ');
      return normalizeJob({
        provider: 'smartrecruiters',
        rawId: posting.id,
        company,
        title: posting.name,
        location,
        raw_url: posting.jobAd?.sections?.jobDescription?.ref || posting.applyUrl || posting.ref || company.careers,
        raw_apply_url: posting.applyUrl || null,
        url_candidates: buildSmartRecruitersCandidates(posting, company),
        posted: posting.releasedDate || posting.releasedAt || posting.updatedOn,
        tags,
        description
      });
    })
    .filter((job) => shouldKeepJob(job, options));
}

async function fetchLeverJobs(company, options) {
  const url = `https://api.lever.co/v0/postings/${encodeURIComponent(company.lever.company)}?mode=json`;
  const response = await fetch(url, { headers: { accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`Lever HTTP ${response.status}`);
  }
  const list = await response.json().catch(() => []);
  return (Array.isArray(list) ? list : [])
    .map((posting) => {
      const description = posting.text || posting.description || '';
      const tags = Object.values(posting.categories || {}).filter(Boolean);
      return normalizeJob({
        provider: 'lever',
        rawId: posting.id,
        company,
        title: posting.text || posting.title,
        location: posting.categories?.location || '',
        raw_url: posting.hostedUrl || posting.applyUrl || posting.url || company.careers,
        raw_apply_url: posting.applyUrl || posting.hostedUrl || null,
        url_candidates: buildLeverCandidates(posting, company),
        posted: posting.createdAt,
        tags,
        description
      });
    })
    .filter((job) => shouldKeepJob(job, options));
}

async function fetchGreenhouseJobs(company, options) {
  const board = company.greenhouse.board;
  const url = `https://boards-api.greenhouse.io/v1/boards/${board}/jobs?content=true`;
  const response = await fetch(url, { headers: { accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`Greenhouse HTTP ${response.status}`);
  }
  const payload = await response.json().catch(() => ({}));
  const jobs = Array.isArray(payload?.jobs) ? payload.jobs : [];
  return jobs
    .map((job) => {
      const description = job.content || '';
      const tags = (job.metadata || []).map((m) => `${m.name}:${m.value}`);
      return normalizeJob({
        provider: 'greenhouse',
        rawId: job.id,
        company,
        title: job.title,
        location: job.location?.name || '',
        raw_url: job.absolute_url || job.external_url || company.careers,
        raw_apply_url: job.absolute_url || job.external_url || null,
        url_candidates: buildGreenhouseCandidates(job, company),
        posted: job.updated_at || job.created_at,
        tags,
        description
      });
    })
    .filter((job) => shouldKeepJob(job, options));
}

async function fetchWorkdayJobs(company, options) {
  const { host, tenant, site } = company.workday;
  const base = `https://${host}/wday/cxs/${tenant}/${site || 'careers'}/jobs`;
  const body = {
    appliedFacets: { locationCountry: ['FR'] },
    limit: Math.min(options.limit || 50, 50),
    offset: 0,
    searchText: options.query || ''
  };
  const response = await fetch(base, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    throw new Error(`Workday HTTP ${response.status}`);
  }
  const payload = await response.json().catch(() => ({}));
  const postings = Array.isArray(payload?.jobPostings) ? payload.jobPostings : [];
  return postings
    .map((posting) => {
      const tags = Array.isArray(posting.categories) ? posting.categories : [];
      const description = posting.brandedDescription || posting.jobPostingInfo?.jobDescription || '';
      const location = (posting.locations || [])
        .map((loc) => loc.shortName || loc.name)
        .filter(Boolean)
        .join(', ');
      return normalizeJob({
        provider: 'workday',
        rawId: posting.jobPostingId,
        company,
        title: posting.title,
        location,
        raw_url: `https://${host}${posting.externalPath || posting.externalUrl || ''}` || company.careers,
        raw_apply_url: posting.externalUrl ? `https://${host}${posting.externalUrl}` : null,
        url_candidates: buildWorkdayCandidates(posting, company),
        posted: posting.postedOn || posting.postedDateTime,
        tags,
        description
      });
    })
    .filter((job) => shouldKeepJob(job, options));
}

function normalizeJob({ provider, rawId, company, title, location, raw_url, raw_apply_url, url_candidates = [], posted, tags = [], description = '' }) {
  const id = `${provider}:${rawId}`;
  const normalizedCandidates = Array.isArray(url_candidates) ? url_candidates.map((c) => ({
    ...c,
    url: ensureAbsoluteUrl(c.url, company.careers)
  })) : [];
  const normalizedUrl = ensureAbsoluteUrl(raw_url, company.careers);
  const detailUrl = normalizedCandidates.length ? null : (looksLikeJobDetail(normalizedUrl) ? normalizedUrl : '');
  const normalizedTags = Array.from(new Set(['alternance', ...tags.filter(Boolean).map((tag) => tag.toString().trim())]));
  const careerDomain = extractDomain(company.careers);
  const urlDomain = extractDomain(normalizedUrl) || careerDomain;
  const logoUrl = urlDomain ? buildFaviconUrl(urlDomain) : null;
  return {
    id,
    title: title?.trim() || `Alternance ${company.name}`,
    company: company.name,
    location: location || 'France',
    posted: safeIsoDate(posted),
    raw_url: normalizedUrl,
    raw_apply_url: ensureAbsoluteUrl(raw_apply_url, normalizedUrl) || null,
    url_candidates: normalizedCandidates,
    url: normalizedUrl,
    apply_url: detailUrl || null,
    source: 'direct-careers',
    tags: normalizedTags,
    description: stripHtml(description),
    logo_domain: urlDomain,
    logo_url: logoUrl,
    company_careers: company.careers || null
  };
}

function shouldKeepJob(job, { query, location }) {
  const queryMatch = matchesQuery(job, query) || ALTERNANCE_REGEX.test(job.title) || ALTERNANCE_REGEX.test(job.description || '');
  const locationMatch = matchesLocation(job.location, location);

  // NOUVEAU: Vérification stricte du type de contrat via les tags
  const contractTypeMatch = isApprenticeshipContract(job);

  return queryMatch && locationMatch && contractTypeMatch;
}

/**
 * Vérifie si l'offre est bien un contrat d'alternance/apprentissage
 * en analysant les tags Employment Type
 */
function isApprenticeshipContract(job) {
  const tags = Array.isArray(job.tags) ? job.tags.join(' ').toLowerCase() : '';
  const title = (job.title || '').toLowerCase();

  // Tags qui indiquent un CDI/CDD/autre (à rejeter)
  const invalidContractTypes = [
    'unlimited contract',  // CDI
    'fixed term',          // CDD
    'permanent',           // CDI
    'freelance',
    'contractor',
    'temporary'
  ];

  // Si l'offre a un tag de type CDI/CDD, on rejette
  if (invalidContractTypes.some(type => tags.includes(type))) {
    // EXCEPTION: Si le titre mentionne explicitement "alternance" ET le tag "apprentice"
    const hasAlternanceInTitle = /\b(alternance|apprentissage)\b/i.test(title);
    const hasApprenticeTag = tags.includes('apprentice');

    if (hasAlternanceInTitle && hasApprenticeTag) {
      return true; // C'est probablement une vraie alternance malgré le tag ambigu
    }

    return false; // Sinon on rejette
  }

  // Tags qui indiquent une alternance/apprentissage (à garder)
  const validContractTypes = [
    'apprentice',
    'apprenticeship',
    'work-study',
    'work study',
    'contrat pro'
  ];

  // Si l'offre a un tag valide, on garde
  if (validContractTypes.some(type => tags.includes(type))) {
    return true;
  }

  // NOUVEAU: Gestion spéciale des "Internship" (stage)
  // Un stage n'est PAS une alternance, SAUF si le titre mentionne explicitement "alternance"
  if (tags.includes('internship')) {
    const hasAlternanceInTitle = /\b(alternance|apprentissage|apprentice)\b/i.test(title);

    // Si c'est un stage ET le titre mentionne "alternance", on garde
    if (hasAlternanceInTitle) {
      return true;
    }

    // Sinon c'est juste un stage, on rejette
    return false;
  }

  // Si pas de tag Employment Type mais "alternance" dans le titre, on garde
  if (/\b(alternance|apprentissage)\b/i.test(title)) {
    return true;
  }

  // Sinon on rejette (pas assez de preuves que c'est une alternance)
  return false;
}

function matchesQuery(job, query) {
  if (!query) return true;
  const needle = query.toLowerCase();
  const haystack = [
    job.title,
    job.description,
    job.location,
    Array.isArray(job.tags) ? job.tags.join(' ') : null
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(needle);
}

function matchesLocation(value, desired) {
  if (!desired) return true;
  const haystack = (value || '').toLowerCase();
  const needle = desired.toLowerCase();
  if (!haystack) return needle === 'france';
  if (needle !== 'france') {
    return haystack.includes(needle);
  }
  return FR_KEYWORDS.some((term) => haystack.includes(term));
}

function safeIsoDate(value) {
  if (!value) return new Date().toISOString();
  try {
    return new Date(value).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function stripHtml(value = '') {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractDomain(url) {
  try {
    const obj = new URL(url);
    return obj.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

function dedupeJobs(jobs) {
  const seen = new Map();
  for (const job of jobs) {
    const key = job.url || job.id;
    if (!key) continue;
    if (!seen.has(key)) {
      seen.set(key, job);
    }
  }
  return Array.from(seen.values());
}

function chooseBestCandidates(jobs, stats) {
  for (const job of jobs) {
    stats.total++;
    const candidates = Array.isArray(job.url_candidates) ? job.url_candidates : [];
    if (!candidates.length) {
      job.__discarded = 'no_candidates';
      stats.generic++;
      continue;
    }
    const filtered = candidates
      .map((candidate) => scoreUrlCandidate(job, candidate))
      .filter((candidate) => !isGenericCareerUrl(candidate.url, job.company_careers));
    if (!filtered.length) {
      job.__discarded = 'generic_candidates';
      stats.generic++;
      continue;
    }
    const scored = filtered.sort((a, b) => b._score - a._score);
    job.url_candidates = scored;
    const best = scored[0];
    job.url = best.url;
    job.apply_url = best.url;
  }
  return jobs;
}

function scoreUrlCandidate(job, candidate) {
  const url = candidate.url || '';
  const domain = extractDomain(url) || '';
  const generic = isGenericCareerUrl(url, job.company_careers);
  const detail = looksLikeJobDetail(url);
  let hostTrust = 0;
  if (TRUSTED_ATS_HOSTS.some((host) => domain.endsWith(host))) hostTrust = 1;
  else if (domain.includes(slugify(job.company))) hostTrust = 0.7;
  const aggregatorPenalty = AGGREGATOR_HINTS.some((hint) => domain.includes(hint)) ? 1 : 0;
  const greenhouseBoost = domain === 'job-boards.greenhouse.io' ? 0.5 : 0;
  const score = hostTrust * 3 + (detail ? 2 : 0) - (generic ? 4 : 0) - aggregatorPenalty * 4 + greenhouseBoost;
  return { ...candidate, genericScore: generic ? 1 : 0, detailScore: detail ? 1 : 0, hostTrustScore: hostTrust, _score: score };
}

async function probeJobUrls(jobs, stats) {
  const limit = Math.min(HTTP_PROBE_LIMIT, jobs.length);
  const subset = jobs.slice(0, limit);
  const tasks = subset.map((job) => probeSingleJob(job, stats));
  await Promise.all(tasks);
  return jobs;
}

async function probeSingleJob(job, stats) {
  const target = job.apply_url || job.url;
  if (!target) return;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HTTP_PROBE_TIMEOUT);
  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7'
    };

    let res = await fetch(target, { method: 'HEAD', redirect: 'follow', signal: controller.signal, headers });

    // Si 405 (Method Not Allowed), 501 (Not Implemented) ou 404 (Not Found), on tente GET
    // On tente aussi avec un slash à la fin si 404 (certains serveurs le demandent)
    if (res.status === 405 || res.status === 501 || res.status === 404) {
      let retryUrl = target;
      if (res.status === 404 && !target.endsWith('/')) {
        retryUrl = target + '/';
      }

      res = await fetch(retryUrl, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          ...headers,
          Range: 'bytes=0-4096'
        }
      });
      if (res.ok) {
        const html = await res.text().catch(() => '');
        job.pageMeta = extractPageMeta(html);
        if (retryUrl !== target) {
          job.url = retryUrl;
          job.apply_url = retryUrl;
        }
      }
    }

    clearTimeout(timeout);

    // Si on a une erreur 403/429 (Rate Limit/Forbidden), on suppose que le lien est valide (protection bot)
    // pour ne pas jeter de bonnes offres.
    const isSoftError = res.status === 403 || res.status === 429;
    const isBroken = res.status >= 400 && !isSoftError;

    job.url_health = {
      status: res.status,
      finalUrl: res.url,
      isBroken: isBroken
    };

    if (res.ok && res.url && res.url !== target) {
      job.url = res.url;
      job.apply_url = res.url;
      if (job.url_candidates) {
        job.url_candidates.unshift({ url: res.url, source: 'http_redirect' });
      }
    }
    if (isBroken) {
      stats.broken++;
    }
  } catch (error) {
    clearTimeout(timeout);
    // En cas de timeout ou erreur réseau, on garde le bénéfice du doute si c'est un ATS connu
    const isKnownAts = TRUSTED_ATS_HOSTS.some(host => target.includes(host));

    if (isKnownAts) {
      job.url_health = {
        status: 0,
        finalUrl: target,
        isBroken: false, // On garde car c'est probablement juste un timeout/blocage
        error: error.message
      };
    } else {
      stats.broken++;
      job.url_health = {
        status: 0,
        finalUrl: target,
        isBroken: true,
        error: error.message
      };
    }
  }
}

function extractPageMeta(html = '') {
  if (!html) return null;
  const titleMatch = html.match(/<title>([^<]{0,200})<\/title>/i);
  const h1Match = html.match(/<h1[^>]*>([^<]{0,200})<\/h1>/i);
  const ogTitleMatch = html.match(/property=['"]og:title['"][^>]*content=['"]([^'"]{0,200})['"]/i);
  if (!titleMatch && !h1Match && !ogTitleMatch) return null;
  return {
    title: titleMatch ? titleMatch[1].trim() : null,
    h1: h1Match ? h1Match[1].trim() : null,
    ogTitle: ogTitleMatch ? ogTitleMatch[1].trim() : null
  };
}

function buildFaviconUrl(domain) {
  if (!domain) return null;
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

function stripInternalFields(job) {
  const { company_careers, raw_url, raw_apply_url, url_candidates, url_health, pageMeta, __discarded, ...rest } = job;
  return rest;
}

async function reviewJobsWithAI(jobs, env) {
  if (!jobs.length) return jobs;
  const ollamaUrl = readEnv(env, 'OLLAMA_URL');
  if (!ollamaUrl) return jobs;
  const primaryModel = readEnv(env, 'OLLAMA_MODEL') || DEFAULT_OLLAMA_MODEL;
  const secondaryModel = readEnv(env, 'DIRECT_CAREERS_SECONDARY_MODEL') || SECONDARY_MODEL_DEFAULT;
  const useSecondary = Boolean(secondaryModel && secondaryModel.toLowerCase() !== 'off');
  const aiLimit = Math.max(0, parseInt(readEnv(env, 'DIRECT_CAREERS_AI_LIMIT') || `${MAX_AI_REVIEWS}`, 10));

  const candidates = jobs.filter((job) => shouldUseAiReview(job)).slice(0, aiLimit || MAX_AI_REVIEWS);
  if (!candidates.length) return jobs;

  const updates = new Map();
  const rejects = [];
  for (const job of candidates) {
    try {
      const primary = await fixJobWithOllama(job, { ollamaUrl, model: primaryModel });
      if (!primary || primary.is_company_listing === false) {
        rejects.push({ id: job.id, reason: primary?.reason || 'primary_reject' });
        continue;
      }
      let approved = true;
      let secondaryNote = null;
      if (useSecondary) {
        const verdict = await verifyJobWithOllama(job, primary, { ollamaUrl, model: secondaryModel });
        if (!verdict || verdict.approved !== true) {
          approved = false;
          rejects.push({ id: job.id, reason: verdict?.reason || 'secondary_reject' });
        } else {
          secondaryNote = verdict;
        }
      }
      if (!approved) continue;
      updates.set(job.id, { ...primary, secondary: secondaryNote });
    } catch (error) {
      console.warn(`[Direct Careers][AI] ${job.id}: ${error.message}`);
    }
  }

  if (rejects.length) {
    console.warn('[Direct Careers][AI] Offres rejetées:', rejects.slice(0, 5));
  }

  const repaired = [];
  for (const job of jobs) {
    const patch = updates.get(job.id);
    if (patch) {
      job.title = patch.title || job.title;
      job.location = patch.location || job.location;
      job.url = patch.url || job.url;
      job.apply_url = patch.url || job.apply_url || job.url;
      job.logo_domain = job.logo_domain || extractDomain(job.url);
      job.logo_url = job.logo_url || (job.logo_domain ? buildFaviconUrl(job.logo_domain) : null);
      job.tags = Array.isArray(job.tags) ? Array.from(new Set([...job.tags, 'validé-ia'])) : ['validé-ia'];
      job.ai_review = {
        source: 'ollama',
        is_company_listing: patch.is_company_listing !== false,
        reason: patch.reason || '',
        secondary: patch.secondary || null,
        reviewed_at: new Date().toISOString()
      };
    }
    repaired.push(job);
  }

  return repaired;
}

function shouldUseAiReview(job) {
  const targetLink = job.apply_url || job.url || '';
  const domain = extractDomain(targetLink);
  const generic = isGenericCareerUrl(targetLink, job.company_careers);
  if (generic) return true;
  if (!targetLink) return true;
  if (!domain) return true;
  if (!job.company) return true;
  if (!looksLikeJobDetail(targetLink)) return true;
  return !isLikelyHealthyUrl(domain, job.company);
}

function isLikelyHealthyUrl(domain, companyName) {
  if (!domain) return false;
  const lower = domain.toLowerCase();
  if (TRUSTED_ATS_HOSTS.some((host) => lower.endsWith(host))) {
    return true;
  }
  const companySlug = slugify(companyName);
  if (companySlug && lower.includes(companySlug)) {
    return true;
  }
  return !AGGREGATOR_HINTS.some((hint) => lower.includes(hint));
}

function slugify(value) {
  if (!value) return '';
  return value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function isGenericCareerUrl(url, careersBase) {
  if (!url) return true;
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/\/+$/, '');
    if (!path || path === '') return true;
    const segments = path.split('/').filter(Boolean);
    if (segments.length <= 1) return true;
    const last = segments[segments.length - 1].toLowerCase();
    if (GENERIC_PATH_HINTS.some((hint) => last.includes(hint))) return true;
    if (!looksLikeJobDetail(url)) return true;
    if (careersBase) {
      const base = new URL(careersBase);
      if (base.hostname === parsed.hostname && path === base.pathname.replace(/\/+$/, '')) {
        return true;
      }
    }
    return false;
  } catch {
    return true;
  }
}

function looksLikeJobDetail(url) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/\/+$/, '');
    if (!path || path === '' || path === '/') return false;

    const segments = path.split('/').filter(Boolean);
    if (segments.length < 2) return false;

    // Si c'est un ATS de confiance, on est plus permissif (ex: /company/job-id)
    const isTrusted = TRUSTED_ATS_HOSTS.some(host => parsed.hostname.endsWith(host));
    if (isTrusted) return true;

    const last = segments[segments.length - 1];
    if (last.length <= 5) return false;
    const lower = last.toLowerCase();
    if (/\d/.test(last) || last.includes('-')) return true;
    if (JOB_DETAIL_HINTS.some((hint) => lower.includes(hint))) return true;
    return segments.length >= 3;
  } catch {
    return false;
  }
}

function buildSmartRecruitersCandidates(posting, company) {
  const candidates = [];
  const companyId = posting.company?.identifier || company.smart?.company;
  const slug = slugify(posting.name || posting.title || '');
  if (posting.applyUrl) {
    candidates.push({ url: posting.applyUrl, source: 'ats_apply' });
  }
  if (companyId && posting.id && slug) {
    candidates.push({
      url: `https://jobs.smartrecruiters.com/${companyId}/${slug}-${posting.id}`,
      source: 'ats_canonical'
    });
  }
  if (posting.jobAd?.sections?.jobDescription?.ref) {
    candidates.push({ url: posting.jobAd.sections.jobDescription.ref, source: 'ats_ref' });
  }
  if (posting.ref) {
    candidates.push({ url: posting.ref, source: 'ats_ref_raw' });
  }
  if (company.careers) {
    candidates.push({ url: company.careers, source: 'company_careers' });
  }
  return dedupeCandidates(candidates);
}

function buildLeverCandidates(posting, company) {
  const candidates = [];
  const companySlug = company.lever?.company;
  const slug = slugify(posting.text || posting.title || '');
  if (posting.hostedUrl) candidates.push({ url: posting.hostedUrl, source: 'ats_hosted' });
  if (companySlug && posting.id && slug) {
    candidates.push({
      url: `https://jobs.lever.co/${companySlug}/${slug}-${posting.id}`,
      source: 'ats_canonical'
    });
  }
  if (posting.applyUrl) candidates.push({ url: posting.applyUrl, source: 'ats_apply' });
  if (posting.url) candidates.push({ url: posting.url, source: 'ats_url' });
  if (company.careers) candidates.push({ url: company.careers, source: 'company_careers' });
  return dedupeCandidates(candidates);
}

function buildGreenhouseCandidates(job, company) {
  const candidates = [];
  const board = company.greenhouse?.board;
  if (board && job.id) {
    pushGreenhouseCandidate(candidates, `https://boards.greenhouse.io/${board}/jobs/${job.id}`, 'ats_canonical');
    pushGreenhouseCandidate(candidates, `https://job-boards.greenhouse.io/${board}/jobs/${job.id}`, 'ats_canonical_jobboards');
  }
  if (job.absolute_url) pushGreenhouseCandidate(candidates, job.absolute_url, 'ats_absolute');
  if (job.external_url) pushGreenhouseCandidate(candidates, job.external_url, 'ats_external');
  if (company.careers) candidates.push({ url: company.careers, source: 'company_careers' });
  return dedupeCandidates(candidates);
}

function pushGreenhouseCandidate(list, url, source) {
  const normalized = ensureAbsoluteUrl(url);
  if (!normalized) return;
  list.push({ url: normalized, source });
  const jobBoardsVariant = toGreenhouseJobBoards(normalized);
  if (jobBoardsVariant && jobBoardsVariant !== normalized) {
    list.push({ url: jobBoardsVariant, source: `${source}_jobboards` });
  }
}

function toGreenhouseJobBoards(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'boards.greenhouse.io') {
      parsed.hostname = 'job-boards.greenhouse.io';
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

function buildWorkdayCandidates(posting, company) {
  const candidates = [];
  const host = company.workday?.host;
  const tenant = company.workday?.tenant;
  const site = company.workday?.site || 'careers';
  if (host && tenant && posting.jobPostingId) {
    candidates.push({
      url: `https://${host}/wday/cxs/${tenant}/${site}/job/${posting.jobPostingId}`,
      source: 'ats_canonical'
    });
  }
  if (posting.externalPath) {
    candidates.push({ url: `https://${host}${posting.externalPath}`, source: 'ats_external_path' });
  }
  if (posting.externalUrl) {
    candidates.push({ url: `https://${host}${posting.externalUrl}`, source: 'ats_external' });
  }
  if (company.careers) candidates.push({ url: company.careers, source: 'company_careers' });
  return dedupeCandidates(candidates);
}

function dedupeCandidates(candidates) {
  const seen = new Set();
  const out = [];
  for (const candidate of candidates) {
    const normalized = candidate.url;
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(candidate);
  }
  return out;
}

function ensureAbsoluteUrl(url, base) {
  if (!url && base) return base;
  if (!url) return '';
  try {
    return new URL(url).toString();
  } catch {
    if (base) {
      try {
        return new URL(url, base).toString();
      } catch {
        // ignore
      }
    }
    if (!/^https?:\/\//i.test(url)) {
      return `https://${url.replace(/^\/+/, '')}`;
    }
    return url;
  }
}

async function fixJobWithOllama(job, { ollamaUrl, model }) {
  const careersBase = job.company_careers || '';
  const candidateLines = Array.isArray(job.url_candidates) && job.url_candidates.length
    ? job.url_candidates.map((cand, idx) => `${idx}. ${cand.url} (${cand.source || 'source'})`).join('\n')
    : '0. ' + (job.apply_url || job.raw_apply_url || job.raw_url || careersBase || 'aucune');
  const prompt = `
Tu nettoies des fiches d'offres d'alternance pour vérifier qu'elles proviennent d'un site employeur.
Entreprise: ${job.company}
Titre: ${job.title}
Localisation: ${job.location || 'inconnue'}
URL fournie: ${job.url || 'aucune'}
Page carrière: ${careersBase || 'inconnue'}

Liste d'URLs candidates (tu dois choisir l'une d'elles, pas en inventer) :
${candidateLines}

Consignes:
- Renvoie un titre court (<=90 caractères) lisible.
- Choisis l'index de l'URL qui correspond le mieux à la fiche détaillée. Ne crée pas d'URL.
- Indique si l'offre semble publiée par l'employeur (true/false) selon le domaine.
- Donne une localisation concise si tu peux.

Réponds STRICTEMENT avec un JSON sans markdown:
{
  "title": "...",
  "location": "...",
  "chosen_index": number,
  "is_company_listing": true/false,
  "reason": "explication brève"
}
`;

  const response = await callOllama({ baseUrl: ollamaUrl, model, prompt });
  const parsed = parseJsonResponse(response);
  if (!parsed) return null;
  let fixedUrl = null;
  if (Array.isArray(job.url_candidates) && job.url_candidates.length) {
    const idx = Number(parsed.chosen_index);
    if (!Number.isFinite(idx) || !job.url_candidates[idx]) return null;
    fixedUrl = job.url_candidates[idx].url;
  } else if (parsed.url) {
    fixedUrl = ensureAbsoluteUrl(parsed.url, careersBase || job.url);
  }
  if (!fixedUrl || !looksLikeJobDetail(fixedUrl)) return null;
  return {
    title: parsed.title,
    location: parsed.location,
    url: fixedUrl,
    is_company_listing: parsed.is_company_listing !== false,
    reason: parsed.reason || ''
  };
}

async function verifyJobWithOllama(job, candidate, { ollamaUrl, model }) {
  const meta = job.pageMeta;
  const metaText = meta
    ? `Meta page détectées: title="${meta.title || ''}", h1="${meta.h1 || ''}", og:title="${meta.ogTitle || ''}".`
    : `Meta page détectées: aucune.`;
  const prompt = `
Tu dois valider que la fiche ci-dessous correspond bien à l'offre d'alternance décrite par l'entreprise.

Entreprise: ${job.company}
Titre attendu: ${job.title}
Localisation attendue: ${job.location || 'inconnue'}
Source: ${job.source}

Fiche proposée:
- URL: ${candidate.url || 'aucune'}
- Titre proposé: ${candidate.title || 'inconnu'}
- Localisation proposée: ${candidate.location || 'inconnue'}
${metaText}

Questions:
1. L'URL semble-t-elle pointer vers une offre précise (pas une page générique) ?
2. Le titre/localisation correspondent-ils à l'offre décrite ?

Réponds STRICTEMENT avec un JSON:
{
  "approved": true/false,
  "reason": "explication courte",
  "confidence": 0-1
}
`;

  try {
    const response = await callOllama({ baseUrl: ollamaUrl, model, prompt });
    const parsed = parseJsonResponse(response);
    return parsed || null;
  } catch (error) {
    console.warn('[Direct Careers][AI secondary] erreur:', error.message);
    return null;
  }
}

async function callOllama({ baseUrl, model, prompt }) {
  const endpoint = `${baseUrl.replace(/\/$/, '')}/api/generate`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      options: { temperature: 0.1, top_p: 0.9 }
    })
  });
  if (!res.ok) {
    throw new Error(`Ollama ${res.status}`);
  }
  const data = await res.json();
  return data.response?.trim() || '';
}

function parseJsonResponse(text) {
  if (!text) return null;
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/```json/gi, '').replace(/```/g, '').trim();
  }
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

function readEnv(env, key) {
  if (env && Object.prototype.hasOwnProperty.call(env, key)) {
    return env[key];
  }
  if (typeof process !== 'undefined' && process.env && Object.prototype.hasOwnProperty.call(process.env, key)) {
    return process.env[key];
  }
  return undefined;
}
