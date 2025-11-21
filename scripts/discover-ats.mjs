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

  // Liste des entreprises à vérifier
  const targets = [
    "Back Market", "Aircall", "Alan", "PayFit", "OpenClassrooms",
    "Thales", "Sanofi", "Danone", "Pernod Ricard", "PwC",
    "Swile", "Ledger", "Voodoo", "Malt"
  ];

  const results = [];

  for (const company of companies) {
    if (!targets.includes(company.name)) continue;

    console.log(`\n🔎 Analyse de ${company.name}...`);

    const slug = slugify(company.name);
    const slugNoDash = slug.replace(/-/g, '');
    const candidates = [slug, slugNoDash, slug + 'hq', slug + 'jobs', slugNoDash + 'jobs'];

    let found = null;

    // 1. Test ASHBY (API check strict)
    if (!found) {
      for (const id of candidates) {
        if (found) break;
        // Ashby API check
        if (await checkAshbyApi(id)) {
          console.log(`   ✅ Ashby trouvé: "${id}"`);
          found = { type: 'ashby', id };
        }
      }
    }

    // 2. Test LEVER
    if (!found) {
      for (const id of candidates) {
        if (found) break;
        if (await checkUrl(`https://api.lever.co/v0/postings/${id}?mode=json`)) {
          console.log(`   ✅ Lever trouvé: "${id}"`);
          found = { type: 'lever', id };
        }
      }
    }

    // 3. Test GREENHOUSE
    if (!found) {
      for (const id of candidates) {
        if (found) break;
        if (await checkUrl(`https://boards-api.greenhouse.io/v1/boards/${id}/jobs`)) {
          console.log(`   ✅ Greenhouse trouvé: "${id}"`);
          found = { type: 'greenhouse', id };
        }
      }
    }

    // 4. Test SMARTRECRUITERS
    if (!found) {
      for (const id of candidates) {
        if (found) break;
        if (await checkUrl(`https://api.smartrecruiters.com/v1/companies/${id}/postings`)) {
          console.log(`   ✅ SmartRecruiters trouvé: "${id}"`);
          found = { type: 'smart', id };
        }
      }
    }

    if (found) {
      results.push({ name: company.name, ...found });
    } else {
      console.log(`   ❌ Aucun ATS standard trouvé pour "${slug}"`);
    }
  }

  if (results.length > 0) {
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
        delete companies[idx].ashby;

        if (res.type === 'lever') companies[idx].lever = { company: res.id };
        if (res.type === 'greenhouse') companies[idx].greenhouse = { board: res.id };
        if (res.type === 'smart') companies[idx].smart = { company: res.id };
        if (res.type === 'ashby') companies[idx].ashby = { company: res.id };
        updatedCount++;
      }
    }

    await fs.writeFile(jsonPath, JSON.stringify(companies, null, 2));
    console.log(`✅ ${updatedCount} entreprises mises à jour !`);
  }
}

async function checkAshbyApi(id) {
  try {
    const url = `https://api.ashbyhq.com/posting-api/job-board/${id}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) return false;
    const data = await res.json();
    // Il faut qu'il y ait des jobs ou au moins que la structure soit valide
    return Array.isArray(data.jobs);
  } catch {
    return false;
  }
}

async function checkUrl(url) {
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 3000);
    const res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    if (res.ok) return true;
    if (res.status === 405) {
         const res2 = await fetch(url, {
            method: 'GET',
            signal: controller.signal,
            headers: { 'Range': 'bytes=0-100' }
         });
         return res2.ok;
    }
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
