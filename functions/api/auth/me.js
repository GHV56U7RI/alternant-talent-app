import { ensureAuthSchema } from '../../_utils/ensure.js';
import { extractToken, validateSession } from '../../_utils/auth.js';
import { getDB } from '../../_utils/db.js';

export async function onRequest({ request, env }) {
  const db = getDB(env);
  await ensureAuthSchema(db);
  const user = await validateSession(env, extractToken(request));
  return new Response(JSON.stringify({ auth: !!user, user: user||null }), {
    headers: {'content-type':'application/json'}
  });
}

