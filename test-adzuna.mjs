#!/usr/bin/env node
// Test de l'API Adzuna
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

async function testAdzuna() {
  console.log('🔍 Test de l\'API Adzuna\n');

  const env = loadEnv();
  const ADZUNA_APP_ID = env.ADZUNA_APP_ID;
  const ADZUNA_APP_KEY = env.ADZUNA_APP_KEY;

  if (!ADZUNA_APP_ID || !ADZUNA_APP_KEY) {
    console.error('❌ ADZUNA_APP_ID ou ADZUNA_APP_KEY non trouvés dans .dev.vars');
    process.exit(1);
  }

  console.log('✓ App ID trouvé:', ADZUNA_APP_ID);
  console.log('✓ App Key trouvé:', ADZUNA_APP_KEY.substring(0, 8) + '...');

  const url = new URL('https://api.adzuna.com/v1/api/jobs/fr/search/1');
  url.searchParams.set('app_id', ADZUNA_APP_ID);
  url.searchParams.set('app_key', ADZUNA_APP_KEY);
  url.searchParams.set('what', 'alternance');
  url.searchParams.set('results_per_page', '10');
  url.searchParams.set('content-type', 'application/json');

  console.log('📡 URL:', url.toString().replace(ADZUNA_APP_KEY, '***'));
  console.log('');

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`❌ Erreur HTTP ${response.status}: ${response.statusText}`);
      const text = await response.text();
      console.error('Réponse:', text.substring(0, 200));
      process.exit(1);
    }

    const data = await response.json();
    const results = data.results || [];

    console.log(`✅ Succès! ${results.length} annonces reçues`);
    console.log(`   Total disponible: ${data.count || 'inconnu'}\n`);

    if (results.length === 0) {
      console.log('⚠️  Aucune annonce trouvée pour cette recherche');
      return;
    }

    console.log('📋 Aperçu des 3 premières annonces:\n');
    results.slice(0, 3).forEach((job, index) => {
      console.log(`${index + 1}. ${job.title || '(sans titre)'}`);
      console.log(`   Entreprise: ${job.company?.display_name || '(non spécifiée)'}`);
      console.log(`   Lieu: ${job.location?.display_name || '(non spécifié)'}`);
      console.log(`   URL: ${job.redirect_url || '(non spécifiée)'}`);
      console.log(`   Catégorie: ${job.category?.label || '(non spécifiée)'}`);
      console.log(`   Date: ${job.created || '(non spécifiée)'}`);
      console.log('');
    });

    console.log('✅ Test Adzuna terminé avec succès!');

  } catch (err) {
    console.error('❌ Erreur lors de l\'appel API:', err.message);
    process.exit(1);
  }
}

testAdzuna();
