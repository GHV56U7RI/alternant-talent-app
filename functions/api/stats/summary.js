import { getDB } from '../../_utils/db.js';
const json = (o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{'content-type':'application/json'}});

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit')||'5',10), 20);

  const db = getDB(env);
  const totalJobs = await db.prepare('SELECT COUNT(*) AS c FROM jobs').all();
  const lastUp    = await db.prepare('SELECT MAX(created_at) AS u FROM jobs').all();

  const topCompanies = await db.prepare(
    `SELECT company, COUNT(*) AS offers
       FROM jobs GROUP BY company ORDER BY offers DESC LIMIT ?`
  ).bind(limit).all();

  const topLocations = await db.prepare(
    `SELECT location, COUNT(*) AS offers
       FROM jobs WHERE IFNULL(location,'')!='' GROUP BY location ORDER BY offers DESC LIMIT ?`
  ).bind(limit).all();

  const clicks7d = await db.prepare(
    `SELECT COUNT(*) AS c FROM job_clicks
      WHERE datetime(created_at) >= datetime('now','-7 days')`
  ).all();

  const topClicked30d = await db.prepare(
    `SELECT j.id, j.title, j.company, j.location, COUNT(c.id) AS clicks
       FROM job_clicks c
       JOIN jobs j ON j.id = c.job_id
      WHERE datetime(c.created_at) >= datetime('now','-30 days')
      GROUP BY j.id
      ORDER BY clicks DESC
      LIMIT ?`
  ).bind(limit).all();

  return json({
    total_jobs: totalJobs.results?.[0]?.c || 0,
    last_update: lastUp.results?.[0]?.u || null,
    top_companies: topCompanies.results || [],
    top_locations: topLocations.results || [],
    clicks_last_7d: clicks7d.results?.[0]?.c || 0,
    top_clicked_30d: topClicked30d.results || []
  });
}
