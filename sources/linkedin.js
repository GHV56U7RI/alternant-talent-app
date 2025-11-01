/**
 * LinkedIn Jobs Fetcher
 * Utilise RapidAPI - LinkedIn Jobs API
 * Documentation: https://rapidapi.com/rockapis-rockapis-default/api/linkedin-jobs-search/
 */

export async function fetchLinkedInJobs({ query = 'alternance', location = 'France', limit = 100, env }) {
  const jobs = [];

  // Vérifier si la clé RapidAPI est configurée
  const rapidApiKey = env?.RAPIDAPI_KEY;
  if (!rapidApiKey) {
    console.warn('⚠️ RAPIDAPI_KEY non configurée - skipping LinkedIn');
    return jobs;
  }

  try {
    // LinkedIn via RapidAPI - recherche par localisation
    const locations = [
      'Paris, France',
      'Lyon, France',
      'Marseille, France',
      'Toulouse, France',
      'Bordeaux, France',
      'Nantes, France',
      'Nice, France',
      'Lille, France'
    ];

    const keywords = ['alternance', 'apprentissage', 'contrat alternance'];

    for (const loc of locations.slice(0, Math.ceil(limit / 15))) {
      for (const keyword of keywords) {
        try {
          if (jobs.length >= limit) break;

          const apiUrl = new URL('https://linkedin-jobs-search.p.rapidapi.com/');
          apiUrl.searchParams.set('keywords', keyword);
          apiUrl.searchParams.set('location', loc);
          apiUrl.searchParams.set('datePosted', 'month');
          apiUrl.searchParams.set('jobType', 'internship');
          apiUrl.searchParams.set('count', '15');

          console.log(`Fetching LinkedIn: ${loc} - ${keyword}`);

          const response = await fetch(apiUrl.toString(), {
            method: 'GET',
            headers: {
              'X-RapidAPI-Key': rapidApiKey,
              'X-RapidAPI-Host': 'linkedin-jobs-search.p.rapidapi.com',
              'Accept': 'application/json'
            }
          });

          if (!response.ok) {
            console.error(`LinkedIn API error for ${loc}: ${response.status}`);
            await sleep(2000); // Rate limiting
            continue;
          }

          const data = await response.json();

          if (data.data && Array.isArray(data.data)) {
            for (const result of data.data) {
              if (jobs.length >= limit) break;

              const jobId = `linkedin-${result.job_id || generateId(result.title + result.company)}`;

              // Éviter les doublons
              if (jobs.some(j => j.id === jobId)) continue;

              jobs.push({
                id: jobId,
                title: cleanText(result.title),
                company: cleanText(result.company) || 'Entreprise',
                location: cleanText(result.location || loc),
                posted: formatLinkedInDate(result.posted_at || result.date),
                url: result.url || result.job_url || `https://www.linkedin.com/jobs/view/${result.job_id}`,
                source: 'linkedin',
                tags: ['alternance'],
                logo_domain: 'linkedin.com',
                logo_url: result.company_logo || null
              });
            }
          }

          // Rate limiting important pour RapidAPI (limite souvent 5 req/sec)
          await sleep(2000);

        } catch (error) {
          console.error(`Error fetching LinkedIn for ${loc}:`, error.message);
        }
      }
    }

    console.log(`LinkedIn: Collected ${jobs.length} jobs`);
    return jobs;

  } catch (error) {
    console.error('Error in fetchLinkedInJobs:', error);
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

// Formater la date LinkedIn
function formatLinkedInDate(dateString) {
  if (!dateString) return 'Récemment';

  try {
    // LinkedIn retourne souvent "2 days ago", "1 week ago", etc.
    if (typeof dateString === 'string') {
      if (dateString.includes('today') || dateString.includes('aujourd\'hui')) return "Aujourd'hui";
      if (dateString.includes('yesterday') || dateString.includes('hier')) return 'Hier';
      if (dateString.match(/\d+ day/)) {
        const days = parseInt(dateString.match(/\d+/)[0]);
        return `Il y a ${days} jours`;
      }
      if (dateString.match(/\d+ week/)) {
        const weeks = parseInt(dateString.match(/\d+/)[0]);
        return `Il y a ${weeks} semaines`;
      }
    }

    // Sinon, parser comme date ISO
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
