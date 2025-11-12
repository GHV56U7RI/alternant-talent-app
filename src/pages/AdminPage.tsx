import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, LogOut, Edit2, Trash2, Plus, Save, X, Upload, Image as ImageIcon, FileText } from "lucide-react";
import { getAllPosts } from "../cms/loadPosts";
import type { PostIndexItem, ArticleType, NewsCategory, FeatureCategory } from "../cms/types";

// Credentials admin simple (à remplacer par une vraie authentification en production)
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123";

// Catégories disponibles
const NEWS_CATEGORIES: { value: NewsCategory; label: string }[] = [
  { value: "alternance", label: "Alternance" },
  { value: "salaire", label: "Salaire" },
  { value: "ecoles", label: "Écoles" },
  { value: "partenariat", label: "Partenariat" },
  { value: "marche", label: "Marché" },
  { value: "conseils", label: "Conseils" },
  { value: "offres", label: "Offres" },
  { value: "contrats", label: "Contrats" },
  { value: "tech", label: "Tech" },
  { value: "aides", label: "Aides" },
  { value: "rh", label: "RH" },
  { value: "outils", label: "Outils" },
  { value: "international", label: "International" },
  { value: "stage", label: "Stage" },
  { value: "cv", label: "CV" },
  { value: "entretien", label: "Entretien" },
  { value: "preparation", label: "Préparation" },
  { value: "comparatif", label: "Comparatif" },
  { value: "entreprises", label: "Entreprises" },
  { value: "recrutement", label: "Recrutement" },
  { value: "societe", label: "Société" },
];

const FEATURE_CATEGORIES: { value: FeatureCategory; label: string }[] = [
  { value: "produit", label: "Produit" },
  { value: "dashboard", label: "Dashboard" },
  { value: "statistiques", label: "Statistiques" },
  { value: "alertes", label: "Alertes" },
  { value: "notifications", label: "Notifications" },
  { value: "candidature", label: "Candidature" },
  { value: "simplification", label: "Simplification" },
  { value: "securite", label: "Sécurité" },
  { value: "confidentialite", label: "Confidentialité" },
  { value: "rgpd", label: "RGPD" },
];

export default function AdminPage() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [articles, setArticles] = useState<PostIndexItem[]>([]);
  const [editingArticle, setEditingArticle] = useState<PostIndexItem | null>(null);
  const [activeTab, setActiveTab] = useState<"tous" | "actualites" | "fonctionnalites">("tous");

  useEffect(() => {
    // Vérifier si l'admin est déjà connecté
    const adminAuth = localStorage.getItem("adminAuth");
    if (adminAuth === "true") {
      setIsAuthenticated(true);
      loadArticles();
    }
  }, []);

  const loadArticles = () => {
    const posts = getAllPosts();
    setArticles(posts);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      localStorage.setItem("adminAuth", "true");
      setIsAuthenticated(true);
      setError("");
      loadArticles();
    } else {
      setError("Identifiants incorrects");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminAuth");
    setIsAuthenticated(false);
    setUsername("");
    setPassword("");
  };

  const handleEdit = (article: PostIndexItem) => {
    setEditingArticle({ ...article });
  };

  const handleCreateNew = () => {
    const newArticle: PostIndexItem = {
      slug: `nouvel-article-${Date.now()}`,
      title: "",
      excerpt: "",
      date: new Date().toISOString().split("T")[0],
      articleType: "actualite",
      category: "alternance",
      readTime: 5,
      cover: "",
      coverAlt: "",
      summaryImage: "",
      summaryImageAlt: "",
      aiSummary: "",
      audioUrl: "",
      tags: [],
      author: "",
      featured: false,
      body: "",
    };
    setEditingArticle(newArticle);
  };

  const handleSave = () => {
    if (!editingArticle) return;

    // TODO: Implémenter la sauvegarde dans le JSON via API backend
    alert("Fonctionnalité de sauvegarde à implémenter avec une API backend\n\nDonnées à sauvegarder:\n" + JSON.stringify(editingArticle, null, 2));
    setEditingArticle(null);
    loadArticles();
  };

  const handleDelete = (slug: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet article ?")) {
      // TODO: Implémenter la suppression
      alert("Fonctionnalité de suppression à implémenter avec une API backend");
    }
  };

  const handleImageUpload = (field: "cover" | "summaryImage") => {
    // TODO: Implémenter l'upload d'image via API
    const url = prompt(`URL de l'image pour ${field === "cover" ? "la couverture" : "l'extrait IA"} :`);
    if (url && editingArticle) {
      setEditingArticle({ ...editingArticle, [field]: url });
    }
  };

  // Filtrer les articles selon l'onglet actif
  const filteredArticles = articles.filter((article) => {
    if (activeTab === "actualites") return article.articleType === "actualite";
    if (activeTab === "fonctionnalites") return article.articleType === "fonctionnalite";
    return true;
  });

  // Page de login
  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f5" }}>
        <div style={{ width: "100%", maxWidth: "400px", padding: "2rem", background: "#fff", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <Lock style={{ width: 48, height: 48, margin: "0 auto", color: "#2563eb" }} />
            <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginTop: "1rem" }}>Administration</h1>
            <p style={{ color: "#666", fontSize: "0.875rem", marginTop: "0.5rem" }}>Connectez-vous pour gérer les articles</p>
          </div>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>
                Nom d'utilisateur
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #e5e5e5",
                  borderRadius: "8px",
                  fontSize: "1rem"
                }}
                placeholder="admin"
                required
              />
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #e5e5e5",
                  borderRadius: "8px",
                  fontSize: "1rem"
                }}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div style={{ padding: "0.75rem", background: "#fee", color: "#c00", borderRadius: "8px", fontSize: "0.875rem", marginBottom: "1rem" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              style={{
                width: "100%",
                padding: "0.75rem",
                background: "linear-gradient(to right, #2563eb, #1d4ed8)",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "1rem",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Se connecter
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Formulaire d'édition
  if (editingArticle) {
    const availableCategories = editingArticle.articleType === "actualite" ? NEWS_CATEGORIES : FEATURE_CATEGORIES;

    return (
      <div style={{ minHeight: "100vh", background: "#f5f5f5", padding: "2rem" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ background: "#fff", borderRadius: "12px", padding: "2rem", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>
                {editingArticle.title ? "Éditer l'article" : "Nouvel article"}
              </h1>
              <button
                onClick={() => setEditingArticle(null)}
                style={{
                  padding: "0.5rem",
                  background: "#f5f5f5",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer"
                }}
              >
                <X style={{ width: 20, height: 20 }} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {/* Type d'article */}
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>
                  Type d'article
                </label>
                <select
                  value={editingArticle.articleType}
                  onChange={(e) => setEditingArticle({
                    ...editingArticle,
                    articleType: e.target.value as ArticleType,
                    category: e.target.value === "actualite" ? "alternance" : "produit"
                  })}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #e5e5e5",
                    borderRadius: "8px",
                    fontSize: "1rem"
                  }}
                >
                  <option value="actualite">Actualité</option>
                  <option value="fonctionnalite">Fonctionnalité</option>
                </select>
              </div>

              {/* Titre */}
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>
                  Titre
                </label>
                <input
                  type="text"
                  value={editingArticle.title}
                  onChange={(e) => setEditingArticle({ ...editingArticle, title: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #e5e5e5",
                    borderRadius: "8px",
                    fontSize: "1rem"
                  }}
                  placeholder="Titre de l'article"
                />
              </div>

              {/* Slug */}
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>
                  Slug (URL)
                </label>
                <input
                  type="text"
                  value={editingArticle.slug}
                  onChange={(e) => setEditingArticle({ ...editingArticle, slug: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #e5e5e5",
                    borderRadius: "8px",
                    fontSize: "0.875rem",
                    fontFamily: "monospace"
                  }}
                  placeholder="mon-article-exemple"
                />
              </div>

              {/* Extrait */}
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>
                  Extrait (Excerpt)
                </label>
                <textarea
                  value={editingArticle.excerpt}
                  onChange={(e) => setEditingArticle({ ...editingArticle, excerpt: e.target.value })}
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #e5e5e5",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    fontFamily: "inherit"
                  }}
                  placeholder="Description courte de l'article..."
                />
              </div>

              {/* Image de couverture */}
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>
                  <ImageIcon style={{ width: 16, height: 16, display: "inline", marginRight: "0.5rem" }} />
                  Image de couverture
                </label>
                <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                  <input
                    type="text"
                    value={editingArticle.cover || ""}
                    onChange={(e) => setEditingArticle({ ...editingArticle, cover: e.target.value })}
                    style={{
                      flex: 1,
                      padding: "0.75rem",
                      border: "1px solid #e5e5e5",
                      borderRadius: "8px",
                      fontSize: "0.875rem"
                    }}
                    placeholder="/uploads/mon-image.jpg"
                  />
                  <button
                    type="button"
                    onClick={() => handleImageUpload("cover")}
                    style={{
                      padding: "0.75rem 1rem",
                      background: "#f5f5f5",
                      border: "1px solid #e5e5e5",
                      borderRadius: "8px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem"
                    }}
                  >
                    <Upload style={{ width: 16, height: 16 }} />
                    Upload
                  </button>
                </div>
                {editingArticle.cover && (
                  <div style={{ marginTop: "0.5rem" }}>
                    <img
                      src={editingArticle.cover}
                      alt="Aperçu"
                      style={{ maxWidth: "200px", height: "auto", borderRadius: "8px", border: "1px solid #e5e5e5" }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                )}
                <input
                  type="text"
                  value={editingArticle.coverAlt || ""}
                  onChange={(e) => setEditingArticle({ ...editingArticle, coverAlt: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    border: "1px solid #e5e5e5",
                    borderRadius: "8px",
                    fontSize: "0.75rem",
                    marginTop: "0.5rem"
                  }}
                  placeholder="Texte alternatif pour l'accessibilité"
                />
              </div>

              {/* Résumé IA + Image */}
              <div style={{ background: "#f9fafb", padding: "1.5rem", borderRadius: "8px", border: "1px solid #e5e5e5" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <FileText style={{ width: 18, height: 18 }} />
                  Résumé généré par IA
                </h3>

                {/* Image pour le résumé */}
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>
                    Image pour l'extrait
                  </label>
                  <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                    <input
                      type="text"
                      value={editingArticle.summaryImage || ""}
                      onChange={(e) => setEditingArticle({ ...editingArticle, summaryImage: e.target.value })}
                      style={{
                        flex: 1,
                        padding: "0.75rem",
                        border: "1px solid #e5e5e5",
                        borderRadius: "8px",
                        fontSize: "0.875rem",
                        background: "#fff"
                      }}
                      placeholder="/uploads/summary-image.jpg"
                    />
                    <button
                      type="button"
                      onClick={() => handleImageUpload("summaryImage")}
                      style={{
                        padding: "0.75rem 1rem",
                        background: "#fff",
                        border: "1px solid #e5e5e5",
                        borderRadius: "8px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem"
                      }}
                    >
                      <Upload style={{ width: 16, height: 16 }} />
                      Upload
                    </button>
                  </div>
                  {editingArticle.summaryImage && (
                    <div style={{ marginTop: "0.5rem" }}>
                      <img
                        src={editingArticle.summaryImage}
                        alt="Aperçu résumé"
                        style={{ maxWidth: "200px", height: "auto", borderRadius: "8px", border: "1px solid #e5e5e5" }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    </div>
                  )}
                  <input
                    type="text"
                    value={editingArticle.summaryImageAlt || ""}
                    onChange={(e) => setEditingArticle({ ...editingArticle, summaryImageAlt: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.5rem 0.75rem",
                      border: "1px solid #e5e5e5",
                      borderRadius: "8px",
                      fontSize: "0.75rem",
                      marginTop: "0.5rem",
                      background: "#fff"
                    }}
                    placeholder="Texte alternatif"
                  />
                </div>

                {/* Texte du résumé */}
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>
                    Texte du résumé (généré manuellement)
                  </label>
                  <textarea
                    value={editingArticle.aiSummary || ""}
                    onChange={(e) => setEditingArticle({ ...editingArticle, aiSummary: e.target.value })}
                    rows={4}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #e5e5e5",
                      borderRadius: "8px",
                      fontSize: "0.875rem",
                      fontFamily: "inherit",
                      background: "#fff"
                    }}
                    placeholder="Ce résumé sera affiché dans la section 'Lire le résumé généré par l'IA'. Vous le rédigez vous-même."
                  />
                </div>
              </div>

              {/* Contenu (Markdown) */}
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>
                  Contenu (Markdown)
                </label>
                <textarea
                  value={editingArticle.body || ""}
                  onChange={(e) => setEditingArticle({ ...editingArticle, body: e.target.value })}
                  rows={15}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #e5e5e5",
                    borderRadius: "8px",
                    fontSize: "0.875rem",
                    fontFamily: "monospace"
                  }}
                  placeholder="## Titre du paragraphe&#10;&#10;Contenu en markdown..."
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                {/* Catégorie */}
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>
                    Catégorie
                  </label>
                  <select
                    value={editingArticle.category}
                    onChange={(e) => setEditingArticle({ ...editingArticle, category: e.target.value as any })}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #e5e5e5",
                      borderRadius: "8px",
                      fontSize: "1rem"
                    }}
                  >
                    {availableCategories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Temps de lecture */}
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>
                    Temps de lecture (min)
                  </label>
                  <input
                    type="number"
                    value={editingArticle.readTime}
                    onChange={(e) => setEditingArticle({ ...editingArticle, readTime: parseInt(e.target.value) })}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #e5e5e5",
                      borderRadius: "8px",
                      fontSize: "1rem"
                    }}
                    min="1"
                  />
                </div>
              </div>

              {/* URL Audio */}
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>
                  URL Audio (optionnel)
                </label>
                <input
                  type="text"
                  value={editingArticle.audioUrl || ""}
                  onChange={(e) => setEditingArticle({ ...editingArticle, audioUrl: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #e5e5e5",
                    borderRadius: "8px",
                    fontSize: "0.875rem"
                  }}
                  placeholder="https://example.com/audio.mp3"
                />
              </div>

              {/* Date */}
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>
                  Date de publication
                </label>
                <input
                  type="date"
                  value={editingArticle.date}
                  onChange={(e) => setEditingArticle({ ...editingArticle, date: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #e5e5e5",
                    borderRadius: "8px",
                    fontSize: "1rem"
                  }}
                />
              </div>

              {/* Featured */}
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={editingArticle.featured || false}
                    onChange={(e) => setEditingArticle({ ...editingArticle, featured: e.target.checked })}
                    style={{ width: "1.25rem", height: "1.25rem", cursor: "pointer" }}
                  />
                  <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>Article à la une</span>
                </label>
              </div>

              {/* Boutons d'action */}
              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button
                  onClick={handleSave}
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    background: "linear-gradient(to right, #2563eb, #1d4ed8)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem"
                  }}
                >
                  <Save style={{ width: 20, height: 20 }} />
                  Enregistrer
                </button>
                <button
                  onClick={() => setEditingArticle(null)}
                  style={{
                    padding: "0.75rem 1.5rem",
                    background: "#f5f5f5",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Liste des articles
  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e5e5", padding: "1rem 2rem" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>Administration</h1>
            <p style={{ color: "#666", fontSize: "0.875rem" }}>Gestion des articles du blog</p>
          </div>
          <div style={{ display: "flex", gap: "1rem" }}>
            <button
              onClick={() => navigate("/")}
              style={{
                padding: "0.5rem 1rem",
                background: "#f5f5f5",
                border: "none",
                borderRadius: "8px",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Voir le site
            </button>
            <button
              onClick={handleLogout}
              style={{
                padding: "0.5rem 1rem",
                background: "#fee",
                color: "#c00",
                border: "none",
                borderRadius: "8px",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}
            >
              <LogOut style={{ width: 16, height: 16 }} />
              Déconnexion
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
        {/* Onglets */}
        <div style={{ marginBottom: "1.5rem", display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() => setActiveTab("tous")}
            style={{
              padding: "0.5rem 1rem",
              background: activeTab === "tous" ? "#2563eb" : "#fff",
              color: activeTab === "tous" ? "#fff" : "#666",
              border: "1px solid #e5e5e5",
              borderRadius: "8px",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Tous ({articles.length})
          </button>
          <button
            onClick={() => setActiveTab("actualites")}
            style={{
              padding: "0.5rem 1rem",
              background: activeTab === "actualites" ? "#2563eb" : "#fff",
              color: activeTab === "actualites" ? "#fff" : "#666",
              border: "1px solid #e5e5e5",
              borderRadius: "8px",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Actualités ({articles.filter(a => a.articleType === "actualite").length})
          </button>
          <button
            onClick={() => setActiveTab("fonctionnalites")}
            style={{
              padding: "0.5rem 1rem",
              background: activeTab === "fonctionnalites" ? "#2563eb" : "#fff",
              color: activeTab === "fonctionnalites" ? "#fff" : "#666",
              border: "1px solid #e5e5e5",
              borderRadius: "8px",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Fonctionnalités ({articles.filter(a => a.articleType === "fonctionnalite").length})
          </button>
        </div>

        <div style={{ background: "#fff", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>
              Articles ({filteredArticles.length})
            </h2>
            <button
              onClick={handleCreateNew}
              style={{
                padding: "0.5rem 1rem",
                background: "linear-gradient(to right, #2563eb, #1d4ed8)",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}
            >
              <Plus style={{ width: 16, height: 16 }} />
              Nouvel article
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {filteredArticles.map((article) => (
              <div
                key={article.slug}
                style={{
                  padding: "1rem",
                  border: "1px solid #e5e5e5",
                  borderRadius: "8px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  transition: "all 0.2s"
                }}
              >
                <div style={{ flex: 1, display: "flex", gap: "1rem", alignItems: "center" }}>
                  {article.cover && (
                    <img
                      src={article.cover}
                      alt=""
                      style={{
                        width: "60px",
                        height: "60px",
                        objectFit: "cover",
                        borderRadius: "6px",
                        border: "1px solid #e5e5e5"
                      }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                      <h3 style={{ fontSize: "1rem", fontWeight: 600 }}>
                        {article.title}
                      </h3>
                      {article.featured && (
                        <span style={{
                          background: "#fef3c7",
                          color: "#92400e",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontSize: "0.625rem",
                          fontWeight: 600
                        }}>
                          À LA UNE
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "1rem", fontSize: "0.75rem", color: "#666" }}>
                      <span style={{
                        background: article.articleType === "actualite" ? "#dbeafe" : "#e0e7ff",
                        color: article.articleType === "actualite" ? "#1e40af" : "#4338ca",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontSize: "0.625rem",
                        fontWeight: 600
                      }}>
                        {article.articleType === "actualite" ? "ACTUALITÉ" : "FONCTIONNALITÉ"}
                      </span>
                      <span>{article.category}</span>
                      <span>•</span>
                      <span>{article.readTime} min</span>
                      <span>•</span>
                      <span>{new Date(article.date).toLocaleDateString("fr-FR")}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => handleEdit(article)}
                    style={{
                      padding: "0.5rem",
                      background: "#f5f5f5",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem"
                    }}
                    title="Éditer"
                  >
                    <Edit2 style={{ width: 16, height: 16 }} />
                  </button>
                  <button
                    onClick={() => handleDelete(article.slug)}
                    style={{
                      padding: "0.5rem",
                      background: "#fee",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer"
                    }}
                    title="Supprimer"
                  >
                    <Trash2 style={{ width: 16, height: 16, color: "#c00" }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
