# ✅ Système de Tri des Annonces - Corrigé

## 🎯 Problème identifié

L'ancien système utilisait une fonction `bucket()` qui se basait sur le **texte** de la date au lieu de calculer l'âge réel :

```javascript
// ❌ ANCIEN (incorrect)
function bucket(p) { 
  const v = (p||'').toLowerCase(); 
  if(v.includes('jourd')) return 'today'; 
  if(v.includes('semaine')) return 'week'; 
  // ...
}
```

**Problème** : Cette approche ne fonctionnait que si la date était déjà formatée en texte français ("aujourd'hui", "cette semaine"), ce qui n'était jamais le cas avec les dates ISO des APIs.

---

## ✅ Solution implémentée

### 1. Calcul de l'âge réel en jours

```javascript
function daysSince(dateStr) {
  if(!dateStr) return 999999;
  try {
    const d = new Date(dateStr);
    if(isNaN(d.getTime())) return 999999;
    const now = new Date();
    const diff = now - d;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  } catch {
    return 999999;
  }
}
```

### 2. Groupement basé sur les jours

```javascript
function bucket(posted) {
  const days = daysSince(posted);
  if(days === 0) return 'today';           // Aujourd'hui
  if(days <= 7) return 'week';             // Cette semaine (≤7j)
  if(days <= 30) return 'recent';          // Récents (≤30j)
  if(days <= 60) return 'month1';          // Il y a 1 mois
  if(days <= 90) return 'month2';          // Il y a 2 mois
  if(days <= 120) return 'month3';         // Il y a 3 mois
  return 'other';                          // Plus anciens
}
```

### 3. Ordre d'affichage

```javascript
const ORDER = ['today', 'week', 'recent', 'month1', 'month2', 'month3', 'other'];
```

### 4. Labels d'affichage

```javascript
const LABEL = {
  today: 'Aujourd\'hui',
  week: 'Cette semaine',
  recent: 'Récents (≤ 30 jours)',
  month1: 'Il y a 1 mois',
  month2: 'Il y a 2 mois',
  month3: 'Il y a 3 mois',
  other: 'Plus anciens'
};
```

---

## 📊 Résultat attendu

Les annonces seront maintenant groupées dans l'ordre suivant :

1. **Aujourd'hui** : Annonces publiées le jour même
2. **Cette semaine** : Annonces de 1 à 7 jours
3. **Récents (≤ 30 jours)** : Annonces de 8 à 30 jours
4. **Il y a 1 mois** : Annonces de 31 à 60 jours
5. **Il y a 2 mois** : Annonces de 61 à 90 jours
6. **Il y a 3 mois** : Annonces de 91 à 120 jours
7. **Plus anciens** : Annonces de plus de 120 jours

---

## 🧪 Test

Un fichier de test a été créé : `test-grouping.html`

Pour tester :
```bash
# Ouvrir le fichier dans un navigateur
open test-grouping.html
```

Le test affiche 11 annonces réparties sur différentes périodes :
- Aujourd'hui : 1 annonce
- Cette semaine : 3 annonces
- Récents : 3 annonces
- Il y a 1 mois : 1 annonce
- Il y a 2 mois : 1 annonce
- Il y a 3 mois : 1 annonce
- Plus anciens : 1 annonce

---

## 📝 Modifications dans index.html

**Fichier** : `public/index.html`

**Lignes modifiées** : 567-600

1. ✅ Ajout de la fonction `daysSince()` pour calculer l'âge
2. ✅ Remplacement de `bucket()` avec logique basée sur les jours
3. ✅ Extension de `ORDER` avec les groupes mensuels
4. ✅ Extension de `LABEL` avec les labels correspondants
5. ✅ Suppression de la duplication "(≤ 30 jours)" dans le rendu

---

## ✅ Validation

Le système fonctionne maintenant correctement avec :
- ✅ Annonces du jour
- ✅ Annonces de la semaine
- ✅ Annonces récentes (≤30j)
- ✅ Groupement par mois (1, 2, 3 mois)
- ✅ Annonces anciennes (>3 mois)

---

## 🎉 Conclusion

Le système de tri est maintenant **basé sur l'âge réel** des annonces calculé à partir de la date ISO (`posted`), et non plus sur du texte français.

**Ordre d'affichage** : Les annonces les plus récentes apparaissent en premier ! ✨
