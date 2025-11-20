/**
 * Résolveur d'URL 100% GRATUIT pour Direct Careers
 * Utilise des patterns ATS connus et l'apprentissage de patterns
 */

export class FreeURLResolver {
  constructor(options = {}) {
    this.stats = {
      resolved: 0,
      failed: 0,
      cached: 0
    };

    // Patterns ATS connus
    this.atsPatterns = {
      greenhouse: {
        detail: /\/jobs\/\d+/,
        generic: /\/jobs\/?$/,
        template: (id) => `/jobs/${id}`,
        extractId: (url) => url.match(/\/jobs\/(\d+)/)?.[1]
      },
      lever: {
        detail: /\/jobs\/[\w-]+$/,
        generic: /\/jobs\/?$/,
        template: (slug) => `/jobs/${slug}`,
        extractId: (url) => url.match(/\/jobs\/([\w-]+)$/)?.[1]
      },
      smartrecruiters: {
        detail: /\/jobs\/\d+/,
        generic: /\/jobs\/?$/,
        template: (id) => `/jobs/${id}`,
        extractId: (url) => url.match(/\/jobs\/(\d+)/)?.[1]
      },
      workday: {
        detail: /\/job\/[\w-]+\/[\w-]+$/,
        generic: /\/jobs$/,
        template: (slug) => `/job/${slug}`,
        extractId: (url) => url.match(/\/job\/([\w-]+\/[\w-]+)$/)?.[1]
      },
      wttj: {
        detail: /\/jobs\/[\w-]+$/,
        generic: /\/jobs\/?$/,
        template: (slug) => `/jobs/${slug}`,
        extractId: (url) => url.match(/\/jobs\/([\w-]+)$/)?.[1]
      },
      teamtailor: {
        detail: /\/jobs\/\d+-[\w-]+/,
        generic: /\/jobs\/?$/,
        template: (id) => `/jobs/${id}`,
        extractId: (url) => url.match(/\/jobs\/(\d+-[\w-]+)/)?.[1]
      }
    };

    // Patterns custom par entreprise (apprentissage)
    this.customPatterns = new Map();

    // Cache de résolution
    this.cache = new Map();
  }

  /**
   * Détecte le type d'ATS utilisé par l'URL
   */
  detectATS(url) {
    if (!url) return 'unknown';
    const urlLower = url.toLowerCase();

    if (urlLower.includes('greenhouse.io') || urlLower.includes('/boards/')) {
      return 'greenhouse';
    }
    if (urlLower.includes('lever.co') || urlLower.includes('/lever/')) {
      return 'lever';
    }
    if (urlLower.includes('smartrecruiters.com')) {
      return 'smartrecruiters';
    }
    if (urlLower.includes('myworkdayjobs.com')) {
      return 'workday';
    }
    if (urlLower.includes('welcometothejungle.com')) {
      return 'wttj';
    }
    if (urlLower.includes('teamtailor.com')) {
      return 'teamtailor';
    }

    return 'unknown';
  }

  /**
   * Vérifie si une URL est générique (non-détail)
   */
  isGenericURL(url, ats = null) {
    if (!url) return false;

    const detectedATS = ats || this.detectATS(url);

    if (detectedATS !== 'unknown' && this.atsPatterns[detectedATS]) {
      return this.atsPatterns[detectedATS].generic.test(url);
    }

    // Heuristiques génériques
    try {
      const genericPaths = ['/careers', '/jobs', '/job', '/emplois', '/recrutement'];
      const path = new URL(url).pathname;
      return genericPaths.some(gp => path === gp || path === gp + '/');
    } catch {
      return false;
    }
  }

  /**
   * Vérifie si une URL est détaillée (page job spécifique)
   */
  isDetailURL(url, ats = null) {
    if (!url) return false;

    const detectedATS = ats || this.detectATS(url);

    if (detectedATS !== 'unknown' && this.atsPatterns[detectedATS]) {
      return this.atsPatterns[detectedATS].detail.test(url);
    }

    // Heuristiques génériques
    const detailHints = ['/job/', '/jobs/', '/offre/', '/offer/'];
    const hasId = /\d{4,}/.test(url) || /[\w-]{15,}/.test(url);
    return detailHints.some(hint => url.includes(hint)) && hasId;
  }

  /**
   * Apprend un pattern custom à partir d'une URL validée
   */
  learnPattern(company, validUrl) {
    try {
      const url = new URL(validUrl);
      const domain = url.hostname;

      if (!this.customPatterns.has(domain)) {
        this.customPatterns.set(domain, {
          company,
          examples: [],
          pattern: null
        });
      }

      const pattern = this.customPatterns.get(domain);
      pattern.examples.push(validUrl);

      // Si on a 3+ exemples, on peut déduire un pattern
      if (pattern.examples.length >= 3) {
        pattern.pattern = this.inferPattern(pattern.examples);
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Infère un pattern à partir d'exemples d'URLs validées
   */
  inferPattern(examples) {
    // Trouve la partie commune dans les paths
    const paths = examples.map(url => new URL(url).pathname);

    // Trouve le préfixe commun
    let commonPrefix = paths[0];
    for (const path of paths) {
      let i = 0;
      while (i < commonPrefix.length && i < path.length && commonPrefix[i] === path[i]) {
        i++;
      }
      commonPrefix = commonPrefix.substring(0, i);
    }

    // Trouve les segments variables (IDs, slugs)
    const variableParts = paths.map(p => p.replace(commonPrefix, ''));

    return {
      prefix: commonPrefix,
      hasNumericId: variableParts.some(v => /^\d+/.test(v)),
      hasSlug: variableParts.some(v => /^[\w-]+$/.test(v)),
      template: (id) => `${commonPrefix}${id}`
    };
  }

  /**
   * Tente de résoudre une URL générique en URL détaillée
   */
  async resolve(genericUrl, context = {}) {
    // Vérifie le cache
    const cacheKey = `${genericUrl}:${context.jobId || ''}`;
    if (this.cache.has(cacheKey)) {
      this.stats.cached++;
      return this.cache.get(cacheKey);
    }

    const ats = this.detectATS(genericUrl);

    // Si déjà détaillée, retourne telle quelle
    if (this.isDetailURL(genericUrl, ats)) {
      const result = { url: genericUrl, confidence: 1.0, method: 'already-detail' };
      this.cache.set(cacheKey, result);
      return result;
    }

    // Essaie différentes stratégies
    const strategies = [
      () => this.resolveWithKnownPattern(genericUrl, ats, context),
      () => this.resolveWithCustomPattern(genericUrl, context),
      () => this.resolveWithHeuristics(genericUrl, context)
    ];

    for (const strategy of strategies) {
      const result = await strategy();
      if (result && result.confidence > 0.5) {
        this.stats.resolved++;
        this.cache.set(cacheKey, result);
        return result;
      }
    }

    this.stats.failed++;
    return { url: genericUrl, confidence: 0, method: 'failed' };
  }

  /**
   * Résout avec un pattern ATS connu
   */
  async resolveWithKnownPattern(url, ats, context) {
    if (ats === 'unknown' || !this.atsPatterns[ats]) {
      return null;
    }

    const pattern = this.atsPatterns[ats];
    const baseUrl = new URL(url);

    // Si on a un jobId dans le contexte
    if (context.jobId) {
      const detailPath = pattern.template(context.jobId);
      baseUrl.pathname = detailPath;
      return {
        url: baseUrl.toString(),
        confidence: 0.8,
        method: 'ats-pattern',
        ats
      };
    }

    // Si on a un titre, essaie de créer un slug
    if (context.title) {
      const slug = this.createSlug(context.title);
      const detailPath = pattern.template(slug);
      baseUrl.pathname = detailPath;
      return {
        url: baseUrl.toString(),
        confidence: 0.6,
        method: 'ats-pattern-slug',
        ats
      };
    }

    return null;
  }

  /**
   * Résout avec un pattern custom appris
   */
  async resolveWithCustomPattern(url, context) {
    const domain = new URL(url).hostname;
    const pattern = this.customPatterns.get(domain);

    if (!pattern || !pattern.pattern) {
      return null;
    }

    let id = context.jobId;
    if (!id && context.title) {
      id = this.createSlug(context.title);
    }

    if (id && pattern.pattern.template) {
      return {
        url: pattern.pattern.template(id),
        confidence: 0.7,
        method: 'custom-pattern',
        domain
      };
    }

    return null;
  }

  /**
   * Résout avec des heuristiques génériques
   */
  async resolveWithHeuristics(url, context) {
    const baseUrl = new URL(url);

    // Essaie différentes combinaisons
    const candidates = [];

    if (context.jobId) {
      candidates.push(
        `${baseUrl.origin}/job/${context.jobId}`,
        `${baseUrl.origin}/jobs/${context.jobId}`,
        `${baseUrl.origin}/offre/${context.jobId}`,
        `${baseUrl.origin}/offers/${context.jobId}`
      );
    }

    if (context.title) {
      const slug = this.createSlug(context.title);
      candidates.push(
        `${baseUrl.origin}/job/${slug}`,
        `${baseUrl.origin}/jobs/${slug}`,
        `${baseUrl.origin}/offre/${slug}`
      );
    }

    // Retourne le premier candidat (on les testera plus tard avec le scraper)
    if (candidates.length > 0) {
      return {
        url: candidates[0],
        alternatives: candidates.slice(1),
        confidence: 0.4,
        method: 'heuristic'
      };
    }

    return null;
  }

  /**
   * Crée un slug à partir d'un titre
   */
  createSlug(title) {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 60);
  }

  /**
   * Retourne les statistiques
   */
  getStats() {
    return {
      ...this.stats,
      cacheSize: this.cache.size,
      customPatterns: this.customPatterns.size
    };
  }

  /**
   * Exporte les patterns appris pour réutilisation
   */
  exportPatterns() {
    return {
      customPatterns: Array.from(this.customPatterns.entries()).map(([domain, pattern]) => ({
        domain,
        company: pattern.company,
        examples: pattern.examples,
        pattern: pattern.pattern
      }))
    };
  }

  /**
   * Importe des patterns appris
   */
  importPatterns(data) {
    if (data.customPatterns) {
      for (const item of data.customPatterns) {
        this.customPatterns.set(item.domain, {
          company: item.company,
          examples: item.examples,
          pattern: item.pattern
        });
      }
    }
  }
}
