import { requireAuth } from '../../../../_utils/auth.js';
const json=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{'content-type':'application/json'}});
export async function onRequest({request,env,params}){
  const acc=await requireAuth(request,env,'employer');
  if(!acc) return json({error:'unauthorized'},401);
  const id=params.id;
  const offer=await env.DB.prepare('SELECT id,title,description,created_at FROM employer_offers WHERE id=? AND account_id=?').bind(id,acc.id).first();
  if(!offer) return json({error:'not_found'},404);
  if(request.method==='GET') return json(offer);
  if(request.method==='PUT'||request.method==='PATCH'){
    let body={}; try{body=await request.json();}catch{return json({error:'bad_json'},400);}
    const title=String(body.title||'').trim();
    const description=String(body.description||'').trim();
    if(!title) return json({error:'missing_fields'},400);
    await env.DB.prepare('UPDATE employer_offers SET title=?,description=? WHERE id=? AND account_id=?').bind(title,description,id,acc.id).run();
    return json({id,title,description});
  }
  if(request.method==='DELETE'){
    await env.DB.prepare('DELETE FROM employer_offers WHERE id=? AND account_id=?').bind(id,acc.id).run();
    return json({ok:true});
  }
  return json({error:'method_not_allowed'},405);
}
