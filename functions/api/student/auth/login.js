import { pbkdf2Hash } from '../../../_utils/crypto.js';
import { setCookie } from '../../../_utils/cookies.js';
const json = (o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{'content-type':'application/json'}});

export async function onRequest({ request, env }) {
  if (request.method!=='POST') return json({error:'method_not_allowed'},405);
  const body = await request.json().catch(()=>({}));
  const email = (body.email||'').trim().toLowerCase();
  const password = body.password||'';
  if (!email || !password) return json({error:'missing_fields'},400);

  const acc = await env.DB.prepare('SELECT id,password_hash FROM student_accounts WHERE email=?').bind(email).first();
  if (!acc) return json({error:'invalid_credentials'},401);

  const hash = await pbkdf2Hash(password, email);
  if (hash !== acc.password_hash) return json({error:'invalid_credentials'},401);

  const sid = crypto.randomUUID();
  const now = new Date().toISOString();
  const exp = Math.floor(Date.now()/1000) + 60*60*24*30;
  await env.DB.prepare('INSERT INTO student_sessions (id,account_id,created_at,expires_at) VALUES (?,?,?,?)')
    .bind(sid, acc.id, now, exp).run();

  return new Response(JSON.stringify({ok:true,email}), {
    headers: { 'content-type':'application/json', 'Set-Cookie': setCookie('stud_sess', sid) }
  });
}
