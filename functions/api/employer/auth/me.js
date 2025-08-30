import { requireAuth } from '../../../_utils/auth.js';
import { json } from '../../../_utils/response.js';
export async function onRequest({ request, env }) {
  const acc=await requireAuth(request,env,'employer');
  if(!acc) return json({authenticated:false});
  return json({authenticated:true,email:acc.email});
}
