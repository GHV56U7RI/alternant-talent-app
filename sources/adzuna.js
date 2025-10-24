/**
 * Adzuna API Source
 * Doc: https://developer.adzuna.com/
 */

export async function fetchAdzunaJobs({ query = '', location = '', limit = 20, env }) {
  const appId = env.ADZUNA_APP_ID;
  const appKey = env.ADZUNA_APP_KEY;

  if (!appId || !appKey) {
    console.warn('Adzuna: Clés API non définies');
    return [];
  }

  try {
    const allJobs = [];
    const searchTerms = [
      `${query || ''} alternance`,
      `${query || ''} apprentissage`,
      `${query || ''} contrat professionnalisation`
    ];

    // Faire plusieurs requêtes pour obtenir plus de résultats
    for (const searchTerm of searchTerms) {
      const what = encodeURIComponent(searchTerm.trim());
      const where = encodeURIComponent(location || 'France');
      const resultsPerPage = 50; // Max par requête Adzuna

      // Faire plusieurs pages (max 10 pages = 500 résultats)
      const numPages = Math.min(Math.ceil(limit / resultsPerPage), 10);

      for (let page = 1; page <= numPages; page++) {

        const url = `https://api.adzuna.com/v1/api/jobs/fr/search/${page}?` +
          `app_id=${appId}&app_key=${appKey}&` +
          `results_per_page=${resultsPerPage}&` +
          `what=${what}&where=${where}`;

        const response = await fetch(url);

        if (!response.ok) {
          console.error(`Adzuna API error page ${page}: ${response.status}`);
          break;
        }

        const data = await response.json();
        const results = data.results || [];

        if (results.length === 0) break; // Plus de résultats

        allJobs.push(...results);
      }
    }

    // Dédupliquer par ID et limiter
    const uniqueJobs = Array.from(
      new Map(allJobs.map(job => [job.id, job])).values()
    ).slice(0, limit);

    // Filtrer pour ne garder que les offres d'alternance/apprentissage
    const filteredJobs = uniqueJobs.filter(job => {
      const text = `${job.title || ''} ${job.description || ''}`.toLowerCase();
      return text.includes('alternance') ||
             text.includes('apprentissage') ||
             text.includes('contrat pro') ||
             text.includes('professionnalisation');
    });

    return filteredJobs.map(job => {
      const randomStr = (job.id || Math.random().toString()).toString().replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
      const id = `adzuna-${randomStr}`;

      // Essayer d'extraire une URL directe de la description
      const directUrl = extractDirectUrl(job.description);

      let finalUrl = directUrl;

      // Si pas d'URL directe, utiliser notre page de redirection personnalisée
      // qui redirige vers Adzuna (garde leur tracking)
      if (!finalUrl && job.redirect_url) {
        // Encoder l'URL Adzuna pour la passer en paramètre
        const encodedAdzunaUrl = encodeURIComponent(job.redirect_url);
        finalUrl = `/redirect.html?url=${encodedAdzunaUrl}`;
        console.log(`[Adzuna] ✅ Redirection personnalisée vers: ${job.redirect_url}`);
      }

      // En dernier recours, utiliser l'URL de tracking Adzuna directement
      if (!finalUrl) {
        console.log(`[Adzuna] ⚠️ Utilisation URL tracking directe (pas de redirect_url)`);
        finalUrl = job.redirect_url || job.url || '#';
      }

      return {
        id,
        title: job.title || 'Sans titre',
        company: job.company?.display_name || 'Entreprise inconnue',
        location: formatLocation(job.location),
        posted: formatDate(job.created),
        tags: extractTags(job.description || job.title || ''),
        url: finalUrl,
        source: 'adzuna',
        logo_domain: extractDomain(job.company?.display_name),
        logo_url: null
      };
    });
  } catch (error) {
    console.error('Erreur Adzuna:', error.message);
    return [];
  }
}

function formatLocation(loc) {
  if (!loc) return 'France';
  const parts = [];
  if (loc.display_name) parts.push(loc.display_name);
  else {
    if (loc.area && loc.area[3]) parts.push(loc.area[3]);
    if (loc.area && loc.area[0]) parts.push(loc.area[0]);
  }
  return parts.join(', ') || 'France';
}

function formatDate(dateStr) {
  if (!dateStr) return 'récent';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "aujourd'hui";
    if (diffDays === 1) return 'hier';
    if (diffDays <= 7) return 'cette semaine';
    if (diffDays <= 30) return 'ce mois-ci';
    return 'récent';
  } catch {
    return 'récent';
  }
}

function extractTags(text) {
  const keywords = ['alternance', 'apprentissage', 'stage', 'cdi', 'cdd', 'développeur', 'commercial', 'marketing', 'data', 'rh'];
  const found = keywords.filter(kw => text.toLowerCase().includes(kw));
  return found.slice(0, 3);
}

function extractDomain(company) {
  if (!company) return null;
  const normalized = company.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${normalized}.com`;
}

function isJobAggregator(url) {
  if (!url) return false;

  const lowerUrl = url.toLowerCase();

  // Note: on ne filtre PAS adzuna car c'est notre source et leurs URLs redirigent automatiquement
  const jobAggregators = [
    'indeed.', 'www.indeed.',
    'meteojob.', 'www.meteojob.',
    'jobijoba.', 'www.jobijoba.',
    'cadremploi.', 'www.cadremploi.',
    'apec.fr', 'www.apec.fr',
    'regionsjob.', 'www.regionsjob.',
    'jobrapido.', 'www.jobrapido.',
    'jooble.', 'www.jooble.',
    'optioncarriere.', 'www.optioncarriere.',
    'monster.', 'www.monster.',
    'keljob.', 'www.keljob.',
    'talent.com', 'www.talent.com',
    'neuvoo.', 'www.neuvoo.',
    'hellowork.', 'www.hellowork.'
  ];

  return jobAggregators.some(agg => lowerUrl.includes(agg));
}

function extractDirectUrl(description) {
  if (!description) return null;

  // Nettoyer le HTML pour obtenir le texte brut
  const textOnly = description
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');

  // Chercher les URLs http/https (exclure adzuna)
  const urlPattern = /https?:\/\/(?!(?:www\.)?adzuna\.)[a-zA-Z0-9][-a-zA-Z0-9+&@#/%?=~_|!:,.;]*[-a-zA-Z0-9+&@#/%=~_|]/gi;

  const matches = textOnly.match(urlPattern);
  if (!matches || matches.length === 0) {
    return null; // Pas d'URL trouvée, utiliser redirect_url
  }

  // Liste des agrégateurs d'emploi à ignorer (avec toutes les variantes)
  const jobAggregators = [
    'adzuna.', 'www.adzuna.',
    'indeed.', 'www.indeed.',
    'meteojob.', 'www.meteojob.',
    'jobijoba.', 'www.jobijoba.',
    'cadremploi.', 'www.cadremploi.',
    'apec.fr', 'www.apec.fr',
    'regionsjob.', 'www.regionsjob.',
    'jobrapido.', 'www.jobrapido.',
    'jooble.', 'www.jooble.',
    'optioncarriere.', 'www.optioncarriere.',
    'monster.', 'www.monster.',
    'keljob.', 'www.keljob.',
    'talent.com', 'www.talent.com',
    'neuvoo.', 'www.neuvoo.',
    'hellowork.', 'www.hellowork.',
    'google-analytics', 'facebook.com',
    'linkedin.com/share', 'twitter.com/share'
  ];

  console.log(`[Adzuna] Trouvé ${matches.length} URLs dans description`);

  // Parcourir TOUTES les URLs et prendre la première qui n'est PAS un agrégateur
  // Si URL1 = adzuna → skip, URL2 = meteojob → skip, URL3 = carriere.com → RETOURNER URL3
  for (const url of matches) {
    const lowerUrl = url.toLowerCase();

    // Exclure les URLs trop courtes
    if (url.length < 15) {
      console.log(`[Adzuna] ❌ URL trop courte: ${url}`);
      continue;
    }

    // Vérifier si l'URL contient un agrégateur
    const isAggregator = jobAggregators.some(agg => lowerUrl.includes(agg));
    if (isAggregator) {
      console.log(`[Adzuna] ❌ Agrégateur ignoré: ${url}`);
      continue; // Ignorer cette URL et passer à la suivante (2ème, 3ème, etc.)
    }

    // Valider que l'URL a un domaine valide
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname && urlObj.hostname.includes('.')) {
        // Retourner la première URL qui n'est pas un agrégateur
        const cleanUrl = url.replace(/[.,;:)\]]+$/, '');
        console.log(`[Adzuna] ✅ URL directe trouvée: ${cleanUrl}`);
        return cleanUrl;
      }
    } catch (e) {
      console.log(`[Adzuna] ❌ URL invalide: ${url}`);
      continue;
    }
  }

  console.log(`[Adzuna] ⚠️ Aucune URL directe trouvée, utilisation du redirect_url`);
  return null; // Aucune URL valide trouvée, utiliser redirect_url
}
