/**
 * Welcome to the Jungle Job Fetcher
 * Utilise l'API Welcomekit officielle (nécessite clé API)
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
  const jobs = [];

  try {
    const cities = ['paris', 'lyon', 'marseille', 'toulouse', 'bordeaux'];

    for (const city of cities) {
      try {
        // WTTJ RSS format: https://www.welcometothejungle.com/fr/jobs.rss?aroundQuery=Paris&contractType=APPRENTICESHIP
        const rssUrl = `https://www.welcometothejungle.com/fr/jobs.rss?aroundQuery=${city}&contractType=APPRENTICESHIP&page=1`;

        const response = await fetch(rssUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; AlternantTalentBot/1.0)',
            'Accept': 'application/rss+xml, application/xml, text/xml'
          }
        });

        if (!response.ok) continue;

        const xmlText = await response.text();
        const items = parseWTTJRSS(xmlText);

        for (const item of items) {
          if (jobs.length >= limit) break;

          const jobId = `wttj-rss-${generateIdFromUrl(item.link)}`;

          jobs.push({
            id: jobId,
            title: cleanText(item.title),
            company: item.company || 'Entreprise',
            location: item.location || city,
            posted: 'Récemment',
            url: item.link,
            source: 'welcometothejungle',
            tags: ['alternance'],
            logo_domain: 'welcometothejungle.com',
            logo_url: null
          });
        }

        await sleep(500);
      } catch (error) {
        console.error(`Error fetching WTTJ RSS for ${city}:`, error.message);
      }
    }
  } catch (error) {
    console.error('Error in fetchWTTJFromRSS:', error);
  }

  return jobs;
}

// Parser RSS WTTJ
function parseWTTJRSS(xmlText) {
  const items = [];

  try {
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xmlText)) !== null) {
      const itemContent = match[1];

      const title = extractTag(itemContent, 'title');
      const link = extractTag(itemContent, 'link');
      const description = extractTag(itemContent, 'description');

      if (title && link) {
        // WTTJ format titre: "Job Title - Company Name"
        const [jobTitle, company] = title.split(' - ').map(s => s.trim());

        items.push({
          title: decodeHtml(jobTitle || title),
          company: decodeHtml(company),
          link: link,
          description: decodeHtml(description),
          location: extractLocationFromDescription(description)
        });
      }
    }
  } catch (error) {
    console.error('Error parsing WTTJ RSS:', error);
  }

  return items;
}

// Extraire un tag XML
function extractTag(xml, tagName) {
  const cdataRegex = new RegExp(`<${tagName}[^>]*><!\\[CDATA\\[([^\\]]+)\\]\\]><\/${tagName}>`, 'i');
  const match = xml.match(cdataRegex);
  if (match) return match[1];

  const simpleRegex = new RegExp(`<${tagName}[^>]*>([^<]+)<\/${tagName}>`, 'i');
  const simpleMatch = xml.match(simpleRegex);
  return simpleMatch ? simpleMatch[1] : '';
}

// Extraire la localisation de la description
function extractLocationFromDescription(description) {
  const locationMatch = description?.match(/(?:à|in|-)\s+([A-Z][^<,.]+)/);
  return locationMatch ? locationMatch[1].trim() : null;
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

// Générer un ID stable à partir d'une URL
function generateIdFromUrl(url) {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
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
