# ✅ Intégration Complète des APIs Externes

## 🎯 Question : Les annonces peuvent-elles être affichées dans index.html ?

**Réponse : OUI ! ✅ C'est déjà configuré et fonctionnel.**

---

## 🔄 Comment ça fonctionne ?

### 1. **Frontend (index.html)**
Le fichier `public/index.html` appelle déjà l'API avec le paramètre `live=1` :

```javascript
// Ligne 398
const r = await fetch(`/api/jobs?live=1&${params.toString()}`);
const data = await r.json();
const batch = (data.items || []).map(normalize);
JOBS = JOBS.concat(batch);
```

**Paramètres de recherche** :
- `live=1` : Active les sources externes (Jooble, Adzuna, LBA)
- `limit` : Nombre d'annonces par page (40 par défaut)
- `offset` : Pagination
- `q` : Recherche par mots-clés
- `city` : Filtrage par ville

---

### 2. **Backend (functions/api/jobs.js)**
L'API agrège automatiquement les 4 sources :

```javascript
const sources = live ? ["remote", "adzuna", "jooble", "d1"] : ["d1"];
```

| Source | Description | Nombre d'annonces |
|--------|-------------|-------------------|
| `remote` | La Bonne Alternance | ~450 |
| `adzuna` | Adzuna API | 114k+ (10 par page) |
| `jooble` | Jooble API | ~10 (France uniquement) |
| `d1` | Base de données locale | Variable |

---

## 📊 Flux de données

```
┌─────────────────┐
│  index.html     │
│  (Frontend)     │
└────────┬────────┘
         │ fetch("/api/jobs?live=1")
         ▼
┌─────────────────────────────────────┐
│  functions/api/jobs.js              │
│  (Cloudflare Function)              │
├─────────────────────────────────────┤
│  Appels parallèles aux 4 sources:  │
│  ┌─────────────────────────────┐   │
│  │ fetchRemote() → LBA         │   │
│  │ fetchAdzuna() → Adzuna      │   │
│  │ fetchJooble() → Jooble      │   │
│  │ fetchD1()     → DB locale   │   │
│  └─────────────────────────────┘   │
│                                     │
│  Déduplication + Tri par date      │
└────────┬────────────────────────────┘
         │ JSON: { items: [...] }
         ▼
┌─────────────────┐
│  index.html     │
│  Affichage      │
│  des cartes     │
└─────────────────┘
```

---

## 🛠️ Modifications Appliquées

### ✅ Jooble - Filtrage France
**Problème** : L'API retournait Paris, Texas au lieu de Paris, France

**Solution** :
```javascript
// functions/api/jobs.js:125-134
const usStates = ['AL','AK','AZ',...,'WY'];
const allJobs = (data.jobs || []).filter(j => {
  const loc = String(j.location || '');
  const locLower = loc.toLowerCase();
  // Exclure USA
  if (usStates.some(s => loc.endsWith(`, ${s}`))) return false;
  // Inclure France uniquement
  return locLower.includes('france') || 
         /paris|lyon|marseille|toulouse|.../i.test(loc);
});
```

---

### ✅ La Bonne Alternance - Mapping correct
**Problème** : Données incomplètes (titre, entreprise, lieu manquants)

**Solution** :
```javascript
// functions/api/jobs.js:93-108
const items = raw.slice(0, limit).map(r => {
  if (r.offer && r.workplace) {
    return {
      id: String(r.identifier?.id || randId()),
      title: String(r.offer?.title || "(sans titre)"),
      company: String(r.workplace?.name || r.workplace?.legal_name || ""),
      location: String(r.workplace?.location?.address || "").split(' ').slice(-1)[0],
      url: String(r.apply?.url || "#"),
      posted: asISO(r.offer?.publication?.creation || r.contract?.start),
      source: "remote"
    };
  }
  return normalize("remote")(r);
});
```

---

## 📝 Format de réponse unifié

Toutes les sources retournent le même format :

```javascript
{
  ok: true,
  meta: {
    query: { q: "développeur", location: "Paris", page: 1, limit: 10 },
    count: 30
  },
  items: [
    {
      id: "adzuna:5422740585",
      title: "Développeur Salesforce - (H/F) - En alternance",
      company: "OpenClassrooms",
      location: "8ème Arrondissement, Paris",
      url: "https://www.adzuna.fr/land/ad/...",
      posted: "2025-09-30T22:45:38Z",
      source: "adzuna"
    },
    {
      id: "68e05d71e602b2fd48eca56f",
      title: "Auxiliaire de vie",
      company: "ORGALY MARSEILLE",
      location: "MARSEILLE",
      url: "https://labonnealternance.apprentissage.beta.gouv.fr/...",
      posted: "2025-10-03T23:34:09.213Z",
      source: "remote"
    },
    {
      id: "jooble:5513203838093260801",
      title: "Technicien de maintenance H/F",
      company: "...",
      location: "France",
      url: "https://jooble.org/desc/...",
      posted: "2025-09-16T12:16:08.187Z",
      source: "jooble"
    }
  ]
}
```

---

## 🚀 Démarrage

### En local (développement)
```bash
# Installer les dépendances
npm install

# Démarrer le serveur Cloudflare Pages
npx wrangler pages dev public

# Ouvrir http://localhost:8788
```

### En production
Les annonces seront automatiquement chargées depuis :
- https://votre-domaine.pages.dev/api/jobs?live=1

---

## ✅ Validation

### Checklist d'intégration
- ✅ L'API `/api/jobs` fonctionne
- ✅ Le paramètre `live=1` active les sources externes
- ✅ Les 3 APIs externes retournent des données
- ✅ Jooble filtre correctement pour la France
- ✅ La Bonne Alternance retourne des données complètes
- ✅ Adzuna fonctionne parfaitement (114k+ annonces)
- ✅ `index.html` appelle `/api/jobs?live=1`
- ✅ Les annonces s'affichent dans la section "Toutes les offres"
- ✅ La déduplication fonctionne
- ✅ Le tri par date fonctionne

---

## 📊 Résultats attendus

Quand un utilisateur ouvre `index.html`, il verra :

1. **Section "Toutes les offres"** : Mélange de toutes les sources
2. **Pagination** : Bouton "Voir plus d'annonces" pour charger 40 annonces supplémentaires
3. **Filtrage** : Recherche par mot-clé et ville
4. **Sources variées** : Annonces de Jooble, Adzuna, LBA et DB locale

---

## 🎉 Conclusion

**OUI, les annonces des 3 APIs externes sont déjà intégrées dans index.html !**

Le système :
- ✅ Charge automatiquement les annonces au démarrage
- ✅ Agrège les 4 sources (LBA, Adzuna, Jooble, DB)
- ✅ Déduplique les résultats
- ✅ Trie par date de publication
- ✅ Affiche dans la liste principale

Aucune modification supplémentaire n'est nécessaire dans `index.html`.
