-- Migration pour ajouter les champs enrichis
ALTER TABLE jobs ADD COLUMN enriched_niveau_etudes TEXT;
ALTER TABLE jobs ADD COLUMN enriched_domaine TEXT;
ALTER TABLE jobs ADD COLUMN enriched_competences TEXT;
ALTER TABLE jobs ADD COLUMN enriched_type_contrat TEXT;
ALTER TABLE jobs ADD COLUMN enriched_duree_estimee TEXT;
ALTER TABLE jobs ADD COLUMN enriched_teletravail INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN enriched_salaire_estime TEXT;
ALTER TABLE jobs ADD COLUMN enriched_tags TEXT;
ALTER TABLE jobs ADD COLUMN enriched_at TEXT;

-- Créer un index pour améliorer les performances des filtres
CREATE INDEX IF NOT EXISTS idx_jobs_enriched ON jobs(enriched_domaine, enriched_niveau_etudes, enriched_teletravail);
