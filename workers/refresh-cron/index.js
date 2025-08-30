import logger from '../../src/logger.js';

async function run(env) {
  const res = await fetch(`${env.BASE_URL}/api/refresh`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.ADMIN_TOKEN}` }
  });
  const text = await res.text().catch(()=> '');
  logger.info("refresh-cron: called", env.BASE_URL, res.status, text.slice(0,200));
  return { ok: res.ok, status: res.status, body: text };
}

export default {
  async scheduled(event, env, ctx) {
    logger.info("refresh-cron: tick", new Date().toISOString(), env.BASE_URL);
    ctx.waitUntil(run(env));
  },
  async fetch(request, env) {
    // Appel manuel: GET / ou POST /run
    if (request.method === "POST" || new URL(request.url).pathname === "/run") {
      const result = await run(env);
      return new Response(JSON.stringify(result), { headers: { "content-type": "application/json" }});
    }
    return new Response("ok");
  }
};
