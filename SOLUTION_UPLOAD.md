# Solution Temporaire pour Upload d'Images et Audio

## ❌ Problème Actuel

Decap CMS demande une URL au lieu d'ouvrir le sélecteur de fichiers pour uploader depuis l'ordinateur.

## ✅ Solutions Disponibles

### Solution 1 : Upload Manuel dans le Dossier (RECOMMANDÉ)

1. **Copiez votre image/audio manuellement** dans le bon dossier :
   - Images : `public/images/blog/mon-image.jpg`
   - Audio : `public/images/blog/audio/mon-audio.mp3`

2. **Dans l'admin, utilisez le chemin relatif** :
   - Pour image : `/images/blog/mon-image.jpg`
   - Pour audio : `/images/blog/audio/mon-audio.mp3`

3. **C'est tout !** Le fichier sera accessible et affiché correctement.

### Solution 2 : Utiliser le Widget Markdown pour Insérer des Images

1. Dans le champ "Contenu" (markdown), vous pouvez insérer des images :
   ```markdown
   ![Description](/ /blog/mon-image.jpg)
   ```

2. Le widget markdown de Decap CMS a parfois un bouton d'upload intégré.

### Solution 3 : Utiliser un Service Externe (pour la production)

Pour avoir un vrai upload qui fonctionne, vous pouvez :

1. **Cloudinary** (gratuit jusqu'à 25GB) :
   ```yaml
   media_library:
     name: cloudinary
     config:
       cloud_name: votre-cloud-name
       api_key: votre-api-key
   ```

2. **Uploadcare** (gratuit jusqu'à 3000 uploads/mois) :
   ```yaml
   media_library:
     name: uploadcare
     config:
       publicKey: votre-public-key
   ```

## 🔧 Pourquoi Ça Ne Fonctionne Pas ?

Decap CMS (anciennement Netlify CMS) nécessite **obligatoirement** une bibliothèque de médias externe (Cloudinary, Uploadcare, etc.) pour avoir un vrai bouton d'upload depuis l'ordinateur.

Le `local_backend: true` permet de :
- ✅ Éditer les fichiers localement sans authentification
- ✅ Voir les changements en temps réel
- ❌ Mais **PAS** d'uploader des fichiers via l'interface

## 📝 Workflow Recommandé pour le Développement Local

1. Mettez vos images dans `public/images/blog/`
2. Notez le nom du fichier
3. Dans l'admin, collez simplement : `/images/blog/nom-fichier.jpg`
4. Sauvegardez

C'est plus rapide que d'attendre un upload de toute façon ! 😊

## 🚀 Pour la Production sur Netlify

Sur Netlify avec Git Gateway activé, vous aurez besoin d'une vraie media library comme Cloudinary ou Uploadcare.
