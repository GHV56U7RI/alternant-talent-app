import { ensureEventsSchema } from '../../_utils/ensure.js';
import { getDB } from '../../_utils/db.js';
export async function onRequest({ request, env }) {
  if (request.method !== 'POST') return new Response('{"error":"method_not_allowed"}',{status:405});
  const { job_id } = await request.json().catch(()=> ({}));
  if (!job_id) return new Response('{"error":"invalid_input"}',{status:400});
  const db = getDB(env);
  await ensureEventsSchema(db);
  await db.prepare(`INSERT INTO events (type, job_id) VALUES ('apply', ?)`).bind(job_id).run();
  return new Response('{"ok":true}',{headers:{'content-type':'application/json'}});
}

