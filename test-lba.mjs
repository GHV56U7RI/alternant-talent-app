#!/usr/bin/env node
// Test de l'API La Bonne Alternance (apprentissage.beta.gouv.fr)
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

async function testLaBonneAlternance() {
  console.log('🔍 Test de l\'API La Bonne Alternance\n');

  const env = loadEnv();
  const REMOTE_API_BASE = env.REMOTE_API_BASE;
  const REMOTE_API_TOKEN = env.REMOTE_API_TOKEN;
  const REMOTE_API_CALLER = env.REMOTE_API_CALLER;

  if (!REMOTE_API_BASE) {
    console.error('❌ REMOTE_API_BASE non trouvée dans .dev.vars');
    process.exit(1);
  }

  console.log('✓ API Base URL:', REMOTE_API_BASE);
  console.log('✓ Caller:', REMOTE_API_CALLER || '(non spécifié)');
  console.log('✓ Token JWT:', REMOTE_API_TOKEN ? REMOTE_API_TOKEN.substring(0, 20) + '...' : '(non spécifié)');

  // Tester plusieurs endpoints possibles
  const endpoints = [
    REMOTE_API_BASE.replace(/\/+$/, ''),
    `${REMOTE_API_BASE.replace(/\/+$/, '')}?limit=10`,
    REMOTE_API_BASE.replace(/\/search$/, '').replace(/\/+$/, '') + '/search?limit=10'
  ];

  console.log('\n📡 Test des endpoints...\n');

  for (const [index, url] of endpoints.entries()) {
    console.log(`${index + 1}. Tentative: ${url}`);

    try {
      const headers = {
        'Accept': 'application/json'
      };

      if (REMOTE_API_TOKEN) {
        headers['Authorization'] = `Bearer ${REMOTE_API_TOKEN}`;
      }
      if (REMOTE_API_CALLER) {
        headers['x-caller'] = REMOTE_API_CALLER;
      }

      const response = await fetch(url, { headers });

      console.log(`   Status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const text = await response.text();
        console.log(`   Réponse: ${text.substring(0, 150)}...`);
        console.log('');
        continue;
      }

      const data = await response.json();

      // Détecter le format des données
      const rawJobs = Array.isArray(data)
        ? data
        : (Array.isArray(data.jobs)
          ? data.jobs
          : (Array.isArray(data.items)
            ? data.items
            : (Array.isArray(data.results)
              ? data.results
              : [])));

      console.log(`   ✅ Succès! ${rawJobs.length} annonces brutes reçues`);

      if (rawJobs.length === 0) {
        console.log('   ⚠️  Aucune annonce dans la réponse');
        console.log('   Structure:', Object.keys(data).join(', '));
        console.log('');
        continue;
      }

      // Mapper la structure LBA spécifique
      const jobs = rawJobs.map(r => {
        // Structure LBA: { identifier, workplace, apply, contract, offer }
        if (r.offer && r.workplace) {
          const address = String(r.workplace?.location?.address || "");
          const addressParts = address.split(' ');
          const city = addressParts[addressParts.length - 1] || "";

          return {
            id: r.identifier?.id || r.identifier?.partner_job_id || '(sans id)',
            title: r.offer?.title || '(sans titre)',
            company: r.workplace?.name || r.workplace?.legal_name || '(non spécifiée)',
            location: city || address,
            url: r.apply?.url || '(non spécifiée)',
            posted: r.offer?.publication?.creation || r.contract?.start || '(non spécifiée)'
          };
        }
        // Fallback ancien format
        return {
          id: r.id || '(sans id)',
          title: r.title || r.intitule || r.name || '(sans titre)',
          company: r.company || r.company_name || r.workplace?.name || '(non spécifiée)',
          location: r.location?.display_name || r.location || r.city || r.workplace?.city || '(non spécifié)',
          url: r.url || r.link || r.apply_url || '(non spécifiée)',
          posted: r.created || r.posted_at || r.date || '(non spécifiée)'
        };
      });

      console.log(`   Mappées: ${jobs.length} annonces\n`);

      console.log('\n📋 Aperçu des 3 premières annonces:\n');
      jobs.slice(0, 3).forEach((job, idx) => {
        console.log(`${idx + 1}. ${job.title}`);
        console.log(`   Entreprise: ${job.company}`);
        console.log(`   Lieu: ${job.location}`);
        console.log(`   URL: ${job.url.substring(0, 60)}...`);
        console.log(`   Date: ${job.posted}`);
        console.log('');
      });

      console.log('✅ Test La Bonne Alternance terminé avec succès!');
      return;

    } catch (err) {
      console.log(`   ❌ Erreur: ${err.message}`);
      console.log('');
    }
  }

  console.log('❌ Aucun endpoint n\'a fonctionné. Vérifiez:');
  console.log('   - L\'URL de base REMOTE_API_BASE');
  console.log('   - Le token JWT REMOTE_API_TOKEN (expiration?)');
  console.log('   - La disponibilité de l\'API externe');
  process.exit(1);
}

testLaBonneAlternance();
