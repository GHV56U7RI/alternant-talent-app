/**
 * Validation IA 100% GRATUITE
 * Tier 1: Ollama (local, illimité)
 * Tier 2: Gemini Flash (1500 req/jour gratuit)
 * Tier 3: Groq (14,400 tokens/min gratuit)
 */

export class FreeAIValidator {
  constructor(config = {}) {
    this.config = {
      ollama: {
        endpoint: config.ollamaEndpoint || 'http://localhost:11434',
        models: ['llama3.2:latest', 'llama3.1:8b-instruct-q4_K_M'],
        timeout: 10000
      },
      gemini: {
        apiKey: config.geminiKey || null,
        model: 'gemini-1.5-flash-8b',
        endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
        dailyLimit: 1500,
        timeout: 8000
      },
      groq: {
        apiKey: config.groqKey || null,
        model: 'llama-3.2-90b-text-preview',
        endpoint: 'https://api.groq.com/openai/v1/chat/completions',
        minuteLimit: 14400, // tokens
        timeout: 8000
      }
    };

    this.stats = {
      ollama: { calls: 0, success: 0, errors: 0 },
      gemini: { calls: 0, success: 0, errors: 0 },
      groq: { calls: 0, success: 0, errors: 0 }
    };

    this.rateLimits = {
      gemini: { count: 0, resetAt: Date.now() + 86400000 },
      groq: { tokens: 0, resetAt: Date.now() + 60000 }
    };
  }

  /**
   * Valide un job avec fallback automatique
   */
  async validate(job, options = {}) {
    const { skipOllama = false, skipGemini = false } = options;

    // Tier 1: Ollama (gratuit local, illimité)
    if (!skipOllama) {
      const ollamaResult = await this.validateWithOllama(job);
      if (ollamaResult.success) {
        return { ...ollamaResult, tier: 'ollama' };
      }
    }

    // Tier 2: Gemini (gratuit cloud, 1500/jour)
    if (!skipGemini && this.hasGeminiQuota()) {
      const geminiResult = await this.validateWithGemini(job);
      if (geminiResult.success) {
        return { ...geminiResult, tier: 'gemini' };
      }
    }

    // Tier 3: Groq (gratuit cloud, 14400 tokens/min)
    if (this.hasGroqQuota()) {
      const groqResult = await this.validateWithGroq(job);
      if (groqResult.success) {
        return { ...groqResult, tier: 'groq' };
      }
    }

    // Fallback: validation heuristique
    return this.validateWithHeuristics(job);
  }

  /**
   * Validation avec Ollama (local, gratuit, illimité)
   */
  async validateWithOllama(job) {
    this.stats.ollama.calls++;

    const model = this.config.ollama.models[0];
    const prompt = this.buildValidationPrompt(job);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.config.ollama.timeout);

      const response = await fetch(`${this.config.ollama.endpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
          format: 'json',
          options: {
            temperature: 0.1,
            num_predict: 200
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Ollama HTTP ${response.status}`);
      }

      const data = await response.json();
      const result = this.parseValidationResponse(data.response);

      this.stats.ollama.success++;
      return { success: true, ...result, model };
    } catch (error) {
      this.stats.ollama.errors++;
      return { success: false, error: error.message };
    }
  }

  /**
   * Validation avec Gemini (gratuit, 1500 req/jour)
   */
  async validateWithGemini(job) {
    if (!this.config.gemini.apiKey) {
      return { success: false, error: 'No Gemini API key' };
    }

    this.stats.gemini.calls++;
    this.rateLimits.gemini.count++;

    const prompt = this.buildValidationPrompt(job);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.config.gemini.timeout);

      const url = `${this.config.gemini.endpoint}/${this.config.gemini.model}:generateContent?key=${this.config.gemini.apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 200,
            responseMimeType: 'application/json'
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Gemini HTTP ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('No response from Gemini');
      }

      const result = this.parseValidationResponse(text);

      this.stats.gemini.success++;
      return { success: true, ...result, model: this.config.gemini.model };
    } catch (error) {
      this.stats.gemini.errors++;
      return { success: false, error: error.message };
    }
  }

  /**
   * Validation avec Groq (gratuit, 14400 tokens/min)
   */
  async validateWithGroq(job) {
    if (!this.config.groq.apiKey) {
      return { success: false, error: 'No Groq API key' };
    }

    this.stats.groq.calls++;

    const prompt = this.buildValidationPrompt(job);
    const estimatedTokens = Math.ceil(prompt.length / 4);
    this.rateLimits.groq.tokens += estimatedTokens;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.config.groq.timeout);

      const response = await fetch(this.config.groq.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.groq.apiKey}`
        },
        body: JSON.stringify({
          model: this.config.groq.model,
          messages: [
            {
              role: 'system',
              content: 'Tu es un validateur d\'offres d\'emploi. Réponds uniquement en JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 200,
          response_format: { type: 'json_object' }
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Groq HTTP ${response.status}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content;
      if (!text) {
        throw new Error('No response from Groq');
      }

      const result = this.parseValidationResponse(text);

      this.stats.groq.success++;
      return { success: true, ...result, model: this.config.groq.model };
    } catch (error) {
      this.stats.groq.errors++;
      return { success: false, error: error.message };
    }
  }

  /**
   * Validation heuristique (fallback sans IA)
   */
  validateWithHeuristics(job) {
    const score = this.calculateHeuristicScore(job);

    return {
      success: true,
      tier: 'heuristic',
      verdict: score > 0.6 ? 'VALID' : 'REJECT',
      confidence: Math.min(score, 0.7), // Max 0.7 pour heuristique
      title_valid: job.title && job.title.length > 10,
      url_type: this.detectURLType(job.apply_url),
      is_alternance: /alternance|apprentissage|apprentice/i.test(job.title || ''),
      reason: 'Validation heuristique (IA indisponible)'
    };
  }

  /**
   * Calcule un score heuristique
   */
  calculateHeuristicScore(job) {
    let score = 0;

    // Titre valide
    if (job.title && job.title.length >= 10 && job.title.length <= 100) {
      score += 0.3;
    }

    // Contient "alternance"
    if (/alternance|apprentissage|apprentice|work-study/i.test(job.title || '')) {
      score += 0.3;
    }

    // URL détaillée
    if (this.detectURLType(job.apply_url) === 'detail') {
      score += 0.2;
    }

    // Entreprise valide
    if (job.company && job.company.length > 2) {
      score += 0.1;
    }

    // Localisation valide
    if (job.location && job.location.length > 2) {
      score += 0.1;
    }

    return score;
  }

  /**
   * Détecte le type d'URL
   */
  detectURLType(url) {
    if (!url) return 'broken';

    const genericPaths = ['/careers', '/jobs', '/job', '/emplois', '/recrutement'];
    const hasGeneric = genericPaths.some(path => url.endsWith(path) || url.endsWith(path + '/'));

    if (hasGeneric) return 'generic';

    const hasDetail = /\/(job|offre|offer)\/[\w-]+/.test(url) || /\/jobs\/\d+/.test(url);
    if (hasDetail) return 'detail';

    return 'unknown';
  }

  /**
   * Construit le prompt de validation
   */
  buildValidationPrompt(job) {
    const tags = Array.isArray(job.tags) ? job.tags.join(', ') : '';

    return `Tu es un validateur STRICT d'offres d'ALTERNANCE/APPRENTISSAGE uniquement.

RÈGLE ABSOLUE: Rejette TOUTE offre qui n'est PAS un contrat d'alternance/apprentissage.

Offre à analyser:
- Titre: ${job.title || 'N/A'}
- Tags: ${tags || 'N/A'}
- URL: ${job.apply_url || 'N/A'}
- Entreprise: ${job.company || 'N/A'}
- Localisation: ${job.location || 'N/A'}

CRITÈRES DE VALIDATION (TOUS obligatoires):
1. Le titre OU les tags DOIVENT contenir: "alternance", "apprentissage", "apprentice", "work-study", "contrat pro"
2. Les tags NE DOIVENT PAS contenir: "CDI", "CDD", "Unlimited Contract", "Fixed Term", "Freelance", "Stage" (sauf si combiné avec alternance)
3. L'URL doit être valide et détaillée (pas juste /careers ou /jobs)

INSTRUCTIONS:
- Si c'est un CDI/CDD/Freelance → verdict: "REJECT", reason: "Type de contrat invalide (CDI/CDD/autre)"
- Si le titre ne mentionne pas alternance/apprentissage → verdict: "REJECT", reason: "Pas une offre d'alternance"
- Si les tags contiennent "Unlimited Contract" ou "Fixed Term" → verdict: "REJECT", reason: "Contrat permanent détecté"
- Sinon → verdict: "VALID"

Réponds UNIQUEMENT en JSON valide:
{
  "verdict": "VALID" ou "REJECT",
  "confidence": 0.0 à 1.0,
  "title_valid": true/false,
  "url_type": "detail" ou "generic" ou "broken",
  "is_alternance": true/false,
  "reason": "explication courte"
}`;
  }

  /**
   * Parse la réponse de validation
   */
  parseValidationResponse(text) {
    try {
      const cleaned = text.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
      const data = JSON.parse(cleaned);

      return {
        verdict: data.verdict || 'REJECT',
        confidence: typeof data.confidence === 'number' ? data.confidence : 0.5,
        title_valid: Boolean(data.title_valid),
        url_type: data.url_type || 'unknown',
        is_alternance: Boolean(data.is_alternance),
        reason: data.reason || 'Pas de raison fournie'
      };
    } catch (error) {
      // Fallback: cherche VALID/REJECT dans le texte
      const hasValid = /VALID/i.test(text) && !/REJECT/i.test(text);
      return {
        verdict: hasValid ? 'VALID' : 'REJECT',
        confidence: 0.3,
        title_valid: false,
        url_type: 'unknown',
        is_alternance: false,
        reason: 'Parse error, fallback'
      };
    }
  }

  /**
   * Vérifie si on a du quota Gemini
   */
  hasGeminiQuota() {
    if (Date.now() > this.rateLimits.gemini.resetAt) {
      this.rateLimits.gemini.count = 0;
      this.rateLimits.gemini.resetAt = Date.now() + 86400000;
    }
    return this.rateLimits.gemini.count < this.config.gemini.dailyLimit;
  }

  /**
   * Vérifie si on a du quota Groq
   */
  hasGroqQuota() {
    if (Date.now() > this.rateLimits.groq.resetAt) {
      this.rateLimits.groq.tokens = 0;
      this.rateLimits.groq.resetAt = Date.now() + 60000;
    }
    return this.rateLimits.groq.tokens < this.config.groq.minuteLimit;
  }

  /**
   * Retourne les statistiques
   */
  getStats() {
    return {
      ...this.stats,
      quotas: {
        gemini: {
          used: this.rateLimits.gemini.count,
          limit: this.config.gemini.dailyLimit,
          resetIn: Math.max(0, this.rateLimits.gemini.resetAt - Date.now())
        },
        groq: {
          used: this.rateLimits.groq.tokens,
          limit: this.config.groq.minuteLimit,
          resetIn: Math.max(0, this.rateLimits.groq.resetAt - Date.now())
        }
      }
    };
  }

  /**
   * Validation par batch (optimisé pour rate limits)
   */
  async validateBatch(jobs, options = {}) {
    const { batchSize = 10, delayMs = 100 } = options;
    const results = [];

    for (let i = 0; i < jobs.length; i += batchSize) {
      const batch = jobs.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(job => this.validate(job, options))
      );
      results.push(...batchResults);

      if (i + batchSize < jobs.length) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    return results;
  }
}
