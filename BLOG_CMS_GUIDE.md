# Guide CMS - Alternant Talent Blog

## 🎯 Comment éditer les articles du blog

### En local (développement)

1. **Démarrer le serveur proxy CMS**
   ```bash
   npm run proxy
   ```

2. **Dans un autre terminal, démarrer l'app**
   ```bash
   npm run dev
   ```

3. **Accéder au CMS**
   - Ouvrir http://localhost:5173/admin
   - Vous pouvez maintenant éditer les articles
   - Les modifications sont sauvegardées dans `content/posts/`

4. **Voir les changements**
   - Les articles sont automatiquement rechargés
   - Le fichier `public/data/blog/search.json` est régénéré au build

### En production

#### Configuration GitHub (à faire une seule fois)

1. **Créer une OAuth App GitHub**
   - Aller sur https://github.com/settings/developers
   - Cliquer "New OAuth App"
   - Remplir :
     - Application name: `Alternant Talent CMS`
     - Homepage URL: `https://alternant-talent.com`
     - Authorization callback URL: `https://alternant-talent.com/api/auth/callback`
   - Copier le `Client ID` et `Client Secret`

2. **Créer l'endpoint d'authentification**

   Vous devez créer un Cloudflare Worker pour gérer l'OAuth :

   ```javascript
   // workers/auth/index.js
   export default {
     async fetch(request, env) {
       const url = new URL(request.url);

       if (url.pathname === '/api/auth') {
         // Redirect to GitHub OAuth
         const githubUrl = `https://github.com/login/oauth/authorize?client_id=${env.GITHUB_CLIENT_ID}&scope=repo`;
         return Response.redirect(githubUrl, 302);
       }

       if (url.pathname === '/api/auth/callback') {
         const code = url.searchParams.get('code');

         // Exchange code for token
         const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
           method: 'POST',
           headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
           body: JSON.stringify({
             client_id: env.GITHUB_CLIENT_ID,
             client_secret: env.GITHUB_CLIENT_SECRET,
             code
           })
         });

         const data = await tokenResponse.json();

         // Return token to CMS
         return new Response(`
           <script>
             window.opener.postMessage({
               type: 'authorization',
               provider: 'github',
               token: '${data.access_token}'
             }, window.location.origin);
             window.close();
           </script>
         `, {
           headers: { 'Content-Type': 'text/html' }
         });
       }

       return new Response('Not found', { status: 404 });
     }
   };
   ```

3. **Déployer le worker**
   ```bash
   cd workers/auth
   wrangler deploy
   ```

4. **Ajouter les secrets**
   ```bash
   wrangler secret put GITHUB_CLIENT_ID
   wrangler secret put GITHUB_CLIENT_SECRET
   ```

5. **Ajouter le token Cloudflare aux secrets GitHub**
   - Aller sur https://github.com/octoberone/alternant-talent-app/settings/secrets/actions
   - Créer `CLOUDFLARE_API_TOKEN`
   - Obtenir le token depuis https://dash.cloudflare.com/profile/api-tokens

#### Utiliser le CMS en production

1. **Accéder au CMS**
   - Aller sur https://alternant-talent.com/admin
   - Cliquer "Login with GitHub"
   - Autoriser l'application

2. **Éditer un article**
   - Sélectionner l'article à modifier
   - Faire les changements
   - Cliquer "Save"
   - Le CMS commit directement sur GitHub

3. **Publication automatique**
   - Quand vous sauvegardez, un commit est créé sur la branche `main`
   - GitHub Action détecte le changement dans `content/posts/`
   - L'action rebuild et redéploie automatiquement
   - Les changements sont visibles en ~2 minutes

## 🔧 Workflow complet

```
1. Éditer article dans /admin
   ↓
2. Sauvegarder (commit GitHub)
   ↓
3. GitHub Action détecte le changement
   ↓
4. Rebuild automatique (regénère search.json)
   ↓
5. Redéploiement sur Cloudflare Pages
   ↓
6. Article mis à jour sur /blog
```

## 📝 Types d'articles

Il y a deux types d'articles :
- **Actualité** : Articles de blog classiques
- **Fonctionnalité** : Articles sur les fonctionnalités du produit

Vous pouvez choisir le type dans le champ "Type d'article" du CMS.

## ⚡ Développement rapide sans OAuth

Si vous voulez juste tester en local sans configurer OAuth :

1. Modifier directement les fichiers MDX dans `content/posts/`
2. Lancer `npm run build` pour régénérer search.json
3. Les changements seront visibles

## 🐛 Dépannage

### Le CMS ne sauvegarde pas
- Vérifier que le proxy est lancé (`npm run proxy`)
- Vérifier que vous êtes authentifié sur GitHub

### Les changements ne s'affichent pas sur /blog
- Vérifier que `search.json` a été régénéré
- Lancer `npm run build` manuellement
- Recharger la page avec Ctrl+Shift+R (hard refresh)

### L'authentification GitHub ne fonctionne pas
- Vérifier que le worker auth est déployé
- Vérifier que les secrets sont configurés
- Vérifier l'URL de callback dans les settings GitHub OAuth
