import { getCookie } from './cookies.js';

export function extractToken(req, name) {
  const auth = req.headers.get('authorization') || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);
  return getCookie(req, name);
}

export async function validateSession(env, sql, token) {
  const now = Math.floor(Date.now() / 1000);
  return await env.DB.prepare(sql).bind(token, now).first();
}

export const authMiddleware = (opts) => async ({ request, env, data }, next) => {
  const token = extractToken(request, opts.cookie);
  data.session = token ? await validateSession(env, opts.sql, token) : null;
  return next();
};

export async function requireAuth(request, env, type = 'employer') {
  const configs = {
    employer: {
      cookie: 'emp_sess',
      sql: `SELECT a.id,a.email FROM employer_sessions s JOIN employer_accounts a ON a.id=s.account_id
           WHERE s.id=? AND s.expires_at>?`
    },
    student: {
      cookie: 'stud_sess',
      sql: `SELECT a.id,a.email FROM student_sessions s JOIN student_accounts a ON a.id=s.account_id
           WHERE s.id=? AND s.expires_at>?`
    }
  };
  const cfg = configs[type];
  if (!cfg) throw new Error('invalid auth type');
  const token = extractToken(request, cfg.cookie);
  if (!token) return null;
  return await validateSession(env, cfg.sql, token);
}

export const authEmp = (req, env) => requireAuth(req, env, 'employer');

