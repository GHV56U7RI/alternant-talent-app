/**
 * Indeed Job Fetcher
 * Utilise l'API Indeed Publisher (nécessite Publisher ID)
 * Documentation: https://docs.indeed.com/publisher-api/
 * Note: API limitée aux offres organiques, pas de scraping
 */

export async function fetchIndeedJobs({ query = 'alternance', location = 'France', limit = 100, env }) {
  const jobs = [];

  // Vérifier si le Publisher ID est configuré
  const publisherId = env?.INDEED_PUBLISHER_ID;
  if (!publisherId) {
    console.warn('⚠️ INDEED_PUBLISHER_ID non configuré - skipping Indeed');
    return jobs;
  }

  try {
    // Indeed Publisher API - recherche par ville
    // Documentation: https://docs.indeed.com/api/job-search/job-search-api/
    const cities = [
      'Paris', 'Lyon', 'Marseille', 'Toulouse', 'Bordeaux',
      'Nantes', 'Nice', 'Lille', 'Rennes', 'Strasbourg'
    ];

    const searchTerms = ['alternance', 'apprentissage', 'contrat apprentissage'];

    for (const city of cities.slice(0, Math.ceil(limit / 30))) {
      for (const searchTerm of searchTerms) {
        try {
          if (jobs.length >= limit) break;

          // Indeed Publisher API endpoint
          const apiUrl = new URL('https://api.indeed.com/ads/apisearch');
          apiUrl.searchParams.set('publisher', publisherId);
          apiUrl.searchParams.set('q', searchTerm);
          apiUrl.searchParams.set('l', city);
          apiUrl.searchParams.set('co', 'fr');
          apiUrl.searchParams.set('format', 'json');
          apiUrl.searchParams.set('v', '2');
          apiUrl.searchParams.set('limit', '25');
          apiUrl.searchParams.set('sort', 'date');

          console.log(`Fetching Indeed API: ${city} - ${searchTerm}`);

          const response = await fetch(apiUrl.toString(), {
            headers: {
              'User-Agent': 'AlternantTalent/1.0',
              'Accept': 'application/json'
            }
          });

          if (!response.ok) {
            console.error(`Indeed API error for ${city}: ${response.status}`);
            await sleep(1000);
            continue;
          }

          const data = await response.json();

          if (data.results && Array.isArray(data.results)) {
            for (const result of data.results) {
              if (jobs.length >= limit) break;

              const jobId = `indeed-${result.jobkey}`;

              // Éviter les doublons
              if (jobs.some(j => j.id === jobId)) continue;

              jobs.push({
                id: jobId,
                title: cleanText(result.jobtitle),
                company: cleanText(result.company) || 'Entreprise confidentielle',
                location: cleanText(result.formattedLocation || result.city || city),
                posted: formatIndeedDate(result.date),
                url: result.url,
                source: 'indeed',
                tags: ['alternance'],
                logo_domain: 'indeed.fr',
                logo_url: null
              });
            }
          }

          // Rate limiting - Indeed limite les requêtes
          await sleep(1000);

        } catch (error) {
          console.error(`Error fetching Indeed for ${city}:`, error.message);
        }
      }
    }

    console.log(`Indeed: Collected ${jobs.length} jobs`);
    return jobs;

  } catch (error) {
    console.error('Error in fetchIndeedJobs:', error);
    return jobs;
  }
}

// Formater la date Indeed (format: "Wed, 01 Nov 2025")
function formatIndeedDate(dateString) {
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

// Parser simple pour RSS Indeed (legacy)
function parseIndeedRSS(xmlText) {
  const items = [];

  try {
    // Regex pour extraire les items du RSS
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xmlText)) !== null) {
      const itemContent = match[1];

      const title = extractTag(itemContent, 'title');
      const link = extractTag(itemContent, 'link');
      const description = extractTag(itemContent, 'description');
      const pubDate = extractTag(itemContent, 'pubDate');

      if (title && link) {
        items.push({
          title: decodeHtml(title),
          link: link,
          description: decodeHtml(description),
          pubDate: pubDate,
          location: extractLocationFromDescription(description)
        });
      }
    }
  } catch (error) {
    console.error('Error parsing Indeed RSS:', error);
  }

  return items;
}

// Extraire un tag XML
function extractTag(xml, tagName) {
  const regex = new RegExp(`<${tagName}[^>]*><!\\[CDATA\\[([^\\]]+)\\]\\]><\/${tagName}>`, 'i');
  const match = xml.match(regex);
  if (match) return match[1];

  const simpleRegex = new RegExp(`<${tagName}[^>]*>([^<]+)<\/${tagName}>`, 'i');
  const simpleMatch = xml.match(simpleRegex);
  return simpleMatch ? simpleMatch[1] : '';
}

// Extraire l'entreprise du titre Indeed (format: "Titre - Entreprise")
function extractCompany(title, description) {
  // Indeed format: "Job Title - Company Name"
  const parts = title.split(' - ');
  if (parts.length >= 2) {
    return parts[parts.length - 1].trim();
  }

  // Fallback: chercher dans la description
  const companyMatch = description?.match(/(?:chez|at|par)\s+([A-Z][^<,.]+)/);
  return companyMatch ? companyMatch[1].trim() : null;
}

// Extraire la localisation de la description
function extractLocationFromDescription(description) {
  const locationMatch = description?.match(/(?:à|in)\s+([^<,.]+(?:,\s*\d{5})?)/);
  return locationMatch ? locationMatch[1].trim() : null;
}

// Générer un ID stable à partir d'une URL
function generateIdFromUrl(url) {
  // Extraire le job key d'Indeed (format: /rc/clk?jk=XXXXX)
  const jkMatch = url.match(/jk=([a-f0-9]+)/);
  if (jkMatch) return jkMatch[1];

  // Fallback: hash simple
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// Extraire le domaine d'une URL
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return 'indeed.fr';
  }
}

// Nettoyer le texte
function cleanText(text) {
  return text
    ?.replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() || '';
}

// Décoder les entités HTML
function decodeHtml(html) {
  const entities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&eacute;': 'é',
    '&egrave;': 'è',
    '&ecirc;': 'ê',
    '&agrave;': 'à',
    '&ccedil;': 'ç',
    '&ocirc;': 'ô'
  };

  let decoded = html || '';
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.replace(new RegExp(entity, 'g'), char);
  }
  return decoded;
}

// Sleep helper
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
