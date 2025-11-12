/**
 * Cloudflare Pages Function pour le callback OAuth GitHub
 * Route: /api/auth/callback
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

    // Retourner le token au CMS via postMessage
    const token = tokenData.access_token;
    const provider = 'github';

    return new Response(`
<!DOCTYPE html>
<html>
<head>
  <title>Authenticating...</title>
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
  </style>
</head>
<body>
  <div class="message">
    <h2>✓ Authentication successful!</h2>
    <p>This window will close automatically...</p>
  </div>
  <script>
    (function() {
      const token = ${JSON.stringify(token)};
      const provider = 'github';

      // Format exact attendu par Decap CMS v3
      const message = 'authorization:' + provider + ':success:' + JSON.stringify({
        token: token,
        provider: provider
      });

      // Fonction pour envoyer le message
      function postMessageToParent() {
        if (!window.opener) {
          console.error('No window.opener found');
          return;
        }

        try {
          // Envoyer le message dans le format Decap CMS
          window.opener.postMessage(message, window.location.origin);

          // Aussi essayer avec wildcard pour compatibilité
          window.opener.postMessage(message, '*');

          console.log('Message sent to parent:', message);
        } catch (e) {
          console.error('Error sending postMessage:', e);
        }
      }

      // Attendre que la page soit complètement chargée
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', postMessageToParent);
      } else {
        postMessageToParent();
      }

      // Réessayer plusieurs fois pour garantir la réception
      setTimeout(postMessageToParent, 100);
      setTimeout(postMessageToParent, 500);
      setTimeout(postMessageToParent, 1000);

      // Fermer la fenêtre après 3 secondes
      setTimeout(function() {
        try {
          window.close();
        } catch (e) {
          console.log('Could not close window automatically');
        }
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
