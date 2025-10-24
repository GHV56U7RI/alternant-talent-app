#!/usr/bin/env node
// Test pour vérifier si les APIs retournent des descriptions

import 'dotenv/config';

const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID;
const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY;
const JOOBLE_KEY = process.env.JOOBLE_KEY;
const REMOTE_API_BASE = process.env.REMOTE_API_BASE;
const REMOTE_API_TOKEN = process.env.REMOTE_API_TOKEN;

console.log('🧪 Test des descriptions des APIs\n');

// 1. Test Adzuna
console.log('1️⃣ Test Adzuna API');
try {
  const url = new URL('https://api.adzuna.com/v1/api/jobs/fr/search/1');
  url.searchParams.set('app_id', ADZUNA_APP_ID);
  url.searchParams.set('app_key', ADZUNA_APP_KEY);
  url.searchParams.set('results_per_page', '1');
  url.searchParams.set('what', 'développeur');

  const response = await fetch(url.toString());
  const data = await response.json();

  if (data.results?.[0]) {
    const job = data.results[0];
    console.log('✅ Adzuna structure:');
    console.log('   - title:', job.title);
    console.log('   - description:', job.description ? `${job.description.substring(0, 100)}...` : 'NON DISPONIBLE');
    console.log('   - snippet:', job.__CLASS__ ? 'NON DISPONIBLE' : 'NON DISPONIBLE');
    console.log('   - Champs disponibles:', Object.keys(job).join(', '));
  }
} catch (err) {
  console.log('❌ Erreur Adzuna:', err.message);
}

console.log('\n2️⃣ Test Jooble API');
try {
  const response = await fetch(`https://jooble.org/api/${encodeURIComponent(JOOBLE_KEY)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keywords: 'développeur', location: 'France', page: 1 })
  });

  const data = await response.json();

  if (data.jobs?.[0]) {
    const job = data.jobs[0];
    console.log('✅ Jooble structure:');
    console.log('   - title:', job.title);
    console.log('   - description:', job.snippet ? `${job.snippet.substring(0, 100)}...` : 'NON DISPONIBLE');
    console.log('   - Champs disponibles:', Object.keys(job).join(', '));
  }
} catch (err) {
  console.log('❌ Erreur Jooble:', err.message);
}

console.log('\n3️⃣ Test La Bonne Alternance API');
try {
  const headers = { 'Accept': 'application/json' };
  if (REMOTE_API_TOKEN) headers['Authorization'] = `Bearer ${REMOTE_API_TOKEN}`;

  const response = await fetch(`${REMOTE_API_BASE}?limit=1`, { headers });
  const data = await response.json();

  const raw = Array.isArray(data) ? data : (data.jobs || data.items || []);

  if (raw[0]) {
    const job = raw[0];
    console.log('✅ LBA structure:');
    console.log('   - offer.title:', job.offer?.title);
    console.log('   - offer.description:', job.offer?.description ? `${job.offer.description.substring(0, 100)}...` : 'NON DISPONIBLE');
    console.log('   - contract.description:', job.contract?.description ? `${job.contract.description.substring(0, 100)}...` : 'NON DISPONIBLE');
    console.log('   - Champs disponibles:', Object.keys(job).join(', '));
    console.log('   - Champs offer:', job.offer ? Object.keys(job.offer).join(', ') : 'N/A');
  }
} catch (err) {
  console.log('❌ Erreur LBA:', err.message);
}

console.log('\n✅ Test terminé');
