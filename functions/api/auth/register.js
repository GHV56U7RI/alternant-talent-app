import { ensureAuthSchema } from '../../_utils/ensure.js';
import { makeSalt, sha256Hex, makeToken } from '../../_utils/crypto.js';
import { cookie } from '../../_utils/cookies.js';
import { json } from '../../_utils/response.js';

export async function onRequest({ request, env }) {
  if (request.method !== 'POST')
    return json({error:'method_not_allowed'},405);

  const body = await request.json().catch(()=> ({}));
  const email = (body.email||'').trim().toLowerCase();
  const password = body.password||'';

  if (!email || !password) return json({error:'invalid_input'},400);

  await ensureAuthSchema(env.DB);

  const exists = await env.DB.prepare(`SELECT id FROM users WHERE email=?`).bind(email).all();
  if (exists.results?.length) return json({error:'email_in_use'},409);

  const salt = makeSalt();
  const password_hash = await sha256Hex(salt + password);
  const now = new Date().toISOString();

  const res = await env.DB.prepare(
    `INSERT INTO users (email, password_hash, password_salt, created_at) VALUES (?,?,?,?)`
  ).bind(email, password_hash, salt, now).run();

  const user_id = res.meta.last_row_id;
  const token = makeToken();
  await env.DB.prepare(`INSERT INTO sessions (user_id, token) VALUES (?,?)`).bind(user_id, token).run();

  return json({ ok:true, user_id }, 200, {
    'set-cookie': cookie('sess', token, { maxAge: 60*60*24*30 })
  });
}

