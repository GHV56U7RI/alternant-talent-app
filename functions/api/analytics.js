/**
 * Endpoint d'analytics pour analyser les tendances des offres enrichies
 *
 * GET /api/analytics
 *
 * Retourne des statistiques sur :
 * - Répartition par domaine
 * - Répartition par niveau d'études
 * - Offres en télétravail
 * - Offres par ville
 * - Compétences les plus demandées
 * - Évolution temporelle
 */

export async function onRequestGet(context) {
  const { env } = context;

  try {
    // 1. Statistiques par domaine
    const byDomain = await env.DB.prepare(`
      SELECT
        enriched_domaine as domaine,
        COUNT(*) as count
      FROM jobs
      WHERE enriched_domaine IS NOT NULL
      GROUP BY enriched_domaine
      ORDER BY count DESC
      LIMIT 20
    `).all();

    // 2. Statistiques par niveau d'études
    const byLevel = await env.DB.prepare(`
      SELECT
        enriched_niveau_etudes as niveau,
        COUNT(*) as count
      FROM jobs
      WHERE enriched_niveau_etudes IS NOT NULL
      GROUP BY enriched_niveau_etudes
      ORDER BY
        CASE enriched_niveau_etudes
          WHEN 'Bac+5' THEN 1
          WHEN 'Bac+4' THEN 2
          WHEN 'Bac+3' THEN 3
          WHEN 'Bac+2' THEN 4
          ELSE 5
        END
    `).all();

    // 3. Télétravail
    const teleworkStats = await env.DB.prepare(`
      SELECT
        CASE
          WHEN enriched_teletravail = 1 THEN 'Avec télétravail'
          ELSE 'Sans télétravail'
        END as category,
        COUNT(*) as count
      FROM jobs
      WHERE enriched_teletravail IS NOT NULL
      GROUP BY category
    `).all();

    // 4. Top 20 villes
    const byCity = await env.DB.prepare(`
      SELECT
        location as ville,
        COUNT(*) as count
      FROM jobs
      WHERE location IS NOT NULL AND location != ''
      GROUP BY location
      ORDER BY count DESC
      LIMIT 20
    `).all();

    // 5. Compétences les plus demandées
    const allJobs = await env.DB.prepare(`
      SELECT enriched_competences
      FROM jobs
      WHERE enriched_competences IS NOT NULL AND enriched_competences != '[]'
      LIMIT 1000
    `).all();

    const competencesMap = {};
    for (const job of allJobs.results || []) {
      try {
        const competences = JSON.parse(job.enriched_competences || '[]');
        for (const comp of competences) {
          competencesMap[comp] = (competencesMap[comp] || 0) + 1;
        }
      } catch (e) {
        // Ignorer les erreurs de parsing
      }
    }

    const topCompetences = Object.entries(competencesMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([name, count]) => ({ name, count }));

    // 6. Statistiques générales
    const totalStats = await env.DB.prepare(`
      SELECT
        COUNT(*) as total_offres,
        SUM(CASE WHEN enriched_at IS NOT NULL THEN 1 ELSE 0 END) as offres_enrichies,
        COUNT(DISTINCT enriched_domaine) as domaines_uniques,
        COUNT(DISTINCT location) as villes_uniques,
        SUM(CASE WHEN enriched_teletravail = 1 THEN 1 ELSE 0 END) as avec_teletravail,
        SUM(CASE WHEN enriched_salaire_estime IS NOT NULL THEN 1 ELSE 0 END) as avec_salaire
      FROM jobs
    `).first();

    // 7. Évolution par mois (derniers 6 mois)
    const evolution = await env.DB.prepare(`
      SELECT
        strftime('%Y-%m', COALESCE(created_at, posted_at)) as mois,
        COUNT(*) as count
      FROM jobs
      WHERE COALESCE(created_at, posted_at) >= date('now', '-6 months')
      GROUP BY mois
      ORDER BY mois DESC
    `).all();

    // 8. Sources des offres
    const bySources = await env.DB.prepare(`
      SELECT
        source,
        COUNT(*) as count
      FROM jobs
      GROUP BY source
      ORDER BY count DESC
    `).all();

    // 9. Type de contrat
    const byContractType = await env.DB.prepare(`
      SELECT
        enriched_type_contrat as type,
        COUNT(*) as count
      FROM jobs
      WHERE enriched_type_contrat IS NOT NULL
      GROUP BY enriched_type_contrat
      ORDER BY count DESC
    `).all();

    return Response.json({
      success: true,
      generated_at: new Date().toISOString(),
      stats: {
        total: totalStats,
        by_domain: byDomain.results || [],
        by_level: byLevel.results || [],
        by_city: byCity.results || [],
        by_source: bySources.results || [],
        by_contract_type: byContractType.results || [],
        telework: teleworkStats.results || [],
        top_competences: topCompetences,
        evolution: evolution.results || []
      }
    }, {
      headers: {
        'content-type': 'application/json',
        'cache-control': 'public, max-age=3600' // Cache 1 heure
      }
    });

  } catch (error) {
    console.error('Erreur analytics:', error);
    return Response.json({
      error: error.message
    }, {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
}
