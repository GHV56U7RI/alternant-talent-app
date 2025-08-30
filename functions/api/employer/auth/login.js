import { pbkdf2Hash } from '../../../_utils/crypto.js';
import { setCookie } from '../../../_utils/cookies.js';
import { json } from '../../../_utils/response.js';

export async function onRequest({ request, env }) {
  if (request.method!=='POST') return json({error:'method_not_allowed'},405);
  let body={}; try{ body=await request.json(); }catch{ return json({error:'bad_json'},400); }
  const email=String(body.email||'').trim().toLowerCase();
  const password=String(body.password||'');
  if(!email||!password) return json({error:'missing_fields'},400);

  const acc=await env.DB.prepare('SELECT id,password_hash FROM employer_accounts WHERE email=?').bind(email).first();
  if(!acc) return json({error:'invalid_credentials'},401);

  const hash=await pbkdf2Hash(password,email);
  if(hash!==acc.password_hash) return json({error:'invalid_credentials'},401);

  const sid=crypto.randomUUID(), now=new Date().toISOString();
  const exp=Math.floor(Date.now()/1000)+60*60*24*30;
  await env.DB.prepare('INSERT INTO employer_sessions (id,account_id,created_at,expires_at) VALUES (?,?,?,?)')
    .bind(sid,acc.id,now,exp).run();

  return json({ok:true,email},200,{ 'Set-Cookie': setCookie('emp_sess',sid) });
}
