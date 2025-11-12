#!/usr/bin/env node

/**
 * Script de migration pour enrichir les offres existantes
 *
 * Usage:
 * node scripts/migrate-enrich.js [options]
 *
 * Options:
 *   --source <source>    Source des offres: 'local' (fichier), 'kv' (Cloudflare), 'api' (Adzuna)
 *   --input <file>       Fichier JSON d'entrée (si source=local)
 *   --output <file>      Fichier JSON de sortie
 *   --limit <number>     Nombre max d'offres à enrichir
 *   --service <url>      URL du service d'enrichissement (défaut: http://localhost:3001)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parser les arguments
const args = process.argv.slice(2);
const options = {
  source: 'local',
  input: path.join(__dirname, '../seed.json'),
  output: path.join(__dirname, '../seed-enriched.json'),
  limit: 100,
  service: 'http://localhost:3001'
};

for (let i = 0; i < args.length; i += 2) {
  const key = args[i].replace('--', '');
  const value = args[i + 1];
  if (key === 'limit') {
    options[key] = parseInt(value);
  } else {
    options[key] = value;
  }
}

console.log('🔧 Configuration:', options);

// Fonction principale
async function main() {
  try {
    // 1. Vérifier que le service d'enrichissement est accessible
    console.log('\n🔍 Vérification du service d\'enrichissement...');
    const healthCheck = await fetch(`${options.service}/health`);

    if (!healthCheck.ok) {
      throw new Error(`Service d'enrichissement non accessible: ${options.service}`);
    }

    const health = await healthCheck.json();
    console.log('✅ Service OK:', health);

    if (health.ollama !== 'connected') {
      throw new Error('Ollama n\'est pas connecté. Démarrez Ollama avec: ollama serve');
    }

    // 2. Charger les offres selon la source
    console.log(`\n📦 Chargement des offres depuis: ${options.source}`);
    let jobs = [];

    if (options.source === 'local') {
      if (!fs.existsSync(options.input)) {
        throw new Error(`Fichier non trouvé: ${options.input}`);
      }

      const data = JSON.parse(fs.readFileSync(options.input, 'utf8'));
      jobs = data.jobs || data;

      console.log(`   Fichier: ${options.input}`);
      console.log(`   Offres trouvées: ${jobs.length}`);

    } else if (options.source === 'kv') {
      // Pour KV, vous devrez utiliser l'API Cloudflare
      console.error('❌ Source KV non implémentée dans ce script');
      console.log('💡 Utilisez plutôt l\'endpoint /api/enrich de votre application');
      process.exit(1);

    } else if (options.source === 'api') {
      console.error('❌ Source API non implémentée dans ce script');
      console.log('💡 Utilisez plutôt l\'endpoint /api/enrich de votre application');
      process.exit(1);
    }

    // Limiter le nombre d'offres
    if (options.limit && jobs.length > options.limit) {
      console.log(`⚠️  Limitation à ${options.limit} offres`);
      jobs = jobs.slice(0, options.limit);
    }

    // 3. Enrichir les offres
    console.log(`\n🤖 Enrichissement de ${jobs.length} offres...`);
    console.log('⏱️  Cela peut prendre quelques minutes...\n');

    const startTime = Date.now();

    const response = await fetch(`${options.service}/enrich/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ jobs })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur enrichissement: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const enrichedJobs = result.jobs;

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    const avgTime = (duration / enrichedJobs.length).toFixed(1);

    console.log(`\n✅ Enrichissement terminé!`);
    console.log(`   Offres enrichies: ${enrichedJobs.length}`);
    console.log(`   Durée totale: ${duration}s`);
    console.log(`   Temps moyen: ${avgTime}s/offre`);

    // 4. Calculer des statistiques
    const stats = {
      total: enrichedJobs.length,
      by_domain: {},
      by_level: {},
      with_teletravail: 0,
      with_salary: 0
    };

    enrichedJobs.forEach(job => {
      if (job.enriched) {
        const domain = job.enriched.domaine || 'Non classé';
        const level = job.enriched.niveau_etudes || 'Non spécifié';

        stats.by_domain[domain] = (stats.by_domain[domain] || 0) + 1;
        stats.by_level[level] = (stats.by_level[level] || 0) + 1;

        if (job.enriched.teletravail) stats.with_teletravail++;
        if (job.enriched.salaire_estime) stats.with_salary++;
      }
    });

    // 5. Sauvegarder le résultat
    const outputData = {
      jobs: enrichedJobs,
      metadata: {
        enriched_at: new Date().toISOString(),
        source: options.source,
        total_count: enrichedJobs.length,
        enrichment_service: options.service,
        statistics: stats
      }
    };

    fs.writeFileSync(options.output, JSON.stringify(outputData, null, 2));
    console.log(`\n💾 Résultats sauvegardés: ${options.output}`);

    // 6. Afficher les statistiques
    console.log('\n📊 Statistiques:');
    console.log(`   Avec télétravail: ${stats.with_teletravail}`);
    console.log(`   Avec salaire: ${stats.with_salary}`);
    console.log('\n   Par domaine:');
    Object.entries(stats.by_domain)
      .sort((a, b) => b[1] - a[1])
      .forEach(([domain, count]) => {
        console.log(`     ${domain}: ${count}`);
      });
    console.log('\n   Par niveau:');
    Object.entries(stats.by_level)
      .sort((a, b) => b[1] - a[1])
      .forEach(([level, count]) => {
        console.log(`     ${level}: ${count}`);
      });

    // 7. Afficher un exemple
    console.log('\n📄 Exemple d\'offre enrichie:');
    const sample = enrichedJobs[0];
    console.log(JSON.stringify({
      title: sample.title,
      location: sample.location,
      enriched: sample.enriched
    }, null, 2));

    console.log('\n🎉 Migration terminée avec succès!');

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    process.exit(1);
  }
}

// Lancer le script
main();
