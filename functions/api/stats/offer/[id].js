import { ensureEventsSchema } from '../../../_utils/ensure.js';
import { getDB } from '../../../_utils/db.js';

export async function onRequest({ params, env }) {
  const db = getDB(env);
  await ensureEventsSchema(db);

  const id = params.id;
  const q = (t) => `SELECT COUNT(*) AS n FROM events WHERE type='${t}' AND job_id=?`;

  const [v,c,a] = await Promise.all([
    db.prepare(q('view')).bind(id).all(),
    db.prepare(q('click')).bind(id).all(),
    db.prepare(q('apply')).bind(id).all(),
  ]);

  return new Response(JSON.stringify({
    job_id: id,
    views: v.results?.[0]?.n||0,
    clicks: c.results?.[0]?.n||0,
    applies: a.results?.[0]?.n||0,
  }), { headers: {'content-type':'application/json'} });
}
