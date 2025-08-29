export default {
  async scheduled(event, env, ctx) {
    await fetch(`${env.BASE_URL}/api/refresh`, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.ADMIN_TOKEN}` }
    });
  }
};
