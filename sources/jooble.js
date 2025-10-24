/**
 * Jooble API Source
 * Doc: https://jooble.org/api/about
 */

export async function fetchJoobleJobs({ query = '', location = '', limit = 20, env }) {
  const apiKey = env.JOOBLE_KEY;
  if (!apiKey) {
    console.warn('Jooble: JOOBLE_KEY non définie');
    return [];
  }

  try {
    console.log(`🔍 Jooble: début de la recherche dans toute la France (limit=${limit})`);
    const allJobs = [];

    // Toutes les grandes villes françaises pour maximiser la couverture nationale
    const cities = [
      'Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg',
      'Montpellier', 'Bordeaux', 'Lille', 'Rennes', 'Reims', 'Le Havre', 'Saint-Étienne',
      'Toulon', 'Grenoble', 'Dijon', 'Angers', 'Nîmes', 'Villeurbanne', 'Clermont-Ferrand',
      'Le Mans', 'Aix-en-Provence', 'Brest', 'Tours', 'Amiens', 'Limoges', 'Annecy',
      'Perpignan', 'Boulogne-Billancourt', 'Metz', 'Besançon', 'Orléans', 'Mulhouse',
      'Rouen', 'Caen', 'Nancy', 'Argenteuil', 'Saint-Denis', 'Montreuil'
    ];

    // Termes de recherche optimisés
    const keywords = ['alternance', 'apprentissage'];

    const searches = [];
    for (const city of cities) {
      for (const keyword of keywords) {
        searches.push({ keywords: keyword, location: city });
      }
    }

    let requestCount = 0;
    const maxRequests = 80; // Augmenté pour couvrir plus de villes

    for (const search of searches) {
      for (let page = 1; page <= 2; page++) {
        if (requestCount >= maxRequests) {
          console.log(`⚠️ Jooble: limite de ${maxRequests} requêtes atteinte`);
          break;
        }

        const payload = {
          keywords: search.keywords.trim(),
          location: search.location,
          page: page
        };

        try {
          requestCount++;
          const response = await fetch(`https://jooble.org/api/${apiKey}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            console.error(`❌ Jooble: ${response.status} pour "${search.keywords}" à ${search.location} page ${page}`);
            continue;
          }

          const data = await response.json();
          const jobs = data.jobs || [];
          console.log(`📥 Jooble: ${jobs.length} jobs pour "${search.keywords}" à ${search.location} page ${page}`);

          if (jobs.length === 0) {
            break;
          }

          allJobs.push(...jobs);
        } catch (err) {
          console.error(`❌ Erreur Jooble "${search.keywords}" à ${search.location} page ${page}:`, err.message);
        }
      }
      if (requestCount >= maxRequests) break;
    }

    console.log(`📊 Jooble: total ${allJobs.length} jobs bruts récupérés en ${requestCount} requêtes`);

    // Filtrage très léger - on fait déjà la recherche avec les bons mots-clés
    // On filtre seulement les offres qui ne mentionnent clairement PAS d'alternance
    const excludeKeywords = ['cdi', 'stage', 'temps plein', 'full time', 'permanent'];
    const filteredJobs = allJobs.filter(job => {
      const text = `${job.title} ${job.snippet || ''}`.toLowerCase();
      // Si le texte contient alternance/apprentissage, on garde
      if (text.includes('alternance') || text.includes('apprentissage')) {
        return true;
      }
      // Sinon, on exclut seulement si c'est clairement un CDI/stage
      const hasExclude = excludeKeywords.some(kw => text.includes(kw));
      return !hasExclude;
    });

    console.log(`📊 Jooble: ${filteredJobs.length} jobs après filtrage léger (${allJobs.length - filteredJobs.length} exclus)`);

    // Dédupliquer par link et limiter
    const uniqueJobs = Array.from(
      new Map(filteredJobs.map(job => [job.link, job])).values()
    ).slice(0, limit);

    console.log(`✅ Jooble: ${uniqueJobs.length} jobs uniques après déduplication`);

    return uniqueJobs.map(job => {
      const randomStr = (job.link || Math.random().toString()).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
      const id = `jooble-${randomStr}`;
      return {
        id,
        title: job.title || 'Sans titre',
        company: job.company || 'Entreprise inconnue',
        location: job.location || location || 'France',
        posted: formatDate(job.updated),
        tags: extractTags(job.snippet || job.title || ''),
        url: job.link || '#',
        source: 'jooble',
        logo_domain: extractDomain(job.company),
        logo_url: null
      };
    });
  } catch (error) {
    console.error('Erreur Jooble:', error.message);
    return [];
  }
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
  const keywords = ['alternance', 'apprentissage', 'bac+2', 'bac+3', 'bac+5', 'développeur', 'commercial', 'marketing', 'data', 'rh', 'communication'];
  const found = keywords.filter(kw => text.toLowerCase().includes(kw));
  return found.slice(0, 3);
}

function extractDomain(company) {
  if (!company) return null;
  const normalized = company.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${normalized}.com`;
}
