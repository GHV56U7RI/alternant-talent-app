# Guide pour travailler en local

## 🔍 Problème actuel

- **Local** : 15 offres (juste le seed.json)
- **Production** : ~1200 offres (depuis les 10 APIs)

Les APIs (Adzuna, LBA, Jooble, etc.) nécessitent des **clés API** qui ne sont configurées qu'en production sur Cloudflare.

## ✅ Solution 1 : Copier les données de production vers local

```bash
# 1. Exporter les offres depuis la production
npx wrangler d1 execute alternance_db --remote --command \
  "SELECT * FROM jobs LIMIT 200" --json > production-jobs.json

# 2. Importer dans la DB locale
# (créer un script d'import si nécessaire)
```

## ✅ Solution 2 : Tester directement en production

Au lieu de travailler en local, déployez et testez sur Cloudflare Pages :

```bash
# Build
npm run build

# Deploy
npx wrangler pages deploy public

# URL: https://alternant-talent.pages.dev
```

## ✅ Solution 3 : Ajouter plus d'offres au seed.json pour le dev local

Modifiez `/public/data/seed.json` pour avoir plus d'offres de test.

## 📊 État actuel

### Local (http://localhost:5175)
- ✅ **Migration appliquée** : colonnes enrichies ajoutées
- ✅ **API fonctionne** : retourne les offres
- ⚠️ **Peu de données** : seulement 15 offres du seed.json
- ❌ **Pas de clés API** : impossible de charger depuis Adzuna/LBA/etc.

### Production (https://alternant-talent.pages.dev)
- ✅ **~1200 offres** depuis les 10 APIs
- ✅ **Clés API configurées** dans Cloudflare
- ⚠️ **Migration non appliquée** : colonnes enrichies manquantes

## 🚀 Prochaines étapes recommandées

### 1. Appliquer la migration en production

```bash
npx wrangler d1 migrations apply alternance_db --remote
```

Cela ajoutera les colonnes enrichies à votre DB de production.

### 2. Enrichir les offres en production

Une fois la migration appliquée :

```bash
# Option A : Via le service d'enrichissement local
cd enrichment-service
npm start

# Dans un autre terminal
curl -X POST https://alternant-talent.pages.dev/api/enrich \
  -H "Content-Type: application/json" \
  -d '{"source": "kv", "limit": 100}'

# Option B : Laisser GitHub Actions le faire automatiquement chaque nuit
```

### 3. Vérifier les statistiques

Une fois enrichi, accédez à :
- Se connecter sur https://alternant-talent.pages.dev
- Menu profil → Statistiques

## 💡 Pourquoi ça marche différemment en local vs production ?

### Production (Cloudflare Pages)
- Base de données D1 sur les serveurs Cloudflare
- Variables d'environnement avec les clés API
- Appels aux APIs Adzuna, LBA, Jooble, etc.
- ~1200 offres récupérées quotidiennement

### Local (votre machine)
- Base de données D1 SQLite locale
- Pas de variables d'environnement configurées
- Pas de clés API
- Utilise uniquement seed.json (15 offres)

## ❓ Questions fréquentes

**Q: Comment avoir les mêmes données en local qu'en production ?**

R: Exportez les données de production :

```bash
# Exporter
npx wrangler d1 execute alternance_db --remote \
  --command "SELECT * FROM jobs LIMIT 500" \
  --json > export.json

# Puis créer un script pour importer dans la DB locale
```

**Q: Est-ce que je peux tester l'enrichissement IA en local ?**

R: Oui ! Le service d'enrichissement tourne 100% en local :

```bash
cd enrichment-service
npm install
npm start

# Puis dans un autre terminal
node ../scripts/migrate-enrich.js \
  --input ../public/data/seed.json \
  --output ../seed-enriched.json \
  --limit 15
```

**Q: L'affichage des dates est-il cassé ?**

R: Non, le code est bon. Vérifiez dans le navigateur sur http://localhost:5175

Les dates comme "Il y a 2 jours", "Hier", etc. s'affichent correctement si les offres ont un champ `posted` valide.

**Q: Pourquoi je ne vois pas les annonces ?**

R: Deux raisons possibles :
1. Cache navigateur : Faites Cmd+Shift+R (Mac) ou Ctrl+Shift+R (Windows)
2. Erreur JavaScript : Ouvrez la console (F12) et vérifiez les erreurs
