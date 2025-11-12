# Guide d'enrichissement des offres avec Ollama

Ce guide explique comment utiliser le système d'enrichissement pour améliorer vos offres d'alternance avec de l'intelligence artificielle.

## 📋 Vue d'ensemble

Le système se compose de 3 parties :

1. **Service d'enrichissement** (`enrichment-service/`) - Serveur Node.js qui appelle Ollama
2. **Fonction Cloudflare** (`functions/api/enrich.js`) - Endpoint pour déclencher l'enrichissement depuis votre app
3. **Script de migration** (`scripts/migrate-enrich.js`) - Pour enrichir un fichier JSON local

## 🚀 Installation rapide

### 1. Installer Ollama

```bash
# macOS ou Linux
curl -fsSL https://ollama.com/install.sh | sh

# Télécharger le modèle Mistral (4GB)
ollama pull mistral

# Démarrer Ollama
ollama serve
```

### 2. Installer le service d'enrichissement

```bash
cd enrichment-service

# Installer les dépendances
npm install

# Créer le fichier de configuration
cp .env.example .env

# Démarrer le service
npm start
```

Le service démarre sur `http://localhost:3001`

### 3. Tester que tout fonctionne

```bash
# Vérifier le statut
curl http://localhost:3001/health

# Tester avec une offre d'exemple
curl -X POST http://localhost:3001/test
```

Vous devriez voir un JSON avec une offre enrichie !

## 💡 Cas d'usage

### Cas 1 : Enrichir un fichier JSON local

Si vous avez récupéré des offres via une API légale et les avez sauvegardées dans un fichier :

```bash
# Enrichir seed.json et créer seed-enriched.json
node scripts/migrate-enrich.js

# Avec options
node scripts/migrate-enrich.js \
  --input ./mes-offres.json \
  --output ./mes-offres-enrichies.json \
  --limit 50
```

### Cas 2 : Enrichir via l'API Cloudflare

Depuis votre application déployée :

```bash
# Enrichir les offres déjà dans KV
curl -X POST https://alternant-talent.pages.dev/api/enrich \
  -H "Content-Type: application/json" \
  -d '{"source": "kv", "limit": 50}'

# Enrichir directement depuis Adzuna
curl -X POST https://alternant-talent.pages.dev/api/enrich \
  -H "Content-Type: application/json" \
  -d '{"source": "adzuna", "limit": 50}'
```

### Cas 3 : Automatiser avec un cron job

Créer un workflow GitHub Actions ou un cron Cloudflare pour enrichir automatiquement chaque jour :

```yaml
# .github/workflows/enrich-jobs.yml
name: Enrich Jobs Daily

on:
  schedule:
    - cron: '0 2 * * *'  # Tous les jours à 2h du matin
  workflow_dispatch:       # Permet de lancer manuellement

jobs:
  enrich:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install Ollama
        run: |
          curl -fsSL https://ollama.com/install.sh | sh
          ollama serve &
          sleep 5
          ollama pull mistral

      - name: Install dependencies
        run: |
          cd enrichment-service
          npm install

      - name: Start enrichment service
        run: |
          cd enrichment-service
          npm start &
          sleep 5

      - name: Enrich jobs
        run: |
          node scripts/migrate-enrich.js --limit 100

      - name: Deploy to Cloudflare
        run: |
          # Uploader seed-enriched.json vers KV
          npx wrangler kv:key put --namespace-id=${{ secrets.KV_NAMESPACE_ID }} \
            "seed.json" "$(cat seed-enriched.json)"
```

## 📊 Données enrichies

Chaque offre enrichie contient :

```json
{
  "id": "123",
  "title": "Développeur Full Stack - Alternance",
  "description": "...",
  "location": "Paris",
  "company": "TechCorp",
  "enriched": {
    "niveau_etudes": "Bac+4",
    "domaine": "Développement web",
    "competences": ["React", "Node.js", "PostgreSQL"],
    "type_contrat": "Alternance",
    "duree_estimee": "24 mois",
    "teletravail": true,
    "salaire_estime": "1000-1400€",
    "tags": ["dev", "fullstack", "javascript"]
  },
  "enriched_at": "2025-01-03T10:30:00.000Z"
}
```

## 🔧 Configuration Cloudflare

Pour utiliser l'endpoint `/api/enrich`, ajoutez ces variables d'environnement dans Cloudflare Pages :

```bash
# URL de votre service d'enrichissement
ENRICHMENT_SERVICE_URL=http://votre-serveur.com:3001

# Clés API Adzuna (optionnel, pour source=adzuna)
ADZUNA_APP_ID=votre_app_id
ADZUNA_APP_KEY=votre_app_key
```

### Rendre le service accessible depuis Cloudflare

**Option 1 : Cloudflare Tunnel (recommandé)**

```bash
# Installer cloudflared
brew install cloudflared

# Créer un tunnel
cloudflared tunnel create alternant-enrichment

# Configurer le tunnel
cat > ~/.cloudflared/config.yml << EOF
tunnel: <tunnel-id>
credentials-file: /path/to/credentials.json

ingress:
  - hostname: enrich.votre-domaine.com
    service: http://localhost:3001
  - service: http_status:404
EOF

# Démarrer le tunnel
cloudflared tunnel run alternant-enrichment
```

Puis dans Cloudflare Pages, mettez `ENRICHMENT_SERVICE_URL=https://enrich.votre-domaine.com`

**Option 2 : Serveur VPS avec IP publique**

Déployez le service sur un VPS (DigitalOcean, Linode, etc.) et utilisez l'IP publique.

## ⚡ Performance

- **Temps par offre** : 2-5 secondes
- **Lot recommandé** : 50-100 offres à la fois
- **Coût** : Gratuit (Ollama local)

Pour 1000 offres :
- Temps total : ~1 heure
- RAM nécessaire : ~8GB (pour Mistral)
- Stockage : ~4GB (modèle Mistral)

## 🛡️ Bonnes pratiques

1. **Toujours enrichir des données légales** - Utilisez uniquement des offres obtenues via APIs officielles
2. **Cacher les résultats** - Les métadonnées enrichies changent rarement, pas besoin de ré-enrichir souvent
3. **Surveiller les quotas API** - Si vous utilisez Adzuna gratuit, limitez à 33 requêtes/jour
4. **Backup régulier** - Sauvegardez vos offres enrichies avant de les mettre à jour

## 🐛 Dépannage

### Ollama ne démarre pas

```bash
# Vérifier si Ollama tourne
ps aux | grep ollama

# Redémarrer Ollama
killall ollama
ollama serve
```

### Le service ne répond pas

```bash
# Vérifier que le port 3001 est libre
lsof -i :3001

# Tester manuellement
curl http://localhost:3001/health
```

### L'enrichissement retourne des erreurs

```bash
# Vérifier les logs du service
cd enrichment-service
npm run dev  # Mode verbose

# Tester avec un seul job
curl -X POST http://localhost:3001/enrich/single \
  -H "Content-Type: application/json" \
  -d '{"job": {"id": "1", "title": "Test", "description": "Test job"}}'
```

## 📚 Prochaines étapes

Une fois vos offres enrichies :

1. **Améliorer les filtres** - Utilisez `niveau_etudes`, `domaine`, `teletravail` pour des filtres précis
2. **Recommandations** - Suggérez des offres similaires basées sur `competences` et `tags`
3. **Analytics** - Analysez les tendances par domaine, niveau, localisation
4. **SEO** - Générez des métadonnées riches pour chaque offre

Bon enrichissement ! 🚀
