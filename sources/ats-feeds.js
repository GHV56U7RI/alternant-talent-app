/**
 * ATS Feeds Aggregator
 *
 * Agrège les offres depuis plusieurs ATS (Applicant Tracking Systems):
 * - Greenhouse (API JSON publique)
 * - Personio (Flux XML public)
 * - Lever (Postings API)
 * - Workable (Flux XML public)
 */

// Helper function to generate hash IDs (Web Crypto API compatible)
async function generateHash(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.substring(0, 16);
}

// Liste d'entreprises françaises connues utilisant ces ATS
// Format: { ats: 'greenhouse', company_slug: 'company-name' }
const KNOWN_COMPANIES = [
  // Greenhouse - Grandes entreprises tech françaises
  { ats: 'greenhouse', slug: 'doctolib', name: 'Doctolib' },
  { ats: 'greenhouse', slug: 'blablacar', name: 'BlaBlaCar' },
  { ats: 'greenhouse', slug: 'contentsquare', name: 'Contentsquare' },
  { ats: 'greenhouse', slug: 'aircall', name: 'Aircall' },
  { ats: 'greenhouse', slug: 'datadog', name: 'Datadog' },
  { ats: 'greenhouse', slug: 'algolia', name: 'Algolia' },
  { ats: 'greenhouse', slug: 'mirakl', name: 'Mirakl' },
  { ats: 'greenhouse', slug: 'qonto', name: 'Qonto' },
  { ats: 'greenhouse', slug: 'ledger', name: 'Ledger' },
  { ats: 'greenhouse', slug: 'epicgames', name: 'Epic Games' },
  { ats: 'greenhouse', slug: 'backmarket', name: 'Back Market' },
  { ats: 'greenhouse', slug: 'vestiairecollective', name: 'Vestiaire Collective' },
  { ats: 'greenhouse', slug: 'mgistudio', name: 'MGI Studio' },
  { ats: 'greenhouse', slug: 'malt', name: 'Malt' },
  { ats: 'greenhouse', slug: 'getaround', name: 'Getaround' },
  { ats: 'greenhouse', slug: 'stripe', name: 'Stripe' },
  { ats: 'greenhouse', slug: 'shopify', name: 'Shopify' },

  // Lever - Startups françaises
  { ats: 'lever', slug: 'alan', name: 'Alan' },
  { ats: 'lever', slug: 'spendesk', name: 'Spendesk' },
  { ats: 'lever', slug: 'swile', name: 'Swile' },
  { ats: 'lever', slug: 'payfit', name: 'PayFit' },
  { ats: 'lever', slug: 'pennylane', name: 'Pennylane' },
  { ats: 'lever', slug: 'luko', name: 'Luko' },
  { ats: 'lever', slug: 'doctrine', name: 'Doctrine' },
  { ats: 'lever', slug: 'side', name: 'Side' },
  { ats: 'lever', slug: 'shift-technology', name: 'Shift Technology' },
  { ats: 'lever', slug: 'lydia', name: 'Lydia' },
  { ats: 'lever', slug: 'yousign', name: 'Yousign' },
];

/**
 * Fetch jobs from Greenhouse API
 */
async function fetchGreenhouseJobs(companySlug, companyName) {
  try {
    const url = `https://boards-api.greenhouse.io/v1/boards/${companySlug}/jobs`;
    console.log(`[Greenhouse] Fetching jobs from ${companyName}...`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'AlternantTalentApp/1.0'
      }
    });

    if (!response.ok) {
      if (response.status !== 404) {
        console.log(`[Greenhouse] ${companyName}: ${response.status}`);
      }
      return [];
    }

    const data = await response.json();
    const jobs = [];

    for (const job of data.jobs || []) {
      // Filtrer pour alternance/apprentissage en France
      const title = job.title?.toLowerCase() || '';
      const location = job.location?.name?.toLowerCase() || '';

      const isAlternance = title.includes('alternance') ||
                          title.includes('apprentissage') ||
                          title.includes('apprenti') ||
                          title.includes('intern') ||
                          title.includes('stage');

      const isFrance = location.includes('france') ||
                       location.includes('paris') ||
                       location.includes('lyon') ||
                       location.includes('marseille') ||
                       location.includes('toulouse') ||
                       location.includes('nice') ||
                       location.includes('nantes') ||
                       location.includes('lille') ||
                       location.includes('bordeaux') ||
                       location.includes('rennes') ||
                       location.includes('strasbourg') ||
                       location.includes('montpellier') ||
                       location.includes('remote');

      // IMPORTANT: On garde SEULEMENT les offres qui sont alternance ET en France
      if (!isAlternance || !isFrance) continue;

      const id = await generateHash(`greenhouse-${job.id}`);
      const jobUrl = ensureGreenhouseJobUrl(job.absolute_url || job.external_url, companySlug, job.id);
      const domain = extractDomain(jobUrl) || `${companySlug}.com`;
      const logoUrl = domain ? buildFaviconUrl(domain) : null;

      jobs.push({
        id: `ats-gh-${id}`,
        title: job.title,
        company: companyName,
        location: job.location?.name || 'France',
        url: jobUrl,
        apply_url: jobUrl,
        posted: new Date(job.updated_at).toLocaleDateString('fr-FR'),
        source: 'ats-feeds',
        tags: ['Alternance', 'ATS'],
        logo_domain: domain,
        logo_url: logoUrl
      });
    }

    console.log(`[Greenhouse] ${companyName}: ${jobs.length} jobs`);
    return jobs;
  } catch (error) {
    console.error(`[Greenhouse] Error fetching ${companyName}:`, error.message);
    return [];
  }
}

/**
 * Fetch jobs from Lever API
 */
async function fetchLeverJobs(companySlug, companyName) {
  try {
    const url = `https://api.lever.co/v0/postings/${companySlug}`;
    console.log(`[Lever] Fetching jobs from ${companyName}...`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'AlternantTalentApp/1.0'
      }
    });

    if (!response.ok) {
      if (response.status !== 404) {
        console.log(`[Lever] ${companyName}: ${response.status}`);
      }
      return [];
    }

    const jobs_data = await response.json();
    const jobs = [];

    for (const job of jobs_data || []) {
      // Filtrer pour alternance/apprentissage en France
      const title = job.text?.toLowerCase() || '';
      const location = job.categories?.location?.toLowerCase() || '';

      const isAlternance = title.includes('alternance') ||
                          title.includes('apprentissage') ||
                          title.includes('apprenti') ||
                          title.includes('intern') ||
                          title.includes('stage');

      const isFrance = location.includes('france') ||
                       location.includes('paris') ||
                       location.includes('lyon') ||
                       location.includes('marseille') ||
                       location.includes('toulouse') ||
                       location.includes('nice') ||
                       location.includes('nantes') ||
                       location.includes('lille') ||
                       location.includes('bordeaux') ||
                       location.includes('rennes') ||
                       location.includes('strasbourg') ||
                       location.includes('montpellier') ||
                       location.includes('remote');

      // IMPORTANT: On garde SEULEMENT les offres qui sont alternance ET en France
      if (!isAlternance || !isFrance) continue;

      const id = await generateHash(`lever-${job.id}`);

      const domain = extractDomain(job.hostedUrl) || `${companySlug}.com`;
      const logoUrl = domain ? buildFaviconUrl(domain) : null;
      jobs.push({
        id: `ats-lv-${id}`,
        title: job.text,
        company: companyName,
        location: job.categories?.location || 'France',
        url: job.hostedUrl,
        apply_url: job.hostedUrl,
        posted: new Date(job.createdAt).toLocaleDateString('fr-FR'),
        source: 'ats-feeds',
        tags: ['Alternance', 'ATS'],
        logo_domain: domain,
        logo_url: logoUrl
      });
    }

    console.log(`[Lever] ${companyName}: ${jobs.length} jobs`);
    return jobs;
  } catch (error) {
    console.error(`[Lever] Error fetching ${companyName}:`, error.message);
    return [];
  }
}

/**
 * Main function to fetch all ATS jobs
 */
export async function fetchATSJobs({ query = '', location = '', limit = 100, env }) {
  console.log('[ATS Feeds] Fetching jobs from multiple ATS...');

  const allJobs = [];
  const companies = KNOWN_COMPANIES; // Toutes les entreprises

  // Traiter par batch pour éviter de surcharger
  const batchSize = 5;
  for (let i = 0; i < companies.length; i += batchSize) {
    const batch = companies.slice(i, i + batchSize);

    const batchPromises = batch.map(async ({ ats, slug, name }) => {
      if (ats === 'greenhouse') {
        return fetchGreenhouseJobs(slug, name);
      } else if (ats === 'lever') {
        return fetchLeverJobs(slug, name);
      }
      return [];
    });

    const batchResults = await Promise.all(batchPromises);

    for (const jobs of batchResults) {
      allJobs.push(...jobs);
    }

    // Petite pause entre les batches
    if (i + batchSize < companies.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log(`[ATS Feeds] Total: ${allJobs.length} jobs from ${companies.length} companies`);

  return allJobs.slice(0, limit);
}

function extractDomain(url) {
  if (!url) return null;
  try {
    const host = new URL(url).hostname;
    return host.replace(/^www\./, '');
  } catch {
    return null;
  }
}

function buildFaviconUrl(domain) {
  if (!domain) return null;
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

function ensureGreenhouseJobUrl(url, boardSlug, jobId) {
  const fallback = boardSlug && jobId ? `https://job-boards.greenhouse.io/${boardSlug}/jobs/${jobId}` : null;
  if (!url) return fallback;
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'boards.greenhouse.io') {
      parsed.hostname = 'job-boards.greenhouse.io';
      return parsed.toString();
    }
    if (parsed.hostname === 'job-boards.greenhouse.io') {
      return parsed.toString();
    }
  } catch {
    // ignore parsing errors
  }
  return fallback || url;
}
