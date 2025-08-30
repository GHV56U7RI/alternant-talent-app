import { ensureEventsSchema } from '../../_utils/ensure.js';
import { json } from '../../_utils/response.js';

export async function onRequest({ request, env }) {
  if (request.method !== 'POST') return json({error:'method_not_allowed'},405);
  const { job_id } = await request.json().catch(()=> ({}));
  if (!job_id) return json({error:'invalid_input'},400);
  await ensureEventsSchema(env.DB);
  await env.DB.prepare(`INSERT INTO events (type, job_id) VALUES ('apply', ?)`).bind(job_id).run();
  return json({ok:true});
}

