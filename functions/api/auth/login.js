import { ensureAuthSchema } from '../../_utils/ensure.js';
import { pbkdf2Hash, makeToken } from '../../_utils/crypto.js';
import { cookie } from '../../_utils/cookies.js';

export async function onRequest({ request, env }) {
  if (request.method !== 'POST') return new Response('{"error":"method_not_allowed"}',{status:405});
  const { email='', password='' } = await request.json().catch(()=> ({}));

  await ensureAuthSchema(env.DB);

  const row = await env.DB.prepare(`SELECT id,password_hash FROM users WHERE email=?`)
    .bind(email.toLowerCase()).all();
  const u = row.results?.[0];
  if (!u) return new Response('{"error":"invalid_credentials"}',{status:401});

  const hash = await pbkdf2Hash(password, email.toLowerCase());
  if (hash !== u.password_hash) return new Response('{"error":"invalid_credentials"}',{status:401});

  const token = makeToken();
  await env.DB.prepare(`INSERT INTO sessions (user_id, token) VALUES (?,?)`).bind(u.id, token).run();

  return new Response('{"ok":true}', {
    headers: { 'set-cookie': cookie('sess', token, { maxAge:60*60*24*30 }), 'content-type':'application/json' }
  });
}

