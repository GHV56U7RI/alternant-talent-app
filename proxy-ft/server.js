import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Cache pour le token OAuth2
let tokenCache = {
  token: null,
  expiresAt: 0
};

// Fonction pour obtenir un token d'accès
async function getAccessToken() {
  const clientId = process.env.FRANCE_TRAVAIL_CLIENT_ID;
  const clientSecret = process.env.FRANCE_TRAVAIL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('FRANCE_TRAVAIL_CLIENT_ID ou FRANCE_TRAVAIL_CLIENT_SECRET non définis');
  }

  // Vérifier si le token en cache est encore valide
  if (tokenCache.token && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  const scope = `application_${clientId} api_offresdemploiv2 o2dsoffre`;
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
    scope: scope,
  }).toString();

  console.log('🔐 Authentification France Travail...');

  const response = await fetch(
    'https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'AlternanceTalent/1.0 (+https://alternant-talent.app)',
        'Accept': 'application/json',
      },
      body,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`France Travail auth error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const expiresIn = data.expires_in || 3600;

  // Mettre en cache le token (avec 5 minutes de marge)
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (expiresIn - 300) * 1000
  };

  console.log('✅ Token obtenu, valide pour', expiresIn, 'secondes');

  return tokenCache.token;
}

// Fonction pour formater la localisation
function formatLocation(lieuTravail) {
  if (!lieuTravail) return 'France';
  const parts = [];
  if (lieuTravail.libelle) parts.push(lieuTravail.libelle);
  if (lieuTravail.codePostal) parts.push(lieuTravail.codePostal);
  return parts.join(', ') || 'France';
}

// Fonction pour formater la date
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

// Fonction pour extraire les tags
function extractTags(offre) {
  const tags = [];
  if (offre.typeContrat) {
    tags.push(offre.typeContrat.toLowerCase());
  }
  const text = `${offre.intitule} ${offre.description || ''}`.toLowerCase();
  if (text.includes('alternance')) tags.push('alternance');
  if (text.includes('apprentissage')) tags.push('apprentissage');
  if (offre.experienceLibelle) {
    tags.push(offre.experienceLibelle.toLowerCase());
  }
  return tags.slice(0, 5);
}

// Fonction pour extraire le domaine
function extractDomain(company) {
  if (!company) return null;
  const normalized = company.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${normalized}.fr`;
}

// Endpoint principal pour récupérer les jobs
app.get('/api/jobs', async (req, res) => {
  try {
    const query = req.query.query || '';
    const location = req.query.location || '';
    const limit = Math.min(parseInt(req.query.limit || '150', 10), 150);

    console.log('📥 Requête reçue:', { query, location, limit });

    // Obtenir le token d'accès
    const accessToken = await getAccessToken();

    const allOffres = [];

    // Recherche simple avec le mot-clé "alternance" et pagination
    console.log('🔍 Recherche France Travail avec pagination...');

    // 2 pages de 150 résultats pour maximiser la couverture
    const pages = [
      { start: 0, end: 149 },    // Page 1
      { start: 150, end: 299 }   // Page 2
    ];

    for (const page of pages) {
      const params = new URLSearchParams({
        range: `${page.start}-${page.end}`,
        sort: '2', // Tri par date
        motsCles: 'alternance',
      });

      try {
        const response = await fetch(
          `https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search?${params}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const offres = data.resultats || [];
          console.log(`  📥 ${offres.length} offres (${page.start}-${page.end})`);
          allOffres.push(...offres);
        } else {
          console.error(`  ❌ Erreur ${response.status} (${page.start}-${page.end})`);
        }
      } catch (err) {
        console.error(`  ❌ Erreur fetch (${page.start}-${page.end}):`, err.message);
      }
    }

    // Dédupliquer par ID
    const uniqueOffres = Array.from(
      new Map(allOffres.map(offre => [offre.id, offre])).values()
    ).slice(0, limit);

    console.log(`✅ ${uniqueOffres.length} offres uniques trouvées (${allOffres.length} total avant déduplication)`);

    // Formater les résultats
    const jobs = uniqueOffres.map(offre => ({
      id: `francetravail-${offre.id}`,
      title: offre.intitule || 'Sans titre',
      company: offre.entreprise?.nom || 'Entreprise non spécifiée',
      location: formatLocation(offre.lieuTravail),
      posted: formatDate(offre.dateCreation),
      tags: extractTags(offre),
      url: offre.origineOffre?.urlOrigine || `https://candidat.francetravail.fr/offres/recherche/detail/${offre.id}`,
      source: 'francetravail',
      logo_domain: extractDomain(offre.entreprise?.nom),
      logo_url: null,
    }));

    res.json({
      success: true,
      count: jobs.length,
      jobs
    });
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      count: 0,
      jobs: []
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'france-travail-proxy' });
});

app.listen(PORT, () => {
  console.log(`🚀 Proxy France Travail démarré sur http://localhost:${PORT}`);
  console.log(`📍 Endpoint: http://localhost:${PORT}/api/jobs`);
});
