import { ensureAuthSchema } from '../../_utils/ensure.js';
import { sha256Hex, makeToken } from '../../_utils/crypto.js';
import { cookie } from '../../_utils/cookies.js';
import { json } from '../../_utils/response.js';

export async function onRequest({ request, env }) {
  if (request.method !== 'POST') return json({error:'method_not_allowed'},405);
  const { email='', password='' } = await request.json().catch(()=> ({}));

  await ensureAuthSchema(env.DB);

  const row = await env.DB.prepare(`SELECT id,password_hash,password_salt FROM users WHERE email=?`)
    .bind(email.toLowerCase()).all();
  const u = row.results?.[0];
  if (!u) return json({error:'invalid_credentials'},401);

  const hash = await sha256Hex((u.password_salt||'') + password);
  if (hash !== u.password_hash) return json({error:'invalid_credentials'},401);

  const token = makeToken();
  await env.DB.prepare(`INSERT INTO sessions (user_id, token) VALUES (?,?)`).bind(u.id, token).run();

  return json({ok:true},200,{ 'set-cookie': cookie('sess', token, { maxAge:60*60*24*30 }) });
}

