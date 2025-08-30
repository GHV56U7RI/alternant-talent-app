import { ensureEventsSchema } from '../../_utils/ensure.js';
import { getDB } from '../../_utils/db.js';

export async function onRequest({ env }) {
  const db = getDB(env);
  await ensureEventsSchema(db);
  const period = "datetime('now','-30 days')";
  const q = (t) => `SELECT COUNT(*) AS n FROM events WHERE type='${t}' AND datetime(created_at) >= ${period}`;
  const [v,c,a,j] = await Promise.all([
    db.prepare(q('view')).all(),
    db.prepare(q('click')).all(),
    db.prepare(q('apply')).all(),
    db.prepare(`SELECT COUNT(*) AS n FROM jobs`).all()
  ]);
  return new Response(JSON.stringify({
    views: v.results?.[0]?.n||0,
    clicks: c.results?.[0]?.n||0,
    applies: a.results?.[0]?.n||0,
    jobs: j.results?.[0]?.n||0
  }), { headers: {'content-type':'application/json'} });
}
