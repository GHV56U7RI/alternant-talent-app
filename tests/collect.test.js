import { expect, it, vi } from 'vitest';

vi.mock('../functions/api/_lib/sources/adzuna.js', () => ({
  collectFromAdzuna: vi.fn().mockResolvedValue({ from_adzuna: 1 })
}));
vi.mock('../functions/api/_lib/sources/jooble.js', () => ({
  collectFromJooble: vi.fn().mockResolvedValue({ from_jooble: 2 })
}));
vi.mock('../functions/api/collect/greenhouse.js', () => ({
  collectGreenhouse: vi.fn().mockResolvedValue(3)
}));
vi.mock('../functions/api/collect/lever.js', () => ({
  collectLever: vi.fn().mockResolvedValue(0)
}));
vi.mock('../functions/api/collect/smartrecruiters.js', () => ({
  collectSmartRecruiters: vi.fn().mockResolvedValue(0)
}));
vi.mock('../functions/api/collect/workday.js', () => ({
  collectWorkday: vi.fn().mockResolvedValue(0)
}));

import { collectFromSources } from '../functions/api/collect/index.js';

it('aggregates job sources', async () => {
  const env = {
    ASSETS: {
      fetch: async () => new Response(JSON.stringify([{ name: 'Co', greenhouse: { board: 'b' } }]), { status: 200 })
    }
  };
  const result = await collectFromSources(env, new Request('http://example.com'));
  expect(result.from_adzuna).toBe(1);
  expect(result.from_jooble).toBe(2);
  expect(result.from_careers).toBe(3);
});
