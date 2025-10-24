/**
 * La Bonne Alternance (LBA) API Source
 * API du gouvernement français pour l'alternance
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

    // Couverture nationale : 30 villes réparties dans toute la France
    const cities = [
      { name: 'Paris', lat: '48.8566', lon: '2.3522' },
      { name: 'Lyon', lat: '45.7640', lon: '4.8357' },
      { name: 'Marseille', lat: '43.2965', lon: '5.3698' },
      { name: 'Toulouse', lat: '43.6047', lon: '1.4442' },
      { name: 'Nantes', lat: '47.2184', lon: '-1.5536' },
      { name: 'Strasbourg', lat: '48.5734', lon: '7.7521' },
      { name: 'Bordeaux', lat: '44.8378', lon: '-0.5792' },
      { name: 'Lille', lat: '50.6292', lon: '3.0573' },
      { name: 'Rennes', lat: '48.1173', lon: '-1.6778' },
      { name: 'Grenoble', lat: '45.1885', lon: '5.7245' },
      { name: 'Dijon', lat: '47.3220', lon: '5.0415' },
      { name: 'Clermont-Ferrand', lat: '45.7772', lon: '3.0870' },
      { name: 'Brest', lat: '48.3904', lon: '-4.4861' },
      { name: 'Metz', lat: '49.1193', lon: '6.1757' },
      { name: 'Orléans', lat: '47.9029', lon: '1.9093' },
      { name: 'Nice', lat: '43.7102', lon: '7.2620' },
      { name: 'Montpellier', lat: '43.6108', lon: '3.8767' },
      { name: 'Reims', lat: '49.2583', lon: '4.0317' },
      { name: 'Tours', lat: '47.3941', lon: '0.6848' },
      { name: 'Angers', lat: '47.4784', lon: '-0.5632' },
      { name: 'Caen', lat: '49.1829', lon: '-0.3707' },
      { name: 'Rouen', lat: '49.4432', lon: '1.0993' },
      { name: 'Nancy', lat: '48.6921', lon: '6.1844' },
      { name: 'Amiens', lat: '49.8941', lon: '2.2958' },
      { name: 'Limoges', lat: '45.8336', lon: '1.2611' },
      { name: 'Besançon', lat: '47.2380', lon: '6.0243' },
      { name: 'Perpignan', lat: '42.6886', lon: '2.8948' },
      { name: 'Toulon', lat: '43.1242', lon: '5.9280' },
      { name: 'Le Havre', lat: '49.4944', lon: '0.1079' },
      { name: 'Ajaccio', lat: '41.9188', lon: '8.7386' }
    ];

    // Différents niveaux de diplôme
    const diplomas = [
      'Cap, autres formations niveau (Infrabac...)',
      'BP, Bac, autres formations (Bac)',
      'BTS, DEUST, autres formations (Bac+2)',
      'Licence, Maîtrise, autres formations (Bac+3 à Bac+4)',
      'Master, titre ingénieur, autres formations (Bac+5)'
    ];

    // Faire requêtes pour les 15 villes x 5 diplômes = 75 requêtes max
    const selectedCities = cities;
    const selectedDiplomas = diplomas;

    for (const city of selectedCities) {
      for (const diploma of selectedDiplomas) {
        const params = new URLSearchParams({
          latitude: city.lat,
          longitude: city.lon,
          radius: '200', // Très large rayon (200km) pour maximiser la couverture
          diploma: diploma,
          api: 'apiv1',
          caller: caller || 'alternant-talent',
          sources: 'offres',
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
            console.error(`LBA API error for ${city.name}: ${response.status}`);
            continue;
          }

          const data = await response.json();
          const results = data.jobs || data.results || [];

          allJobs.push(...results);
        } catch (err) {
          console.error(`LBA fetch error for ${city.name}:`, err.message);
        }
      }
    }

    // Dédupliquer par ID et limiter
    const uniqueJobs = Array.from(
      new Map(allJobs.map(job => {
        const jobId = job.identifier?.id || job.identifier?.partner_job_id;
        return [jobId, job];
      })).values()
    ).slice(0, limit);

    return uniqueJobs.map(job => {
      const jobId = job.identifier?.id || job.identifier?.partner_job_id || Math.random().toString();
      const randomStr = jobId.toString().replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
      const id = `lba-${randomStr}`;

      return {
        id,
        title: job.offer?.title || job.title || "Offre d'alternance",
        company: job.workplace?.name || job.workplace?.legal_name || 'Entreprise',
        location: formatLocation(job),
        posted: formatDate(job.contract?.start),
        tags: extractTags(job),
        url: job.apply?.url || '#',
        source: 'lba',
        logo_domain: extractDomain(job.workplace?.name || job.workplace?.legal_name),
        logo_url: null
      };
    });
  } catch (error) {
    console.error('Erreur LBA:', error.message);
    return [];
  }
}

function formatLocation(job) {
  if (job.workplace?.location?.address) {
    // Extract city from address like "8 RUE DE LA VEGA 75012 PARIS"
    const address = job.workplace.location.address;
    const parts = address.split(' ');
    // Usually the city is at the end
    if (parts.length > 0) {
      return parts[parts.length - 1];
    }
  }
  if (job.place?.city) return job.place.city;
  if (job.location) return job.location;
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
  if (job.contract?.type && Array.isArray(job.contract.type)) {
    tags.push(...job.contract.type);
  }
  if (job.offer?.target_diploma?.label) {
    tags.push(job.offer.target_diploma.label);
  }
  tags.push('alternance');
  return tags.slice(0, 3);
}

function extractDomain(company) {
  if (!company) return null;
  const normalized = company.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${normalized}.com`;
}
