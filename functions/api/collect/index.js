import { collectFromAdzuna } from '../_lib/sources/adzuna.js';
import { collectFromJooble } from '../_lib/sources/jooble.js';
import { collectGreenhouse } from './greenhouse.js';
import { collectLever } from './lever.js';
import { collectSmartRecruiters } from './smartrecruiters.js';
import { collectWorkday } from './workday.js';

export async function collectFromSources(env, request) {
  // 1) agrégateurs FR
  const a = await collectFromAdzuna(env, { what: "alternance", results: 50 });
  const j = await collectFromJooble(env, { keywords: "alternance", location: "France", limit: 50 });

  // 2) entreprises (depuis public/data/sources.json)
  const origin = new URL(request.url).origin;
  const res = await env.ASSETS.fetch(new Request(new URL('/data/sources.json', origin), { method: 'GET' }));
  const sources = await res.json().catch(() => ([]));

  let careersAdded = 0;
  for (const s of sources) {
    if (s.greenhouse?.board) careersAdded += await collectGreenhouse({ board: s.greenhouse.board, companyLabel: s.name }, env);
    if (s.lever?.company)   careersAdded += await collectLever({ company: s.lever.company, companyLabel: s.name }, env);
    if (s.smart?.company)   careersAdded += await collectSmartRecruiters({ company: s.smart.company, companyLabel: s.name }, env);
    if (s.workday?.host)    careersAdded += await collectWorkday({ ...s.workday, companyLabel: s.name }, env);
  }

  return { ...a, ...j, from_careers: careersAdded };
}
