# Politique de confidentialité
_Entrée en vigueur : 2025-08-30 • Dernière mise à jour : 2025-08-30_

La présente politique explique comment **Alternant Talent App** (« nous », « notre », « nos ») collecte, utilise et protège vos données lors de l’utilisation du site et de l’API accessibles à l’adresse **https://www.alternant-talent.com/**.

> TL;DR : nous collectons le strict nécessaire pour faire fonctionner le service (compte, préférences, journaux techniques) ; les offres d’emploi proviennent de sources tierces (Adzuna, Jooble) et ne visent pas à identifier des personnes ; vous pouvez demander l’accès, la rectification ou la suppression de vos données.

---

## 1) Responsable du traitement
- **Responsable** : Alternant Talent App  
- **Adresse de contact** : privacy@alternant-talent.com (ou contact@alternant-talent.com)  
- **DPO (si applicable)** : dpo@alternant-talent.com

---

## 2) Données que nous traitons

### 2.1 Compte & authentification
- **Données** : e-mail, mot de passe (haché/bcrypt), horodatages de création/mise à jour, préférences de profil (ex. ville, rayon, mots-clés, préférence télétravail).
- **Base légale** : exécution du contrat (art. 6-1-b RGPD).

### 2.2 Données d’usage (logs)
- **Données** : horodatages, IP tronquée ou complète (selon hébergeur), User-Agent, URL/route, code statut, identifiant de session (cookie `sid`).
- **Base légale** : intérêt légitime (sécurité, lutte contre l’abus) (art. 6-1-f RGPD).

### 2.3 Favoris & réglages côté navigateur
- **Données** : favoris d’offres, filtres/recherche, petites préférences UI.
- **Lieu de stockage** : **localStorage** sur votre appareil (non transmis au serveur).
- **Base légale** : exécution du contrat / intérêt légitime (amélioration de l’UX).

### 2.4 Contenus tiers (offres d’emploi)
- **Provenance** : APIs **Adzuna** et **Jooble** (et, le cas échéant, pages carrières publiques d’entreprises).
- **Nature** : intitulé, entreprise, lieu, description, lien de candidature, méta-données (date, source, tags).  
- **Remarque** : ces contenus sont **publics** chez nos partenaires/sources ; ils ne visent pas à identifier des personnes physiques. Si une offre expose par erreur une donnée personnelle, contactez-nous : privacy@alternant-talent.com.

---

## 3) Finalités
- Fournir le service (affichage d’offres, recherche, favoris, profil).
- Sécuriser et maintenir l’infrastructure (détection d’abus, diagnostic pannes).
- Mesure d’audience **minimale** (si activée, voir § Cookies & analytics).

---

## 4) Cookies & stockage local

### 4.1 Cookies essentiels
- **`sid` (HttpOnly, SameSite=Lax, Secure en prod)** : session d’authentification.  
- **Base légale** : exécution du contrat ; exempté de consentement.

### 4.2 Cookies/analytics (optionnels)
- Par défaut **désactivés**. Si nous activons une mesure d’audience respectueuse (ex. Plausible auto-hébergé, sans cookies), nous l’indiquerons ici et dans la bannière.  
- **Base légale** : consentement (art. 6-1-a) ou intérêt légitime si solution sans cookie et agrégée.

### 4.3 Stockage local
- **localStorage** : favoris, préférences d’affichage. Vous pouvez vider ces données via les réglages de votre navigateur.

---

## 5) Destinataires et sous-traitants
- **Hébergeur** : précisez (ex. Cloudflare / Vercel / Render / OVH).  
- **Fournisseurs de données** : **Adzuna**, **Jooble** (sources d’offres).  
- **Géoservices (option)** : **OpenStreetMap / Nominatim**, **OSRM**, **Overpass** pour des calculs d’itinéraires/lieux.  
- Accès interne restreint aux personnes habilitées (maintenance/sécurité).

Nous ne vendons pas vos données. Aucun transfert non nécessaire hors UE n’est effectué, hors cas où l’un de ces prestataires opère hors UE avec des garanties adéquates (clauses contractuelles types, hébergement UE, etc.).

---

## 6) Durées de conservation
- **Compte utilisateur** : tant que le compte est actif, puis suppression à votre demande ou après inactivité prolongée (ex. 24 mois) ; certains journaux sécurité peuvent être conservés plus longtemps si nécessaire.
- **Logs techniques** : 3 à 12 mois max (selon contrainte légale/sécurité).
- **Cookies de session** : durée de la session ou 30 jours max si « rester connecté ».
- **localStorage** : persiste jusqu’à suppression par l’utilisateur.

---

## 7) Vos droits (RGPD)
Vous pouvez exercer à tout moment :
- **Accès** à vos données,
- **Rectification**,
- **Effacement** (« droit à l’oubli »),
- **Limitation** du traitement,
- **Opposition** (notamment mesure d’audience, si activée),
- **Portabilité** (le cas échéant).

Contact : **privacy@alternant-talent.com** (objet « Exercice de droits RGPD »).  
Nous répondrons sous 30 jours (prolongeable en cas de complexité).  
Vous pouvez également déposer une réclamation auprès de l’autorité compétente (en France : **CNIL**).

---

## 8) Sécurité
- Mots de passe **hachés** (bcrypt).  
- Cookies de session **HttpOnly** + **Secure** (en production).  
- Journalisation et surveillance de base contre l’abus.  
- Accès administrateur protégé (**Bearer ADMIN_TOKEN**) et principes de moindre privilège.  
Aucune mesure n’est infaillible ; en cas d’incident, nous notifierons les personnes concernées et l’autorité compétente lorsque requis.

---

## 9) Transferts hors UE
Lorsque certains prestataires (ex. CDN, mesure d’audience) opèrent en dehors de l’UE, nous privilégions :
- un **hébergement UE** ou
- des **Clauses Contractuelles Types** et/ou
- des solutions **sans cookie**, **sans IP complète**, **anonymisées**.

---

## 10) Mineurs
Le service ne cible pas les mineurs de **moins de 15 ans**. Si vous êtes parent/tuteur et pensez qu’un mineur nous a fourni des données, contactez-nous : privacy@alternant-talent.com.

---

## 11) Modifications de cette politique
Nous pouvons modifier cette politique pour refléter des évolutions légales ou fonctionnelles.  
Nous publierons la nouvelle version ici avec une **nouvelle date d’entrée en vigueur** ; si les changements sont substantiels, une notification pourra apparaître sur le site.

---

## 12) Contact
- **E-mail** : privacy@alternant-talent.com  
- **Adresse postale** (si applicable) : …  
- **DPO** (si nommé) : dpo@alternant-talent.com

---

## 13) Résumé technique (pour les développeurs)

- **Back-end** : Node.js/Express (`server.js`)  
  - Auth : SQLite (`data/auth.db`) via `better-sqlite3` ou fallback JSON (`data/auth.json`)  
  - Cookies : `sid` HttpOnly, SameSite=Lax, Secure en prod  
  - API : `/api/jobs`, `/api/refresh` (Bearer), `/api/direct`, `/api/auth/*`, `/api/events` (SSE)  
- **Front** : `bridge-v12.js`  
  - Favoris/profil léger côté client via localStorage (non transmis par défaut)  
- **Données externes** : Adzuna/Jooble (offres publiques), OSM/OSRM (option itinéraires)  
- **Logs** : accès agrégé, rotation ; pas de contenus sensibles par défaut  
- **Mesure d’audience** : **désactivée par défaut** (si activation : outil privacy-friendly ou consentement requis)

---

_En utilisant le service, vous acceptez cette politique. Pour toute question, écrivez-nous à **privacy@alternant-talent.com**._
