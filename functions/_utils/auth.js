import { getCookie } from './cookies.js';
import { getDB } from './db.js';

export function extractToken(request){
  const cookieToken=getCookie(request,'sess');
  if(cookieToken) return cookieToken;
  const auth=request.headers.get('authorization')||'';
  if(auth.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

export async function validateSession(env,token){
  if(!token) return null;
  const db=getDB(env);
  const row=await db.prepare(
    `SELECT u.id, u.email, u.created_at
       FROM sessions s JOIN users u ON u.id=s.user_id
      WHERE s.token=?`
  ).bind(token).first();
  return row||null;
}

export async function authMiddleware(ctx,next){
  ctx.user=await validateSession(ctx.env,extractToken(ctx.request));
  return next();
}

export async function requireAuth(ctx,next){
  ctx.user=await validateSession(ctx.env,extractToken(ctx.request));
  if(!ctx.user){
    return new Response(JSON.stringify({error:'unauthorized'}),{
      status:401,
      headers:{'content-type':'application/json'}
    });
  }
  return next();
}
