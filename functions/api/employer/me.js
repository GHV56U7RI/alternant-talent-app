import { requireAuth } from '../../_utils/auth.js';
import { json } from '../../_utils/response.js';
export async function onRequest({request,env}){
  const acc=await requireAuth(request,env,'employer');
  if(!acc) return json({error:'unauthorized'},401);
  return json({id:acc.id,email:acc.email});
}
