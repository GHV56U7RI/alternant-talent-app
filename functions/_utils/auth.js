import { getCookie } from './cookies.js';
import { getDB } from './db.js';
export const authEmp=async (req,env)=>{
  const sid=getCookie(req,'emp_sess');
  if(!sid) return null;
  const now=Math.floor(Date.now()/1000);
  return await getDB(env).prepare(
    `SELECT a.id,a.email FROM employer_sessions s JOIN employer_accounts a ON a.id=s.account_id
     WHERE s.id=? AND s.expires_at>?`
  ).bind(sid,now).first();
};
