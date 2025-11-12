// Catégories pour Actualités (inspirées du BlogPage)
export type NewsCategory =
  | "salaire" | "ecoles" | "partenariat" | "marche" | "conseils"
  | "offres" | "contrats" | "tech" | "aides" | "rh"
  | "outils" | "international" | "alternance" | "stage"
  | "cv" | "entretien" | "preparation" | "comparatif"
  | "entreprises" | "recrutement" | "societe";

// Catégories pour Fonctionnalités (features du SaaS)
export type FeatureCategory =
  | "produit" | "dashboard" | "statistiques" | "alertes"
  | "notifications" | "candidature" | "simplification"
  | "securite" | "confidentialite" | "rgpd";

export type ArticleType = "actualite" | "fonctionnalite";

export type PostFrontmatter = {
  slug: string;
  title: string;
  excerpt: string;
  date: string; // ISO format
  articleType: ArticleType; // Nouveau: sépare actualités et fonctionnalités
  category: NewsCategory | FeatureCategory;
  readTime: number;
  cover?: string; // Image de couverture principale
  coverAlt?: string; // Texte alternatif pour l'image
  summaryImage?: string; // Image pour la section "extrait généré par IA"
  summaryImageAlt?: string;
  aiSummary?: string; // Résumé généré par IA (géré manuellement par l'admin)
  audioUrl?: string;
  tags?: string[];
  author?: string;
  status: "draft" | "published";
  featured?: boolean;
  body?: string;
};

export type PostIndexItem = Omit<PostFrontmatter, "status">;
