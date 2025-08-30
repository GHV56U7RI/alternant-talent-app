import { getCookie, clearCookie } from '../../../_utils/cookies.js';
import { getDB } from '../../../_utils/db.js';
const json=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{'content-type':'application/json'}});
export async function onRequest({ request, env }) {
  if (request.method!=='POST') return json({error:'method_not_allowed'},405);
  const sid=getCookie(request,'emp_sess');
  const db = getDB(env);
  if(sid) await db.prepare('DELETE FROM employer_sessions WHERE id=?').bind(sid).run();
  return new Response(JSON.stringify({ok:true}),{
    headers:{'content-type':'application/json','Set-Cookie':clearCookie('emp_sess')}
  });
}
