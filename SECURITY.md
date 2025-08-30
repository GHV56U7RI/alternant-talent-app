# Politique de sécurité

Merci de contribuer à la sécurité d’**Alternant Talent App**.  
Nous appliquons une politique de **divulgation responsable** et encourageons la communauté à nous signaler toute vulnérabilité.

---

## Signaler une vulnérabilité

- **Email dédié** : security@votre-domaine.tld  
- **Security.txt** : https://votre-domaine/.well-known/security.txt  
- **Option chiffrée (PGP)** : (facultatif) publiez ici l’empreinte & la clé publique, ex. `openpgp.asc`

Merci d’inclure :
- Étapes de reproduction (claires, déterministes)
- Portée affectée (URL, endpoint API, version)
- Impact (lecture/écriture de données, RCE, escalade, etc.)
- Logs / captures / PoC (sans données personnelles si possible)
- Vos coordonnées (pour suivi)

**Nous nous engageons** à :
- Accuser réception sous **72h**,
- Qualifier sous **5 jours ouvrés**,
- Proposer un correctif ou une mitigation dans un délai cible de **7–90 jours** selon la sévérité.

---

## Portée (in scope)

- Production : `https://alternant-talent.pages.dev/` et tout domaine officiel dérivé  
- API/back-end : endpoints `server.js` (`/api/*`, SSE `/api/events`)  
- Collecteurs : `adzuna.js`, `jooble.js` (entrée/sortie, validation)  
- Front statique : `public/*`, `bridge-v12.js` (XSS/CSRF/Clickjacking)

**Hors portée (out of scope)**

- Attaques **DoS/DDoS** ou volumétriques, stress test non coordonné
- Ingénierie sociale, phishing, usurpation de personnel/partenaires
- Accès physique aux appareils ou à l’infrastructure d’hébergement
- Découvertes liées à des **composants tiers** sans impact démontré chez nous
- Scans automatiques agressifs sans contrôle du taux de requêtes

---

## Règles de test

- Utilisez des **comptes de test** et des **données fictives**.
- Ne lisez/modifiez/supprimez **aucune donnée d’un tiers**.
- Respectez un **taux raisonnable** de requêtes (rate-limiting friendly).
- Prévenez-nous avant tout test potentiellement risqué (p. ex. fuzz ciblé).

**Safe harbor** : Tant que vous respectez ces règles et la divulgation responsable, nous **n’engagerons pas d’action** contre des recherches de bonne foi.

---

## Sévérité (guidelines)

- **Critique** : RCE, exfiltration massive de données, auth bypass global
- **Élevée** : IDOR menant à des données d’un autre utilisateur, XSS stocké, SSRF exploitable
- **Moyenne** : XSS réfléchi, fuites partielles, mauvaises permissions non triviales
- **Faible** : best practices manquantes, en-têtes de sécurité absents, messages d’erreur verbeux

Nous utilisons un mix **CVSS** + **impact métier** pour prioriser.

---

## Bonnes pratiques appliquées

- **Secrets** : `.env` local (non versionné), **secrets d’environnement** en hébergement ; rotation si exposition
- **Données runtime** : `data/*.db`, `data/*-cache*.json` **ignorés par Git**
- **Cookies** : `sid` **HttpOnly**, `SameSite=Lax`, `Secure` en production
- **CSP & headers** : à définir via `public/_headers` (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
- **Dépendances** : `npm audit`, alertes GitHub, mises à jour régulières
- **Entrées utilisateur** : validation côté serveur ; échappement en front
- **Logs** : pas de secrets, pas de données sensibles en clair
- **SSE** : connexions vérifiées, timeouts/keep-alive configurés
- **Endpoints admin** : `/api/refresh` protégé par `Authorization: Bearer <ADMIN_TOKEN>`

---

## Gestion d’incident

1. **Triage** & reproduction
2. **Mitigation** rapide si nécessaire (désactivation partielle, règles WAF)
3. **Correctif** + tests
4. **Déploiement** progressif
5. **Communication** responsable (merci de ne pas divulguer publiquement avant correctif ou délai convenu)

---

## Modèle de rapport (copier-coller)

Titre : <vulnérabilité résumée>
Portée : <URL/endpoint/version>
Impact : <impact technique + métier>
Étapes de reproduction :

…

…

…
PoC / Captures :
Correctif suggéré (optionnel) :
Contact :

yaml
Copier le code

---

## Programme de récompenses

Nous n’avons pas (encore) de bug bounty formel.  
Pour les signalements **critiques/élevés** de bonne foi, nous pouvons proposer un **remerciement public** dans le changelog et/ou une petite gratification symbolique.

---

## Contact d’urgence

- **security@votre-domaine.tld** (24/7, meilleure réactivité)
- En cas d’exposition de secrets : **révoquez-les immédiatement*