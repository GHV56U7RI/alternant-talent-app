/**
 * Cloudflare Pages Function pour le callback OAuth GitHub
 * Route: /api/auth/callback
 *
 * Ce callback implémente le format exact attendu par Decap CMS
 * en s'inspirant de netlify-cms-github-oauth-provider
 */

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return new Response('Error: No code provided', { status: 400 });
  }

  try {
    // Échanger le code contre un access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code: code,
        redirect_uri: `${url.origin}/api/auth/callback`
      })
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('GitHub OAuth error:', tokenData);
      return new Response(`OAuth Error: ${tokenData.error_description}`, { status: 400 });
    }

    const token = tokenData.access_token;

    // HTML avec le script exact de netlify-cms-github-oauth-provider
    return new Response(`
<!DOCTYPE html>
<html>
<head>
  <title>Authorization successful</title>
  <meta charset="utf-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      background: #f5f5f5;
    }
    .message {
      text-align: center;
      padding: 2rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .success {
      color: #22c55e;
      font-size: 48px;
      margin-bottom: 1rem;
    }
  </style>
</head>
<body>
  <div class="message">
    <div class="success">✓</div>
    <h2>Authorization successful</h2>
    <p>You can close this window.</p>
  </div>
  <script>
    // Script exact de netlify-cms-github-oauth-provider
    (function() {
      function recieveMessage(e) {
        console.log('Received message:', e);
        if (e.data && e.data.type === 'authorizing') {
          window.addEventListener('message', recieveMessage, false);

          // Envoyer le token au parent (Decap CMS)
          const data = {
            token: ${JSON.stringify(token)},
            provider: 'github'
          };

          window.opener.postMessage(
            'authorization:github:success:' + JSON.stringify(data),
            e.origin
          );

          // Aussi envoyer le format alternatif
          window.opener.postMessage(data, e.origin);
        }
      }

      window.addEventListener('message', recieveMessage, false);

      // Notifier qu'on est prêt
      window.opener.postMessage('authorizing:github', '*');

      // Auto-fermeture après 3 secondes
      setTimeout(function() {
        window.close();
      }, 3000);
    })();
  </script>
</body>
</html>
    `, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      }
    });

  } catch (error) {
    console.error('Auth error:', error);
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
}
