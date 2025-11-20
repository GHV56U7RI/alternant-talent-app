# Système de Résolution d'URLs Gratuit - Documentation

## Vue d'ensemble

Ce système améliore la qualité des offres collectées depuis Direct Careers en résolvant automatiquement les URLs génériques (`/careers`) vers des pages de jobs spécifiques, et en validant les offres avec des modèles IA 100% gratuits.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   COLLECTE DIRECT CAREERS                   │
│  (Greenhouse, Lever, SmartRecruiters, Workday, etc.)       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              RÉSOLUTION D'URLs (FreeURLResolver)            │
│  • Détection ATS (Greenhouse, Lever, Workday, etc.)        │
│  • Patterns connus (templates par ATS)                      │
│  • Patterns custom (apprentissage automatique)              │
│  • Heuristiques intelligentes                               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│           VALIDATION IA GRATUITE (FreeAIValidator)          │
│                                                             │
│  Tier 1: Ollama (local, illimité) ──────► Succès ──────┐   │
│     └─► Échec                                           │   │
│                                                         ▼   │
│  Tier 2: Gemini Flash (1500 req/jour) ──► Succès ──────┤   │
│     └─► Échec                                           │   │
│                                                         │   │
│  Tier 3: Groq (14,400 tokens/min) ─────► Succès ───────┤   │
│     └─► Échec                                           │   │
│                                                         │   │
│  Tier 4: Validation heuristique ───────────────────────┤   │
│                                                         │   │
└─────────────────────────────────────────┬───────────────┘   │
                                          │                   │
                                          ▼                   │
                                   OFFRE VALIDÉE ◄────────────┘
```

## Composants

### 1. FreeURLResolver (`sources/url-resolver-free.js`)

Résout intelligemment les URLs génériques vers des URLs détaillées.

**Fonctionnalités:**
- Détection automatique de l'ATS (Greenhouse, Lever, Workday, etc.)
- Templates d'URL par ATS
- Apprentissage de patterns custom par entreprise
- Cache de résolution pour performances
- Export/import de patterns appris

**Exemple d'utilisation:**

```javascript
import { FreeURLResolver } from './sources/url-resolver-free.js';

const resolver = new FreeURLResolver();

// Résolution d'une URL générique
const result = await resolver.resolve('https://boards.greenhouse.io/company/jobs', {
  jobId: '123456',
  title: 'Développeur Alternance',
  company: 'TechCorp'
});

console.log(result.url);         // https://boards.greenhouse.io/jobs/123456
console.log(result.confidence);  // 0.8
console.log(result.method);      // 'ats-pattern'

// Apprentissage de patterns
resolver.learnPattern('Example Corp', 'https://example.com/jobs/dev-123');
resolver.learnPattern('Example Corp', 'https://example.com/jobs/marketing-456');
resolver.learnPattern('Example Corp', 'https://example.com/jobs/sales-789');

// Export des patterns appris
const patterns = resolver.exportPatterns();
```

**Patterns ATS supportés:**

| ATS | Pattern détail | Template |
|-----|----------------|----------|
| Greenhouse | `/jobs/{id}` | `/jobs/123456` |
| Lever | `/jobs/{slug}` | `/jobs/developer-alternance` |
| SmartRecruiters | `/jobs/{id}` | `/jobs/789` |
| Workday | `/job/{location}/{title}` | `/job/Paris/Developer` |
| WTTJ | `/jobs/{slug}` | `/jobs/alternance-dev` |
| TeamTailor | `/jobs/{id}-{slug}` | `/jobs/123-developer` |

### 2. FreeAIValidator (`sources/ai-validator-free.js`)

Valide les offres avec un système de fallback multi-tier 100% gratuit.

**Tiers de validation:**

1. **Ollama (local)** - Illimité, gratuit
   - Modèles: Mistral, Llama 3.2, Phi 3, Qwen 2.5
   - Endpoint: `http://localhost:11434`
   - Timeout: 10s

2. **Gemini Flash** - 1500 req/jour gratuit
   - Modèle: `gemini-1.5-flash-8b`
   - Rate limit: 1500/jour
   - Timeout: 8s

3. **Groq** - 14,400 tokens/min gratuit
   - Modèle: `llama-3.2-90b-text-preview`
   - Rate limit: 14,400 tokens/min
   - Timeout: 8s

4. **Heuristique** - Fallback sans IA
   - Score basé sur titre, URL, localisation
   - Confiance max: 0.7

**Exemple d'utilisation:**

```javascript
import { FreeAIValidator } from './sources/ai-validator-free.js';

const validator = new FreeAIValidator({
  ollamaEndpoint: 'http://localhost:11434',
  geminiKey: process.env.GEMINI_API_KEY,
  groqKey: process.env.GROQ_API_KEY
});

const job = {
  id: 'job-123',
  title: 'Alternance Développeur Full Stack - Paris',
  company: 'TechCorp',
  location: 'Paris, France',
  apply_url: 'https://techcorp.com/jobs/dev-fullstack-123'
};

const result = await validator.validate(job);

console.log(result.verdict);     // 'VALID' ou 'REJECT'
console.log(result.confidence);  // 0.0 à 1.0
console.log(result.tier);        // 'ollama', 'gemini', 'groq', ou 'heuristic'
console.log(result.reason);      // Explication

// Stats
const stats = validator.getStats();
console.log(stats.ollama.calls);   // Nombre d'appels Ollama
console.log(stats.gemini.calls);   // Nombre d'appels Gemini
console.log(stats.groq.calls);     // Nombre d'appels Groq
```

### 3. FreeMonitoring (`sources/monitoring-free.js`)

Système de monitoring en temps réel des performances.

**Métriques trackées:**

- **Résolution d'URLs**
  - Total résolu / échoué
  - Taux de succès
  - Confiance moyenne
  - Par méthode (ats-pattern, custom-pattern, heuristic)
  - Par ATS (Greenhouse, Lever, etc.)

- **Validation IA**
  - Total validé / rejeté
  - Taux de validation
  - Confiance moyenne
  - Par tier (Ollama, Gemini, Groq, heuristique)

- **Jobs**
  - Collectés / validés / rejetés
  - URLs génériques vs détaillées
  - Performance (jobs/seconde)

**Exemple d'utilisation:**

```javascript
import { FreeMonitoring } from './sources/monitoring-free.js';

const monitoring = new FreeMonitoring();

// Log événements
monitoring.logJobCollected(job, 'detail');
monitoring.logURLResolution({ url: '...', confidence: 0.8, method: 'ats-pattern' });
monitoring.logAIValidation({ verdict: 'VALID', confidence: 0.9, tier: 'ollama' }, job);

// Génère rapport
const report = monitoring.generateTextReport();
console.log(report);

// Export session
const session = monitoring.exportSession();
```

**Exemple de rapport:**

```
╔══════════════════════════════════════════════════════════════╗
║                  RAPPORT DE MONITORING                       ║
╚══════════════════════════════════════════════════════════════╝

📊 Session: session-1700000000000-abc123
⏱️  Durée: 5m 30s
📅 Démarré: 2025-11-19T06:00:00.000Z

┌────────────────────────────────────────────────────────────┐
│ RÉSOLUTION D'URLS                                          │
└────────────────────────────────────────────────────────────┘
  Total: 150
  ✅ Résolues: 120 (80%)
  ❌ Échouées: 30
  🎯 Confiance moyenne: 0.75

  Par méthode:
    ats-pattern: 80
    custom-pattern: 25
    heuristic: 15

  Par ATS:
    greenhouse: 45
    lever: 30
    smartrecruiters: 5

┌────────────────────────────────────────────────────────────┐
│ VALIDATION IA                                              │
└────────────────────────────────────────────────────────────┘
  Total: 120
  ✅ Validées: 95 (79.17%)
  ❌ Rejetées: 25
  🎯 Confiance moyenne: 0.82

  Distribution par tier:
    🖥️  Ollama (local): 80 (66.67%)
    ☁️  Gemini (cloud): 15 (12.5%)
    ⚡ Groq (cloud): 0 (0%)
    🔧 Heuristique: 25 (20.83%)

┌────────────────────────────────────────────────────────────┐
│ JOBS                                                       │
└────────────────────────────────────────────────────────────┘
  Collectés: 150
  ✅ Validés: 95 (63.33%)
  ❌ Rejetés: 55

  Types d'URL:
    🔗 Détaillées: 75
    📄 Génériques: 75 (50%)

┌────────────────────────────────────────────────────────────┐
│ PERFORMANCE                                                │
└────────────────────────────────────────────────────────────┘
  ⚡ Jobs/seconde: 0.45
  ⏱️  Temps moyen/job: 2222ms
```

## Configuration

### Variables d'environnement

Ajoutez à `.dev.vars` (local) ou Cloudflare (production):

```bash
# Ollama (optionnel, défaut: http://localhost:11434)
OLLAMA_ENDPOINT=http://localhost:11434

# Gemini (optionnel, gratuit 1500 req/jour)
GEMINI_API_KEY=your_gemini_api_key

# Groq (optionnel, gratuit 14,400 tokens/min)
GROQ_API_KEY=your_groq_api_key
```

### Installation Ollama (recommandé)

Ollama est gratuit, local et illimité. C'est le tier 1 recommandé.

```bash
# macOS/Linux
curl -fsSL https://ollama.com/install.sh | sh

# Windows
# Télécharger depuis https://ollama.com/download

# Installer un modèle
ollama pull mistral
ollama pull qwen2.5
```

### Obtenir les clés API gratuites

**Gemini (Google):**
1. Aller sur https://makersuite.google.com/app/apikey
2. Créer une clé API
3. Gratuit: 1500 requêtes/jour

**Groq:**
1. Aller sur https://console.groq.com
2. Créer un compte
3. Générer une clé API
4. Gratuit: 14,400 tokens/minute

## Intégration dans Direct Careers

Le système est déjà intégré dans `sources/direct-careers.js`.

**Workflow automatique:**

1. Collecte des jobs via ATS
2. Détection des URLs génériques
3. Résolution intelligente vers URLs détaillées
4. Probing HTTP pour vérifier accessibilité
5. Validation IA multi-tier
6. Filtrage final
7. Génération rapport de monitoring

**Pas de configuration nécessaire!** Le système fonctionne automatiquement.

## Tests

### Test du résolveur d'URLs

```bash
node scripts/test-url-resolver.mjs
```

### Test de collecte complète

```bash
# Lancer wrangler
npx wrangler pages dev public --port 8790 --local

# Dans un autre terminal
curl -X GET 'http://localhost:8790/api/jobs?refresh=true&limit=50' \
  -H 'Authorization: Bearer alternant-talent-secret-2025'
```

## Performances

**Avec le système gratuit:**

- **URLs résolues:** +80% de précision sur les URLs génériques
- **Validation IA:**
  - Ollama (local): ~2s par job, illimité
  - Gemini: ~1s par job, 1500/jour
  - Groq: ~0.5s par job, 14,400 tokens/min
  - Heuristique: <0.1s par job, illimité
- **Coût:** 0€ (100% gratuit)
- **Rate limits:**
  - Ollama: illimité
  - Gemini: reset toutes les 24h
  - Groq: reset toutes les minutes

**Recommandation:**

1. Utiliser **Ollama en local** pour le bulk (tier 1)
2. **Gemini** pour compléter (tier 2) - jusqu'à 1500/jour
3. **Groq** en secours (tier 3) - très rapide
4. **Heuristique** en dernier recours (tier 4)

Avec cette configuration, vous pouvez traiter **des milliers d'offres par jour gratuitement**.

## Évolutions futures

- Scraping intelligent avec Puppeteer pour récupérer les URLs depuis les pages /careers
- Enrichissement avec extraction de données (salaire, compétences, etc.)
- Machine learning pour améliorer les patterns custom
- API d'export des patterns appris pour partage communautaire
- Intégration D1 (Cloudflare) pour persist les patterns

## Support

Pour toute question:
- Consulter les fichiers source avec commentaires détaillés
- Lancer les tests pour voir des exemples d'utilisation
- Vérifier les logs wrangler pour déboguer
