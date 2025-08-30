import { ensureEventsSchema } from '../../_utils/ensure.js';

export async function onRequest({ env }) {
  await ensureEventsSchema(env.DB);
  const { results } = await env.DB.prepare(
    `SELECT company, COUNT(*) AS offers
       FROM jobs
      WHERE datetime(created_at) >= datetime('now','-7 days')
      GROUP BY company
      ORDER BY offers DESC`
  ).all();
  return new Response(JSON.stringify(results || []), { headers: { 'content-type': 'application/json' } });
}
