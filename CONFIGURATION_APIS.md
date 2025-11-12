# Configuration des Variables d'Environnement

## ✅ Tâche 1 Terminée : Expansion des entreprises (x4.76)

**Résultat** : Passage de **132 → 628 entreprises** avec bureaux en France
- **2265 offres totales** en production
- **1256 offres** de direct-careers (628 entreprises × 2 postes)
- **999 offres** d'Adzuna
- **8 offres** de Greenhouse
- **2 offres** de seed

### Nouvelles catégories ajoutées (179 entreprises)

✅ **50+ Startups & Scale-ups françaises**
Ornikar, Gymlib, Pennylane, Pigment, Alma, Forest Admin, Molotov TV, Devialet, Blissim, Cheerz, JobTeaser, Evaneos, OpenClassrooms, 360Learning, SeLoger, PAP, Meilleurs Agents, Heetch, Kapten, Marcel, Frichti, Gorillas, Cajoo, Epicery, Padam Mobility, Cityscoot, Cooltra, Lime, Bolt, Tier, Voi, Dott, Wind, Zeway, Share Now, Europcar...

✅ **30+ Tech internationales**
Twitter/X, LinkedIn, Snap, TikTok, Pinterest, Reddit, Spotify, Netflix, Disney+, Twitch, Discord, Telegram, Signal, Dropbox, Box, WeTransfer, GitHub, GitLab, Atlassian (Jira, Trello, Confluence), Zapier, Make, n8n, Pipedrive, HubSpot, Mailchimp, SendGrid, Klaviyo...

✅ **30+ E-commerce & Marketplaces**
Etsy, eBay, Rakuten, AliExpress, Wish, Shopify, WooCommerce, PrestaShop, Magento, BigCommerce, Squarespace, Wix, Webflow, Sellsy, Axonaut, Odoo, Sage, Cegid, EBP, QuickBooks, Xero, FreshBooks, Zoho, Bitrix24, monday.com, ClickUp, Basecamp, Teamwork, Wrike...

✅ **30+ Fintech & Crypto**
Binance, Coinbase, Kraken, Crypto.com, Ledger Live, Blockchain.com, Bitpanda, eToro, Plus500, Trading 212, Wise, Monzo, Starling, Chime, Varo, Current, Robinhood, Webull, Acorns, Stash, Betterment, Wealthfront, SoFi, Affirm, Klarna, Afterpay, Sezzle, Uplift...

✅ **20+ EdTech & Formation**
Coursera, Udemy, Udacity, edX, Khan Academy, Duolingo, Babbel, Busuu, Lingoda, Preply, Cambly, Italki, Verbling, Le Wagon, Ironhack, General Assembly, Flatiron School, Codecademy, Pluralsight, LinkedIn Learning...

✅ **20+ Logistique & Transport**
DHL, FedEx, UPS, TNT, Chronopost, Colissimo, Mondial Relay, Relais Colis, Colis Privé, GLS, DPD, XPO Logistics, Kuehne+Nagel, DB Schenker, Dachser, Bolloré Logistics, FM Logistic, Stef, Norbert Dentressangle, Dubreuil...

---

## 🔧 Tâche 2 : Configuration LBA et France Travail

### ✅ La Bonne Alternance (LBA) - Prêt à configurer

**Variables à ajouter dans Cloudflare Pages :**

1. **REMOTE_API_BASE**
   Valeur : `https://labonnealternance.apprentissage.beta.gouv.fr/api/V1/jobs`

2. **REMOTE_API_CALLER**
   Valeur : `alternant-talent`

3. **REMOTE_API_TOKEN**
   ✅ Déjà configuré dans `.dev.vars`

**Comment configurer dans Cloudflare Pages :**

```bash
# Via Wrangler CLI
npx wrangler pages project deployment-settings alternant-talent \
  --environment-variable REMOTE_API_BASE:https://labonnealternance.apprentissage.beta.gouv.fr/api/V1/jobs \
  --environment-variable REMOTE_API_CALLER:alternant-talent
```

**Ou via le Dashboard Cloudflare :**

1. Aller sur https://dash.cloudflare.com
2. Sélectionner "Pages" > "alternant-talent"
3. Onglet "Settings" > "Environment variables"
4. Cliquer "Add variable"
5. Ajouter :
   - Nom : `REMOTE_API_BASE`
   - Valeur : `https://labonnealternance.apprentissage.beta.gouv.fr/api/V1/jobs`
6. Répéter pour `REMOTE_API_CALLER` avec la valeur `alternant-talent`

**Résultat attendu :**
Une fois configuré, LBA devrait retourner **plusieurs centaines d'offres supplémentaires** depuis l'API gouvernementale. Le code fait 30 villes × 5 niveaux de diplôme = 150 requêtes.

---

### ⚠️ France Travail - Nécessite un serveur proxy

**Problème :** Cloudflare Workers ne peut pas directement appeler l'API France Travail à cause de restrictions CORS et OAuth2.

**Solution requise :** Déployer un serveur proxy Node.js

**Variable nécessaire :**
- `FRANCE_TRAVAIL_PROXY_URL` : URL du serveur proxy (ex: `https://votre-proxy.railway.app`)

**Options pour le serveur proxy :**

#### Option 1 : Railway (Recommandé - Gratuit)

```bash
# Créer un nouveau projet sur Railway.app
# Déployer le proxy depuis le dossier /proxy-france-travail

# Puis configurer dans Cloudflare Pages
npx wrangler pages project deployment-settings alternant-talent \
  --environment-variable FRANCE_TRAVAIL_PROXY_URL:https://votre-app.railway.app
```

#### Option 2 : Cloudflare Tunnel

```bash
# Installer cloudflared
brew install cloudflared  # ou via https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/

# Créer un tunnel
cloudflared tunnel create france-travail-proxy

# Configurer
cat > ~/.cloudflared/config.yml << EOF
tunnel: <tunnel-id>
credentials-file: /path/to/<tunnel-id>.json

ingress:
  - hostname: france-travail-proxy.votre-domaine.com
    service: http://localhost:3003
  - service: http_status:404
EOF

# Démarrer le serveur proxy local sur le port 3003
cd proxy-france-travail
npm install
npm start

# Dans un autre terminal, démarrer le tunnel
cloudflared tunnel run france-travail-proxy

# Configurer dans Cloudflare Pages
npx wrangler pages project deployment-settings alternant-talent \
  --environment-variable FRANCE_TRAVAIL_PROXY_URL:https://france-travail-proxy.votre-domaine.com
```

#### Option 3 : Désactiver France Travail temporairement

Si vous ne voulez pas configurer le proxy maintenant, France Travail restera simplement inactif (ne retournera aucune offre).

**État actuel :** Le code gère déjà gracieusement l'absence de proxy, donc cela n'affecte pas les autres sources.

---

## 📊 Statut actuel des sources

| Source | Statut | Offres | Configuration requise |
|--------|--------|--------|----------------------|
| **Adzuna** | ✅ Actif | ~999 | ✅ Configuré |
| **Direct Careers** | ✅ Actif | 1256 | ✅ Configuré (628 entreprises) |
| **Greenhouse** | ✅ Actif | ~8 | ✅ Configuré |
| **Jooble** | ✅ Actif | 0 (limite API?) | ✅ Configuré |
| **Indeed** | ✅ Actif | 0 (RSS feeds) | ✅ Configuré |
| **WTTJ** | ✅ Actif | 0 | ✅ Configuré |
| **HelloWork** | ✅ Actif | 0 | ✅ Configuré |
| **LinkedIn** | ⚠️ Limité | 0 | ✅ Configuré |
| **LBA** | ❌ Inactif | 0 | ⚠️ Variables manquantes |
| **France Travail** | ❌ Inactif | 0 | ⚠️ Proxy requis |
| **Seed** | ✅ Actif | 2 | ✅ Configuré |

**Total actuel : 2265 offres**
**Potentiel avec LBA : 2500-3000 offres**

---

## 🧪 Tester la configuration

### Test local

```bash
# Ajouter les variables dans .dev.vars
echo 'export REMOTE_API_BASE=https://labonnealternance.apprentissage.beta.gouv.fr/api/V1/jobs' >> .dev.vars
echo 'export REMOTE_API_CALLER=alternant-talent' >> .dev.vars

# Démarrer le serveur local
npm run dev

# Tester l'API
curl "http://localhost:5175/api/jobs?limit=3000" | jq '{total: .total, sources: [.jobs[] | .source] | group_by(.) | map({source: .[0], count: length})}'
```

### Test en production

```bash
# Forcer le rafraîchissement du cache
curl "https://alternant-talent.pages.dev/api/jobs?refresh=true"

# Attendre 20 secondes puis vérifier
sleep 20
curl "https://alternant-talent.pages.dev/api/jobs?limit=3000" | jq '{total: .total, sources: [.jobs[] | .source] | group_by(.) | map({source: .[0], count: length})}'
```

**Résultat attendu avec LBA configuré :**
```json
{
  "total": 2500-3000,
  "sources": [
    {"source": "adzuna", "count": 999},
    {"source": "direct-careers", "count": 1256},
    {"source": "lba", "count": 300-700},
    {"source": "greenhouse", "count": 8},
    {"source": "seed", "count": 2}
  ]
}
```

---

## 📝 Résumé des commandes

### Configuration complète via CLI

```bash
# 1. Configurer LBA
npx wrangler pages project deployment-settings alternant-talent \
  --environment-variable REMOTE_API_BASE:https://labonnealternance.apprentissage.beta.gouv.fr/api/V1/jobs \
  --environment-variable REMOTE_API_CALLER:alternant-talent

# 2. Re-déployer (optionnel, les variables sont appliquées au prochain déploiement)
npm run build
npx wrangler pages deploy public

# 3. Tester
curl "https://alternant-talent.pages.dev/api/jobs?refresh=true"
sleep 20
curl "https://alternant-talent.pages.dev/api/jobs?limit=3000" | jq .total
```

---

## 🎯 Prochaines étapes

1. ✅ **Tâche 1 terminée** : 628 entreprises déployées (x4.76)
2. ⏳ **Tâche 2 en cours** : Configurer LBA (simple) et France Travail (nécessite proxy)
3. 🔜 **Optionnel** : Enrichir les offres avec l'IA (système déjà implémenté dans `/enrichment-service/`)

**Questions ?** Faites-moi savoir si vous voulez que je :
- Configure automatiquement les variables LBA via Wrangler
- Crée le serveur proxy France Travail
- Aide avec le déploiement sur Railway/Cloudflare Tunnel
