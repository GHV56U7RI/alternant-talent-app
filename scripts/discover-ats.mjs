import fs from 'fs/promises';
import path from 'path';

async function discover() {
  console.log("🔍 Découverte AVANCÉE des IDs ATS...");

  const jsonPath = path.resolve('sources/companies-large.json');
  let companies = [];
  try {
    const content = await fs.readFile(jsonPath, 'utf-8');
    companies = JSON.parse(content);
  } catch (e) {
    console.error("❌ Impossible de lire companies-large.json");
    return;
  }

  // Liste des entreprises qui posaient problème
  const targets = [
    "Back Market", "Aircall", "Alan", "PayFit", "OpenClassrooms",
    "Thales", "Sanofi", "Danone", "Pernod Ricard", "PwC",
    "Swile", "Ledger", "Voodoo", "Malt"
  ];

  const results = [];

  for (const company of companies) {
    if (!targets.includes(company.name)) continue;

    console.log(`\n🔎 Analyse de ${company.name}...`);

    // Tentative 1: Analyse de la page carrière (déjà fait, mais on garde pour référence)
    // On passe direct au Brute Force sur les API pour gagner du temps

    const slug = slugify(company.name);
    const candidates = [slug, slug.replace(/-/g, ''), slug + 'hq', slug + 'jobs'];

    let found = null;

    // Test LEVER
    for (const id of candidates) {
      if (found) break;
      const url = `https://api.lever.co/v0/postings/${id}?mode=json`;
      if (await checkUrl(url)) {
        console.log(`   ✅ Lever trouvé: "${id}"`);
        found = { type: 'lever', id };
      }
    }

    // Test GREENHOUSE
    if (!found) {
      for (const id of candidates) {
        if (found) break;
        const url = `https://boards-api.greenhouse.io/v1/boards/${id}/jobs`;
        if (await checkUrl(url)) {
          console.log(`   ✅ Greenhouse trouvé: "${id}"`);
          found = { type: 'greenhouse', id };
        }
      }
    }

    // Test SMARTRECRUITERS
    if (!found) {
      for (const id of candidates) {
        if (found) break;
        const url = `https://api.smartrecruiters.com/v1/companies/${id}/postings`;
        if (await checkUrl(url)) {
          console.log(`   ✅ SmartRecruiters trouvé: "${id}"`);
          found = { type: 'smart', id };
        }
      }
    }

    // Test WELCOME TO THE JUNGLE (API cachée via Algolia souvent, plus dur à tester simple fetch)
    // On skip WTTJ pour ce script simple

    if (found) {
      results.push({ name: company.name, ...found });
    } else {
      console.log(`   ❌ Aucun ATS standard trouvé pour "${slug}"`);
    }
  }

  // Affiche le JSON à copier
  if (results.length > 0) {
    console.log("\n\n📋 COPIEZ CECI DANS companies-large.json (ou je le ferai auto):");
    console.log(JSON.stringify(results, null, 2));

    // Mise à jour automatique
    console.log("\n💾 Mise à jour automatique du fichier...");
    let updatedCount = 0;
    for (const res of results) {
      const idx = companies.findIndex(c => c.name === res.name);
      if (idx !== -1) {
        // Reset providers
        delete companies[idx].greenhouse;
        delete companies[idx].lever;
        delete companies[idx].smart;
        delete companies[idx].workday;

        if (res.type === 'lever') companies[idx].lever = { company: res.id };
        if (res.type === 'greenhouse') companies[idx].greenhouse = { board: res.id };
        if (res.type === 'smart') companies[idx].smart = { company: res.id };
        updatedCount++;
      }
    }

    await fs.writeFile(jsonPath, JSON.stringify(companies, null, 2));
    console.log(`✅ ${updatedCount} entreprises mises à jour !`);
  }
}

async function checkUrl(url) {
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 3000);
    const res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal
    });
    if (res.ok) return true;
    // SmartRecruiters retourne 200 même si vide ? Non, 404 si company existe pas.
    // Lever retourne 404 si company existe pas.
    // Greenhouse retourne 404.

    // Par sécurité on tente un GET léger
    if (res.status === 405 || res.status === 404) return false; // Method not allowed often means endpoint exists but HEAD rejected? No for these APIs.

    return false;
  } catch {
    return false;
  }
}

function slugify(text) {
  return text.toString().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

discover();
