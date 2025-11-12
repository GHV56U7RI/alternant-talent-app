/**
 * Endpoint Cloudflare pour déclencher l'enrichissement des offres
 *
 * Workflow:
 * 1. Récupère les offres depuis KV (offres brutes depuis APIs légales)
 * 2. Appelle le service d'enrichissement local (Ollama)
 * 3. Stocke les offres enrichies dans KV
 *
 * Usage:
 * POST /api/enrich
 * Body: {
 *   "source": "kv" | "adzuna",  // Source des offres
 *   "limit": 50                  // Nombre max d'offres à enrichir
 * }
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { source = 'kv', limit = 50 } = body;

    console.log(`🚀 Démarrage enrichissement - Source: ${source}, Limite: ${limit}`);

    // 1. Récupérer les offres selon la source
    let rawJobs = [];

    if (source === 'kv') {
      // Récupérer depuis KV (offres déjà collectées)
      const cached = await env.JOBS_CACHE.get('seed.json', 'json');
      if (cached && cached.jobs) {
        rawJobs = cached.jobs.slice(0, limit);
        console.log(`📦 ${rawJobs.length} offres récupérées depuis KV`);
      } else {
        return Response.json({
          error: 'Aucune offre trouvée dans KV. Lancez d\'abord la collecte depuis les APIs.'
        }, { status: 404 });
      }
    } else if (source === 'adzuna') {
      // Récupérer directement depuis Adzuna (exemple)
      // Vous devez configurer ADZUNA_APP_ID et ADZUNA_APP_KEY dans Cloudflare
      const adzunaAppId = env.ADZUNA_APP_ID;
      const adzunaAppKey = env.ADZUNA_APP_KEY;

      if (!adzunaAppId || !adzunaAppKey) {
        return Response.json({
          error: 'Configuration Adzuna manquante. Ajoutez ADZUNA_APP_ID et ADZUNA_APP_KEY.'
        }, { status: 500 });
      }

      const response = await fetch(
        `https://api.adzuna.com/v1/api/jobs/fr/search/1?app_id=${adzunaAppId}&app_key=${adzunaAppKey}&results_per_page=${limit}&what=alternance&content-type=application/json`
      );

      if (!response.ok) {
        return Response.json({
          error: `Erreur Adzuna: ${response.status}`
        }, { status: response.status });
      }

      const data = await response.json();
      rawJobs = data.results.map(job => ({
        id: job.id,
        title: job.title,
        description: job.description,
        location: job.location?.display_name || 'Non spécifié',
        company: job.company?.display_name || 'Non spécifié',
        url: job.redirect_url,
        created: job.created,
        salary_min: job.salary_min,
        salary_max: job.salary_max
      }));

      console.log(`📦 ${rawJobs.length} offres récupérées depuis Adzuna`);
    }

    if (rawJobs.length === 0) {
      return Response.json({
        error: 'Aucune offre à enrichir'
      }, { status: 400 });
    }

    // 2. Appeler le service d'enrichissement
    // IMPORTANT: Vous devez configurer ENRICHMENT_SERVICE_URL dans Cloudflare
    // Par exemple: http://votre-serveur.com:3001 ou utiliser un tunnel Cloudflare
    const enrichmentUrl = env.ENRICHMENT_SERVICE_URL || 'http://localhost:3001';

    console.log(`🤖 Appel du service d'enrichissement: ${enrichmentUrl}`);

    const enrichResponse = await fetch(`${enrichmentUrl}/enrich/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ jobs: rawJobs })
    });

    if (!enrichResponse.ok) {
      const errorText = await enrichResponse.text();
      return Response.json({
        error: `Erreur service d'enrichissement: ${enrichResponse.status}`,
        details: errorText
      }, { status: 500 });
    }

    const enrichResult = await enrichResponse.json();
    const enrichedJobs = enrichResult.jobs;

    console.log(`✅ ${enrichedJobs.length} offres enrichies`);

    // 3. Stocker dans KV
    const dataToStore = {
      jobs: enrichedJobs,
      lastUpdate: Date.now(),
      count: enrichedJobs.length,
      enriched: true,
      source: source
    };

    await env.JOBS_CACHE.put('seed.json', JSON.stringify(dataToStore), {
      metadata: {
        enriched: true,
        count: enrichedJobs.length,
        timestamp: Date.now()
      }
    });

    console.log('💾 Offres enrichies sauvegardées dans KV');

    // Retourner le résultat
    return Response.json({
      success: true,
      message: `${enrichedJobs.length} offres enrichies avec succès`,
      stats: {
        total: enrichedJobs.length,
        source: source,
        timestamp: new Date().toISOString()
      },
      sample: enrichedJobs[0]?.enriched // Montrer un exemple
    });

  } catch (error) {
    console.error('❌ Erreur enrichissement:', error);
    return Response.json({
      error: 'Erreur lors de l\'enrichissement',
      details: error.message
    }, { status: 500 });
  }
}

// Endpoint GET pour vérifier le statut
export async function onRequestGet(context) {
  const { env } = context;

  try {
    // Vérifier les offres dans KV
    const cached = await env.JOBS_CACHE.get('seed.json', 'json');

    if (!cached) {
      return Response.json({
        status: 'no_data',
        message: 'Aucune offre dans le cache'
      });
    }

    const enrichedCount = cached.jobs?.filter(j => j.enriched).length || 0;

    return Response.json({
      status: 'ok',
      total_jobs: cached.count || 0,
      enriched_jobs: enrichedCount,
      last_update: cached.lastUpdate ? new Date(cached.lastUpdate).toISOString() : null,
      is_enriched: cached.enriched || false
    });

  } catch (error) {
    return Response.json({
      error: error.message
    }, { status: 500 });
  }
}
