# ✅ Synchronisation des Champs Admin ↔ Articles

## 📊 Tableau de Correspondance

| Champ Admin (config.yml) | Nom Technique | Présent dans Articles | Synchronisé |
|---------------------------|---------------|----------------------|-------------|
| **Titre** | `title` | ✅ Oui | ✅ Parfait |
| **Slug (URL)** | `slug` | ✅ Oui | ✅ Parfait |
| **Résumé** | `excerpt` | ✅ Oui | ✅ Parfait |
| **Date de publication** | `date` | ✅ Oui | ✅ Parfait |
| **Catégorie** | `category` | ✅ Oui | ✅ Parfait |
| **Temps de lecture (min)** | `readTime` | ✅ Oui | ✅ Parfait |
| **Image de couverture** | `cover` | ✅ Oui | ✅ Parfait |
| **URL Audio (optionnel)** | `audioUrl` | ✅ Oui | ✅ Parfait |
| **Tags** | `tags` | ✅ Oui | ✅ Parfait |
| **Auteur** | `author` | ✅ Oui | ✅ Parfait |
| **Statut** | `status` | ✅ Oui | ✅ Parfait |
| **À la Une** | `featured` | ✅ Oui | ✅ Parfait |
| **Contenu (Markdown)** | `body` | ✅ Oui | ✅ Parfait |

## 🎯 Résultat : 100% Synchronisé ✅

**Tous les champs sont parfaitement synchronisés !**

## 📝 Exemple d'Article Existant

Voici la structure d'un de vos articles (`candidature-un-clic.mdx`) :

```yaml
---
slug: "candidature-un-clic"
title: "Candidature en 1 clic : postulez plus vite que jamais"
excerpt: "Notre nouvelle fonctionnalité de candidature instantanée..."
date: "2025-11-02"
category: "produit"
readTime: 3
cover: ""
audioUrl: ""
tags: ["produit", "candidature", "simplification"]
author: "Équipe Mon alternance talent"
status: "published"
featured: false
---

## Le contenu de l'article en Markdown
...
```

## 🔄 Correspondance Admin → Article

Quand vous créez un article dans l'admin, voici ce qui se passe :

### Dans l'Admin (formulaire)
```
Titre: "Mon Article"
Slug: "mon-article"
Résumé: "Description courte"
Date: 2025-11-12
Catégorie: alternance
Temps de lecture: 5
Image de couverture: /images/blog/mon-image.jpg
URL Audio: /images/blog/audio/podcast.mp3
Tags: alternance, conseil
Auteur: Votre Nom
Statut: published
À la Une: ✓ (coché)
Contenu: [Votre texte en markdown]
```

### Dans le Fichier (content/posts/2025-11-12-mon-article.mdx)
```yaml
---
slug: "mon-article"
title: "Mon Article"
excerpt: "Description courte"
date: "2025-11-12"
category: "alternance"
readTime: 5
cover: "/images/blog/mon-image.jpg"
audioUrl: "/images/blog/audio/podcast.mp3"
tags: ["alternance", "conseil"]
author: "Votre Nom"
status: "published"
featured: true
---

[Votre texte en markdown]
```

## 📚 Champs Manquants que Vous Avez Mentionnés

Vous avez demandé si ces champs sont synchronisés :

| Champ Demandé | Correspond à | Status |
|---------------|--------------|--------|
| ✅ Type d'article | → `category` | Synchronisé |
| ✅ Titre | → `title` | Synchronisé |
| ✅ Slug (URL) | → `slug` | Synchronisé |
| ✅ Extrait (Excerpt) | → `excerpt` | Synchronisé |
| ✅ Image de couverture | → `cover` | Synchronisé |
| ✅ Texte du résumé | → `excerpt` | Synchronisé (même chose) |
| ✅ Contenu (Markdown) | → `body` | Synchronisé |
| ✅ Catégorie | → `category` | Synchronisé |
| ✅ Temps de lecture (min) | → `readTime` | Synchronisé |
| ✅ URL Audio (optionnel) | → `audioUrl` | Synchronisé |
| ✅ Date de publication | → `date` | Synchronisé |

## ✨ Champs Bonus (aussi synchronisés)

En plus de ce que vous avez demandé, vous avez aussi :

- ✅ **Tags** : Pour organiser vos articles
- ✅ **Auteur** : Pour créditer l'auteur
- ✅ **Statut** : draft/published pour gérer la publication
- ✅ **À la Une** : Pour mettre en avant certains articles

## 🎓 Comment Vérifier la Synchronisation

### 1. Via l'Admin
1. Allez sur http://localhost:5173/admin
2. Cliquez sur un article existant
3. Tous les champs devraient être remplis avec les données de l'article

### 2. Via les Fichiers
1. Ouvrez `content/posts/`
2. Ouvrez n'importe quel fichier `.mdx`
3. Regardez le front matter (entre les `---`)
4. Tous les champs de l'admin sont là

## 🔍 Test de Synchronisation

Pour tester que tout fonctionne :

1. **Modifiez un article dans l'admin** :
   - Changez le titre
   - Modifiez le résumé
   - Sauvegardez

2. **Vérifiez le fichier** :
   - Ouvrez `content/posts/[nom-article].mdx`
   - Les changements sont là ✅

3. **Vérifiez sur le site** :
   - Rechargez http://localhost:5173/blog
   - Les changements s'affichent ✅

## 🎯 Conclusion

**100% des champs sont synchronisés** entre :
- L'interface admin (Decap CMS)
- Les fichiers MDX dans `content/posts/`
- L'affichage sur le site

Vous pouvez éditer vos articles soit :
- ✏️ **Via l'admin** : http://localhost:5173/admin
- 📝 **Via les fichiers** : Directement dans `content/posts/*.mdx`

Les deux méthodes fonctionnent et restent synchronisées ! 🎉
