import { getCookie, clearCookie } from '../../../_utils/cookies.js';
import { json } from '../../../_utils/response.js';
export async function onRequest({ request, env }) {
  if (request.method!=='POST') return json({error:'method_not_allowed'},405);
  const sid=getCookie(request,'emp_sess');
  if(sid) await env.DB.prepare('DELETE FROM employer_sessions WHERE id=?').bind(sid).run();
  return json({ok:true},200,{ 'Set-Cookie': clearCookie('emp_sess') });
}
