/**
 * Proxy Node.js pour l'API France Travail (ex-Pôle Emploi)
 * Contourne les restrictions CORS de Cloudflare Workers
 */

import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

// Configuration
const FRANCE_TRAVAIL_API = 'https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search';
const CLIENT_ID = process.env.FRANCE_TRAVAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.FRANCE_TRAVAIL_CLIENT_SECRET;

// Middleware
app.use(cors());
app.use(express.json());

// Cache du token OAuth2
let cachedToken = null;
let tokenExpiry = 0;

/**
 * Obtenir un token OAuth2 depuis France Travail
 */
async function getAccessToken() {
  // Vérifier si le token en cache est encore valide
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('FRANCE_TRAVAIL_CLIENT_ID et CLIENT_SECRET requis');
  }

  try {
    const tokenUrl = 'https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=/partenaire';

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        scope: 'api_offresdemploiv2 o2dsoffre',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    cachedToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // 1 minute de marge

    console.log('✅ Token OAuth2 obtenu, expire dans', data.expires_in, 'secondes');

    return cachedToken;
  } catch (error) {
    console.error('❌ Erreur obtention token:', error.message);
    throw error;
  }
}

/**
 * Endpoint de santé
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'france-travail-proxy',
    timestamp: new Date().toISOString(),
    hasCredentials: !!(CLIENT_ID && CLIENT_SECRET),
  });
});

/**
 * Endpoint principal : récupérer les offres d'emploi
 */
app.get('/api/jobs', async (req, res) => {
  try {
    const { query = '', location = '', limit = '500' } = req.query;

    console.log(`📡 Recherche France Travail: query="${query}", location="${location}", limit=${limit}`);

    // Obtenir le token OAuth2
    const token = await getAccessToken();

    // Préparer les paramètres de recherche
    const params = new URLSearchParams({
      motsCles: query || 'alternance',
      typeContrat: 'E2,FS', // E2=Alternance, FS=Contrat professionnalisation
      range: `0-${Math.min(parseInt(limit) - 1, 149)}`, // Max 150 résultats par requête
    });

    if (location) {
      params.append('commune', location);
    }

    // Appeler l'API France Travail
    const apiUrl = `${FRANCE_TRAVAIL_API}?${params.toString()}`;

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ France Travail API error: ${response.status}`, errorText);
      return res.status(response.status).json({
        success: false,
        error: `France Travail API returned ${response.status}`,
        details: errorText,
      });
    }

    const data = await response.json();

    // Transformer les résultats au format attendu
    const jobs = (data.resultats || []).map(job => ({
      id: `francetravail-${job.id}`,
      title: job.intitule || 'Sans titre',
      company: job.entreprise?.nom || 'Entreprise non spécifiée',
      location: job.lieuTravail?.libelle || 'France',
      tags: ['alternance', ...(job.competences?.map(c => c.libelle.toLowerCase()) || [])],
      url: job.origineOffre?.urlOrigine || `https://candidat.francetravail.fr/offres/recherche/detail/${job.id}`,
      source: 'france-travail',
      posted: formatDate(job.dateCreation),
      description: job.description || '',
      logo_domain: job.entreprise?.nom ? extractDomain(job.entreprise.nom) : null,
      logo_url: null,
    }));

    console.log(`✅ France Travail: ${jobs.length} offres trouvées`);

    res.json({
      success: true,
      count: jobs.length,
      jobs: jobs,
    });

  } catch (error) {
    console.error('❌ Erreur proxy France Travail:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Formater la date de publication
 */
function formatDate(dateString) {
  if (!dateString) return 'récent';

  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'aujourd\'hui';
  if (diffDays === 1) return 'hier';
  if (diffDays < 7) return `il y a ${diffDays} jours`;
  if (diffDays < 30) return `il y a ${Math.floor(diffDays / 7)} semaines`;
  return 'il y a plus d\'un mois';
}

/**
 * Extraire le domaine d'une entreprise pour le logo
 */
function extractDomain(companyName) {
  const normalized = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${normalized}.com`;
}

/**
 * Démarrer le serveur
 */
app.listen(PORT, () => {
  console.log(`🚀 Proxy France Travail démarré sur le port ${PORT}`);
  console.log(`📡 API: ${FRANCE_TRAVAIL_API}`);
  console.log(`🔑 Credentials: ${CLIENT_ID ? '✅' : '❌'} CLIENT_ID, ${CLIENT_SECRET ? '✅' : '❌'} CLIENT_SECRET`);
  console.log(`\n📝 Endpoints disponibles:`);
  console.log(`   GET  http://localhost:${PORT}/health`);
  console.log(`   GET  http://localhost:${PORT}/api/jobs?query=alternance&limit=100`);
});
