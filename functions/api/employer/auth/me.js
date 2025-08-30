import { getCookie } from '../../../_utils/cookies.js';
import { getDB } from '../../../_utils/db.js';
const json=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{'content-type':'application/json'}});
export async function onRequest({ request, env }) {
  const sid=getCookie(request,'emp_sess');
  if(!sid) return json({authenticated:false});
  const now=Math.floor(Date.now()/1000);
  const db=getDB(env);
  const row=await db.prepare(
    `SELECT a.email FROM employer_sessions s JOIN employer_accounts a ON a.id=s.account_id
     WHERE s.id=? AND s.expires_at>?`
  ).bind(sid,now).first();
  if(!row) return json({authenticated:false});
  return json({authenticated:true,email:row.email});
}
