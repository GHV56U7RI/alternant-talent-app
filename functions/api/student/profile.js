import { getCookie } from '../../_utils/cookies.js';
import { getDB } from '../../_utils/db.js';
const json = (o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{'content-type':'application/json'}});

async function requireSession(request, env){
  const sid = getCookie(request,'stud_sess');
  if(!sid) return null;
  const now = Math.floor(Date.now()/1000);
  return await getDB(env).prepare('SELECT account_id FROM student_sessions WHERE id=? AND expires_at>?')
    .bind(sid, now).first();
}

export async function onRequest({ request, env }) {
  const db = getDB(env);
  const sess = await requireSession(request, env);
  if(!sess) return json({error:'unauthorized'},401);
  const account = sess.account_id;

  if(request.method==='GET'){
    const row = await db.prepare('SELECT full_name, location, bio FROM student_profiles WHERE account_id=?')
      .bind(account).first();
    return json({profile: row || null});
  }

  if(request.method==='POST' || request.method==='PUT'){
    const body = await request.json().catch(()=>({}));
    const full_name = (body.full_name||'').trim();
    const location = (body.location||'').trim();
    const bio = (body.bio||'').trim();
    const nowStr = new Date().toISOString();
    await db.prepare(
      `INSERT INTO student_profiles (account_id,full_name,location,bio,updated_at)
       VALUES (?,?,?,?,?)
       ON CONFLICT(account_id) DO UPDATE SET
         full_name=excluded.full_name,
         location=excluded.location,
         bio=excluded.bio,
         updated_at=excluded.updated_at`
    ).bind(account, full_name, location, bio, nowStr).run();
    return json({ok:true});
  }

  return json({error:'method_not_allowed'},405);
}

