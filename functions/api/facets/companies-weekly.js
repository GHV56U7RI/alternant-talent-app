import { json } from '../../_utils/response.js';

export async function onRequestGet({ env }) {
  const db = env.DB;
  const { results } = await db.prepare(
    `SELECT company, COUNT(*) AS offers
       FROM jobs
      WHERE created >= datetime('now', '-7 days')
      GROUP BY company
      ORDER BY offers DESC`
  ).all();
  return json(results);
}
