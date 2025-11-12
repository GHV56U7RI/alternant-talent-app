import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'mistral';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Fonction pour appeler Ollama
async function callOllama(prompt) {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.1,
          top_p: 0.9
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status}`);
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Erreur Ollama:', error);
    throw error;
  }
}

// Fonction pour enrichir une seule offre
async function enrichJob(job) {
  const prompt = `Tu es un assistant qui analyse des offres d'alternance françaises.
Analyse cette offre et retourne UNIQUEMENT un JSON valide avec cette structure exacte :

{
  "niveau_etudes": "Bac+2" ou "Bac+3" ou "Bac+4" ou "Bac+5" ou "Non spécifié",
  "domaine": "catégorie précise ex: Développement web, Marketing digital, Commerce, Design",
  "competences": ["compétence 1", "compétence 2", "compétence 3"],
  "type_contrat": "Alternance" ou "Apprentissage" ou "Professionnalisation" ou "Non spécifié",
  "duree_estimee": "12 mois" ou "24 mois" ou "Non spécifié",
  "teletravail": true ou false,
  "salaire_estime": "800-1200€" ou null si non mentionné,
  "tags": ["tag1", "tag2", "tag3"]
}

Offre :
Titre: ${job.title || 'Non spécifié'}
Description: ${(job.description || '').substring(0, 1500)}
Localisation: ${job.location || 'Non spécifié'}
Entreprise: ${job.company || 'Non spécifié'}

IMPORTANT: Réponds UNIQUEMENT avec le JSON, sans texte avant ou après, sans markdown, sans backticks.`;

  try {
    const response = await callOllama(prompt);

    // Nettoyer la réponse (enlever backticks markdown si présents)
    let cleanedResponse = response.trim();
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/```\n?/g, '');
    }

    const enrichedData = JSON.parse(cleanedResponse);

    return {
      ...job,
      enriched: enrichedData,
      enriched_at: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Erreur enrichissement job ${job.id || 'unknown'}:`, error);

    // Retourner l'offre avec des données par défaut si l'enrichissement échoue
    return {
      ...job,
      enriched: {
        niveau_etudes: "Non spécifié",
        domaine: "Non classé",
        competences: [],
        type_contrat: "Alternance",
        duree_estimee: "Non spécifié",
        teletravail: false,
        salaire_estime: null,
        tags: []
      },
      enriched_at: new Date().toISOString(),
      enrichment_error: error.message
    };
  }
}

// Health check
app.get('/health', async (req, res) => {
  try {
    // Vérifier qu'Ollama est accessible
    const response = await fetch(`${OLLAMA_URL}/api/tags`);
    const ollamaOk = response.ok;

    res.json({
      status: 'ok',
      ollama: ollamaOk ? 'connected' : 'disconnected',
      model: OLLAMA_MODEL,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      ollama: 'disconnected',
      error: error.message
    });
  }
});

// Endpoint pour enrichir une seule offre
app.post('/enrich/single', async (req, res) => {
  try {
    const { job } = req.body;

    if (!job) {
      return res.status(400).json({ error: 'Job data required' });
    }

    const enriched = await enrichJob(job);
    res.json({ success: true, job: enriched });
  } catch (error) {
    console.error('Erreur /enrich/single:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint pour enrichir un lot d'offres
app.post('/enrich/batch', async (req, res) => {
  try {
    const { jobs } = req.body;

    if (!jobs || !Array.isArray(jobs)) {
      return res.status(400).json({ error: 'Jobs array required' });
    }

    console.log(`📦 Enrichissement de ${jobs.length} offres...`);

    const enrichedJobs = [];
    const delay = parseInt(process.env.ENRICH_DELAY || '500');

    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      console.log(`  [${i + 1}/${jobs.length}] ${job.title || 'Sans titre'}`);

      const enriched = await enrichJob(job);
      enrichedJobs.push(enriched);

      // Pause entre chaque enrichissement pour ne pas surcharger
      if (i < jobs.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    console.log(`✅ ${enrichedJobs.length} offres enrichies`);

    res.json({
      success: true,
      total: enrichedJobs.length,
      jobs: enrichedJobs
    });
  } catch (error) {
    console.error('Erreur /enrich/batch:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint pour tester Ollama
app.post('/test', async (req, res) => {
  try {
    const testJob = {
      id: 'test-123',
      title: 'Développeur Full Stack - Alternance',
      description: 'Nous recherchons un alternant Bac+4/5 pour rejoindre notre équipe tech. Vous travaillerez sur React, Node.js et PostgreSQL. Possibilité de télétravail 2 jours par semaine. Rémunération selon la grille légale.',
      location: 'Paris',
      company: 'TechCorp'
    };

    console.log('🧪 Test d\'enrichissement...');
    const enriched = await enrichJob(testJob);

    res.json({
      success: true,
      original: testJob,
      enriched: enriched.enriched
    });
  } catch (error) {
    console.error('Erreur /test:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`
🚀 Serveur d'enrichissement démarré
📍 Port: ${PORT}
🤖 Ollama: ${OLLAMA_URL}
🧠 Modèle: ${OLLAMA_MODEL}

Endpoints disponibles:
  GET  /health          - Vérifier le statut du service
  POST /test            - Tester l'enrichissement avec un exemple
  POST /enrich/single   - Enrichir une seule offre
  POST /enrich/batch    - Enrichir un lot d'offres
  `);
});
