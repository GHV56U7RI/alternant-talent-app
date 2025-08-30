import { extractToken, validateSession } from '../../../_utils/auth_student.js';
const json = (o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{'content-type':'application/json'}});

export async function onRequest({ request, env }) {
  const student = await validateSession(env, extractToken(request));
  if (!student) return json({authenticated:false});
  return json({authenticated:true, email: student.email});
}
