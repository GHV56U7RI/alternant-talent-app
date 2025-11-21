import fs from 'fs/promises';
import path from 'path';

async function discover() {
  console.log("🔍 Découverte MASSIVE des IDs ATS (Batch)...");

  const jsonPath = path.resolve('sources/companies-large.json');
  let companies = [];
  try {
    const content = await fs.readFile(jsonPath, 'utf-8');
    companies = JSON.parse(content);
  } catch (e) {
    console.error("❌ Impossible de lire companies-large.json");
    return;
  }

  // Filtrer ceux qui n'ont PAS de provider configuré
  const targets = companies.filter(c =>
    !c.greenhouse && !c.lever && !c.smart && !c.workday && !c.ashby
  );

  console.log(`📋 ${targets.length} entreprises sans configuration à analyser.`);

  // Traitement par batch pour éviter de surcharger le réseau
  const BATCH_SIZE = 10;
  let updatedCount = 0;

  for (let i = 0; i < targets.length; i += BATCH_SIZE) {
    const batch = targets.slice(i, i + BATCH_SIZE);
    console.log(`\n🔄 Traitement du lot ${i + 1}-${Math.min(i + BATCH_SIZE, targets.length)}...`);

    const promises = batch.map(async (company) => {
      const slug = slugify(company.name);
      const slugNoDash = slug.replace(/-/g, '');
      const candidates = [slug, slugNoDash, slug + 'hq', slug + 'jobs', slugNoDash + 'jobs'];

      // 1. Test ASHBY
      for (const id of candidates) {
        if (await checkAshbyApi(id)) return { name: company.name, type: 'ashby', id };
      }

      // 2. Test LEVER
      for (const id of candidates) {
        if (await checkUrl(`https://api.lever.co/v0/postings/${id}?mode=json`)) return { name: company.name, type: 'lever', id };
      }

      // 3. Test GREENHOUSE
      for (const id of candidates) {
        if (await checkUrl(`https://boards-api.greenhouse.io/v1/boards/${id}/jobs`)) return { name: company.name, type: 'greenhouse', id };
      }

      // 4. Test SMARTRECRUITERS
      for (const id of candidates) {
        if (await checkUrl(`https://api.smartrecruiters.com/v1/companies/${id}/postings`)) return { name: company.name, type: 'smart', id };
      }

      return null;
    });

    const results = await Promise.all(promises);

    // Appliquer les résultats
    for (const res of results) {
      if (!res) continue;

      console.log(`   ✅ ${res.name} -> ${res.type}: ${res.id}`);
      const idx = companies.findIndex(c => c.name === res.name);
      if (idx !== -1) {
        if (res.type === 'lever') companies[idx].lever = { company: res.id };
        if (res.type === 'greenhouse') companies[idx].greenhouse = { board: res.id };
        if (res.type === 'smart') companies[idx].smart = { company: res.id };
        if (res.type === 'ashby') companies[idx].ashby = { company: res.id };
        updatedCount++;
      }
    }

    // Sauvegarde intermédiaire
    await fs.writeFile(jsonPath, JSON.stringify(companies, null, 2));
  }

  console.log(`\n✅ Terminé ! ${updatedCount} nouvelles configurations trouvées.`);
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
    return Array.isArray(data.jobs);
  } catch {
    return false;
  }
}

async function checkUrl(url) {
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 2000); // Timeout court
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
