# Instructions pour utiliser l'Admin avec Upload de Fichiers

## ✅ Serveurs qui doivent tourner

Vous avez besoin de 2 serveurs en même temps :

1. **Terminal 1** - Application principale :
   ```bash
   npm run dev
   ```
   → Tourne sur http://localhost:5173/

2. **Terminal 2** - Proxy pour l'admin :
   ```bash
   npm run proxy
   ```
   → Tourne sur port 8081

## 🔧 Comment accéder à l'admin

1. Ouvrez votre navigateur
2. Allez sur : **http://localhost:5173/admin**
3. Vous devriez voir en haut : **"Working with local backend"** en vert

## 📤 Comment uploader des fichiers

### Pour une IMAGE :

1. Créez un nouvel article
2. Descendez jusqu'au champ **"Image de couverture"**
3. Vous devriez voir :
   - Un cadre avec **"Choose an image"** (bouton)
   - OU une zone de glisser-déposer
4. Cliquez sur le bouton OU glissez une image
5. Sélectionnez votre fichier .jpg, .png, etc.

### Pour un AUDIO :

1. Dans le même article
2. Descendez jusqu'au champ **"Fichier Audio (MP3/WAV/OGG)"**
3. Même processus : cliquez sur **"Choose an image"** (oui, c'est le même bouton)
4. Sélectionnez votre fichier .mp3, .wav, .ogg

## ⚠️ Si vous ne voyez pas le bouton "Choose an image" :

1. **Videz COMPLÈTEMENT le cache** :
   - Chrome/Edge : Ctrl+Shift+Delete → Cochez tout → Effacer
   - Firefox : Ctrl+Shift+Delete → Cochez tout → Effacer
   - Safari : Cmd+Option+E

2. **Fermez complètement le navigateur**

3. **Redémarrez le navigateur**

4. **Allez directement sur** http://localhost:5173/admin

## 🐛 Problèmes courants

### "Il me demande un lien"
→ Le proxy n'est pas lancé. Vérifiez Terminal 2.

### "Cannot connect to backend"
→ Rechargez la page avec Ctrl+R ou Cmd+R

### "Working with Git Gateway"
→ Mauvaise configuration. Devrait être "Working with local backend"

## 📁 Où sont sauvegardés les fichiers ?

- Images : `public/images/blog/votre-image.jpg`
- Audio : `public/images/blog/audio/votre-audio.mp3`
