# Stratégies de Scraping Avancées

Ce document détaille les méthodologies utilisées pour récupérer les offres d'emploi sur les sites carrières modernes, en particulier ceux protégés (SPA, SSR) ou utilisant des technologies spécifiques comme Meteojob/CleverConnect et Welcome to the Jungle.

## 1. La Stratégie Hybride

Pour maximiser le nombre d'offres trouvées, nous combinons souvent plusieurs sources pour une même entreprise :
1.  **Le site carrière officiel** : Source de vérité, mais souvent complexe à scraper.
2.  **Les agrégateurs spécialisés (ex: WTTJ)** : Données plus structurées, API souvent exposées involontairement.

## 2. Techniques par Type d'ATS

### A. Meteojob / CleverConnect (Ex: Auchan, Crédit Agricole, Caisse d'Épargne)

Ces sites sont des "Single Page Applications" (SPA) qui chargent les données via une API protégée par des tokens CSRF/Cookies complexes. Cependant, pour assurer le référencement (SEO) et la performance, l'état initial de la page (la première page de résultats) est injecté directement dans le HTML.

**Méthode "State Parsing" :**
1.  Télécharger la page HTML de recherche (ex: `/jobs?facetContract=APPRENTICE`).
2.  Rechercher la balise `<script id="fibonacci-state" type="application/json">`.
3.  Extraire et parser le JSON contenu dans cette balise.
4.  Naviguer dans l'objet pour trouver la liste des offres (souvent `jobsearch.results.list` ou `app:search:offers`).

**Configuration dans `direct-careers.js` :**
```javascript
{
  name: 'NomEntreprise',
  meteojob: {
    baseUrl: 'https://recrutement.entreprise.fr',
    filterParams: '?facetContract=APPRENTICE' // Filtres optionnels (ex: alternance)
  }
}
```

### B. Welcome to the Jungle (WTTJ)

WTTJ utilise **Algolia** pour son moteur de recherche. Les clés d'API Algolia (App ID et API Key publique) sont nécessaires au navigateur pour effectuer les recherches et sont donc présentes dans le code source.

**Méthode "Algolia Extraction" :**
1.  Télécharger la page "Jobs" de l'entreprise sur WTTJ.
2.  Extraire la variable globale `window.__INITIAL_DATA__` (JSON).
3.  Parser ce JSON pour trouver les clés `algolia_app_id` et `algolia_api_key`.
4.  Interroger directement l'API Algolia (`https://APP_ID-dsn.algolia.net/...`) avec ces clés.
    *   Cela permet de récupérer **toutes** les offres (jusqu'à 1000) en une seule requête.
    *   Permet un filtrage précis côté client.

**Configuration dans `direct-careers.js` :**
```javascript
{
  name: 'NomEntreprise',
  wttj: { slug: 'slug-de-l-entreprise' } // ex: 'auchan'
}
```

### C. Workday (Ex: Sanofi, Puma, Renault)

Workday est une plateforme très répandue mais difficile. Les URLs publiques ne sont pas des API. Il faut utiliser l'API interne `/wday/cxs`.

**Configuration :**
```javascript
{
  name: 'Entreprise',
  workday: {
    host: 'fr.wd3.myworkdayjobs.com', // ou autre hôte
    tenant: 'NomTenant', // Souvent le début de l'URL
    site: 'Careers' // Souvent 'careers' ou 'External'
  }
}
```

## 3. Comment identifier la technologie d'un site ?

1.  Ouvrez le site carrière dans votre navigateur.
2.  Faites `Ctrl+U` (Afficher la source).
3.  Recherchez des mots-clés :
    *   `fibonacci` ou `cleverconnect` -> **Meteojob**.
    *   `myworkdayjobs` dans l'URL -> **Workday**.
    *   `smartrecruiters` -> **SmartRecruiters** (API publique disponible).
    *   `lever` -> **Lever** (API publique disponible).
    *   `greenhouse` -> **Greenhouse** (API publique disponible).
