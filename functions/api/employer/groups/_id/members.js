import { requireAuth } from '../../../_utils/auth.js';
const json=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{'content-type':'application/json'}});
export async function onRequest({request,env,params}){
  const acc=await requireAuth(request,env,'employer');
  if(!acc) return json({error:'unauthorized'},401);
  const gid=params.id;
  const grp=await env.DB.prepare('SELECT id FROM employer_groups WHERE id=? AND account_id=?').bind(gid,acc.id).first();
  if(!grp) return json({error:'not_found'},404);
  if(request.method==='GET'){
    const rows=await env.DB.prepare(
      'SELECT c.id,c.name,c.email FROM employer_group_members gm JOIN employer_candidates c ON c.id=gm.candidate_id WHERE gm.group_id=?'
    ).bind(gid).all();
    return json(rows.results||[]);
  }
  if(request.method==='POST'){
    let body={}; try{body=await request.json();}catch{return json({error:'bad_json'},400);}
    const cid=String(body.candidate_id||'');
    if(!cid) return json({error:'missing_fields'},400);
    const c=await env.DB.prepare('SELECT id FROM employer_candidates WHERE id=? AND account_id=?').bind(cid,acc.id).first();
    if(!c) return json({error:'invalid_candidate'},400);
    await env.DB.prepare('INSERT OR IGNORE INTO employer_group_members (group_id,candidate_id) VALUES (?,?)').bind(gid,cid).run();
    return json({ok:true});
  }
  if(request.method==='DELETE'){
    let body={}; try{body=await request.json();}catch{return json({error:'bad_json'},400);}
    const cid=String(body.candidate_id||'');
    if(!cid) return json({error:'missing_fields'},400);
    await env.DB.prepare('DELETE FROM employer_group_members WHERE group_id=? AND candidate_id=?').bind(gid,cid).run();
    return json({ok:true});
  }
  return json({error:'method_not_allowed'},405);
}
