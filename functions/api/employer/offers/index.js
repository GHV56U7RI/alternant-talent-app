import { requireAuth } from '../../../../_utils/auth.js';
const json=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{'content-type':'application/json'}});
export async function onRequest({request,env}){
  const acc=await requireAuth(request,env,'employer');
  if(!acc) return json({error:'unauthorized'},401);
  if(request.method==='GET'){
    const rows=await env.DB.prepare('SELECT id,title,description,created_at FROM employer_offers WHERE account_id=? ORDER BY created_at DESC').bind(acc.id).all();
    return json(rows.results||[]);
  }
  if(request.method==='POST'){
    let body={}; try{body=await request.json();}catch{return json({error:'bad_json'},400);}
    const title=String(body.title||'').trim();
    const description=String(body.description||'').trim();
    if(!title) return json({error:'missing_fields'},400);
    const id=crypto.randomUUID();
    await env.DB.prepare('INSERT INTO employer_offers (id,account_id,title,description) VALUES (?,?,?,?)').bind(id,acc.id,title,description).run();
    return json({id,title,description});
  }
  return json({error:'method_not_allowed'},405);
}
