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
    const rs = await db.prepare(
      'SELECT id, query, created_at, updated_at FROM student_alerts WHERE account_id=? ORDER BY created_at DESC'
    ).bind(account).all();
    return json({alerts: rs.results || []});
  }

  if(request.method==='POST'){
    const body = await request.json().catch(()=>({}));
    const query = (body.query||'').trim();
    if(!query) return json({error:'missing_query'},400);
    const nowStr = new Date().toISOString();
    if(body.id){
      const exists = await db.prepare('SELECT id FROM student_alerts WHERE id=? AND account_id=?')
        .bind(body.id, account).first();
      if(!exists) return json({error:'not_found'},404);
      await db.prepare('UPDATE student_alerts SET query=?, updated_at=? WHERE id=?')
        .bind(query, nowStr, body.id).run();
      return json({ok:true, id: body.id});
    } else {
      const id = crypto.randomUUID();
      await db.prepare('INSERT INTO student_alerts (id,account_id,query,created_at,updated_at) VALUES (?,?,?,?,?)')
        .bind(id, account, query, nowStr, nowStr).run();
      return json({ok:true, id});
    }
  }

  if(request.method==='DELETE'){
    const url = new URL(request.url);
    const id = url.searchParams.get('id') || '';
    if(!id) return json({error:'missing_id'},400);
    await db.prepare('DELETE FROM student_alerts WHERE id=? AND account_id=?')
      .bind(id, account).run();
    return json({ok:true});
  }

  return json({error:'method_not_allowed'},405);
}

