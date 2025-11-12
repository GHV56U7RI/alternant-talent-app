# Configuration Cloudinary pour Upload d'Images

## ✅ Pourquoi Cloudinary ?

- 🆓 **Gratuit** jusqu'à 25GB de stockage
- 📤 **Upload direct** depuis l'ordinateur
- 🖼️ **Gestion d'images** optimisée
- 🚀 **CDN intégré** pour des chargements rapides
- 🎨 **Transformations** d'images en temps réel

## 🚀 Configuration (5 minutes)

### Étape 1 : Créer un compte Cloudinary (GRATUIT)

1. Allez sur **https://cloudinary.com/users/register_free**
2. Inscrivez-vous avec votre email
3. Vérifiez votre email
4. Connectez-vous à votre dashboard

### Étape 2 : Récupérer vos identifiants

Dans le dashboard Cloudinary, vous verrez :

```
Cloud name: votre-cloud-name
API Key: 123456789012345
API Secret: xxxxxxxxxxxxx (pas besoin pour le CMS)
```

### Étape 3 : Mettre à jour la configuration

Ouvrez `admin/config.yml` et remplacez :

```yaml
media_library:
  name: cloudinary
  config:
    cloud_name: demo                    # ← Remplacez par votre cloud_name
    api_key: '126474716728491'          # ← Remplacez par votre api_key
```

Par vos propres identifiants :

```yaml
media_library:
  name: cloudinary
  config:
    cloud_name: mon-cloud-name          # Votre cloud_name
    api_key: '123456789012345'          # Votre API key (entre guillemets)
```

### Étape 4 : Tester

1. **Redémarrez le serveur** :
   - Arrêtez avec Ctrl+C
   - Relancez avec `npm run dev` et `npm run proxy`

2. **Videz le cache du navigateur** : Ctrl+Shift+Delete

3. **Allez sur** http://localhost:5173/admin

4. **Créez un article** et cliquez sur "Image de couverture"

5. **Vous devriez voir** :
   - Un bouton "Upload" ou "Media Library"
   - Une interface Cloudinary avec possibilité de glisser-déposer
   - Sélection de fichiers depuis votre ordinateur ✅

## 📝 Notes Importantes

### Pour le Développement (Actuellement)

J'ai configuré les identifiants **demo** de Cloudinary qui fonctionnent pour tester, mais :
- ⚠️ Les fichiers uploadés seront publics
- ⚠️ Cloudinary peut supprimer les fichiers du compte demo
- ⚠️ Limité en fonctionnalités

### Pour la Production

Créez votre propre compte gratuit Cloudinary :
- ✅ Vos fichiers sont privés et persistants
- ✅ 25GB de stockage gratuit
- ✅ Toutes les fonctionnalités disponibles

## 🎯 Avantages de Cloudinary

### Upload Simple
```
Avant : Copier manuellement dans public/images/blog/
Après  : Glisser-déposer directement dans l'admin ✨
```

### Optimisation Automatique
```
Image originale : 5MB
Image servie    : 200KB (optimisée automatiquement)
```

### Transformations d'Images
```
/image.jpg                    → Image originale
/w_300,h_200/image.jpg        → 300x200px
/w_300,h_200,c_fill/image.jpg → 300x200px recadrée
```

### CDN Global
Vos images sont servies depuis le CDN le plus proche de vos utilisateurs pour un chargement ultra-rapide.

## 🔒 Sécurité

- ✅ L'API Secret n'est jamais exposé côté client
- ✅ Seul l'API Key public est dans le code (normal)
- ✅ Vous contrôlez qui peut uploader via les paramètres Cloudinary

## 🆘 Support

- Documentation : https://cloudinary.com/documentation
- Support gratuit : Via le dashboard Cloudinary
- Limites gratuites : https://cloudinary.com/pricing

## 🎉 C'est Prêt !

Une fois configuré, vous pourrez :
1. Cliquer sur "Upload" dans l'admin
2. Sélectionner une image depuis votre ordinateur
3. L'image est automatiquement uploadée sur Cloudinary
4. L'URL est automatiquement insérée dans votre article

**Aucune manipulation manuelle de fichiers nécessaire !** 🚀
