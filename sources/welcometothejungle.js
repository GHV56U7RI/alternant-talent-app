/**
 * Welcome to the Jungle Job Fetcher
 * Utilise l'API Welcomekit officielle (nécessite clé API) ou le scraping de la page publique.
 * Documentation: https://developers.welcomekit.co
 */

export async function fetchWTTJJobs({ query = 'alternance', location = 'France', limit = 100, env }) {
  const jobs = [];

  // Vérifier si la clé API est configurée
  const apiKey = env?.WTTJ_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ WTTJ_API_KEY non configurée - utilisation du feed public RSS');
    return fetchWTTJFromPublicFeed(limit);
  }

  try {
    // Utiliser l'API Welcomekit officielle
    // Documentation: https://developers.welcomekit.co/api/v1/jobs
    const pages = Math.ceil(limit / 50);

    for (let page = 1; page <= pages && jobs.length < limit; page++) {
      try {
        const response = await fetch(
          `https://www.welcomekit.co/api/v1/jobs?` +
          `contract_type[]=apprenticeship&contract_type[]=internship` +
          `&page=${page}&per_page=50&sort_by=published_at`,
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          }
        );

        if (!response.ok) {
          console.error(`WTTJ API error (page ${page}):`, response.status);
          break;
        }

        const data = await response.json();

        if (data.jobs && Array.isArray(data.jobs)) {
          for (const job of data.jobs) {
            if (jobs.length >= limit) break;

            // Filtrer pour la France
            const location = job.office?.city || job.office?.name || '';
            if (!location.match(/france|paris|lyon|marseille|toulouse|bordeaux|nantes|lille|nice|rennes|strasbourg/i)) {
              continue;
            }

            const jobId = `wttj-${job.id || job.reference}`;

            jobs.push({
              id: jobId,
              title: job.name || job.title,
              company: job.organization?.name || 'Entreprise',
              location: location,
              posted: formatDate(job.published_at),
              url: job.url || `https://www.welcometothejungle.com/fr/jobs/${job.reference}`,
              source: 'welcometothejungle',
              tags: ['alternance'],
              logo_domain: 'welcometothejungle.com',
              logo_url: job.organization?.logo_url
            });
          }
        }

        // Rate limiting
        await sleep(500);

      } catch (error) {
        console.error(`Error fetching WTTJ page ${page}:`, error.message);
      }
    }

    console.log(`Welcome to the Jungle: Collected ${jobs.length} jobs`);
    return jobs;

  } catch (error) {
    console.error('Error in fetchWTTJJobs:', error);
    return jobs;
  }
}

/**
 * Scrape les jobs d'une entreprise spécifique sur WTTJ via la page publique
 * @param {string} companySlug - Le slug de l'entreprise (ex: 'auchan')
 */
export async function fetchWTTJCompanyJobs(companySlug, options = {}) {
  const url = `https://www.welcometothejungle.com/fr/companies/${companySlug}/jobs`;
  console.log(`[WTTJ] Scraping ${url}...`);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      console.error(`[WTTJ] Error fetching ${url}: ${response.status}`);
      return [];
    }

    const html = await response.text();

    // Extraction des données initiales JSON
    const match = html.match(/window\.__INITIAL_DATA__\s*=\s*"((?:[^"\\]|\\.)*)"/);
    if (!match) {
      console.warn('[WTTJ] Impossible de trouver __INITIAL_DATA__');
      return [];
    }

    let jsonData;
    try {
      const rawJson = match[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
      jsonData = JSON.parse(rawJson);
    } catch (e) {
      try {
        jsonData = JSON.parse(JSON.parse(`"${match[1]}"`));
      } catch (e2) {
        console.warn('[WTTJ] Erreur parsing JSON:', e.message);
        return [];
      }
    }

    // 1. Chercher les clés Algolia dans les données
    let algoliaCreds = null;

    // Parcours profond pour trouver les clés
    const findKeys = (obj) => {
      if (!obj || typeof obj !== 'object') return;
      if (obj.algolia_app_id && obj.algolia_api_key) {
        algoliaCreds = { appId: obj.algolia_app_id, apiKey: obj.algolia_api_key, indexName: obj.algolia_index_name || 'wk_cms_jobs_production' };
        return;
      }
      Object.values(obj).forEach(findKeys);
    };
    findKeys(jsonData);

    if (algoliaCreds) {
      console.log('[WTTJ] Clés Algolia trouvées, utilisation de l\'API...');
      return await fetchAlgoliaJobs(algoliaCreds, companySlug, options);
    }

    // Fallback: Parsing manuel si pas de clés (peu probable)
    console.warn('[WTTJ] Pas de clés Algolia trouvées, fallback sur les données initiales...');
    return parseJobsFromInitialData(jsonData, companySlug, options);

  } catch (error) {
    console.error(`[WTTJ] Error scraping company ${companySlug}:`, error);
    return [];
  }
}

async function fetchAlgoliaJobs({ appId, apiKey, indexName }, companySlug, options) {
  try {
    const algoliaUrl = `https://${appId}-dsn.algolia.net/1/indexes/${indexName}/query`;
    // On récupère toutes les offres (sans filtre de contrat) pour laisser le filtrage se faire en aval
    // Cela permet de récupérer les offres "Alternance" mal catégorisées
    const params = {
      params: `filters=organization.slug:${companySlug}&hitsPerPage=1000`
    };

    const response = await fetch(algoliaUrl, {
      method: 'POST',
      headers: {
        'X-Algolia-API-Key': apiKey,
        'X-Algolia-Application-Id': appId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      console.error(`[WTTJ] Algolia API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    console.log(`[WTTJ] ${data.nbHits} offres d'alternance trouvées via Algolia.`);

    return (data.hits || []).map(job => {
      // Filtrage préventif pour ne retourner que les alternances
      const type = (job.contract_type || '').toUpperCase();
      const title = (job.name || '').toUpperCase();
      const isApprenticeship = type === 'APPRENTICESHIP' ||
                               type === 'PROFESSIONALIZATION' ||
                               /ALTERNANCE|APPRENTISSAGE|CONTRAT PRO/.test(title);

      if (!isApprenticeship && !options.includeAll) return null;

      const jobUrl = `https://www.welcometothejungle.com/fr/companies/${companySlug}/jobs/${job.reference}`;
      return {
        id: `wttj-${job.reference}`,
        title: job.name,
        company: job.organization?.name || companySlug,
        location: job.office?.city || job.office?.name || 'France',
        posted: job.published_at ? new Date(job.published_at).toISOString() : new Date().toISOString(),
        url: jobUrl,
        apply_url: jobUrl,
        url_candidates: [
          { url: jobUrl, source: 'wttj_api' }
        ],
        source: 'welcometothejungle',
        tags: ['alternance', job.contract_type],
        description: job.profile || ''
      };
    }).filter(Boolean);

  } catch (error) {
    console.error('[WTTJ] Error querying Algolia:', error);
    return [];
  }
}

function parseJobsFromInitialData(jsonData, companySlug, options) {
    const jobs = [];
    if (jsonData.queries && Array.isArray(jsonData.queries)) {
      for (const query of jsonData.queries) {
        const data = query.state?.data;
        if (!data) continue;
        if (data.jobs && data.jobs.hits && Array.isArray(data.jobs.hits)) {
           jobs.push(...data.jobs.hits);
        } else if (data.jobs && Array.isArray(data.jobs)) {
           jobs.push(...data.jobs);
        } else if (data.organization && data.organization.jobs && Array.isArray(data.organization.jobs)) {
           jobs.push(...data.organization.jobs);
        }
      }
    }

    return jobs.map(job => {
      const type = (job.contract_type || '').toUpperCase();
      const title = (job.name || '').toUpperCase();

      const isApprenticeship = type === 'APPRENTICESHIP' ||
                               type === 'PROFESSIONALIZATION' ||
                               /ALTERNANCE|APPRENTISSAGE|CONTRAT PRO/.test(title);

      if (!isApprenticeship && !options.includeAll) return null;

      const jobUrl = `https://www.welcometothejungle.com/fr/companies/${companySlug}/jobs/${job.reference}`;
      return {
        id: `wttj-${job.reference || job.id}`,
        title: job.name || job.title,
        company: job.organization?.name || companySlug,
        location: job.office?.city || job.office?.name || 'France',
        posted: job.published_at ? new Date(job.published_at).toISOString() : new Date().toISOString(),
        url: jobUrl,
        apply_url: jobUrl,
        url_candidates: [
          { url: jobUrl, source: 'wttj_initial_data' }
        ],
        source: 'welcometothejungle',
        tags: [job.contract_type, 'alternance'].filter(Boolean),
        description: job.description || ''
      };
    }).filter(Boolean);
}

// Fallback: Feed public de Welcome to the Jungle
async function fetchWTTJFromPublicFeed(limit = 50) {
  const jobs = [];

  try {
    // Utiliser le site public qui liste les offres
    // Alternative: parser la page de recherche publique
    const cities = ['paris', 'lyon', 'marseille', 'toulouse', 'bordeaux'];

    for (const city of cities.slice(0, Math.ceil(limit / 20))) {
      try {
        // L'URL de recherche publique WTTJ
        const searchUrl = `https://www.welcometothejungle.com/fr/jobs?` +
          `refinementList[contract_type][]=APPRENTICESHIP` +
          `&refinementList[contract_type][]=INTERNSHIP` +
          `&aroundQuery=${city}&page=1`;

        // Note: Cette approche nécessiterait un parser HTML
        // Pour l'instant, retourner une liste vide en attendant la clé API
        console.log(`WTTJ public feed: ${searchUrl} (nécessite parsing HTML)`);

      } catch (error) {
        console.error(`Error fetching WTTJ public for ${city}:`, error.message);
      }
    }
  } catch (error) {
    console.error('Error in fetchWTTJFromPublicFeed:', error);
  }

  return jobs;
}

// Fallback RSS (legacy)
async function fetchWTTJFromRSS(limit = 50) {
  // ... (legacy code kept for reference if needed)
  return [];
}

// Helper functions
function formatDate(dateString) {
  if (!dateString) return new Date().toISOString();
  try {
    return new Date(dateString).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
