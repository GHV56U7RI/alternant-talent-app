import { authEmp } from '../../_utils/auth.js';
const json=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{'content-type':'application/json'}});
export async function onRequest({request,env}){
  const acc=await authEmp(request,env);
  if(!acc) return json({error:'unauthorized'},401);
  return json({id:acc.id,email:acc.email});
}
