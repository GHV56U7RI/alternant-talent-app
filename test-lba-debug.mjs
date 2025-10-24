#!/usr/bin/env node
// Debug détaillé de l'API La Bonne Alternance
import { readFileSync, writeFileSync } from 'fs';

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

async function debugLBA() {
  console.log('🔍 Debug détaillé de l\'API La Bonne Alternance\n');

  const env = loadEnv();
  const REMOTE_API_BASE = env.REMOTE_API_BASE;
  const REMOTE_API_TOKEN = env.REMOTE_API_TOKEN;
  const REMOTE_API_CALLER = env.REMOTE_API_CALLER;

  const url = REMOTE_API_BASE.replace(/\/+$/, '');

  console.log('📡 URL:', url);
  console.log('');

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

    console.log(`Status: ${response.status} ${response.statusText}\n`);

    if (!response.ok) {
      const text = await response.text();
      console.error('❌ Erreur:', text.substring(0, 500));
      process.exit(1);
    }

    const data = await response.json();

    // Sauvegarder la réponse complète
    writeFileSync('lba-response-sample.json', JSON.stringify(data, null, 2));
    console.log('✅ Réponse complète sauvegardée dans: lba-response-sample.json\n');

    // Analyser la structure
    console.log('📊 Structure de la réponse:');
    console.log('  Type:', Array.isArray(data) ? 'Array' : 'Object');

    if (Array.isArray(data)) {
      console.log('  Nombre d\'éléments:', data.length);
      if (data.length > 0) {
        console.log('\n🔑 Clés du premier élément:');
        console.log('  ', Object.keys(data[0]).join(', '));
      }
    } else {
      console.log('  Clés racine:', Object.keys(data).join(', '));

      // Chercher un tableau dans la structure
      for (const key of Object.keys(data)) {
        if (Array.isArray(data[key])) {
          console.log(`  "${key}" est un tableau de ${data[key].length} éléments`);
          if (data[key].length > 0) {
            console.log(`  Clés du premier élément de "${key}":`, Object.keys(data[key][0]).join(', '));
          }
        }
      }
    }

    // Extraire le tableau de jobs
    const jobs = Array.isArray(data)
      ? data
      : (Array.isArray(data.jobs)
        ? data.jobs
        : (Array.isArray(data.items)
          ? data.items
          : (Array.isArray(data.results)
            ? data.results
            : [])));

    if (jobs.length === 0) {
      console.log('\n⚠️  Aucune annonce trouvée dans la structure');
      return;
    }

    console.log(`\n✅ ${jobs.length} annonces trouvées\n`);

    // Analyser les 3 premiers jobs en détail
    console.log('📋 Analyse détaillée des 3 premières annonces:\n');
    console.log('═'.repeat(80));

    jobs.slice(0, 3).forEach((job, index) => {
      console.log(`\n🔹 Annonce #${index + 1}:`);
      console.log('─'.repeat(80));

      // Afficher toutes les clés et valeurs
      const keys = Object.keys(job);
      console.log(`Nombre de champs: ${keys.length}\n`);

      // Regrouper par type
      const stringFields = [];
      const objectFields = [];
      const arrayFields = [];
      const otherFields = [];

      for (const key of keys) {
        const value = job[key];
        const type = Array.isArray(value) ? 'array' : typeof value;

        if (type === 'string' && value) {
          stringFields.push({ key, value: String(value).substring(0, 60) });
        } else if (type === 'object' && value !== null) {
          objectFields.push({ key, keys: Object.keys(value) });
        } else if (type === 'array') {
          arrayFields.push({ key, length: value.length });
        } else if (value) {
          otherFields.push({ key, value, type });
        }
      }

      if (stringFields.length > 0) {
        console.log('📝 Champs texte:');
        stringFields.forEach(({ key, value }) => {
          console.log(`  ${key}: "${value}${value.length > 60 ? '...' : ''}"`);
        });
        console.log('');
      }

      if (objectFields.length > 0) {
        console.log('📦 Objets imbriqués:');
        objectFields.forEach(({ key, keys }) => {
          console.log(`  ${key}: { ${keys.join(', ')} }`);
          // Afficher les valeurs de l'objet
          const obj = job[key];
          keys.forEach(k => {
            const val = obj[k];
            if (val && typeof val === 'string') {
              console.log(`    ↳ ${k}: "${String(val).substring(0, 50)}"`);
            } else if (val && typeof val === 'object' && !Array.isArray(val)) {
              console.log(`    ↳ ${k}: { ${Object.keys(val).join(', ')} }`);
            }
          });
        });
        console.log('');
      }

      if (arrayFields.length > 0) {
        console.log('📚 Tableaux:');
        arrayFields.forEach(({ key, length }) => {
          console.log(`  ${key}: [${length} éléments]`);
        });
        console.log('');
      }

      if (otherFields.length > 0) {
        console.log('🔢 Autres champs:');
        otherFields.forEach(({ key, value, type }) => {
          console.log(`  ${key} (${type}): ${value}`);
        });
        console.log('');
      }
    });

    console.log('═'.repeat(80));
    console.log('\n✅ Analyse terminée ! Consultez lba-response-sample.json pour la réponse complète.');

  } catch (err) {
    console.error('❌ Erreur lors de l\'appel API:', err.message);
    process.exit(1);
  }
}

debugLBA();
