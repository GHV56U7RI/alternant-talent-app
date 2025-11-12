/**
 * Cloudflare Pages Function pour l'authentification OAuth GitHub
 * Route: /api/auth
 */

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);

  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: `${url.origin}/api/auth/callback`,
    scope: 'repo,user'
  });

  const githubAuthUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;

  return Response.redirect(githubAuthUrl, 302);
}
