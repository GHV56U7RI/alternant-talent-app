import { cookie } from '../../_utils/cookies.js';
import { ensureAuthSchema } from '../../_utils/ensure.js';
import { extractToken } from '../../_utils/auth.js';
import { getDB } from '../../_utils/db.js';

export async function onRequest({ request, env }) {
  const db = getDB(env);
  await ensureAuthSchema(db);
  const token = extractToken(request);
  if (token) await db.prepare(`DELETE FROM sessions WHERE token=?`).bind(token).run();

  return new Response('{"ok":true}', {
    headers: { 'set-cookie': cookie('sess','',{ maxAge:0 }), 'content-type': 'application/json' }
  });
}

