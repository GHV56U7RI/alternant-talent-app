import { pbkdf2Hash } from '../../../_utils/crypto.js';
import { setCookie } from '../../../_utils/cookies.js';
const json = (o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{'content-type':'application/json'}});

export async function onRequest({ request, env }) {
  if (request.method!=='POST') return json({error:'method_not_allowed'},405);
  let body={}; try{ body=await request.json(); }catch{ return json({error:'bad_json'},400); }
  const email=String(body.email||'').trim().toLowerCase();
  const password=String(body.password||'');
  if(!email||!password) return json({error:'missing_fields'},400);

  const exists=await env.DB.prepare('SELECT 1 FROM employer_accounts WHERE email=?').bind(email).first();
  if(exists) return json({error:'email_taken'},409);

  const id=crypto.randomUUID(), now=new Date().toISOString();
  const hash=await pbkdf2Hash(password,email);
  await env.DB.prepare('INSERT INTO employer_accounts (id,email,password_hash,created_at) VALUES (?,?,?,?)')
    .bind(id,email,hash,now).run();

  const sid=crypto.randomUUID(), exp=Math.floor(Date.now()/1000)+60*60*24*30;
  await env.DB.prepare('INSERT INTO employer_sessions (id,account_id,created_at,expires_at) VALUES (?,?,?,?)')
    .bind(sid,id,now,exp).run();

  return new Response(JSON.stringify({ok:true,email}),{
    headers:{'content-type':'application/json','Set-Cookie':setCookie('emp_sess',sid)}
  });
}
