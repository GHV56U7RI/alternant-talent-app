/**
 * Système de monitoring gratuit (en mémoire pour Cloudflare Workers)
 * Track les performances de résolution d'URLs et validation IA
 */

export class FreeMonitoring {
  constructor(options = {}) {
    this.currentSession = {
      startTime: Date.now(),
      sessionId: this.generateSessionId(),
      events: [],
      stats: {
        urlResolution: {
          total: 0,
          resolved: 0,
          failed: 0,
          byMethod: {},
          byATS: {},
          avgConfidence: 0
        },
        aiValidation: {
          total: 0,
          valid: 0,
          rejected: 0,
          byTier: { ollama: 0, gemini: 0, groq: 0, heuristic: 0 },
          avgConfidence: 0
        },
        jobs: {
          collected: 0,
          validated: 0,
          rejected: 0,
          genericUrls: 0,
          detailUrls: 0
        }
      }
    };
  }

  /**
   * Génère un ID de session unique
   */
  generateSessionId() {
    return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Log un événement de résolution d'URL
   */
  logURLResolution(result) {
    const event = {
      type: 'url_resolution',
      timestamp: Date.now(),
      ...result
    };

    this.currentSession.events.push(event);

    const stats = this.currentSession.stats.urlResolution;
    stats.total++;

    if (result.confidence > 0.5) {
      stats.resolved++;
    } else {
      stats.failed++;
    }

    // Stats par méthode
    const method = result.method || 'unknown';
    stats.byMethod[method] = (stats.byMethod[method] || 0) + 1;

    // Stats par ATS
    if (result.ats) {
      stats.byATS[result.ats] = (stats.byATS[result.ats] || 0) + 1;
    }

    // Moyenne de confiance
    stats.avgConfidence = (stats.avgConfidence * (stats.total - 1) + result.confidence) / stats.total;
  }

  /**
   * Log un événement de validation IA
   */
  logAIValidation(result, job) {
    const event = {
      type: 'ai_validation',
      timestamp: Date.now(),
      tier: result.tier,
      verdict: result.verdict,
      confidence: result.confidence,
      jobId: job.id,
      jobTitle: job.title,
      url: job.apply_url
    };

    this.currentSession.events.push(event);

    const stats = this.currentSession.stats.aiValidation;
    stats.total++;

    if (result.verdict === 'VALID') {
      stats.valid++;
    } else {
      stats.rejected++;
    }

    // Stats par tier
    stats.byTier[result.tier] = (stats.byTier[result.tier] || 0) + 1;

    // Moyenne de confiance
    stats.avgConfidence = (stats.avgConfidence * (stats.total - 1) + result.confidence) / stats.total;
  }

  /**
   * Log un job collecté
   */
  logJobCollected(job, urlType = 'unknown') {
    const event = {
      type: 'job_collected',
      timestamp: Date.now(),
      jobId: job.id,
      company: job.company,
      title: job.title,
      url: job.apply_url,
      urlType
    };

    this.currentSession.events.push(event);

    const stats = this.currentSession.stats.jobs;
    stats.collected++;

    if (urlType === 'generic') {
      stats.genericUrls++;
    } else if (urlType === 'detail') {
      stats.detailUrls++;
    }
  }

  /**
   * Log un job validé
   */
  logJobValidated(job) {
    this.currentSession.stats.jobs.validated++;
  }

  /**
   * Log un job rejeté
   */
  logJobRejected(job, reason) {
    const event = {
      type: 'job_rejected',
      timestamp: Date.now(),
      jobId: job.id,
      reason
    };

    this.currentSession.events.push(event);
    this.currentSession.stats.jobs.rejected++;
  }

  /**
   * Retourne les stats de la session courante
   */
  getCurrentStats() {
    return {
      ...this.currentSession.stats,
      duration: Date.now() - this.currentSession.startTime,
      sessionId: this.currentSession.sessionId
    };
  }

  /**
   * Génère un rapport détaillé
   */
  generateReport() {
    const stats = this.getCurrentStats();
    const duration = stats.duration / 1000;

    const report = {
      session: {
        id: stats.sessionId,
        duration: `${Math.floor(duration / 60)}m ${Math.floor(duration % 60)}s`,
        startTime: new Date(this.currentSession.startTime).toISOString()
      },
      urlResolution: {
        total: stats.urlResolution.total,
        resolved: stats.urlResolution.resolved,
        failed: stats.urlResolution.failed,
        successRate: this.percentage(stats.urlResolution.resolved, stats.urlResolution.total),
        avgConfidence: this.round(stats.urlResolution.avgConfidence),
        byMethod: stats.urlResolution.byMethod,
        byATS: stats.urlResolution.byATS
      },
      aiValidation: {
        total: stats.aiValidation.total,
        valid: stats.aiValidation.valid,
        rejected: stats.aiValidation.rejected,
        validationRate: this.percentage(stats.aiValidation.valid, stats.aiValidation.total),
        avgConfidence: this.round(stats.aiValidation.avgConfidence),
        byTier: stats.aiValidation.byTier,
        tierDistribution: {
          ollama: this.percentage(stats.aiValidation.byTier.ollama, stats.aiValidation.total),
          gemini: this.percentage(stats.aiValidation.byTier.gemini, stats.aiValidation.total),
          groq: this.percentage(stats.aiValidation.byTier.groq, stats.aiValidation.total),
          heuristic: this.percentage(stats.aiValidation.byTier.heuristic, stats.aiValidation.total)
        }
      },
      jobs: {
        collected: stats.jobs.collected,
        validated: stats.jobs.validated,
        rejected: stats.jobs.rejected,
        validationRate: this.percentage(stats.jobs.validated, stats.jobs.collected),
        urlTypes: {
          generic: stats.jobs.genericUrls,
          detail: stats.jobs.detailUrls,
          genericRate: this.percentage(stats.jobs.genericUrls, stats.jobs.collected)
        }
      },
      performance: {
        jobsPerSecond: this.round(stats.jobs.collected / duration),
        avgTimePerJob: duration > 0 ? this.round((duration * 1000) / stats.jobs.collected) + 'ms' : 'N/A'
      }
    };

    return report;
  }

  /**
   * Génère un rapport textuel pour la console
   */
  generateTextReport() {
    const report = this.generateReport();

    return `
╔══════════════════════════════════════════════════════════════╗
║                  RAPPORT DE MONITORING                       ║
╚══════════════════════════════════════════════════════════════╝

📊 Session: ${report.session.id}
⏱️  Durée: ${report.session.duration}
📅 Démarré: ${report.session.startTime}

┌────────────────────────────────────────────────────────────┐
│ RÉSOLUTION D'URLS                                          │
└────────────────────────────────────────────────────────────┘
  Total: ${report.urlResolution.total}
  ✅ Résolues: ${report.urlResolution.resolved} (${report.urlResolution.successRate})
  ❌ Échouées: ${report.urlResolution.failed}
  🎯 Confiance moyenne: ${report.urlResolution.avgConfidence}

  Par méthode:
${this.formatObject(report.urlResolution.byMethod, '    ')}

  Par ATS:
${this.formatObject(report.urlResolution.byATS, '    ')}

┌────────────────────────────────────────────────────────────┐
│ VALIDATION IA                                              │
└────────────────────────────────────────────────────────────┘
  Total: ${report.aiValidation.total}
  ✅ Validées: ${report.aiValidation.valid} (${report.aiValidation.validationRate})
  ❌ Rejetées: ${report.aiValidation.rejected}
  🎯 Confiance moyenne: ${report.aiValidation.avgConfidence}

  Distribution par tier:
    🖥️  Ollama (local): ${report.aiValidation.byTier.ollama} (${report.aiValidation.tierDistribution.ollama})
    ☁️  Gemini (cloud): ${report.aiValidation.byTier.gemini} (${report.aiValidation.tierDistribution.gemini})
    ⚡ Groq (cloud): ${report.aiValidation.byTier.groq} (${report.aiValidation.tierDistribution.groq})
    🔧 Heuristique: ${report.aiValidation.byTier.heuristic} (${report.aiValidation.tierDistribution.heuristic})

┌────────────────────────────────────────────────────────────┐
│ JOBS                                                       │
└────────────────────────────────────────────────────────────┘
  Collectés: ${report.jobs.collected}
  ✅ Validés: ${report.jobs.validated} (${report.jobs.validationRate})
  ❌ Rejetés: ${report.jobs.rejected}

  Types d'URL:
    🔗 Détaillées: ${report.jobs.urlTypes.detail}
    📄 Génériques: ${report.jobs.urlTypes.generic} (${report.jobs.urlTypes.genericRate})

┌────────────────────────────────────────────────────────────┐
│ PERFORMANCE                                                │
└────────────────────────────────────────────────────────────┘
  ⚡ Jobs/seconde: ${report.performance.jobsPerSecond}
  ⏱️  Temps moyen/job: ${report.performance.avgTimePerJob}

╚══════════════════════════════════════════════════════════════╝
`;
  }

  /**
   * Sauvegarde la session (en mémoire seulement pour Cloudflare Workers)
   */
  async saveSession() {
    // Cloudflare Workers n'a pas de système de fichiers
    // On retourne juste les données de la session
    const data = {
      ...this.currentSession,
      endTime: Date.now(),
      report: this.generateReport()
    };

    return data;
  }

  /**
   * Exporte la session en JSON
   */
  exportSession() {
    return {
      ...this.currentSession,
      endTime: Date.now(),
      report: this.generateReport()
    };
  }

  // Helpers

  percentage(value, total) {
    if (total === 0) return '0%';
    return `${this.round((value / total) * 100)}%`;
  }

  round(value, decimals = 2) {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  average(values) {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  delta(current, previous) {
    const diff = current - previous;
    const sign = diff >= 0 ? '+' : '';
    return `${sign}${this.round(diff)}`;
  }

  formatObject(obj, indent = '') {
    return Object.entries(obj)
      .map(([key, value]) => `${indent}${key}: ${value}`)
      .join('\n') || `${indent}(aucune donnée)`;
  }
}
