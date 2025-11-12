/**
 * La Bonne Alternance (LBA) API Source
 * API du gouvernement français pour l'alternance
 *
 * Utilise les codes ROME (Répertoire Opérationnel des Métiers et des Emplois)
 * et les codes INSEE des villes
 */

export async function fetchLBAJobs({ query = '', location = '', limit = 20, env }) {
  const apiBase = env.REMOTE_API_BASE;
  const apiToken = env.REMOTE_API_TOKEN;
  const caller = env.REMOTE_API_CALLER;

  if (!apiBase || !apiToken) {
    console.warn('LBA: Configuration API manquante');
    return [];
  }

  try {
    const allJobs = [];

    // Codes ROME pour l'alternance (principalement tech, commerce, gestion)
    const romeCodes = [
      'M1805', // Études et développement informatique
      'M1806', // Conseil et maîtrise d'ouvrage en systèmes d'information
      'M1810', // Production et exploitation de systèmes d'information
      'M1704', // Management de la relation client et après-vente
      'M1703', // Management et gestion de produit
      'D1406', // Management en force de vente
      'M1705', // Marketing
      'M1203', // Comptabilité
      'M1206', // Management de groupe ou de service comptable
      'M1402', // Conseil en organisation et management d'entreprise
      'M1403', // Études et prospectives socio-économiques
      'K2111', // Formation professionnelle
      'E1103', // Communication
      'E1104', // Conception de contenus multimédias
      'I1401', // Maintenance informatique et bureautique
    ];

    // 20 grandes villes avec leurs codes INSEE
    const cities = [
      { name: 'Paris', insee: '75056' },
      { name: 'Lyon', insee: '69123' },
      { name: 'Marseille', insee: '13055' },
      { name: 'Toulouse', insee: '31555' },
      { name: 'Nice', insee: '06088' },
      { name: 'Nantes', insee: '44109' },
      { name: 'Strasbourg', insee: '67482' },
      { name: 'Montpellier', insee: '34172' },
      { name: 'Bordeaux', insee: '33063' },
      { name: 'Lille', insee: '59350' },
      { name: 'Rennes', insee: '35238' },
      { name: 'Reims', insee: '51454' },
      { name: 'Saint-Étienne', insee: '42218' },
      { name: 'Le Havre', insee: '76351' },
      { name: 'Toulon', insee: '83137' },
      { name: 'Grenoble', insee: '38185' },
      { name: 'Dijon', insee: '21231' },
      { name: 'Angers', insee: '49007' },
      { name: 'Nîmes', insee: '30189' },
      { name: 'Villeurbanne', insee: '69266' },
    ];

    // Faire requêtes pour 20 villes x 3 codes ROME = 60 requêtes (réduit pour éviter rate limiting)
    const selectedCities = cities;
    const selectedRomeCodes = romeCodes.slice(0, 3); // Prendre seulement 3 codes ROME pour commencer

    for (const city of selectedCities) {
      for (const romeCode of selectedRomeCodes) {
        const params = new URLSearchParams({
          romes: romeCode,
          insee: city.insee,
          radius: '30', // 30km autour de la ville
          api: 'apiv1',
          caller: caller || 'alternant-talent',
          sources: 'offres', // Offres d'emploi seulement
        });

        const url = `${apiBase}?${params.toString()}`;

        try {
          const response = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${apiToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            if (response.status !== 404) { // 404 = pas de résultats, c'est normal
              console.error(`LBA API error for ${city.name} (${romeCode}): ${response.status}`);
            }
            continue;
          }

          const data = await response.json();
          // Structure: { peJobs: { results: [...] }, partnerJobs: [...] }
          const peResults = (data.peJobs && data.peJobs.results) || [];
          const partnerResults = data.partnerJobs || [];

          allJobs.push(...peResults, ...partnerResults);
        } catch (err) {
          console.error(`LBA fetch error for ${city.name} (${romeCode}):`, err.message);
        }
      }
    }

    console.log(`LBA: Total ${allJobs.length} jobs récupérés`);

    // Dédupliquer par ID et limiter
    const uniqueJobs = Array.from(
      new Map(allJobs.map(job => {
        const jobId = job.id || Math.random().toString();
        return [jobId, job];
      })).values()
    ).slice(0, limit);

    return uniqueJobs.map(job => {
      const jobId = job.id || Math.random().toString();
      const randomStr = jobId.toString().replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
      const id = `lba-${randomStr}`;

      // Extract company name from description or use default
      const companyMatch = job.company?.description?.match(/^([^\n.!?]{5,100})/);
      const companyName = companyMatch ? companyMatch[1].trim() : 'Entreprise';

      return {
        id,
        title: job.title || "Offre d'alternance",
        company: companyName,
        location: job.place?.city || job.place?.fullAddress || 'France',
        posted: formatDate(job.job?.creationDate),
        tags: extractTags(job),
        url: job.url || '#',
        source: 'lba',
        logo_domain: extractDomain(companyName),
        logo_url: null,
        description: job.job?.description || ''
      };
    });
  } catch (error) {
    console.error('Erreur LBA:', error.message);
    return [];
  }
}

function formatLocation(job) {
  if (job.place?.city) return job.place.city;
  if (job.place?.fullAddress) return job.place.fullAddress;
  return 'France';
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

function extractTags(job) {
  const tags = [];

  // Job types (Apprentissage, Contrat de professionnalisation, etc.)
  if (job.job?.type && Array.isArray(job.job.type)) {
    tags.push(...job.job.type.map(t => t.toLowerCase()));
  }

  // Contract type
  if (job.job?.contractType) {
    tags.push(job.job.contractType.toLowerCase());
  }

  tags.push('alternance');
  return [...new Set(tags)].slice(0, 4); // Remove duplicates and limit to 4
}

function extractDomain(company) {
  if (!company) return null;
  const normalized = company.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${normalized}.com`;
}
