import { ensureEventsSchema } from '../../_utils/ensure.js';
import { getDB } from '../../_utils/db.js';

export async function onRequest({ env }) {
  const db = getDB(env);
  await ensureEventsSchema(db);
  const { results } = await db.prepare(
    `SELECT company, COUNT(*) AS offers
       FROM jobs
      WHERE datetime(created_at) >= datetime('now','-7 days')
      GROUP BY company
      ORDER BY offers DESC`
  ).all();
  return new Response(JSON.stringify(results || []), { headers: { 'content-type': 'application/json' } });
}
