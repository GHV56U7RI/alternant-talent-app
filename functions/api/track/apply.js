import { ensureEventsSchema } from '../../_utils/ensure.js';
export async function onRequest({ request, env }) {
  if (request.method !== 'POST') return new Response('{"error":"method_not_allowed"}',{status:405});
  const { job_id } = await request.json().catch(()=> ({}));
  if (!job_id) return new Response('{"error":"invalid_input"}',{status:400});
  await ensureEventsSchema(env.DB);
  await env.DB.prepare(`INSERT INTO events (type, job_id) VALUES ('apply', ?)`).bind(job_id).run();
  return new Response('{"ok":true}',{headers:{'content-type':'application/json'}});
}

