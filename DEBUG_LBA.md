# 🔍 Diagnostic LBA - Pourquoi ça ne fonctionne pas encore

## Statut Actuel

✅ **Ce qui est fait :**
- Variables configurées localement (`.dev.vars`)
- Variables ajoutées sur Cloudflare (selon utilisateur)
- Code LBA implémenté
- Déployé 2 fois

❌ **Problème :**
- LBA n'apparaît pas dans les sources
- Total reste à 2266 offres (pas d'augmentation)

## Causes Possibles

### 1. Variables dans le mauvais environnement ⚠️ (PROBABLE)

**Symptôme :** Les variables sont en "Preview" au lieu de "Production"

**Vérification :**
1. Aller sur Cloudflare Dashboard
2. Workers & Pages > alternant-talent > Settings
3. Environment variables
4. **Vérifier que les 3 variables sont sous "Production" :**
   - REMOTE_API_BASE
   - REMOTE_API_CALLER
   - REMOTE_API_TOKEN

**Solution :**
Si elles sont en "Preview", les supprimer et les recréer en "Production"

### 2. Token invalide ou expiré ⚠️

**Token fourni par l'utilisateur :**
```
eyJhbGciOiJIUzI1NiJ9.eyJfaWQiOiI2OGNmNmNkNjgxZGY5MmFiYTc2MDNhODUiLCJhcGlfa2V5IjoiT1piZmNSdlNoeXkzWFBiaHF3REJ6aGFqRVdTQ3V6bFlFNU9raVVlZS9IST0iLCJvcmdhbmlzYXRpb24iOiJJbmNvbm51ZSIsImVtYWlsIjoiYWx0ZXJuYW50LnRhbGVudC5wLTk4YmRAb3V0bG9vay5jb20iLCJpc3MiOiJhcGkiLCJpYXQiOjE3NjIyNTg2NTksImV4cCI6MTc4OTk2MDQwOH0.y2H_c8m1nBquQcexTaM-I2Gu6rNkRCCwhR70opi95bc
```

**Décodage JWT (expiration) :**
```json
{
  "iat": 1762258659,  // Émis le: ~2025-11-04
  "exp": 1789960408   // Expire le: ~2026-11-20
}
```

✅ Token valide jusqu'en novembre 2026

**Si le token ne fonctionne pas :**
- Aller sur https://labonnealternance.apprentissage.beta.gouv.fr/espace-developpeurs
- Se connecter avec: alternant.talent.p-98bd@outlook.com
- Regénérer un nouveau token API

### 3. Nom des variables incorrect ❌

**Vérifier que les noms sont EXACTEMENT :**
```
REMOTE_API_BASE     (pas BASE_API_DISTANTE !)
REMOTE_API_CALLER   (pas API_CALLER !)
REMOTE_API_TOKEN    (pas TOKEN_API !)
```

### 4. API LBA en maintenance 🔧

**Test manuel de l'API :**

Ouvrir un navigateur et tester cette URL :
```
https://labonnealternance.apprentissage.beta.gouv.fr/api/V1/jobs?latitude=48.8566&longitude=2.3522&radius=30&diploma=Licence&api=apiv1&caller=alternant-talent&sources=offres
```

Ajouter le header :
```
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

**Si erreur 401 :** Token invalide
**Si erreur 403 :** Pas d'autorisation
**Si erreur 500 :** API en maintenance

### 5. Code qui ne s'exécute pas 🐛

**Vérification dans le code :**

`sources/lba.js` ligne 11-14 :
```javascript
if (!apiBase || !apiToken) {
  console.warn('LBA: Configuration API manquante');
  return [];
}
```

Si les variables ne sont pas accessibles, le code retourne un tableau vide sans erreur visible.

**Comment vérifier :**
Regarder les logs Cloudflare pour voir le warning "Configuration API manquante"

## Solutions par Priorité

### Solution 1 : Vérifier l'environnement (5 min) ⭐⭐⭐

1. Screenshot de la page Environment variables
2. Vérifier que les 3 variables sont en "Production"
3. Si en "Preview", les déplacer en "Production"

### Solution 2 : Vérifier les noms des variables (2 min) ⭐⭐⭐

```bash
# Sur Cloudflare, les noms DOIVENT être :
REMOTE_API_BASE     ✅
REMOTE_API_CALLER   ✅
REMOTE_API_TOKEN    ✅

# PAS :
BASE_API_DISTANTE   ❌
API_CALLER          ❌
TOKEN_LBA           ❌
```

### Solution 3 : Regénérer le token (10 min) ⭐⭐

1. Aller sur https://labonnealternance.apprentissage.beta.gouv.fr/espace-developpeurs
2. Se connecter
3. Regénérer un nouveau token
4. Remplacer REMOTE_API_TOKEN sur Cloudflare
5. Redéployer

### Solution 4 : Tester avec moins de villes (5 min) ⭐

Le code fait 30 villes × 5 diplômes = 150 requêtes. C'est peut-être trop.

Modifier `sources/lba.js` ligne 63 :
```javascript
// Avant :
const selectedCities = cities;

// Après (test avec 5 villes) :
const selectedCities = cities.slice(0, 5);
```

## Commandes de Debug

### Forcer un nouveau refresh
```bash
curl "https://alternant-talent.pages.dev/api/jobs?refresh=true"
sleep 60
curl -s "https://alternant-talent.pages.dev/api/jobs?limit=5000" | jq .total
```

### Voir les logs en temps réel
```bash
# Dans le dashboard Cloudflare :
# Workers & Pages > alternant-talent > Deployments > Latest > Logs
```

### Tester une seule ville manuellement
```javascript
// Dans la console navigateur sur alternant-talent.pages.dev
fetch('/api/jobs?refresh=true&limit=3000')
  .then(r => r.json())
  .then(d => console.log('Sources:', d.jobs.map(j => j.source).filter((v,i,a) => a.indexOf(v)===i)))
```

## Checklist de Vérification

- [ ] Variables en "Production" (pas "Preview")
- [ ] Noms exacts : REMOTE_API_BASE, REMOTE_API_CALLER, REMOTE_API_TOKEN
- [ ] Token non expiré (expire 2026-11-20)
- [ ] Déployé après ajout des variables
- [ ] Attendu 60 secondes après refresh
- [ ] Pas d'erreur 401/403 dans logs

## Prochaine Étape

**Attendre screenshot de l'utilisateur** montrant la page Environment variables pour identifier le problème exact.

Si tout est bon côté configuration, le problème vient probablement :
1. De l'API LBA qui ne retourne rien
2. Du token qui n'a pas les bonnes permissions
3. Du délai de propagation Cloudflare (peut prendre 5-10 minutes)
