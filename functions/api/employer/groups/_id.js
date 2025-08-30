import { authEmp } from '../../_utils/auth.js';
import { getDB } from '../../_utils/db.js';
const json=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{'content-type':'application/json'}});
export async function onRequest({request,env,params}){
  const db=getDB(env);
  const acc=await authEmp(request,env);
  if(!acc) return json({error:'unauthorized'},401);
  const id=params.id;
  const grp=await db.prepare('SELECT id,name FROM employer_groups WHERE id=? AND account_id=?').bind(id,acc.id).first();
  if(!grp) return json({error:'not_found'},404);
  if(request.method==='GET') return json(grp);
  if(request.method==='PUT'||request.method==='PATCH'){
    let body={}; try{body=await request.json();}catch{return json({error:'bad_json'},400);}
    const name=String(body.name||'').trim();
    if(!name) return json({error:'missing_fields'},400);
    await db.prepare('UPDATE employer_groups SET name=? WHERE id=? AND account_id=?').bind(name,id,acc.id).run();
    return json({id,name});
  }
  if(request.method==='DELETE'){
    await db.prepare('DELETE FROM employer_group_members WHERE group_id=?').bind(id).run();
    await db.prepare('DELETE FROM employer_groups WHERE id=? AND account_id=?').bind(id,acc.id).run();
    return json({ok:true});
  }
  return json({error:'method_not_allowed'},405);
}
