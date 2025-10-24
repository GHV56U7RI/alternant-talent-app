#!/usr/bin/env node
// Test de l'API Jooble
import { readFileSync } from 'fs';

// Charger les variables d'environnement depuis .dev.vars
function loadEnv() {
  try {
    const content = readFileSync('.dev.vars', 'utf8');
    const env = {};
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [key, ...values] = trimmed.split('=');
      if (key && values.length) {
        env[key.trim()] = values.join('=').trim();
      }
    }
    return env;
  } catch (err) {
    console.error('❌ Erreur lors du chargement de .dev.vars:', err.message);
    process.exit(1);
  }
}

async function testJooble() {
  console.log('🔍 Test de l\'API Jooble\n');

  const env = loadEnv();
  const JOOBLE_KEY = env.JOOBLE_KEY;

  if (!JOOBLE_KEY) {
    console.error('❌ JOOBLE_KEY non trouvée dans .dev.vars');
    process.exit(1);
  }

  console.log('✓ Clé API trouvée:', JOOBLE_KEY.substring(0, 8) + '...');

  const url = `https://jooble.org/api/${encodeURIComponent(JOOBLE_KEY)}`;
  const body = {
    keywords: 'développeur web',
    location: 'Île-de-France',
    page: 1
  };

  console.log('📡 Requête:', JSON.stringify(body, null, 2));
  console.log('');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'alternant-talent-app/1.0'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      console.error(`❌ Erreur HTTP ${response.status}: ${response.statusText}`);
      const text = await response.text();
      console.error('Réponse:', text.substring(0, 200));
      process.exit(1);
    }

    const data = await response.json();
    const allJobs = data.jobs || [];

    // Filtrer pour ne garder que les annonces françaises
    const frenchCities = ['paris', 'lyon', 'marseille', 'toulouse', 'nice', 'nantes', 'strasbourg',
                          'montpellier', 'bordeaux', 'lille', 'rennes', 'reims', 'le havre',
                          'saint-étienne', 'toulon', 'grenoble', 'dijon', 'angers', 'nîmes', 'villeurbanne'];
    const usStates = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL',
                      'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT',
                      'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI',
                      'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'];

    const jobs = allJobs.filter(job => {
      const location = String(job.location || '');
      const locationLower = location.toLowerCase();

      // Exclure explicitement les USA (format: "City, ST" ou ", USA")
      if (/, (${usStates.join('|')})$/.test(location)) {
        return false;
      }
      if (locationLower.includes(', usa') || locationLower.includes('united states')) {
        return false;
      }

      // Inclure si mention explicite "France"
      if (locationLower.includes('france')) {
        return true;
      }

      // Inclure si ville française sans suffixe d'état US
      const hasUSState = usStates.some(state => location.endsWith(`, ${state}`));
      if (hasUSState) {
        return false;
      }

      return frenchCities.some(city => locationLower.includes(city));
    });

    console.log(`✅ API a retourné ${allJobs.length} annonces`);
    console.log(`   Filtrées pour la France: ${jobs.length} annonces\n`);

    if (jobs.length === 0) {
      console.log('⚠️  Aucune annonce française trouvée pour cette recherche');
      console.log('\n📋 Exemples de localisations reçues:');
      allJobs.slice(0, 5).forEach(job => {
        console.log(`   - ${job.location || '(non spécifié)'}`);
      });
      return;
    }

    console.log('📋 Aperçu des 3 premières annonces françaises:\n');
    jobs.slice(0, 3).forEach((job, index) => {
      console.log(`${index + 1}. ${job.title || '(sans titre)'}`);
      console.log(`   Entreprise: ${job.company || '(non spécifiée)'}`);
      console.log(`   Lieu: ${job.location || '(non spécifié)'}`);
      console.log(`   URL: ${job.link || '(non spécifiée)'}`);
      console.log(`   Date: ${job.updated || job.date || '(non spécifiée)'}`);
      console.log('');
    });

    console.log('✅ Test Jooble terminé avec succès!');

  } catch (err) {
    console.error('❌ Erreur lors de l\'appel API:', err.message);
    process.exit(1);
  }
}

testJooble();
