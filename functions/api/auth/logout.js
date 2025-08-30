import { parseCookies, cookie } from '../../_utils/cookies.js';
import { ensureAuthSchema } from '../../_utils/ensure.js';
import { getDB } from '../../_utils/db.js';

export async function onRequest({ request, env }) {
  const db = getDB(env);
  await ensureAuthSchema(db);
  const { sess } = parseCookies(request);
  if (sess) await db.prepare(`DELETE FROM sessions WHERE token=?`).bind(sess).run();

  return new Response('{"ok":true}', {
    headers: { 'set-cookie': cookie('sess','',{ maxAge:0 }), 'content-type': 'application/json' }
  });
}

