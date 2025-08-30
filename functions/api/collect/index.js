import { collectGreenhouse } from './greenhouse.js';
import { collectLever } from './lever.js';
import { collectSmartRecruiters } from './smartrecruiters.js';
import { collectWorkday } from './workday.js';

export async function collectFromSources(env, request) {
  // sources.json sera dans /public/data/ pour édition facile via Git
  const origin = new URL(request.url).origin;
  const srcURL = new URL('/data/sources.json', origin);
  const res = await env.ASSETS.fetch(new Request(srcURL, { method: 'GET' }));
  if (!res.ok) return [];
  const sources = await res.json().catch(()=> ([]));
  if (!Array.isArray(sources)) return [];

  const results = [];
  for (const s of sources) {
    try {
      if (s.platform === 'greenhouse') {
        results.push(...await collectGreenhouse({ board: s.board, companyLabel: s.company }));
      } else if (s.platform === 'lever') {
        results.push(...await collectLever({ company: s.companySlug, companyLabel: s.company }));
      } else if (s.platform === 'smartrecruiters') {
        results.push(...await collectSmartRecruiters({ company: s.companySlug, companyLabel: s.company }));
      } else if (s.platform === 'workday') {
        results.push(...await collectWorkday({ host: s.host, tenant: s.tenant, site: s.site, search: s.search || 'alternance', companyLabel: s.company }));
      }
    } catch (e) {
      // continue on error
    }
  }
  return results;
}

