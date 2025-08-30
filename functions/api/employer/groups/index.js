import { requireAuth } from '../../_utils/auth.js';
const json=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{'content-type':'application/json'}});
export async function onRequest({request,env}){
  const acc=await requireAuth(request,env,'employer');
  if(!acc) return json({error:'unauthorized'},401);
  if(request.method==='GET'){
    const rows=await env.DB.prepare('SELECT id,name,created_at FROM employer_groups WHERE account_id=?').bind(acc.id).all();
    return json(rows.results||[]);
  }
  if(request.method==='POST'){
    let body={}; try{body=await request.json();}catch{return json({error:'bad_json'},400);}
    const name=String(body.name||'').trim();
    if(!name) return json({error:'missing_fields'},400);
    const id=crypto.randomUUID();
    await env.DB.prepare('INSERT INTO employer_groups (id,account_id,name) VALUES (?,?,?)').bind(id,acc.id,name).run();
    return json({id,name});
  }
  return json({error:'method_not_allowed'},405);
}
