# Alternant Talent App

Plateforme d’agrégation et de gestion d’offres d’alternance.
Front statique + API serverless (Cloudflare Functions + D1).

## 🚀 Structure du projet

- `public/` → Front statique (HTML, assets, SEO)
- `functions/` → API et backend serverless (auth, jobs, stats…)
- `migrations/` → Schéma SQL D1
- `scripts/` → Scripts utilitaires
- `.github/` → Workflows CI/CD, sécurité, templates PR/issues

## 🧱 Architecture

Frontend déployé sur Cloudflare Pages. Les Workers hébergent l'API et accèdent à la base D1 via `env.DB`.

### Endpoints principaux

- `GET /api/jobs` — liste paginée des offres (filtrage via `q`, `limit`, `offset`)
- `POST /api/refresh` — recharge la base à partir de `data/seed.json` (nécessite `Authorization: Bearer <ADMIN_TOKEN>`)
- `GET /api/stats/overview` — statistiques globales
- `POST /api/track/view|click|apply` — traçage des interactions utilisateurs

## 💻 Installation

```bash
npm install
```

### Exemple de `.dev.vars`

```bash
ADMIN_TOKEN=changeme
```

## 🔧 Dev local

```bash
npm run lint
npm test
```

## ☁️ Déploiement (Cloudflare)

```bash
npx wrangler pages deploy
```

### Exemple de `wrangler.toml`

```toml
name = "alternant-talent"
compatibility_date = "2025-08-01"
pages_build_output_dir = "public"

[[d1_databases]]
binding = "DB"
database_name = "alternance_db"
database_id = "c6fcd041-953d-42dc-96d5-8c17a881fe04"
```
