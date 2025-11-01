# Configuration des clés API pour les sources d'emploi

Ce fichier documente les clés API nécessaires pour activer toutes les sources d'offres d'emploi.

## 📋 Sources actuellement actives (SANS clé API)

Ces sources fonctionnent immédiatement sans configuration :

✅ **Adzuna** - ~1000 offres
✅ **La Bonne Alternance** - ~1500 offres
✅ **Jooble** - ~2000 offres
✅ **France Travail** - ~500 offres
✅ **Direct Careers** - ~100 offres
✅ **ATS Feeds (Greenhouse, Lever)** - ~200 offres
✅ **HelloWork** - ~200 offres (API publique)

**Total actuel : ~5500 offres**

---

## 🔑 Sources nécessitant des clés API (optionnelles)

### 1. Indeed Publisher API

**Potentiel** : +300 offres
**Comment obtenir** :
1. S'inscrire sur https://www.indeed.com/publisher
2. Créer un compte Indeed Publisher
3. Demander l'accès à l'API (processus d'approbation)
4. Récupérer le Publisher ID

**Configuration Cloudflare** :
```bash
wrangler pages secret put INDEED_PUBLISHER_ID
```

**Documentation** : https://docs.indeed.com/publisher-api/

---

### 2. Welcome to the Jungle (Welcomekit API)

**Potentiel** : +200 offres
**Comment obtenir** :
1. Contacter WTTJ pour un partenariat : https://developers.welcomekit.co
2. Demander l'accès à l'API Welcomekit
3. Obtenir une clé API Bearer

**Configuration Cloudflare** :
```bash
wrangler pages secret put WTTJ_API_KEY
```

**Documentation** : https://developers.welcomekit.co/api/v1

---

### 3. LinkedIn Jobs (via RapidAPI)

**Potentiel** : +100 offres
**Comment obtenir** :
1. Créer un compte sur https://rapidapi.com
2. S'abonner à "LinkedIn Jobs Search API" : https://rapidapi.com/rockapis-rockapis-default/api/linkedin-jobs-search/
3. Copier la clé RapidAPI (X-RapidAPI-Key)

**Configuration Cloudflare** :
```bash
wrangler pages secret put RAPIDAPI_KEY
```

**Coût** : Plan gratuit disponible (limité à ~500 requêtes/mois)
**Documentation** : https://rapidapi.com/rockapis-rockapis-default/api/linkedin-jobs-search/

---

## 🚀 Configuration des secrets Cloudflare

Pour configurer les clés API sur Cloudflare Pages :

```bash
# Indeed
npx wrangler pages secret put INDEED_PUBLISHER_ID --project-name=alternant-talent

# Welcome to the Jungle
npx wrangler pages secret put WTTJ_API_KEY --project-name=alternant-talent

# LinkedIn (RapidAPI)
npx wrangler pages secret put RAPIDAPI_KEY --project-name=alternant-talent
```

Ou via le dashboard Cloudflare :
1. Aller sur https://dash.cloudflare.com
2. Sélectionner le projet `alternant-talent`
3. Settings → Environment variables
4. Ajouter les variables

---

## 📊 Impact des clés API

| Source | Sans clé | Avec clé | Total possible |
|--------|----------|----------|----------------|
| Sources actuelles | 5500 | 5500 | 5500 |
| Indeed | 0 | 300 | 300 |
| Welcome to the Jungle | 0 | 200 | 200 |
| LinkedIn | 0 | 100 | 100 |
| **TOTAL** | **5500** | **6100** | **6100** |

**Note** : Les sources fonctionnent en mode dégradé sans clé API. Elles retournent 0 offre mais ne bloquent pas les autres sources.

---

## 🧪 Tester les sources

Pour tester localement avec les clés API :

1. Créer un fichier `.dev.vars` à la racine :
```env
INDEED_PUBLISHER_ID=your_publisher_id
WTTJ_API_KEY=your_wttj_key
RAPIDAPI_KEY=your_rapidapi_key
```

2. Lancer en développement :
```bash
npx wrangler pages dev public --compatibility-date=2025-08-01
```

3. Forcer un refresh de la base de données :
```bash
curl "http://localhost:8788/api/jobs?refresh=true"
```

---

## ⚠️ Notes importantes

- **Indeed** : API limitée, approbation nécessaire
- **WTTJ** : Nécessite un partenariat entreprise
- **LinkedIn** : Coûts RapidAPI après le plan gratuit
- **HelloWork** : Fonctionne sans clé API (API publique)

Sans ces clés, l'application fonctionne toujours avec **5500+ offres** des autres sources.
