import { parseCookies } from '../../_utils/cookies.js';
import { ensureAuthSchema } from '../../_utils/ensure.js';
import { getDB } from '../../_utils/db.js';

export async function onRequest({ request, env }) {
  const db = getDB(env);
  await ensureAuthSchema(db);
  const { sess } = parseCookies(request);
  if (!sess) return new Response('{"auth":false}', { headers:{'content-type':'application/json'} });

  const row = await db.prepare(
    `SELECT u.id, u.email, u.created_at
     FROM sessions s JOIN users u ON u.id=s.user_id
     WHERE s.token=?`
  ).bind(sess).all();

  const me = row.results?.[0];
  return new Response(JSON.stringify({ auth: !!me, user: me||null }), {
    headers: {'content-type':'application/json'}
  });
}

