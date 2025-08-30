import { requireStudentSession } from '../../_utils/auth_student.js';
import { json } from '../../_utils/response.js';

export async function onRequest({ request, env }) {
  const sess = await requireStudentSession(request, env);
  if(!sess) return json({error:'unauthorized'},401);
  const account = sess.id;

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

