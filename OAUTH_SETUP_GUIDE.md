# 🔐 Guide de configuration OAuth GitHub pour Decap CMS

## ✅ Ce qui a été créé

- ✅ Worker d'authentification dans `/workers/auth/`
- ✅ Configuration wrangler.toml pour le worker

## 📋 Étapes à suivre

### 1️⃣ Créer l'OAuth App sur GitHub

1. Allez sur https://github.com/settings/developers
2. Cliquez **"OAuth Apps"** → **"New OAuth App"**
3. Remplissez :
   - **Application name**: `Alternant Talent CMS`
   - **Homepage URL**: `https://alternant-talent.com`
   - **Authorization callback URL**: `https://alternant-talent.com/api/auth/callback`
4. Cliquez **"Register application"**
5. **Copiez le `Client ID`**
6. Cliquez **"Generate a new client secret"** et **copiez le `Client Secret`**

⚠️ **Important** : Gardez ces informations en sécurité !

---

### 2️⃣ Déployer le Worker d'authentification

Ouvrez un terminal et exécutez :

```bash
cd workers/auth
npx wrangler deploy
```

Le worker sera déployé sur Cloudflare et gérera les routes `/api/auth` et `/api/auth/callback`.

---

### 3️⃣ Configurer les secrets

Configurez les secrets du worker (remplacez les valeurs par celles obtenues à l'étape 1) :

```bash
cd workers/auth

# Configurer le Client ID
npx wrangler secret put GITHUB_CLIENT_ID
# Quand demandé, collez votre Client ID et appuyez sur Entrée

# Configurer le Client Secret
npx wrangler secret put GITHUB_CLIENT_SECRET
# Quand demandé, collez votre Client Secret et appuyez sur Entrée
```

---

### 4️⃣ Vérifier que tout fonctionne

1. Allez sur https://alternant-talent.com/admin
2. Cliquez sur **"Login with GitHub"**
3. Vous serez redirigé vers GitHub pour autoriser l'application
4. Après autorisation, vous serez redirigé vers le CMS et connecté ! 🎉

---

## 🧪 Tester en local (sans OAuth)

Si vous voulez juste tester le CMS sans configurer OAuth :

```bash
# Terminal 1
npm run proxy

# Terminal 2
npm run dev

# Allez sur http://localhost:5173/admin
```

En local, pas besoin d'OAuth ! Le proxy gère tout.

---

## 🔧 Dépannage

### Le bouton "Login with GitHub" ne fait rien
- Vérifiez que le worker est déployé : `cd workers/auth && npx wrangler deployments list`
- Vérifiez les secrets : les deux secrets doivent être configurés

### Erreur "OAuth error" après connexion GitHub
- Vérifiez que l'URL de callback dans GitHub OAuth App est exactement : `https://alternant-talent.com/api/auth/callback`
- Vérifiez que les secrets sont corrects

### Le worker ne se déploie pas
- Assurez-vous d'être authentifié avec Cloudflare : `npx wrangler login`
- Vérifiez que le domaine `alternant-talent.com` est bien configuré dans votre compte Cloudflare

---

## 📝 Workflow complet après configuration

1. Aller sur https://alternant-talent.com/admin
2. Se connecter avec GitHub
3. Modifier un article
4. Sauvegarder
5. Le CMS commit automatiquement sur GitHub
6. La GitHub Action détecte le commit
7. Rebuild et redéploiement automatique (~2 minutes)
8. Les changements sont visibles sur /blog

---

## 🎯 Résumé des commandes

```bash
# Déployer le worker
cd workers/auth
npx wrangler deploy

# Configurer les secrets
npx wrangler secret put GITHUB_CLIENT_ID
npx wrangler secret put GITHUB_CLIENT_SECRET

# Tester le worker
curl -I https://alternant-talent.com/api/auth
```

Si tout est configuré correctement, vous verrez une redirection (302) vers GitHub.
