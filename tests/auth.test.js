import { describe, it, expect } from 'vitest';
import { pbkdf2Hash } from '../functions/_utils/crypto.js';
import { onRequest as studentLogin } from '../functions/api/student/auth/login.js';
import { onRequest as employerLogin } from '../functions/api/employer/auth/login.js';

function makeDBStub(prefix, account) {
  return {
    prepare(sql) {
      if (sql.includes(`${prefix}_accounts`)) {
        return {
          bind: (email) => ({
            first: async () => (account && account.email === email ? { id: account.id, password_hash: account.password_hash } : null)
          })
        };
      }
      if (sql.includes(`${prefix}_sessions`)) {
        return {
          bind: () => ({ run: async () => ({}) })
        };
      }
      throw new Error('unexpected sql ' + sql);
    }
  };
}

describe('student auth', () => {
  it('logs in with valid credentials', async () => {
    const email = 'student@example.com';
    const password = 'secret';
    const password_hash = await pbkdf2Hash(password, email);
    const env = { DB: makeDBStub('student', { id: 's1', email, password_hash }) };
    const req = new Request('http://test', { method: 'POST', body: JSON.stringify({ email, password }) });
    const res = await studentLogin({ request: req, env });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, email });
  });
});

describe('employer auth', () => {
  it('logs in with valid credentials', async () => {
    const email = 'boss@example.com';
    const password = 'secret';
    const password_hash = await pbkdf2Hash(password, email);
    const env = { DB: makeDBStub('employer', { id: 'e1', email, password_hash }) };
    const req = new Request('http://test', { method: 'POST', body: JSON.stringify({ email, password }) });
    const res = await employerLogin({ request: req, env });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, email });
  });
});
