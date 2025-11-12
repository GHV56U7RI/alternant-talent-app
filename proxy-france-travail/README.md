# Proxy France Travail (Pôle Emploi)

Serveur proxy Node.js pour contourner les restrictions CORS de Cloudflare Workers lors des appels à l'API France Travail (ex-Pôle Emploi).

## 🎯 Pourquoi ce proxy ?

L'API France Travail utilise OAuth2 et a des restrictions CORS qui empêchent les appels directs depuis Cloudflare Workers/Pages. Ce proxy Node.js :
- Gère l'authentification OAuth2 (client credentials flow)
- Met en cache les tokens d'accès
- Transforme les réponses au format attendu par votre application
- Contourne les restrictions CORS

## 🚀 Déploiement rapide sur Railway

### 1. Créer un compte Railway

Allez sur [railway.app](https://railway.app) et créez un compte (gratuit).

### 2. Obtenir les credentials France Travail

1. Allez sur [pole-emploi.io](https://pole-emploi.io/inscription)
2. Créez un compte
3. Créez une nouvelle application
4. Sélectionnez l'API "Offres d'emploi v2"
5. Notez votre `CLIENT_ID` et `CLIENT_SECRET`

### 3. Déployer sur Railway

#### Option A : Via GitHub (Recommandé)

```bash
# 1. Pusher le code sur GitHub
cd /chemin/vers/proxy-france-travail
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/votre-username/france-travail-proxy.git
git push -u origin main

# 2. Sur Railway.app
# - Cliquez "New Project"
# - Sélectionnez "Deploy from GitHub repo"
# - Autorisez Railway à accéder à votre repo
# - Sélectionnez le repo france-travail-proxy
```

#### Option B : Via Railway CLI

```bash
# Installer Railway CLI
npm install -g @railway/cli

# Se connecter
railway login

# Créer un nouveau projet
railway init

# Déployer
railway up

# Configurer les variables d'environnement
railway variables set FRANCE_TRAVAIL_CLIENT_ID=votre_client_id
railway variables set FRANCE_TRAVAIL_CLIENT_SECRET=votre_client_secret

# Obtenir l'URL publique
railway domain
```

### 4. Configurer dans Cloudflare Pages

Une fois le proxy déployé, vous obtiendrez une URL comme `https://votre-app.up.railway.app`.

Ajoutez cette variable dans Cloudflare Pages :

```bash
# Via le dashboard Cloudflare
# Settings > Environment variables > Production
FRANCE_TRAVAIL_PROXY_URL=https://votre-app.up.railway.app
```

## 🧪 Tester le proxy

### Localement

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer les credentials
cp .env.example .env
# Éditez .env avec vos vrais credentials

# 3. Démarrer le serveur
npm start

# 4. Tester
curl http://localhost:3003/health
curl "http://localhost:3003/api/jobs?query=alternance&limit=10"
```

### En production

```bash
# Tester la santé
curl https://votre-app.up.railway.app/health

# Tester la recherche
curl "https://votre-app.up.railway.app/api/jobs?query=alternance&limit=10"
```

## 📡 Endpoints disponibles

### GET /health

Vérifier l'état du serveur.

**Réponse :**
```json
{
  "status": "ok",
  "service": "france-travail-proxy",
  "timestamp": "2025-01-04T10:30:00.000Z",
  "hasCredentials": true
}
```

### GET /api/jobs

Rechercher des offres d'alternance.

**Paramètres de requête :**
- `query` (optionnel) : Mot-clé de recherche (défaut: "alternance")
- `location` (optionnel) : Nom de la commune
- `limit` (optionnel) : Nombre max de résultats (défaut: 500, max: 150 par requête)

**Exemple :**
```bash
curl "https://votre-proxy.railway.app/api/jobs?query=développeur&location=Paris&limit=50"
```

**Réponse :**
```json
{
  "success": true,
  "count": 45,
  "jobs": [
    {
      "id": "francetravail-123456",
      "title": "Alternance Développeur Full Stack",
      "company": "TechCorp",
      "location": "Paris (75)",
      "tags": ["alternance", "javascript", "react"],
      "url": "https://candidat.francetravail.fr/offres/recherche/detail/123456",
      "source": "france-travail",
      "posted": "il y a 2 jours",
      "description": "...",
      "logo_domain": "techcorp.com",
      "logo_url": null
    }
  ]
}
```

## 🔧 Variables d'environnement

| Variable | Description | Requis |
|----------|-------------|--------|
| `FRANCE_TRAVAIL_CLIENT_ID` | Client ID de l'API France Travail | ✅ Oui |
| `FRANCE_TRAVAIL_CLIENT_SECRET` | Client Secret de l'API France Travail | ✅ Oui |
| `PORT` | Port du serveur (auto sur Railway) | Non (défaut: 3003) |

## 📊 Limites de l'API

- **150 résultats max** par requête
- **Rate limiting** : respecter les quotas de France Travail
- **Types de contrat** : E2 (Alternance), FS (Contrat de professionnalisation)

## 🐛 Dépannage

### Erreur 401 Unauthorized

Vérifiez que vos credentials sont corrects :
```bash
railway logs
```

Si le token expire, le proxy le renouvelle automatiquement.

### Erreur 429 Too Many Requests

Vous avez atteint la limite de requêtes. Attendez quelques minutes.

### Aucune offre retournée

Vérifiez les paramètres de recherche. L'API France Travail peut retourner 0 résultat pour certaines combinaisons de filtres.

## 📝 Architecture

```
┌─────────────────┐          ┌──────────────────┐          ┌─────────────────┐
│ Cloudflare      │  HTTPS   │  Proxy Railway   │  OAuth2  │ France Travail  │
│ Pages/Workers   ├─────────>│  (Node.js)       ├─────────>│ API             │
│                 │          │                  │          │                 │
└─────────────────┘          └──────────────────┘          └─────────────────┘
```

1. Cloudflare appelle le proxy Railway
2. Le proxy obtient un token OAuth2 (mis en cache)
3. Le proxy fait la requête vers France Travail
4. Le proxy transforme et retourne les données

## 🔐 Sécurité

- ✅ Les credentials ne sont **jamais** exposés côté client
- ✅ Les tokens OAuth2 sont **mis en cache** pour réduire les requêtes
- ✅ CORS activé pour autoriser les appels depuis Cloudflare
- ✅ Pas de stockage de données personnelles

## 💰 Coûts

- **Railway** : Gratuit jusqu'à 500h/mois (largement suffisant)
- **API France Travail** : Gratuite (quotas selon votre abonnement)

## 🚀 Alternatives à Railway

### Heroku

```bash
# Se connecter
heroku login

# Créer l'app
heroku create votre-app-name

# Configurer les variables
heroku config:set FRANCE_TRAVAIL_CLIENT_ID=xxx
heroku config:set FRANCE_TRAVAIL_CLIENT_SECRET=xxx

# Déployer
git push heroku main

# Obtenir l'URL
heroku info
```

### Cloudflare Tunnel

```bash
# Installer cloudflared
brew install cloudflared

# Créer un tunnel
cloudflared tunnel create france-travail-proxy

# Configurer (créer ~/.cloudflared/config.yml)
tunnel: <tunnel-id>
credentials-file: /path/to/<tunnel-id>.json

ingress:
  - hostname: france-travail.votre-domaine.com
    service: http://localhost:3003
  - service: http_status:404

# Démarrer le serveur local
npm start

# Dans un autre terminal, démarrer le tunnel
cloudflared tunnel run france-travail-proxy
```

### Render

1. Créer un compte sur [render.com](https://render.com)
2. Créer un nouveau "Web Service"
3. Connecter votre repo GitHub
4. Ajouter les variables d'environnement
5. Déployer

## 📚 Ressources

- [Documentation API France Travail](https://pole-emploi.io/data/api)
- [Railway Documentation](https://docs.railway.app/)
- [OAuth2 Client Credentials Flow](https://www.rfc-editor.org/rfc/rfc6749#section-4.4)

## 📞 Support

Pour toute question :
- API France Travail : support@pole-emploi.io
- Ce proxy : ouvrir une issue sur GitHub
