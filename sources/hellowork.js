/**
 * HelloWork Job Fetcher
 * HelloWork (ex RegionsJob, ParisJob, etc.) - agrégateur français
 * Utilise l'API de recherche publique
 */

export async function fetchHelloWorkJobs({ query = 'alternance', location = 'France', limit = 200, env }) {
  const jobs = [];

  try {
    // HelloWork API - endpoint de recherche public
    // Plusieurs requêtes pour différentes régions
    const regions = [
      { id: 'ile-de-france', name: 'Île-de-France' },
      { id: 'auvergne-rhone-alpes', name: 'Auvergne-Rhône-Alpes' },
      { id: 'provence-alpes-cote-d-azur', name: 'PACA' },
      { id: 'occitanie', name: 'Occitanie' },
      { id: 'nouvelle-aquitaine', name: 'Nouvelle-Aquitaine' },
      { id: 'hauts-de-france', name: 'Hauts-de-France' },
      { id: 'grand-est', name: 'Grand Est' },
      { id: 'pays-de-la-loire', name: 'Pays de la Loire' },
      { id: 'bretagne', name: 'Bretagne' },
      { id: 'normandie', name: 'Normandie' }
    ];

    const searchTerms = ['alternance', 'apprentissage', 'contrat alternance'];

    for (const region of regions.slice(0, Math.ceil(limit / 20))) {
      for (const searchTerm of searchTerms) {
        try {
          if (jobs.length >= limit) break;

          //HelloWork/RegionsJob utilise une API JSONP/REST
          const apiUrl = new URL('https://api.hellowork.com/fr/emplois/search.json');
          apiUrl.searchParams.set('what', searchTerm);
          apiUrl.searchParams.set('where', region.name);
          apiUrl.searchParams.set('mode', 'pagination');
          apiUrl.searchParams.set('page', '1');
          apiUrl.searchParams.set('limit', '20');

          console.log(`Fetching HelloWork: ${region.name} - ${searchTerm}`);

          const response = await fetch(apiUrl.toString(), {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; AlternantTalentBot/1.0)',
              'Accept': 'application/json',
              'Referer': 'https://www.hellowork.com/'
            }
          });

          if (!response.ok) {
            console.error(`HelloWork API error for ${region.name}: ${response.status}`);
            await sleep(500);
            continue;
          }

          const data = await response.json();

          if (data.results && Array.isArray(data.results)) {
            for (const result of data.results) {
              if (jobs.length >= limit) break;

              const jobId = `hellowork-${result.id || generateId(result.title + result.company)}`;

              // Éviter les doublons
              if (jobs.some(j => j.id === jobId)) continue;

              jobs.push({
                id: jobId,
                title: cleanText(result.title || result.jobTitle),
                company: cleanText(result.company || result.companyName) || 'Entreprise',
                location: cleanText(result.location || result.city || region.name),
                posted: formatDate(result.publicationDate || result.date),
                url: result.url || result.link || `https://www.hellowork.com/fr-fr/emplois/${result.id}.html`,
                source: 'hellowork',
                tags: ['alternance'],
                logo_domain: 'hellowork.com',
                logo_url: result.companyLogo || null
              });
            }
          }

          // Rate limiting
          await sleep(300);

        } catch (error) {
          console.error(`Error fetching HelloWork for ${region.name}:`, error.message);
        }
      }
    }

    console.log(`HelloWork: Collected ${jobs.length} jobs`);
    return jobs;

  } catch (error) {
    console.error('Error in fetchHelloWorkJobs:', error);
    return jobs;
  }
}

// Générer un ID unique
function generateId(string) {
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    const char = string.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// Formater la date
function formatDate(dateString) {
  if (!dateString) return 'Récemment';

  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
    return 'Récemment';
  } catch {
    return 'Récemment';
  }
}

// Nettoyer le texte
function cleanText(text) {
  return text
    ?.replace(/<[^>]+>/g, '')
    ?.replace(/&nbsp;/g, ' ')
    ?.replace(/\s+/g, ' ')
    ?.trim() || '';
}

// Sleep helper
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
