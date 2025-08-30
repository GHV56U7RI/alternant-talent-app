import { requireAuth } from '../../../_utils/auth.js';
const json=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{'content-type':'application/json'}});
export async function onRequest({ request, env }) {
  const acc=await requireAuth(request,env,'employer');
  if(!acc) return json({authenticated:false});
  return json({authenticated:true,email:acc.email});
}
