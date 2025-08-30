import { getCookie } from './cookies.js';
import { getDB } from './db.js';

export function extractToken(req){
  const cookieToken=getCookie(req,'stud_sess');
  if(cookieToken) return cookieToken;
  const auth=req.headers.get('authorization')||'';
  if(auth.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

export async function validateSession(env,token){
  if(!token) return null;
  const db=getDB(env);
  const now=Math.floor(Date.now()/1000);
  const row=await db.prepare(
    `SELECT a.id, a.email
       FROM student_sessions s
       JOIN student_accounts a ON a.id=s.account_id
      WHERE s.id=? AND s.expires_at>?`
  ).bind(token,now).first();
  return row||null;
}

export async function authMiddleware(ctx,next){
  ctx.student=await validateSession(ctx.env,extractToken(ctx.request));
  return next();
}

export async function requireAuth(ctx,next){
  ctx.student=await validateSession(ctx.env,extractToken(ctx.request));
  if(!ctx.student){
    return new Response(JSON.stringify({error:'unauthorized'}),{
      status:401,
      headers:{'content-type':'application/json'}
    });
  }
  return next();
}
