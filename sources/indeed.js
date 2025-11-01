/**
 * Indeed Job Scraper
 * Note: Indeed n'a pas d'API publique officielle
 * Cette implémentation utilise le RSS feed public d'Indeed
 */

export async function fetchIndeedJobs({ query = 'alternance', location = 'France', limit = 100, env }) {
  const jobs = [];

  try {
    // Indeed RSS Feed - disponible publiquement
    // Format: https://fr.indeed.com/rss?q=alternance&l=Paris
    const cities = [
      'Paris', 'Lyon', 'Marseille', 'Toulouse', 'Bordeaux',
      'Nantes', 'Nice', 'Lille', 'Rennes', 'Strasbourg'
    ];

    const searchQueries = ['alternance', 'apprentissage'];

    for (const city of cities.slice(0, Math.ceil(limit / 20))) {
      for (const searchQuery of searchQueries) {
        try {
          const rssUrl = `https://fr.indeed.com/rss?q=${encodeURIComponent(searchQuery)}&l=${encodeURIComponent(city)}&limit=50&sort=date`;

          console.log(`Fetching Indeed RSS: ${rssUrl}`);

          const response = await fetch(rssUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; AlternantTalentBot/1.0)',
              'Accept': 'application/rss+xml, application/xml, text/xml'
            }
          });

          if (!response.ok) {
            console.error(`Indeed RSS error for ${city}: ${response.status}`);
            continue;
          }

          const xmlText = await response.text();

          // Parser simple pour RSS/XML
          const items = parseIndeedRSS(xmlText);

          for (const item of items) {
            if (jobs.length >= limit) break;

            const jobId = `indeed-${generateIdFromUrl(item.link)}`;

            jobs.push({
              id: jobId,
              title: cleanText(item.title),
              company: extractCompany(item.title, item.description) || 'Entreprise confidentielle',
              location: item.location || city,
              posted: 'Récemment',
              url: item.link,
              source: 'indeed',
              tags: ['alternance'],
              logo_domain: extractDomain(item.link),
              logo_url: null
            });
          }

          // Rate limiting
          await sleep(500);

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

// Parser simple pour RSS Indeed
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
