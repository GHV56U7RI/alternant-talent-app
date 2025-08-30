import { describe, it, expect } from 'vitest';
import { onRequest as logout } from '../functions/api/auth/logout.js';
import { onRequest as me } from '../functions/api/auth/me.js';

function makeEnv() {
  return {
    DB: {
      prepare: () => ({
        run: async () => ({}),
        bind: () => ({
          run: async () => ({}),
          all: async () => ({ results: [] })
        })
      })
    }
  };
}

describe('auth cookie handling', () => {
  it('handles requests without cookie', async () => {
    const env = makeEnv();
    const req = new Request('http://test');
    await expect(logout({ request: req, env })).resolves.toBeInstanceOf(Response);
    await expect(me({ request: req, env })).resolves.toBeInstanceOf(Response);
  });

  it('handles requests with cookie', async () => {
    const env = makeEnv();
    const req = new Request('http://test', { headers: { cookie: 'sess=abc' } });
    await expect(logout({ request: req, env })).resolves.toBeInstanceOf(Response);
    await expect(me({ request: req, env })).resolves.toBeInstanceOf(Response);
  });
});
