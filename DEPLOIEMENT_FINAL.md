# 🚀 Guide de Déploiement Final - LBA & France Travail

## ✅ Ce qui est déjà fait

### Tâche 1 : Expansion des entreprises - TERMINÉ ✅
- **628 entreprises** (x4.76 vs 132 initiales)
- **2265 offres** en production
- **1256 offres** direct-careers
- **999 offres** Adzuna
- Déployé et actif

### Tâche 2 : Configuration LBA & France Travail - PRÊT ✅
- ✅ Variables LBA ajoutées dans `.dev.vars`
- ✅ Proxy France Travail créé dans `/proxy-france-travail/`
- ⏳ **Reste à faire** : Configurer en production

---

## 📋 Configuration Production - 3 Étapes

### Étape 1 : Configurer LBA dans Cloudflare Pages (5 minutes)

#### Via Dashboard Cloudflare (Recommandé)

1. **Aller sur le dashboard Cloudflare :**
   https://dash.cloudflare.com

2. **Naviguer vers votre projet Pages :**
   - Cliquez sur "Workers & Pages" (dans le menu gauche)
   - Sélectionnez "alternant-talent"

3. **Ajouter les variables d'environnement :**
   - Cliquez sur l'onglet "Settings"
   - Descendez jusqu'à "Environment variables"
   - Section "Production" > Cliquez "Add variable"

4. **Ajouter ces 2 variables :**

   **Variable 1 :**
   ```
   Nom: REMOTE_API_BASE
   Valeur: https://labonnealternance.apprentissage.beta.gouv.fr/api/V1/jobs
   ```

   **Variable 2 :**
   ```
   Nom: REMOTE_API_CALLER
   Valeur: alternant-talent
   ```

5. **Sauvegarder et redéployer :**
   - Cliquez "Save" pour chaque variable
   - Le prochain déploiement activera LBA automatiquement

#### Redéployer pour activer

```bash
npm run build
npx wrangler pages deploy public
```

#### Vérifier que LBA fonctionne

Après le déploiement, attendez 30 secondes puis :

```bash
# Forcer le rafraîchissement du cache
curl "https://alternant-talent.pages.dev/api/jobs?refresh=true"

# Attendre 20 secondes
sleep 20

# Vérifier le résultat
curl "https://alternant-talent.pages.dev/api/jobs?limit=3000" | jq '{total: .total, sources: [.jobs[] | .source] | group_by(.) | map({source: .[0], count: length})}'
```

**Résultat attendu :**
```json
{
  "total": 2500-3000,
  "sources": [
    {"source": "adzuna", "count": 999},
    {"source": "direct-careers", "count": 1256},
    {"source": "lba", "count": 300-700},  // <-- NOUVEAU !
    {"source": "greenhouse", "count": 8},
    {"source": "seed", "count": 2}
  ]
}
```

---

### Étape 2 : Obtenir les credentials France Travail (10 minutes)

1. **Créer un compte sur l'API France Travail :**
   - Allez sur https://pole-emploi.io/inscription
   - Remplissez le formulaire d'inscription
   - Validez votre email

2. **Créer une application :**
   - Connectez-vous sur https://pole-emploi.io
   - Cliquez "Mes applications" > "Ajouter une application"
   - Nom : "Alternant Talent"
   - Description : "Plateforme d'offres d'alternance"

3. **Sélectionner l'API "Offres d'emploi v2" :**
   - Dans la liste des APIs disponibles
   - Cochez "Offres d'emploi v2"
   - Acceptez les conditions

4. **Obtenir vos credentials :**
   - Une fois validé, vous obtiendrez :
     - `CLIENT_ID` (ressemble à : `PAR_alternanttalent_abc123def456`)
     - `CLIENT_SECRET` (ressemble à : `xyz789abc123...`)
   - **IMPORTANT** : Sauvegardez-les dans un endroit sûr

---

### Étape 3 : Déployer le proxy France Travail sur Railway (10 minutes)

#### 3.1. Créer un compte Railway

1. Allez sur https://railway.app
2. Cliquez "Sign up"
3. Connectez-vous avec GitHub
4. Plan gratuit : 500h/mois (largement suffisant)

#### 3.2. Déployer le proxy

**Option A : Via GitHub (Recommandé)**

```bash
# 1. Créer un repo GitHub pour le proxy
cd proxy-france-travail
git init
git add .
git commit -m "Initial commit: France Travail proxy"

# 2. Créer le repo sur GitHub
# Allez sur github.com/new
# Nom : france-travail-proxy
# Public ou Private
# NE PAS initialiser avec README

# 3. Pousser le code
git remote add origin https://github.com/VOTRE_USERNAME/france-travail-proxy.git
git branch -M main
git push -u origin main

# 4. Sur Railway.app
# - Cliquez "New Project"
# - Sélectionnez "Deploy from GitHub repo"
# - Autorisez Railway à accéder à vos repos
# - Sélectionnez "france-travail-proxy"
# - Railway détectera automatiquement Node.js et déploiera
```

**Option B : Via Railway CLI**

```bash
# Installer Railway CLI
npm install -g @railway/cli

# Se connecter
railway login

# Créer le projet
cd proxy-france-travail
railway init

# Déployer
railway up
```

#### 3.3. Configurer les variables sur Railway

1. **Via le Dashboard Railway :**
   - Allez sur https://railway.app/dashboard
   - Sélectionnez votre projet "france-travail-proxy"
   - Onglet "Variables"
   - Cliquez "Add Variable"

2. **Ajouter ces 2 variables :**
   ```
   FRANCE_TRAVAIL_CLIENT_ID=PAR_votre_client_id_ici
   FRANCE_TRAVAIL_CLIENT_SECRET=votre_client_secret_ici
   ```

3. **Railway redéploiera automatiquement**

#### 3.4. Obtenir l'URL publique

1. Dans Railway, onglet "Settings"
2. Section "Domains"
3. Cliquez "Generate Domain"
4. Vous obtiendrez une URL comme : `https://france-travail-proxy-production-xxxx.up.railway.app`
5. **Copiez cette URL** (vous en aurez besoin pour l'étape 4)

#### 3.5. Tester le proxy

```bash
# Remplacez par votre vraie URL Railway
PROXY_URL=https://france-travail-proxy-production-xxxx.up.railway.app

# Tester la santé
curl $PROXY_URL/health

# Devrait retourner :
# {"status":"ok","service":"france-travail-proxy","hasCredentials":true,...}

# Tester la recherche
curl "$PROXY_URL/api/jobs?query=alternance&limit=10"

# Devrait retourner des offres d'emploi
```

---

### Étape 4 : Configurer France Travail dans Cloudflare Pages

1. **Retourner sur le dashboard Cloudflare :**
   https://dash.cloudflare.com

2. **Aller dans votre projet Pages "alternant-talent"**

3. **Ajouter la variable FRANCE_TRAVAIL_PROXY_URL :**
   - Settings > Environment variables > Production
   - Add variable
   ```
   Nom: FRANCE_TRAVAIL_PROXY_URL
   Valeur: https://france-travail-proxy-production-xxxx.up.railway.app
   ```
   (Remplacez par votre vraie URL Railway)

4. **Redéployer :**
   ```bash
   npm run build
   npx wrangler pages deploy public
   ```

5. **Vérifier le résultat final :**

   ```bash
   # Forcer le rafraîchissement
   curl "https://alternant-talent.pages.dev/api/jobs?refresh=true"

   sleep 30

   # Vérifier toutes les sources
   curl "https://alternant-talent.pages.dev/api/jobs?limit=3000" | jq '{total: .total, sources: [.jobs[] | .source] | group_by(.) | map({source: .[0], count: length})}'
   ```

   **Résultat attendu :**
   ```json
   {
     "total": 3000-4000,
     "sources": [
       {"source": "adzuna", "count": 999},
       {"source": "direct-careers", "count": 1256},
       {"source": "lba", "count": 300-700},
       {"source": "france-travail", "count": 100-500},  // <-- NOUVEAU !
       {"source": "greenhouse", "count": 8},
       {"source": "seed", "count": 2}
     ]
   }
   ```

---

## 📊 Récapitulatif des sources finales

| Source | Statut | Offres estimées | Configuration |
|--------|--------|-----------------|---------------|
| **Adzuna** | ✅ Actif | ~999 | ✅ Déjà configuré |
| **Direct Careers** | ✅ Actif | 1256 (628 entreprises) | ✅ Déjà configuré |
| **LBA** | ⏳ À configurer | 300-700 | ⚙️ Étape 1 ci-dessus |
| **France Travail** | ⏳ À configurer | 100-500 | ⚙️ Étapes 2-4 ci-dessus |
| **Greenhouse** | ✅ Actif | ~8 | ✅ Déjà configuré |
| **Jooble** | ✅ Actif | 0-50 | ✅ Déjà configuré |
| **Indeed** | ✅ Actif | 0-20 | ✅ Déjà configuré |
| **WTTJ** | ✅ Actif | 0-30 | ✅ Déjà configuré |
| **HelloWork** | ✅ Actif | 0-20 | ✅ Déjà configuré |
| **LinkedIn** | ⚠️ Limité | 0-10 | ✅ Déjà configuré |
| **Seed** | ✅ Actif | 2 | ✅ Déjà configuré |

**Total actuel :** 2265 offres
**Total avec LBA :** 2500-3000 offres
**Total avec LBA + France Travail :** **3000-4000 offres** 🎉

---

## 🧪 Tester en local avant la production

### Tester LBA en local

```bash
# 1. Les variables sont déjà dans .dev.vars
# 2. Démarrer le serveur local
npm run dev

# 3. Dans un autre terminal, tester
curl "http://localhost:5175/api/jobs?limit=3000&refresh=true" | jq '{total: .total, sources: [.jobs[] | .source] | group_by(.) | map({source: .[0], count: length})}'

# Vous devriez voir LBA dans la liste
```

### Tester France Travail en local

```bash
# 1. Démarrer le proxy localement
cd proxy-france-travail
npm install
cp .env.example .env

# 2. Éditer .env avec vos vrais credentials
nano .env  # ou vim, ou VSCode

# 3. Démarrer le proxy
npm start

# 4. Dans un autre terminal, tester le proxy
curl http://localhost:3003/health
curl "http://localhost:3003/api/jobs?query=alternance&limit=10"

# 5. Ajouter la variable dans .dev.vars (racine du projet)
cd ..
echo "export FRANCE_TRAVAIL_PROXY_URL=http://localhost:3003" >> .dev.vars

# 6. Redémarrer le serveur principal
npm run dev

# 7. Tester
curl "http://localhost:5175/api/jobs?limit=3000&refresh=true" | jq .total
```

---

## 🐛 Dépannage

### LBA ne retourne aucune offre

**Problème possible 1 : Variables mal configurées**
```bash
# Vérifier les logs Cloudflare
npx wrangler pages deployment tail --project-name=alternant-talent

# Vous devriez voir des logs comme :
# [LBA] Recherche sur 30 villes x 5 diplômes
```

**Problème possible 2 : Token expiré**
Le token REMOTE_API_TOKEN a peut-être expiré. Vérifiez l'expiration :
```bash
echo "eyJhbGc..." | base64 -d  # Décoder le JWT pour voir l'expiration
```

**Problème possible 3 : Rate limiting**
L'API LBA limite à 5-20 req/s. Attendez quelques minutes.

### France Travail ne fonctionne pas

**Problème 1 : Proxy Railway non accessible**
```bash
curl https://votre-proxy.up.railway.app/health

# Si timeout ou erreur 502 :
# - Vérifier les logs Railway
# - Vérifier que les variables sont configurées
```

**Problème 2 : Credentials invalides**
```bash
# Logs Railway montreront :
# "❌ Token request failed: 401"
#
# Solution : Vérifier CLIENT_ID et CLIENT_SECRET sur pole-emploi.io
```

**Problème 3 : Quota API dépassé**
France Travail a des quotas. Vérifiez votre dashboard pole-emploi.io.

---

## 💰 Coûts

| Service | Coût | Limites |
|---------|------|---------|
| **Cloudflare Pages** | Gratuit | Illimité requêtes |
| **Railway** | Gratuit | 500h/mois (suffisant pour un seul service) |
| **LBA API** | Gratuit | 5-20 req/s |
| **France Travail API** | Gratuit | Selon abonnement |

**Total : 0€/mois** 🎉

---

## 📈 Prochaines étapes recommandées

Une fois LBA et France Travail configurés, vous pouvez :

1. **Enrichir avec l'IA** (système déjà implémenté) :
   ```bash
   cd enrichment-service
   npm install
   npm start

   # Enrichir les offres
   curl -X POST https://alternant-talent.pages.dev/api/enrich \
     -H "Content-Type: application/json" \
     -d '{"source": "kv", "limit": 100}'
   ```

2. **Mettre en place l'enrichissement automatique** :
   - GitHub Actions enrichit automatiquement chaque nuit
   - Workflow déjà configuré dans `.github/workflows/enrich-daily.yml`

3. **Optimiser les performances** :
   - Augmenter le cache TTL si besoin
   - Ajouter pagination côté frontend
   - Mettre en place analytics

---

## 📞 Support

**Problème avec ce guide ?**
- Vérifiez les logs : `npx wrangler pages deployment tail`
- Relisez les étapes ci-dessus
- Vérifiez que toutes les variables sont configurées

**APIs externes :**
- LBA : labonnealternance@apprentissage.beta.gouv.fr
- France Travail : support via pole-emploi.io

---

## ✅ Checklist finale

Avant de considérer la configuration terminée :

- [ ] LBA configuré dans Cloudflare Pages (REMOTE_API_BASE, REMOTE_API_CALLER)
- [ ] Variables testées en local
- [ ] Credentials France Travail obtenus (CLIENT_ID, CLIENT_SECRET)
- [ ] Proxy France Travail déployé sur Railway
- [ ] Variables configurées sur Railway
- [ ] URL Railway ajoutée dans Cloudflare (FRANCE_TRAVAIL_PROXY_URL)
- [ ] Redéployé Cloudflare Pages
- [ ] Testé en production (3000-4000 offres visibles)
- [ ] Vérifié les logs (pas d'erreurs)

Une fois tout coché ✅, vous aurez un système complet avec **10 sources d'offres actives** ! 🎉
