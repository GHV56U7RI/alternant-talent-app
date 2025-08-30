import { parseCookies, cookie } from '../../../_utils/cookies.js';
import { ensureAuthSchema } from '../../../_utils/ensure.js';

export async function onRequest({ request, env }) {
  await ensureAuthSchema(env.DB);
  const { stud_sess } = parseCookies(request);
  if (stud_sess) await env.DB.prepare(`DELETE FROM sessions WHERE token=?`).bind(stud_sess).run();

  return new Response('{"ok":true}', {
    headers: { 'set-cookie': cookie('stud_sess','',{ maxAge:0 }), 'content-type': 'application/json' }
  });
}

