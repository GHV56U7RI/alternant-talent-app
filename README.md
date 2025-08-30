# Alternant Talent App

Plateforme **open-source** d’agrégation d’offres d’alternance pour la France.  
Front **HTML/CSS/JS** statique + **API Node.js (ESM)**, cache local, collecte depuis **Adzuna** et **Jooble**, redirection “**direct apply**”, auth simple (SQLite ou JSON), et rafraîchissement en **temps réel (SSE)**.

---

## Sommaire

- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Prérequis](#prérequis)
- [Installation rapide (local)](#installation-rapide-local)
- [Configuration (.env)](#configuration-env)
- [Démarrage & données](#démarrage--données)
- [Collecte d’offres (Adzuna/Jooble)](#collecte-doffres-adzunajooble)
- [Découverte d’ATS (discover-slugsjs)](#découverte-dats-discover-slugsjs)
- [Endpoints API](#endpoints-api)
- [Intégration front (bridge-v12js)](#intégration-front-bridge-v12js)
- [Production & SEO](#production--seo)
- [Sécurité & données](#sécurité--données)
- [Dépannage](#dépannage)
- [Licence](#licence)

---

## Fonctionnalités

- ✅ **Agrégation** d’offres (Adzuna, Jooble) avec normalisation + déduplication
- ✅ **Cache** disque (`data/jobs-cache.json`) pour un chargement instantané
- ✅ **Rafraîchissement** manuel (`POST /api/refresh`) et auto (cron)
- ✅ **SSE** (`/api/events`) pour signaler les nouvelles annonces au front
- ✅ **Direct apply** (`/api/direct`) : suit les redirections des agrégateurs vers le site employeur
- ✅ **Auth** basique (SQLite via `better-sqlite3` ou fallback JSON)
- ✅ **Profil** candidat (ville, rayon, télétravail, mots-clés…)
- ✅ **Front bridge** (favoris, recherche, “Ils recrutent cette semaine”, compteurs)
- ✅ **SEO-ready** (robots+sitemap+manifest) quand activé
- ✅ **Script** de découverte d’ATS (Greenhouse, Lever, Ashby, Workable, Personio, Recruitee, Teamtailor, SmartRecruiters)

---

## Architecture

.
├─ public/ # Front statique (index.html, assets, manifest, robots, sitemap…)
├─ data/ # Données runtime (cache, base auth SQLite/JSON) — ignoré par Git
├─ server.js # API Node.js (ESM)
├─ bridge-v12.js # Bridge front → API (à inclure côté public/index.html)
├─ adzuna.js # Collecteur Adzuna
├─ jooble.js # Collecteur Jooble
├─ discover-slugs.js # Découverte d'ATS par entreprise
├─ 2025-08-found.json # Seeds d’offres (existant)
├─ 2025-08-manual.json # Seeds manuelles (existant)
├─ slugs.json # (optionnel) Liste d’entreprises/slugs
├─ found-slugs.json # (généré) Résultats discover-slugs
├─ package.json
├─ .env.example
├─ .gitignore
└─ LICENSE

yaml
Copier le code
