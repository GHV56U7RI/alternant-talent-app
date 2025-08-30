import { ensureAuthSchema } from '../../_utils/ensure.js';
import { makeSalt, sha256Hex, makeToken } from '../../_utils/crypto.js';
import { cookie } from '../../_utils/cookies.js';
import { getDB } from '../../_utils/db.js';

export async function onRequest({ request, env }) {
  if (request.method !== 'POST')
    return new Response('{"error":"method_not_allowed"}', { status:405 });

  const body = await request.json().catch(()=> ({}));
  const email = (body.email||'').trim().toLowerCase();
  const password = body.password||'';

  if (!email || !password) return new Response('{"error":"invalid_input"}',{status:400});

  const db = getDB(env);
  await ensureAuthSchema(db);

  const exists = await db.prepare(`SELECT id FROM users WHERE email=?`).bind(email).all();
  if (exists.results?.length) return new Response('{"error":"email_in_use"}',{status:409});

  const salt = makeSalt();
  const password_hash = await sha256Hex(salt + password);
  const now = new Date().toISOString();

  const res = await db.prepare(
    `INSERT INTO users (email, password_hash, password_salt, created_at) VALUES (?,?,?,?)`
  ).bind(email, password_hash, salt, now).run();

  const user_id = res.meta.last_row_id;
  const token = makeToken();
  await db.prepare(`INSERT INTO sessions (user_id, token) VALUES (?,?)`).bind(user_id, token).run();

  return new Response(JSON.stringify({ ok:true, user_id }), {
    headers: { 'set-cookie': cookie('sess', token, { maxAge: 60*60*24*30 }), 'content-type':'application/json' }
  });
}

