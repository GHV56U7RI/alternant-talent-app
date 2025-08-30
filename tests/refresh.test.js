import { expect, it, vi } from 'vitest';

vi.mock('../functions/api/_lib/ingest.js', () => ({
  insertMany: vi.fn().mockResolvedValue(1)
}));
vi.mock('../functions/api/collect/index.js', () => ({
  collectFromSources: vi.fn().mockResolvedValue({ from_adzuna: 2, from_jooble: 3, from_careers: 4 })
}));

import { onRequest } from '../functions/api/refresh.js';
import { insertMany } from '../functions/api/_lib/ingest.js';
import { collectFromSources } from '../functions/api/collect/index.js';

it('refresh seeds and collects jobs', async () => {
  const env = {
    ADMIN_TOKEN: 'secret',
    ASSETS: {
      fetch: async () => new Response(JSON.stringify([{ id: 1 }]), { status: 200 })
    }
  };
  const req = new Request('http://example.com/api/refresh', {
    method: 'POST',
    headers: { authorization: 'Bearer secret' }
  });
  const res = await onRequest({ request: req, env });
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.inserted_total).toBe(1 + 2 + 3 + 4);
  expect(insertMany).toHaveBeenCalled();
  expect(collectFromSources).toHaveBeenCalled();
});
