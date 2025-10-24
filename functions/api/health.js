/**
 * /api/health
 * Vérifie Adzuna, Jooble, LBA et la base D1, avec fallback GET pour LBA.
 */
export const onRequestGet = async ({ env }) => {
  const out = {
    ok:     { adzuna:false, jooble:false, lba:false, db:false },
    counts: { adzuna:0,     jooble:0,     lba:0,     db:0     },
    errors: {}
  };

  // ---- Adzuna ----
  try {
    if (!env.ADZUNA_APP_ID || !env.ADZUNA_APP_KEY) throw new Error("ADZUNA vars manquants");
    const url = `https://api.adzuna.com/v1/api/jobs/fr/search/1?app_id=${env.ADZUNA_APP_ID}&app_key=${env.ADZUNA_APP_KEY}&results_per_page=1&what=alternance&where=France`;
    const r = await fetch(url);
    out.ok.adzuna = r.ok;
    if (r.ok) {
      const d = await r.json();
      out.counts.adzuna = Number.isFinite(d?.count) ? d.count : (Array.isArray(d?.results) ? d.results.length : 0);
    } else out.errors.adzuna = `HTTP ${r.status}`;
  } catch(e){ out.errors.adzuna = String(e); }

  // ---- Jooble ----
  try {
    if (!env.JOOBLE_KEY) throw new Error("JOOBLE_KEY manquant");
    const r = await fetch(`https://jooble.org/api/${env.JOOBLE_KEY}`, {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        keywords:'alternance OR apprentissage OR "contrat pro" OR "contrat de professionnalisation" OR alternant',
        location:"France",
        country:"fr",
        page:1
      })
    });
    out.ok.jooble = r.ok;
    if (r.ok) {
      const d = await r.json();
      out.counts.jooble = Number.isFinite(d?.totalCount) ? d.totalCount : (Array.isArray(d?.jobs) ? d.jobs.length : 0);
    } else out.errors.jooble = `HTTP ${r.status}`;
  } catch(e){ out.errors.jooble = String(e); }

  // ---- LBA : POST puis fallback GET ----
  try {
    if (!env.REMOTE_API_TOKEN) throw new Error("REMOTE_API_TOKEN manquant");
    const base = env.REMOTE_API_BASE || "https://api.apprentissage.beta.gouv.fr/api/job/v1/search";

    let r = await fetch(base, {
      method:"POST",
      headers:{
        "Accept":"application/json",
        "Content-Type":"application/json",
        "Authorization": `Bearer ${env.REMOTE_API_TOKEN}`
      },
      body: JSON.stringify({
        latitude:48.8566, longitude:2.3522, radius:30,
        romes:["M1805","M1802"],
        caller: env.REMOTE_API_CALLER || "alternant-talent.app"
      })
    });

    if (!r.ok) {
      // fallback GET
      const u = new URL(base);
      u.searchParams.set("latitude","48.8566");
      u.searchParams.set("longitude","2.3522");
      u.searchParams.set("radius","30");
      u.searchParams.set("romes","M1805,M1802");
      u.searchParams.set("caller", env.REMOTE_API_CALLER || "alternant-talent.app");
      r = await fetch(u.toString(), {
        headers:{
          "Accept":"application/json",
          "Authorization": `Bearer ${env.REMOTE_API_TOKEN}`
        }
      });
    }

    out.ok.lba = r.ok;
    if (r.ok) {
      const d = await r.json();
      out.counts.lba = Array.isArray(d?.jobs) ? d.jobs.length : 0;
    } else out.errors.lba = `HTTP ${r.status}`;
  } catch(e){ out.errors.lba = String(e); }

  // ---- DB D1 ----
  try {
    const rs = await env.DB.prepare("SELECT COUNT(*) AS c FROM jobs;").all();
    out.ok.db = true;
    out.counts.db = Number(rs?.results?.[0]?.c || 0);
  } catch(e){ out.errors.db = String(e); }

  return new Response(JSON.stringify({ ...out, timestamp:new Date().toISOString() }), {
    headers:{ "content-type":"application/json; charset=utf-8" }
  });
};
