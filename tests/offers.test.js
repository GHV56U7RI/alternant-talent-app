import { describe, it, expect } from 'vitest';
import { insertMany } from '../functions/api/_lib/ingest.js';

describe('insertMany', () => {
  it('normalizes and inserts jobs', async () => {
    const inserted = [];
    const env = {
      DB: {
        prepare: () => ({
          bind: (...args) => ({
            run: async () => {
              inserted.push(args);
            }
          })
        })
      }
    };
    const jobs = [{ title: '', company: '', location: 'Paris', url: 'http://x', source: 'seed' }];
    const n = await insertMany(env, jobs);
    expect(n).toBe(1);
    expect(inserted.length).toBe(1);
    expect(inserted[0][1]).toBe('Sans titre');
    expect(inserted[0][2]).toBe('Entreprise');
  });
});
