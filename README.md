# Alternant Talent App

Plateforme d’agrégation et de gestion d’offres d’alternance.  
Front statique + API serverless (Cloudflare Functions + D1).

## 🚀 Structure du projet

- `public/` → Front statique (HTML, assets, SEO)
- `functions/` → API et backend serverless (auth, jobs, stats…)
- `migrations/` → Schéma SQL D1
- `scripts/` → Scripts utilitaires
- `.github/` → Workflows CI/CD, sécurité, templates PR/issues

## 🔧 Dev local

Prérequis : Node.js (>=18) et npm doivent être installés.

```bash
# installer les dépendances
npm install

# analyser le code
npm run lint

# exécuter la suite de tests
npm test
```

## 🌱 Seed de données

Un petit jeu de données de test se trouve dans `public/data/seed.json`. Pour l'insérer dans la base D1 locale :

```bash
node scripts/local-seed.mjs
```

Le script utilise l'API D1 pour ajouter les entrées dans la table `jobs`.
