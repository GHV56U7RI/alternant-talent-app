import { getCookie } from '../../_utils/cookies.js';
const json = (o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{'content-type':'application/json'}});

async function requireSession(request, env){
  const sid = getCookie(request,'stud_sess');
  if(!sid) return null;
  const now = Math.floor(Date.now()/1000);
  return await env.DB.prepare('SELECT account_id FROM student_sessions WHERE id=? AND expires_at>?')
    .bind(sid, now).first();
}

export async function onRequest({ request, env }) {
  const sess = await requireSession(request, env);
  if(!sess) return json({error:'unauthorized'},401);
  const account = sess.account_id;

  if(request.method==='GET'){
    const rs = await env.DB.prepare('SELECT job_id, created_at FROM student_favorites WHERE account_id=? ORDER BY created_at DESC')
      .bind(account).all();
    return json({favorites: (rs.results||[]).map(r=>r.job_id)});
  }

  if(request.method==='POST'){
    const body = await request.json().catch(()=>({}));
    const job = (body.job_id||'').trim();
    if(!job) return json({error:'missing_job_id'},400);
    const nowStr = new Date().toISOString();
    await env.DB.prepare('INSERT OR IGNORE INTO student_favorites (account_id,job_id,created_at) VALUES (?,?,?)')
      .bind(account, job, nowStr).run();
    return json({ok:true});
  }

  if(request.method==='DELETE'){
    const url = new URL(request.url);
    const job = url.searchParams.get('job_id') || '';
    if(!job) return json({error:'missing_job_id'},400);
    await env.DB.prepare('DELETE FROM student_favorites WHERE account_id=? AND job_id=?')
      .bind(account, job).run();
    return json({ok:true});
  }

  return json({error:'method_not_allowed'},405);
}

