import logger from '../../../src/logger.js';

export async function onRequest({ params, env }) {
  const id = params.id;
  if (env.DEBUG) logger.debug('GET /api/jobs/:id', { id });
  const job = await env.DB.prepare('SELECT * FROM jobs WHERE id=?').bind(id).first();
  if (!job) {
    return new Response(JSON.stringify({ error: 'not_found' }), {
      status: 404,
      headers: { 'content-type': 'application/json' }
    });
  }
  const tags = (() => { try { return JSON.parse(job.tags || '[]'); } catch { return []; } })();
  const body = {
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    description: job.description,
    url: job.url,
    source: job.source,
    tags,
    created_at: job.created_at
  };
  return new Response(JSON.stringify(body), {
    headers: { 'content-type': 'application/json' }
  });
}
