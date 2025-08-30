import { pbkdf2Hash } from '../../../_utils/crypto.js';
import { setCookie } from '../../../_utils/cookies.js';
import { getDB } from '../../../_utils/db.js';

const json = (o, s=200) =>
  new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json' }});

export async function onRequest({ request, env }) {
  try {
    if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

    let body = {};
    try { body = await request.json(); } catch { return json({ error:'bad_json' }, 400); }

    const email = String(body.email||'').trim().toLowerCase();
    const password = String(body.password||'');
    if (!email || !password) return json({ error: 'missing_fields' }, 400);

    const db = getDB(env);
    const exists = await db.prepare('SELECT 1 FROM student_accounts WHERE email=?').bind(email).first();
    if (exists) return json({ error: 'email_taken' }, 409);

    const id   = crypto.randomUUID();
    const hash = await pbkdf2Hash(password, email);
    const now  = new Date().toISOString();

    await db.prepare(
      'INSERT INTO student_accounts (id,email,password_hash,created_at) VALUES (?,?,?,?)'
    ).bind(id, email, hash, now).run();

    const sid = crypto.randomUUID();
    const exp = Math.floor(Date.now()/1000) + 60*60*24*30;
    await db.prepare(
      'INSERT INTO student_sessions (id,account_id,created_at,expires_at) VALUES (?,?,?,?)'
    ).bind(sid, id, now, exp).run();

    return new Response(JSON.stringify({ ok:true, email }), {
      headers: { 'content-type': 'application/json', 'Set-Cookie': setCookie('stud_sess', sid) }
    });
  } catch (e) {
    return json({ error: 'internal', message: e.message }, 500);
  }
}
