import { requireAuth } from '../../../_utils/auth.js';
import { json } from '../../../_utils/response.js';
export async function onRequest({request,env}){
  const acc=await requireAuth(request,env,'employer');
  if(!acc) return json({error:'unauthorized'},401);
  if(request.method==='GET'){
    const rows=await env.DB.prepare('SELECT id,name,email,offer_id,created_at FROM employer_candidates WHERE account_id=?').bind(acc.id).all();
    return json(rows.results||[]);
  }
  if(request.method==='POST'){
    let body={}; try{body=await request.json();}catch{return json({error:'bad_json'},400);}
    const name=String(body.name||'').trim();
    const email=String(body.email||'').trim().toLowerCase();
    const offer=body.offer_id||null;
    if(!name||!email) return json({error:'missing_fields'},400);
    const id=crypto.randomUUID();
    await env.DB.prepare('INSERT INTO employer_candidates (id,account_id,name,email,offer_id) VALUES (?,?,?,?,?)').bind(id,acc.id,name,email,offer).run();
    return json({id,name,email,offer_id:offer});
  }
  return json({error:'method_not_allowed'},405);
}
