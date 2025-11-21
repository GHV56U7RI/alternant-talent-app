import fs from 'fs/promises';
import path from 'path';

async function discover() {
  console.log("🔍 Découverte des IDs ATS pour les entreprises configurées...");

  const jsonPath = path.resolve('sources/companies-large.json');
  let companies = [];
  try {
    const content = await fs.readFile(jsonPath, 'utf-8');
    companies = JSON.parse(content);
  } catch (e) {
    console.error("❌ Impossible de lire companies-large.json");
    return;
  }

  // Liste des entreprises à vérifier (celles qui ont échoué ou toutes)
  const targets = [
    "Contentsquare", "Back Market", "Aircall", "Alan", "PayFit", "OpenClassrooms",
    "Thales", "Sanofi", "Danone"
  ];

  for (const company of companies) {
    if (!targets.includes(company.name)) continue;

    console.log(`\n🔎 Analyse de ${company.name} (${company.careers})...`);
    try {
      const response = await fetch(company.careers, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; JobScraper/1.0)' }
      });

      const finalUrl = response.url;
      const html = await response.text();

      console.log(`   ↳ URL finale: ${finalUrl}`);

      // 1. Recherche dans les URLs (Redirection)
      let found = false;

      // Lever
      let match = finalUrl.match(/jobs\.lever\.co\/([^/"'\s]+)/) || html.match(/jobs\.lever\.co\/([^/"'\s]+)/);
      if (match) {
         console.log(`   ✅ Lever détecté: "${match[1]}"`);
         found = true;
      }

      // Greenhouse
      match = finalUrl.match(/boards\.greenhouse\.io\/([^/"'\s]+)/) || html.match(/boards\.greenhouse\.io\/([^/"'\s]+)/);
      if (match) {
         console.log(`   ✅ Greenhouse détecté: "${match[1]}"`);
         found = true;
      }

      // SmartRecruiters
      match = finalUrl.match(/jobs\.smartrecruiters\.com\/([^/"'\s]+)/) || html.match(/jobs\.smartrecruiters\.com\/([^/"'\s]+)/);
      if (match) {
         console.log(`   ✅ SmartRecruiters détecté: "${match[1]}"`);
         found = true;
      }

      // Workday
      if (finalUrl.includes('myworkdayjobs.com') || html.includes('myworkdayjobs.com')) {
         // Recherche du pattern dans le HTML: href="https://xxxx.wd3.myworkdayjobs.com/Tenant"
         const wdMatch = html.match(/https:\/\/([^.]+)\.wd3\.myworkdayjobs\.com\/([^/"'\s]+)/);
         if (wdMatch) {
             console.log(`   ✅ Workday détecté: Host="${wdMatch[1]}.wd3.myworkdayjobs.com", Tenant="${wdMatch[2]}"`);
             found = true;
         }
      }

      // WTTJ
      if (html.includes('welcometothejungle.com')) {
        const wttjMatch = html.match(/welcometothejungle\.com\/[^/]+\/companies\/([^/"'\s]+)/);
        if (wttjMatch) {
            console.log(`   ⚠️ WTTJ détecté: "${wttjMatch[1]}" (Utilisez le provider WTTJ si disponible)`);
        }
      }

      if (!found) {
        console.log("   ❌ Aucun ATS identifié automatiquement.");
      }

    } catch (e) {
      console.log(`   ❌ Erreur d'accès: ${e.message}`);
    }
  }
}

discover();
