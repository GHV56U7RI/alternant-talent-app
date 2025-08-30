import { pbkdf2Hash } from '../../../_utils/crypto.js';
import { setCookie } from '../../../_utils/cookies.js';
const json = (obj, status=200)=>new Response(JSON.stringify(obj),{status,headers:{'content-type':'application/json'}});

export async function onRequest({ request, env }) {
  if (request.method!=='POST') return json({error:'method_not_allowed'},405);
  const body = await request.json().catch(()=>({}));
  const email = (body.email||'').trim().toLowerCase();
  const password = body.password||'';
  if (!email || !password) return json({error:'missing_fields'},400);

  const exists = await env.DB.prepare('SELECT id FROM student_accounts WHERE email=?').bind(email).first();
  if (exists) return json({error:'email_taken'},409);

  const id = crypto.randomUUID();
  const hash = await pbkdf2Hash(password, email);
  const now = new Date().toISOString();

  await env.DB.prepare('INSERT INTO student_accounts (id,email,password_hash,created_at) VALUES (?,?,?,?)')
    .bind(id, email, hash, now).run();

  const sid = crypto.randomUUID();
  const exp = Math.floor(Date.now()/1000) + 60*60*24*30;
  await env.DB.prepare('INSERT INTO student_sessions (id,account_id,created_at,expires_at) VALUES (?,?,?,?)')
    .bind(sid, id, now, exp).run();

  return new Response(JSON.stringify({ok:true,email}), {
    headers: { 'content-type':'application/json', 'Set-Cookie': setCookie('stud_sess', sid) }
  });
}
