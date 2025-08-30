import { describe, it, expect, vi } from 'vitest';
import { getDB as realGetDB } from '../functions/_utils/db.js';
import { pbkdf2Hash } from '../functions/_utils/crypto.js';

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

describe('getDB', () => {
  it('returns env.DB', () => {
    const db = {};
    expect(realGetDB({ DB: db })).toBe(db);
  });
});

describe('endpoint initialization', () => {
  it('uses getDB to access the database', async () => {
    vi.resetModules();
    const getDBMock = vi.fn();
    vi.doMock('../functions/_utils/db.js', () => ({ getDB: getDBMock }));
    const { onRequest: studentLogin } = await import('../functions/api/student/auth/login.js');

    const email = 'student@example.com';
    const password = 'secret';
    const password_hash = await pbkdf2Hash(password, email);
    const db = makeDBStub('student', { id: 's1', email, password_hash });
    getDBMock.mockReturnValue(db);

    const req = new Request('http://test', { method: 'POST', body: JSON.stringify({ email, password }) });
    const env = {};
    const res = await studentLogin({ request: req, env });

    expect(getDBMock).toHaveBeenCalledWith(env);
    expect(res.status).toBe(200);
  });
});
