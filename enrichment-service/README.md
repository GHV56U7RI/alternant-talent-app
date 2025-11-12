# Service d'enrichissement Alternant Talent

Service Node.js pour enrichir les offres d'alternance avec Ollama.

## Installation

```bash
cd enrichment-service

# Installer les dépendances
npm install

# Copier le fichier de configuration
cp .env.example .env

# Modifier .env avec vos paramètres
```

## Prérequis

1. **Installer Ollama** (si pas déjà fait) :
```bash
# macOS/Linux
curl -fsSL https://ollama.com/install.sh | sh

# Télécharger Mistral (environ 4GB)
ollama pull mistral

# Vérifier que ça fonctionne
ollama run mistral "Bonjour"
```

2. **Démarrer Ollama** :
```bash
ollama serve
```

## Démarrage

```bash
# Mode développement (avec hot reload)
npm run dev

# Mode production
npm start
```

Le serveur démarre sur `http://localhost:3001`

## Endpoints

### GET /health
Vérifier le statut du service et la connexion à Ollama.

```bash
curl http://localhost:3001/health
```

### POST /test
Tester l'enrichissement avec une offre d'exemple.

```bash
curl -X POST http://localhost:3001/test
```

### POST /enrich/single
Enrichir une seule offre.

```bash
curl -X POST http://localhost:3001/enrich/single \
  -H "Content-Type: application/json" \
  -d '{
    "job": {
      "id": "123",
      "title": "Développeur Full Stack",
      "description": "...",
      "location": "Paris",
      "company": "TechCorp"
    }
  }'
```

### POST /enrich/batch
Enrichir un lot d'offres.

```bash
curl -X POST http://localhost:3001/enrich/batch \
  -H "Content-Type: application/json" \
  -d '{
    "jobs": [
      {"id": "123", "title": "...", "description": "..."},
      {"id": "124", "title": "...", "description": "..."}
    ]
  }'
```

## Format de sortie

Chaque offre enrichie contient les champs supplémentaires suivants :

```json
{
  "id": "123",
  "title": "Développeur Full Stack",
  "description": "...",
  "location": "Paris",
  "company": "TechCorp",
  "enriched": {
    "niveau_etudes": "Bac+4",
    "domaine": "Développement web",
    "competences": ["React", "Node.js", "PostgreSQL"],
    "type_contrat": "Alternance",
    "duree_estimee": "24 mois",
    "teletravail": true,
    "salaire_estime": "1000-1400€",
    "tags": ["dev", "fullstack", "javascript"]
  },
  "enriched_at": "2025-01-03T10:30:00.000Z"
}
```

## Performance

- Environ 2-5 secondes par offre (selon la taille de la description)
- Délai configurable entre chaque enrichissement (défaut: 500ms)
- Limite recommandée: 100 offres par batch

## Gestion des erreurs

Si l'enrichissement échoue pour une offre, elle est retournée avec des valeurs par défaut et un champ `enrichment_error`.
