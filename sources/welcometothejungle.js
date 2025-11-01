/**
 * Welcome to the Jungle Job Scraper
 * Utilise l'API publique de recherche de Welcome to the Jungle
 */

export async function fetchWTTJJobs({ query = 'alternance', location = 'France', limit = 100, env }) {
  const jobs = [];

  try {
    // Welcome to the Jungle a une API GraphQL publique
    // Endpoint: https://www.welcometothejungle.com/api/graphql

    const cities = [
      'Paris', 'Lyon', 'Marseille', 'Toulouse', 'Bordeaux',
      'Nantes', 'Nice', 'Lille', 'Rennes', 'Strasbourg',
      'Montpellier', 'Grenoble', 'Aix-en-Provence'
    ];

    const contractTypes = ['APPRENTICESHIP', 'INTERNSHIP'];

    for (const city of cities.slice(0, Math.ceil(limit / 10))) {
      for (const contractType of contractTypes) {
        try {
          // GraphQL Query pour WTTJ
          const graphqlQuery = {
            query: `
              query SearchJobs($query: String!, $location: String, $contractType: String) {
                jobs(
                  query: $query
                  location: $location
                  contract_type: $contractType
                  page: 1
                  per_page: 50
                ) {
                  edges {
                    node {
                      id
                      name
                      slug
                      description
                      office {
                        name
                        city
                      }
                      contract_type
                      published_at
                      organization {
                        name
                        slug
                      }
                      websites_urls {
                        website_url
                      }
                    }
                  }
                }
              }
            `,
            variables: {
              query: query,
              location: city,
              contractType: contractType
            }
          };

          const response = await fetch('https://www.welcometothejungle.com/api/graphql', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'Mozilla/5.0 (compatible; AlternantTalentBot/1.0)',
              'Accept': 'application/json'
            },
            body: JSON.stringify(graphqlQuery)
          });

          if (!response.ok) {
            console.error(`WTTJ API error for ${city}: ${response.status}`);
            continue;
          }

          const data = await response.json();

          if (data.data?.jobs?.edges) {
            for (const edge of data.data.jobs.edges) {
              if (jobs.length >= limit) break;

              const job = edge.node;
              const jobId = `wttj-${job.id || job.slug}`;

              jobs.push({
                id: jobId,
                title: job.name,
                company: job.organization?.name || 'Entreprise',
                location: job.office ? `${job.office.city || job.office.name}` : city,
                posted: formatDate(job.published_at),
                url: job.websites_urls?.[0]?.website_url ||
                     `https://www.welcometothejungle.com/fr/companies/${job.organization?.slug}/jobs/${job.slug}`,
                source: 'welcometothejungle',
                tags: ['alternance', contractType.toLowerCase()],
                logo_domain: 'welcometothejungle.com',
                logo_url: job.organization?.slug ?
                  `https://cdn.welcometothejungle.com/uploads/organization/logo/${job.organization.slug}/logo.jpg` : null
              });
            }
          }

          // Rate limiting
          await sleep(300);

        } catch (error) {
          console.error(`Error fetching WTTJ for ${city}:`, error.message);
        }
      }
    }

    // Fallback: Utiliser le RSS feed public si GraphQL échoue
    if (jobs.length < 10) {
      console.log('Trying WTTJ RSS fallback...');
      const rssJobs = await fetchWTTJFromRSS(limit);
      jobs.push(...rssJobs);
    }

    console.log(`Welcome to the Jungle: Collected ${jobs.length} jobs`);
    return jobs;

  } catch (error) {
    console.error('Error in fetchWTTJJobs:', error);
    return jobs;
  }
}

// Fallback: RSS Feed de Welcome to the Jungle
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
