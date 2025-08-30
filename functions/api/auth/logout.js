import { parseCookies, cookie } from '../../_utils/cookies.js';
import { ensureAuthSchema } from '../../_utils/ensure.js';
import { json } from '../../_utils/response.js';

export async function onRequest({ request, env }) {
  await ensureAuthSchema(env.DB);
  const { sess } = parseCookies(request.headers.get('cookie'));
  if (sess) await env.DB.prepare(`DELETE FROM sessions WHERE token=?`).bind(sess).run();

  return json({ok:true},200,{ 'set-cookie': cookie('sess','',{ maxAge:0 }) });
}

