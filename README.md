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

Un petit jeu de données de test se trouve dans `public/data/seed.json`. Pour
l'insérer dans la base D1 locale :

```bash
node scripts/local-seed.mjs
```

Ce script lit le JSON de seed et, via `wrangler`, insère chaque entrée dans la
table `jobs` de la base D1 locale
(`scripts/local-seed.mjs`)
et permet ainsi de disposer rapidement de données de développement.

## ☁️ Déploiement Cloudflare

1. Appliquer les migrations D1 :

   ```bash
   npx wrangler d1 migrations apply alternance_db
   ```

2. Déployer Pages + Functions :

   ```bash
   npx wrangler pages deploy public
   ```

3. Configurer les secrets (`ADMIN_TOKEN`, etc.) via le tableau de bord ou
   `wrangler secret put`.

## 🗄️ Schéma D1 et migrations

Les migrations SQL dans `migrations/` définissent la structure de la base :

- `0000_bootstrap_jobs.sql` crée `companies`, `jobs` et la vue
  `v_company_week_counts` pour les statistiques hebdomadaires.
- `init.sql` ajoute les tables d'authentification de base (`users`, `sessions`,
  `profiles`).
- `0004_student.sql` + `0005_student_auth.sql` ajoutent les profils étudiants,
  alertes, favoris et leurs comptes/sessions.
- `0006_employer_auth.sql` + `0008_employer_data.sql` définissent les comptes
  employeurs, offres publiées et candidats.
- `0007_clicks.sql` trace les clics sur les offres.
- Les événements (`events`) sont créés à la volée par `ensureEventsSchema` pour
  suivre vues, clics et candidatures.

Pour initialiser une base vide, exécuter `npx wrangler d1 migrations apply
alternance_db` avant tout usage.

## 🧠 API

### Auth `/api/auth/*`

- `POST /api/auth/register` : inscription avec `{ email, password }`, création
  d'un compte et d'une session persistante.
- `POST /api/auth/login` : authentifie un utilisateur existant et renvoie un
  cookie de session.
- `GET /api/auth/me` : renvoie `{ auth: bool, user }` selon la session courante.
- `GET /api/auth/logout` : supprime la session (`set-cookie: sess=;`).

### Jobs

#### GET `/api/jobs`

Retourne des offres d'alternance. Paramètres de requête :

- `q` : filtre sur le titre, l'entreprise, le lieu ou les tags.
- `location` : filtre spécifique sur le champ `location` (`LIKE`).
- `limit` : nombre maximum de résultats (≤50).
- `offset` : décalage de pagination.
- `world` : si `1`, désactive le filtre France/DOM-TOM.

#### GET `/api/jobs/:id`

Renvoie l'offre correspondant à l'identifiant `id` ou `404` si absente.

### Collecte

- `POST /api/refresh` : réservé à l'admin (`Authorization: Bearer`), charge
  `public/data/seed.json` et agrège les sources externes (Adzuna, Jooble,
  Greenhouse, Lever, SmartRecruiters, Workday).

### Tracking `/api/track/*`

- `POST /api/track/view` : enregistre la consultation d'une offre.
- `POST /api/track/click` : trace un clic sortant vers l'offre.
- `POST /api/track/apply` : comptabilise une candidature.
