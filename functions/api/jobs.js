import { fetchAdzunaJobs } from '../../sources/adzuna.js';
import { fetchLBAJobs } from '../../sources/lba.js';
import { fetchJoobleJobs } from '../../sources/jooble.js';
import { fetchFranceTravailJobs } from '../../sources/francetravail.js';
import { fetchDirectCareersJobs } from '../../sources/direct-careers.js';
import { fetchATSJobs } from '../../sources/ats-feeds.js';
import { fetchIndeedJobs } from '../../sources/indeed.js';
import { fetchWTTJJobs } from '../../sources/welcometothejungle.js';
import { fetchHelloWorkJobs } from '../../sources/hellowork.js';
import { fetchLinkedInJobs } from '../../sources/linkedin.js';

const like = (q="") => `%${q}%`;
const isTrue = v => v === '1' || v === 'true';

// Termes simples pour filtrer France + DOM-TOM
const FR_TERMS = [
  'France','Guadeloupe','Martinique','Guyane','Réunion','La Réunion','Mayotte',
  'Polynésie','Nouvelle-Calédonie','Saint-Pierre','Wallis','Saint-Barthélemy','Saint-Martin',
  'Paris','Lyon','Marseille','Nantes','Lille','Toulouse','Bordeaux','Rennes','Nice','Strasbourg'
];

async function initializeDB(env) {
  try {
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        company TEXT NOT NULL,
        location TEXT,
        posted TEXT,
        posted_at TEXT,
        created_at TEXT,
        url TEXT,
        tags TEXT,
        type TEXT,
        contract TEXT,
        source TEXT DEFAULT 'd1',
        logo_domain TEXT,
        logo_url TEXT,
        enriched_niveau_etudes TEXT,
        enriched_domaine TEXT,
        enriched_competences TEXT,
        enriched_type_contrat TEXT,
        enriched_duree_estimee TEXT,
        enriched_teletravail INTEGER DEFAULT 0,
        enriched_salaire_estime TEXT,
        enriched_tags TEXT,
        enriched_at TEXT
      )
    `).run();
    await env.DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_jobs_search ON jobs(title, company, location, tags)
    `).run();
    await env.DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_jobs_enriched ON jobs(enriched_domaine, enriched_niveau_etudes, enriched_teletravail)
    `).run();
    console.log('Base de données initialisée');
  } catch (error) {
    console.error('Erreur initialisation DB:', error);
  }
}

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const q = url.searchParams.get('q') || '';
  const location = url.searchParams.get('location') || '';
  const niveau = url.searchParams.get('niveau') || '';
  const domaine = url.searchParams.get('domaine') || '';
  const teletravail = url.searchParams.get('teletravail') || '';
  const limit = Math.min(parseInt(url.searchParams.get('limit')||'20000',10), 20000);
  const offset = Math.max(parseInt(url.searchParams.get('offset')||'0',10), 0);
  const world = isTrue(url.searchParams.get('world') || '0');
  const forceRefresh = isTrue(url.searchParams.get('refresh') || '0');

  console.log('GET /api/jobs', { q, location, niveau, domaine, teletravail, limit, offset, world, forceRefresh });

  try {
    // 0. Initialiser la DB si nécessaire
    await initializeDB(env);

    // 1. D'abord, vérifier si on a des données dans la DB
    let cacheStatus = { isRecent: false, lastUpdate: null };
    let hasData = false;

    cacheStatus = await checkCacheStatus(env);
    hasData = cacheStatus.lastUpdate !== null;

    console.log('Cache status:', { hasData, lastUpdate: cacheStatus.lastUpdate, forceRefresh });

    // 2. Si DB non initialisée ou pas de données, charger seed.json
    if (!hasData && !forceRefresh) {
      console.log('Chargement de seed.json car base vide');
      const seedUrl = new URL('/data/seed.json', request.url);
      const seedResponse = await fetch(seedUrl.toString());
      const seedData = await seedResponse.json();

      return new Response(JSON.stringify({
        count: seedData.length,
        total: seedData.length,
        jobs: seedData.slice(offset, offset + limit),
        source: 'seed.json',
        updated_at: new Date().toISOString()
      }), {
        headers: {
          'content-type': 'application/json',
          'cache-control': 'public, max-age=300'
        }
      });
    }

    // 3. Si forceRefresh OU si la DB est vide, faire le refresh
    if (forceRefresh || !hasData) {
      console.log('Rafraîchissement des données depuis les APIs...');
      await refreshJobsFromAPIs(env);
      await cleanExpiredJobs(env);
    } else if (!cacheStatus.isRecent) {
      console.log('Cache expiré (plus de 4 heures), mais données retournées immédiatement');
    }

    // 4. Récupérer depuis la DB
    const jobs = await fetchJobsFromDB({ q, location, niveau, domaine, teletravail, limit, offset, world, env });

    return new Response(JSON.stringify({
      count: jobs.length,
      total: jobs.length,
      jobs,
      cached_at: cacheStatus.lastUpdate,
      updated_at: new Date().toISOString()
    }), {
      headers: {
        'content-type': 'application/json',
        'cache-control': 'public, max-age=300'
      }
    });
  } catch (error) {
    console.error('Erreur API jobs:', error);
    return new Response(JSON.stringify({
      error: error.message,
      count: 0,
      jobs: []
    }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
}

// Vérifier le statut du cache
async function checkCacheStatus(env) {
  try {
    const result = await env.DB.prepare(
      `SELECT MAX(COALESCE(created_at, posted_at, posted)) as last_update, COUNT(*) as job_count
       FROM jobs
       WHERE source IN ('adzuna', 'lba', 'jooble', 'francetravail', 'direct-careers', 'ats-feeds', 'indeed', 'welcometothejungle', 'hellowork', 'linkedin')`
    ).first();

    console.log('checkCacheStatus result:', result);

    if (!result || !result.last_update || result.job_count === 0) {
      return { isRecent: false, lastUpdate: null, jobCount: result?.job_count || 0 };
    }

    const lastUpdate = new Date(result.last_update);
    const now = new Date();
    const diffMinutes = (now - lastUpdate) / (1000 * 60);

    return {
      isRecent: diffMinutes < 720, // Cache valide pendant 12 heures
      lastUpdate: result.last_update,
      jobCount: result.job_count
    };
  } catch (error) {
    console.error('Erreur checkCacheStatus:', error);
    return { isRecent: false, lastUpdate: null, jobCount: 0 };
  }
}

// Rafraîchir les jobs depuis les APIs
async function refreshJobsFromAPIs(env) {
  try {
    console.log('Appel des APIs Adzuna et LBA...');

    const allJobs = [];

    // Adzuna - Toute la France
    try {
      const adzunaJobs = await fetchAdzunaJobs({
        query: 'alternance',
        location: 'France',
        limit: 1000, // Augmenté pour plus de résultats
        env
      });
      allJobs.push(...adzunaJobs);
      console.log(`Adzuna: ${adzunaJobs.length} jobs`);
    } catch (error) {
      console.error('Erreur Adzuna:', error);
    }

    // LBA - Toute la France via coordonnées géographiques
    try {
      const lbaJobs = await fetchLBAJobs({
        query: 'alternance',
        location: 'France',
        limit: 1500, // Augmenté pour toutes les villes
        env
      });
      allJobs.push(...lbaJobs);
      console.log(`LBA: ${lbaJobs.length} jobs`);
    } catch (error) {
      console.error('Erreur LBA:', error);
    }

    // Jooble - 40 grandes villes françaises
    try {
      const joobleJobs = await fetchJoobleJobs({
        query: '',
        location: 'France',
        limit: 2000,
        env
      });
      allJobs.push(...joobleJobs);
      console.log(`Jooble: ${joobleJobs.length} jobs`);
    } catch (error) {
      console.error('Erreur Jooble:', error);
    }

    // France Travail - API nationale avec recherches multiples et pagination
    try {
      const franceTravailJobs = await fetchFranceTravailJobs({
        query: '',
        location: 'France',
        limit: 500, // Recherches avec plusieurs mots-clés + pagination
        env
      });
      allJobs.push(...franceTravailJobs);
      console.log(`France Travail: ${franceTravailJobs.length} jobs`);
    } catch (error) {
      console.error('Erreur France Travail:', error);
    }

    // Sites carrières directs des grandes entreprises
    try {
      const directCareersJobs = await fetchDirectCareersJobs({
        query: 'alternance',
        location: 'France',
        limit: 700, // 634 entreprises avec bureaux en France
        env
      });
      allJobs.push(...directCareersJobs);
      console.log(`Direct Careers: ${directCareersJobs.length} entreprises`);
    } catch (error) {
      console.error('Erreur Direct Careers:', error);
    }

    // ATS Feeds (Greenhouse, Lever, etc.)
    try {
      const atsJobs = await fetchATSJobs({
        query: 'alternance',
        location: 'France',
        limit: 200, // Plusieurs ATS
        env
      });
      allJobs.push(...atsJobs);
      console.log(`ATS Feeds: ${atsJobs.length} jobs`);
    } catch (error) {
      console.error('Erreur ATS Feeds:', error);
    }

    // Indeed - Via RSS Feed
    try {
      const indeedJobs = await fetchIndeedJobs({
        query: 'alternance',
        location: 'France',
        limit: 300, // RSS feed de plusieurs villes
        env
      });
      allJobs.push(...indeedJobs);
      console.log(`Indeed: ${indeedJobs.length} jobs`);
    } catch (error) {
      console.error('Erreur Indeed:', error);
    }

    // Welcome to the Jungle - Via API Welcomekit
    try {
      const wttjJobs = await fetchWTTJJobs({
        query: 'alternance',
        location: 'France',
        limit: 200, // Welcomekit API (nécessite clé API)
        env
      });
      allJobs.push(...wttjJobs);
      console.log(`Welcome to the Jungle: ${wttjJobs.length} jobs`);
    } catch (error) {
      console.error('Erreur Welcome to the Jungle:', error);
    }

    // HelloWork - Via API publique
    try {
      const helloworkJobs = await fetchHelloWorkJobs({
        query: 'alternance',
        location: 'France',
        limit: 200, // 10 régions françaises
        env
      });
      allJobs.push(...helloworkJobs);
      console.log(`HelloWork: ${helloworkJobs.length} jobs`);
    } catch (error) {
      console.error('Erreur HelloWork:', error);
    }

    // LinkedIn - Via RapidAPI
    try {
      const linkedinJobs = await fetchLinkedInJobs({
        query: 'alternance',
        location: 'France',
        limit: 100, // RapidAPI (nécessite clé API)
        env
      });
      allJobs.push(...linkedinJobs);
      console.log(`LinkedIn: ${linkedinJobs.length} jobs`);
    } catch (error) {
      console.error('Erreur LinkedIn:', error);
    }

    console.log(`Total jobs récupérés: ${allJobs.length}`);

    // Compter les jobs par source avant insertion
    const jobsBySource = {};
    for (const job of allJobs) {
      jobsBySource[job.source] = (jobsBySource[job.source] || 0) + 1;
    }
    console.log('Jobs par source avant insertion:', jobsBySource);

    // Supprimer les anciens jobs API (garder seulement seed)
    await env.DB.prepare(
      `DELETE FROM jobs WHERE source IN ('adzuna', 'lba', 'jooble', 'francetravail', 'direct-careers', 'ats-feeds', 'indeed', 'welcometothejungle', 'hellowork', 'linkedin')`
    ).run();

    // Préparer tous les statements pour le batch
    const statements = [];
    const invalidJobs = [];

    for (const job of allJobs) {
      // Vérifier que tous les champs requis sont présents
      if (!job.id || !job.title || !job.company) {
        invalidJobs.push({ id: job.id, reason: 'champs requis manquants' });
        continue;
      }

      statements.push(
        env.DB.prepare(`
          INSERT OR REPLACE INTO jobs (
            id, title, company, location, tags, url, source, posted,
            logo_domain, logo_url, created_at, posted_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).bind(
          job.id,
          job.title,
          job.company,
          job.location,
          JSON.stringify(job.tags || []),
          job.url,
          job.source,
          job.posted,
          job.logo_domain,
          job.logo_url
        )
      );
    }

    // Insérer par batch (beaucoup plus rapide)
    console.log(`Insertion de ${statements.length} jobs en batch...`);
    try {
      await env.DB.batch(statements);
      console.log(`✅ Insertion terminée: ${statements.length} jobs insérés, ${invalidJobs.length} jobs invalides`);

      if (invalidJobs.length > 0) {
        console.log('Jobs invalides:', JSON.stringify(invalidJobs.slice(0, 5), null, 2));
      }
    } catch (error) {
      console.error('Erreur lors du batch insert:', error.message);
      throw error;
    }

    console.log('Base de données mise à jour avec succès');
  } catch (error) {
    console.error('Erreur refreshJobsFromAPIs:', error);
  }
}

// Nettoyer les jobs expirés (>10 mois)
async function cleanExpiredJobs(env) {
  try {
    const result = await env.DB.prepare(`
      DELETE FROM jobs
      WHERE source IN ('adzuna', 'lba', 'jooble', 'francetravail', 'indeed', 'welcometothejungle', 'hellowork', 'linkedin')
      AND created_at < datetime('now', '-10 months')
    `).run();

    if (result.meta.changes > 0) {
      console.log(`${result.meta.changes} jobs expirés supprimés`);
    }
  } catch (error) {
    console.error('Erreur cleanExpiredJobs:', error);
  }
}

// Récupérer les jobs depuis la DB
async function fetchJobsFromDB({ q, location, limit, offset, world, env, niveau, domaine, teletravail }) {
  const clauses = [];
  const params = [];

  if (q) {
    clauses.push(`(title LIKE ? OR company LIKE ? OR location LIKE ? OR tags LIKE ? OR enriched_competences LIKE ?)`);
    params.push(like(q), like(q), like(q), like(q), like(q));
  }

  if (location) {
    clauses.push(`location LIKE ?`);
    params.push(like(location));
  }

  // Nouveaux filtres enrichis
  if (niveau) {
    clauses.push(`enriched_niveau_etudes = ?`);
    params.push(niveau);
  }

  if (domaine) {
    clauses.push(`enriched_domaine LIKE ?`);
    params.push(like(domaine));
  }

  if (teletravail === 'true' || teletravail === '1') {
    clauses.push(`enriched_teletravail = 1`);
  }

  // Filtre France supprimé pour afficher toutes les villes de France
  // Par défaut, on affiche TOUTES les offres sans filtrage géographique

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  const rs = await env.DB.prepare(
    `SELECT id,title,company,location,tags,url,source,posted,logo_domain,logo_url,
            COALESCE(created_at, posted_at) as publishedAt,
            COALESCE(created_at, posted_at, posted) as sort_date,
            enriched_niveau_etudes, enriched_domaine, enriched_competences,
            enriched_type_contrat, enriched_duree_estimee, enriched_teletravail,
            enriched_salaire_estime, enriched_tags, enriched_at
     FROM jobs
     ${where}
     ORDER BY
       CASE
         WHEN posted LIKE '%aujourd%' OR posted LIKE '%today%' THEN 1
         WHEN posted LIKE '%hier%' OR posted LIKE '%yesterday%' THEN 2
         WHEN posted LIKE '%jour%' OR posted LIKE '%day%' THEN 3
         WHEN posted LIKE '%semaine%' OR posted LIKE '%week%' THEN 4
         WHEN posted LIKE '%mois%' OR posted LIKE '%month%' THEN 5
         ELSE 6
       END ASC,
       sort_date DESC
     LIMIT ? OFFSET ?`
  ).bind(...params, limit, offset).all();

  return (rs.results || []).map(r => {
    const enriched = r.enriched_niveau_etudes ? {
      niveau_etudes: r.enriched_niveau_etudes,
      domaine: r.enriched_domaine,
      competences: (() => { try { return JSON.parse(r.enriched_competences||'[]'); } catch { return []; } })(),
      type_contrat: r.enriched_type_contrat,
      duree_estimee: r.enriched_duree_estimee,
      teletravail: r.enriched_teletravail === 1,
      salaire_estime: r.enriched_salaire_estime,
      tags: (() => { try { return JSON.parse(r.enriched_tags||'[]'); } catch { return []; } })()
    } : null;

    return {
      ...r,
      posted: r.posted || 'Récemment',
      tags: (() => { try { return JSON.parse(r.tags||'[]'); } catch { return []; } })(),
      enriched: enriched,
      enriched_at: r.enriched_at
    };
  });
}
