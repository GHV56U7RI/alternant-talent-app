import { parseCookies } from '../../../_utils/cookies.js';
import { ensureAuthSchema } from '../../../_utils/ensure.js';

export async function onRequest({ request, env }) {
  await ensureAuthSchema(env.DB);
  const { stud_sess } = parseCookies(request);
  if (!stud_sess) return new Response('{"auth":false}', { headers:{'content-type':'application/json'} });

  const row = await env.DB.prepare(
    `SELECT u.id, u.email, u.created_at
     FROM sessions s JOIN users u ON u.id=s.user_id
     WHERE s.token=?`
  ).bind(stud_sess).all();

  const me = row.results?.[0];
  return new Response(JSON.stringify({ auth: !!me, user: me||null }), {
    headers: {'content-type':'application/json'}
  });
}

