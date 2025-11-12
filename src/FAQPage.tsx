import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  BriefcaseBusiness,
  X,
  ChevronRight,
  HelpCircle,
  List,
  BookOpen,
  FileText,
  Euro,
  Shield,
  Cog,
  LifeBuoy,
} from "lucide-react";

// ====== Utils ======
function useScrollShrink(threshold = 8) {
  const [shrunk, setShrunk] = useState(false);
  useEffect(() => {
    const onScroll = () => setShrunk(window.scrollY > threshold);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return shrunk;
}

function LightActionHero({ onPrimaryClick }: { onPrimaryClick?: () => void }) {
  return (
    <div data-testid="light-hero" className="la-hero flow-hero">
      <div className="bg-bleed" aria-hidden />
      <div className="flow-wrap">
        <div className="flow-cta">
          <button className="flow-btn" onClick={onPrimaryClick}>
            <HelpCircle className="w-4 h-4" /> Chercher une réponse
          </button>
        </div>
      </div>
    </div>
  );
}

// ====== Données FAQ ======
const FAQS = [
  { id: "eligibilite", q: "Qui peut candidater à une alternance ?", a: "Toute personne inscrite en formation éligible (apprentissage ou professionnalisation) et avec un employeur prêt à signer. L'âge, le niveau d'études et la durée varient selon le contrat.", cat: "Découvrir l'alternance", tags: ["éligibilité", "contrat"] },
  { id: "types-contrat", q: "Quelles différences entre contrat d'apprentissage et de professionnalisation ?", a: "L'apprentissage vise surtout les diplômes d'État (CAP à Master) avec un CFA; la professionnalisation cible l'insertion ou la reconversion avec des titres RNCP. Les rythmes et aides diffèrent.", cat: "Découvrir l'alternance", tags: ["contrats", "apprentissage", "professionnalisation"] },
  { id: "trouver-offres", q: "Comment trouver rapidement des offres pertinentes ?", a: "Utilise la recherche par mots‑clés/ville, les filtres et enregistre tes favoris. Notre moteur met en avant la fraîcheur de l'offre et la correspondance avec ton profil.", cat: "Recherche d'offres", tags: ["recherche", "filtres", "favoris"] },
  { id: "alertes", q: "Puis‑je recevoir des alertes e‑mail ?", a: "Bientôt. Les alertes arrivent très vite : crée des filtres, sauvegarde ta recherche, et tu recevras un e‑mail dès qu'une offre correspond.", cat: "Recherche d'offres", tags: ["alertes", "email"] },
  { id: "postuler", q: "Comment postuler à une offre ?", a: "Clique sur 'Voir' puis 'Voir l'offre complète'. Selon le recruteur, tu postuleras soit sur Alternance & Talent, soit sur le site de l'entreprise.", cat: "Candidature", tags: ["postuler", "process"] },
  { id: "cv", q: "Quel format de CV recommandez‑vous ?", a: "PDF en une page lisible (typo simple, sections claires). Mets l'expérience, les projets et compétences clés. Renomme le fichier clairement : Nom_Prenom_CV.pdf.", cat: "Candidature", tags: ["cv", "pdf"] },
  { id: "motivation", q: "Faut‑il toujours une lettre de motivation ?", a: "Conseillée si le poste est sélectif ou si tu changes de voie. 7–10 lignes suffisent : motivation, adéquation profil‑poste, valeur ajoutée.", cat: "Candidature", tags: ["motivation", "lettre"] },
  { id: "suivi", q: "Comment suivre mes candidatures ?", a: "Depuis ta page 'Mes candidatures' (bientôt). En attendant, ajoute en favoris et utilise des tags personnels pour organiser tes relances.", cat: "Candidature", tags: ["suivi", "favoris"] },
  { id: "salaire", q: "Comment est calculé le salaire en alternance ?", a: "Il dépend de l'âge, de l'année de contrat et du type de contrat. Utilise notre calculateur estimatif depuis la fiche d'offre.", cat: "Rémunération", tags: ["salaire", "calcul"] },
  { id: "net-brut", q: "Différence entre brut et net ?", a: "Le brut inclut les cotisations. Le net est ce que tu perçois. Notre outil affiche une estimation pour t'aider à comparer.", cat: "Rémunération", tags: ["brut", "net"] },
  { id: "compte", q: "Le compte est‑il obligatoire pour postuler ?", a: "Pas toujours. Mais créer un compte te permet d'enregistrer des favoris, recevoir des alertes, et suivre tes candidatures.", cat: "Compte & Sécurité", tags: ["compte", "favoris"] },
  { id: "donnees", q: "Comment sont protégées mes données ?", a: "Nous appliquons le RGPD. Les mesures de suivi sont anonymes par défaut et tu peux refuser les cookies non essentiels.", cat: "Compte & Sécurité", tags: ["données", "RGPD", "cookies"] },
  { id: "fraude", q: "Comment signaler une offre douteuse ?", a: "Utilise le bouton 'Partager' puis choisis 'Copier le lien' et écris‑nous via Contact. Nous vérifions et retirons si nécessaire.", cat: "Compte & Sécurité", tags: ["fraude", "signalement"] },
  { id: "localisation", q: "Puis‑je chercher par ville ou télétravail ?", a: "Oui. Renseigne une ville ('Paris', 'Lyon'…) et des mots‑clés ('remote', 'télétravail') dans la barre de recherche.", cat: "Fonctionnalités du site", tags: ["ville", "remote"] },
  { id: "favoris", q: "À quoi servent les favoris ?", a: "À garder sous la main les offres qui t'intéressent, planifier des relances et comparer les salaires/avantages.", cat: "Fonctionnalités du site", tags: ["favoris", "comparaison"] },
  { id: "partage", q: "Comment partager une offre ?", a: "Depuis la fiche, clique sur 'Partager'. Si ton appareil ne supporte pas le partage natif, le lien est copié dans le presse‑papiers.", cat: "Fonctionnalités du site", tags: ["partage", "lien"] },
  { id: "support", q: "Comment contacter le support ?", a: "Depuis la section Contact en bas de page ou via le Centre d'aide. Nous répondons sous 24–48h ouvrées.", cat: "Aide & Contact", tags: ["support", "contact"] },
  { id: "centre-aide", q: "Quelle différence entre FAQ et Centre d'aide ?", a: "La FAQ répond vite aux questions courantes. Le Centre d'aide propose des guides détaillés et des pas‑à‑pas.", cat: "Aide & Contact", tags: ["centre d'aide", "guides"] },
  { id: "accessibilite", q: "Le site est‑il accessible sur mobile et lecteur d'écran ?", a: "Oui, design responsive et balises ARIA sur les interactions clés. Écris‑nous si tu rencontres un obstacle.", cat: "Aide & Contact", tags: ["accessibilité", "mobile", "ARIA"] },
  { id: "delais", q: "Combien de temps une offre reste‑t‑elle en ligne ?", a: "Variable. Nous affichons la date de publication et d'autres signaux de fraîcheur pour t'aider à prioriser.", cat: "Recherche d'offres", tags: ["fraîcheur", "publication"] },
  { id: "lettre-alt", q: "Avez‑vous des modèles de lettres/mail ?", a: "Oui, des templates simples arrivent dans le Centre d'aide : mail de candidature, relance, LinkedIn, etc.", cat: "Candidature", tags: ["templates", "relance"] },
  { id: "international", q: "Puis‑je candidater hors de ma région ?", a: "Oui. Filtre par ville, région ou télétravail, et vérifie les conditions de présence indiquées par l'employeur.", cat: "Recherche d'offres", tags: ["mobilité", "télétravail"] },
  { id: "docs", q: "Quels documents préparer avant de postuler ?", a: "CV PDF, éventuellement LM, portfolio/LindedIn et, si demandé, relevés/attestations d'école.", cat: "Candidature", tags: ["documents", "portfolio"] },
  { id: "retraite", q: "L'alternance compte‑t‑elle pour la retraite ?", a: "Selon les contrats, certaines périodes valident des trimestres. Renseigne‑toi auprès des organismes officiels.", cat: "Rémunération", tags: ["retraite", "droits"] },
];

const CATEGORIES = ["Toutes", ...Array.from(new Set(FAQS.map((f) => f.cat)))];

const CAT_ICONS: Record<string, any> = {
  "Toutes": List,
  "Découvrir l'alternance": BookOpen,
  "Recherche d'offres": Search,
  "Candidature": FileText,
  "Rémunération": Euro,
  "Compte & Sécurité": Shield,
  "Fonctionnalités du site": Cog,
  "Aide & Contact": LifeBuoy,
};

export default function FAQPage() {
  const shrunk = useScrollShrink(8);
  const [isLoginOpen, setLoginOpen] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [cookieChoice, setCookieChoice] = useState(() => {
    try {
      return localStorage.getItem("cookieConsent") || "";
    } catch {
      return "";
    }
  });
  const acceptCookies = () => {
    try {
      localStorage.setItem("cookieConsent", "accepted");
    } catch {}
    setCookieChoice("accepted");
  };
  const declineCookies = () => {
    try {
      localStorage.setItem("cookieConsent", "declined");
    } catch {}
    setCookieChoice("declined");
  };

  const [qDraft, setQDraft] = useState("");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Toutes");
  const [showAll, setShowAll] = useState(false);
  const faqRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { setShowAll(false); }, [cat, q]);

  const applyFaqSearch = () => {
    setQ(qDraft.trim());
    setTimeout(() => faqRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };

  const results = useMemo(() => {
    const ql = q.toLowerCase();
    const byCat = (f: any) => cat === "Toutes" || f.cat === cat;
    const byQuery = (f: any) => !ql || f.q.toLowerCase().includes(ql) || f.a.toLowerCase().includes(ql) || f.tags?.some((t: string) => t.toLowerCase().includes(ql));
    return FAQS.filter((f) => byCat(f) && byQuery(f));
  }, [q, cat]);

  const displayed = useMemo(() => (cat === "Toutes" && !showAll && q.trim() === "" ? results.slice(0, 5) : results), [results, cat, showAll, q]);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <style>{`
:root{
  --bg:#FFFFFF; --panel:#FFFFFF; --text:#0F0F10; --muted:#6F6B65;
  --headerPill:rgba(255,255,255,.55); --border:#ECEBEA; --borderStrong:#E6E5E3; --sep:#E6E5E3;
  --heroBg:#F5F6F7; --blueText:#1E40AF; --counterBg:#f7f6f4; --redBg:#FFE7E6; --redText:#B3261E;
  --radiusSoft:6px; --chipH:30px;
  --flowCream:#F3F4F6; --flowLavGradStart:#E9ECEF; --flowLavGradEnd:#FFFFFF;
}
.card{ background:var(--panel); border:1px solid var(--border); border-radius:var(--radiusSoft); position:relative; }
.btn{ border-radius:10px; font-weight:600; }
.btn-primary{ background:#2563EB; color:#fff; }
.btn-outline{ background:#fff; border:1px solid var(--border); color:var(--text); }
.btn-help{ background:#f7f6f4; color:#111; border:1px solid var(--border); }
.btn-help:hover{ filter:brightness(0.98); }
.header-shell{ position:static; background:var(--flowCream); }
.header-pill{ position:fixed; top:8px; left:50%; transform:translateX(-50%); z-index:70; background:var(--headerPill);
  border:1px solid rgba(255,255,255,.55); backdrop-filter:saturate(180%) blur(8px); -webkit-backdrop-filter:saturate(180%) blur(8px);
  border-radius:9999px; display:flex; align-items:center; gap:10px; white-space:nowrap; overflow:hidden;
  transition: padding .18s ease, gap .18s ease;
}
.header-pill.shrunk{ gap:6px; }
.brand-badge{ display:inline-flex; align-items:center; justify-content:center; background:#0f0f10; color:#fff; border-radius:10px; height:18px; padding:0 8px; font-weight:800; font-size:10.5px; letter-spacing:.04em; line-height:1; }
.brand-sep{ width:1px; height:16px; background:rgba(0,0,0,.22); margin:0 8px; display:inline-block; vertical-align:middle; transition:opacity .16s ease, transform .16s ease; }
.brand-text{ text-overflow: ellipsis; font-size:12.5px; transition:max-width .22s ease, opacity .16s ease, transform .16s ease; }
.page-sep{ height:1px; background:var(--border); }
.flow-hero{ position:relative; padding:56px 0 28px; }
.flow-hero .bg-bleed{ position:absolute; inset:0; left:50%; width:100vw; transform:translateX(-50%);
  background:linear-gradient(180deg,var(--flowCream) 0%, #FFFFFF 80%); z-index:0; }
.flow-wrap{ position:relative; z-index:1; max-width:56rem; margin:0 auto; text-align:center; padding:0 16px; }
.flow-cta{ display:flex; justify-content:center; margin-top:22px; }
.flow-btn{ display:inline-flex; align-items:center; gap:10px; background:#F7F7F8; border:1px solid #E5E7EB; border-radius:9999px; padding:12px 18px; font-weight:700; }
.flow-btn:hover{ box-shadow:0 6px 18px rgba(0,0,0,0.06); }
.faq-wrap{ max-width:56rem; margin:0 auto; padding:0 16px; }
.search-wrap{ display:flex; align-items:center; gap:10px; background:#fff; border:1px solid var(--borderStrong); border-radius:9999px; padding:10px 12px; width:100%; box-sizing:border-box; }
.input-with-icon{ flex:1; display:flex; align-items:center; gap:8px; color:#8A867F; min-width:0; }
.input-with-icon input{ flex:1; border:0; outline:none; background:transparent; color:var(--text); font-size:13px; }
.search-btn{ margin-left:auto; background:#2B2B2B; color:#fff; padding:8px 12px; border-radius:9999px; font-weight:700; font-size:13px; display:inline-flex; align-items:center; gap:6px; flex-shrink:0; }
.tabs{ display:flex; align-items:center; min-height:var(--chipH); background:#fff; border:1px solid var(--border); border-radius:9999px; padding:2px; gap:4px; overflow-x:auto; -webkit-overflow-scrolling:touch; }
.tab{ display:inline-flex; align-items:center; gap:8px; height:calc(var(--chipH) - 4px); padding:0 12px; border-radius:9999px; font-weight:600; color:#3F3D39; font-size:13px; white-space:nowrap; }
.tab .ico{ width:16px; height:16px; }
.tab.active{ background:#2B2B2B; color:#fff; }
.filters-row{ display:flex; align-items:center; gap:12px; flex-wrap:wrap; margin-top:12px; }
.faq-list{ margin-top:18px; }
.faq-accordion{ overflow:hidden; background:#fff; border:1px solid var(--border); border-radius:10px; }
.faq-accordion .faq-item + .faq-item{ border-top:1px solid var(--border); }
.faq-q{ display:flex; align-items:center; justify-content:space-between; gap:8px; padding:12px 14px; cursor:pointer; list-style:none; }
.faq-q::-webkit-details-marker{ display:none; }
.faq-q .chevron{ transition:transform .18s ease; }
.faq-item[open] .chevron{ transform:rotate(90deg); }
.answer{ padding:0 14px 12px; color:#58544E; }
.label{ font-size:13px; color:#3F3D39; font-weight:700; margin-bottom:8px; display:block; }
.input{ width:100%; background:#fff; border:1px solid var(--border); border-radius:12px; padding:12px 14px; font-size:14px; color:var(--text); }
.cookie-bar{ position:fixed; left:0; right:0; bottom:0; z-index:60; color:#fff; background:rgba(17,17,17,.78); backdrop-filter:saturate(120%) blur(4px); -webkit-backdrop-filter:saturate(120%) blur(4px); border:0; box-shadow:0 -6px 18px rgba(0,0,0,.18); }
.cookie-inner{ max-width:72rem; margin:0 auto; padding:8px 12px; display:flex; align-items:center; gap:8px; justify-content:space-between; }
.cookie-text{ opacity:.96; font-size:12.5px; }
.cookie-actions{ display:flex; align-items:center; gap:8px; }
.cookie-accept{ background:#fff; color:#111; border:0; border-radius:9999px; padding:6px 10px; font-weight:700; }
.cookie-decline{ background:transparent; color:#fff; border:0; padding:6px 8px; text-decoration:underline; }
.footer-shell{ background:#fff; border-top:1px solid var(--border); }
.footer-inner{ max-width:72rem; margin:0 auto; padding:24px 16px; }
.footer-grid{ display:grid; grid-template-columns:1.5fr repeat(3,1fr); gap:24px; align-items:flex-start; }
.footer-title{ font-weight:700; font-size:14px; color:#1F1E1B; margin-bottom:8px; }
.footer-link{ display:block; color:#6F6B65; font-size:13px; padding:4px 0; text-decoration:none; }
.footer-link:hover{ color:#1F1E1B; }
.footer-brand{ display:flex; align-items:center; gap:8px; color:#1F1E1B; }
.footer-bottom{ margin-top:16px; padding-top:12px; border-top:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; color:#6F6B65; font-size:12px; }
.footer-bottom .footer-link{ display:inline-block; padding:0; margin-left:12px; }
@media (max-width: 640px){
  :root{ --chipH:24px; }
  .search-wrap{ padding:8px 8px; gap:8px; }
  .search-btn{ padding:6px 10px; font-size:12px; }
  .filters-row{ gap:6px; overflow-x:auto; padding-bottom:2px; }
  .tabs{ overflow-x:auto; }
  .tab{ flex:0 0 auto; }
  .header-pill{ max-width: calc(100vw - 12px); }
  .brand-badge{ height:16px; padding:0 6px; font-size:9.5px; }
  .help-banner{ padding:8px 10px !important; gap:8px !important; }
  .help-cta .btn{ padding:6px 8px; font-size:12px; }
}
      `}</style>

      {/* Header */}
      <header className="header-shell">
        <div className="mx-auto max-w-6xl px-4 flex items-center justify-between" style={{ paddingTop: shrunk ? 4 : 8, paddingBottom: shrunk ? 4 : 8 }}>
          <div className={`header-pill ${shrunk ? "shrunk" : ""}`} style={{ padding: shrunk ? "4px 10px" : "6px 12px" }}>
            <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="brand-badge">mon</span>
              <span className="brand-sep" aria-hidden></span>
              <span className="brand-text inline-block font-medium whitespace-nowrap overflow-hidden" style={{ color: "var(--text)", maxWidth: shrunk ? 0 : 160, opacity: shrunk ? 0 : 1, transform: shrunk ? "translateY(-1px) scale(0.98)" : "none" }} aria-hidden={shrunk}>alternance & talent</span>
            </Link>
            <Link to="/" className="btn btn-outline px-3 py-1 text-sm" style={{ textDecoration: 'none' }}>Offres</Link>
            <button onClick={() => setLoginOpen(true)} className="btn btn-outline px-3 py-1 text-sm" data-testid="btn-login">Se connecter</button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="mx-auto max-w-6xl px-4 mt-0">
        <LightActionHero onPrimaryClick={() => document.getElementById("faq-search")?.scrollIntoView({ behavior: "smooth", block: "start" })} />
      </section>
      <div className="mx-auto max-w-6xl px-4 my-4"><div className="page-sep" /></div>

      {/* FAQ Search */}
      <section className="faq-wrap" id="faq-search" ref={faqRef}>
        <div className="search-wrap">
          <div className="input-with-icon">
            <Search className="w-4 h-4" />
            <input
              id="faq-input"
              aria-label="Recherche dans la FAQ"
              placeholder="Tape une question : salaire, CV, télétravail…"
              value={qDraft}
              onChange={(e) => setQDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyFaqSearch();
              }}
            />
          </div>
          <button className="search-btn" onClick={applyFaqSearch}>
            <Search className="w-4 h-4" /> Rechercher
          </button>
        </div>

        <div className="filters-row">
          <nav className="tabs" role="tablist" aria-label="Catégories FAQ">
            {CATEGORIES.map((c) => {
              const Icon = CAT_ICONS[c] || HelpCircle;
              return (
                <button
                  key={c}
                  role="tab"
                  aria-selected={cat === c}
                  className={`tab ${cat === c ? "active" : ""}`}
                  title={c}
                  aria-label={c}
                  onClick={() => setCat(c)}
                >
                  <Icon className="ico" />
                  <span>{c}</span>
                </button>
              );
            })}
          </nav>
          <button className="btn btn-outline px-3 py-1.5" onClick={() => { setQ(""); setQDraft(""); setCat("Toutes"); }}>
            Réinitialiser
          </button>
          <Link to="/" className="btn btn-primary px-3 py-1.5" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <BriefcaseBusiness className="w-4 h-4" />
            <span>Voir les offres</span>
          </Link>
        </div>

        {/* FAQ List */}
        <div className="faq-list" data-testid="faq-list">
          <div className="card faq-accordion" role="list">
            {displayed.map((f) => (
              <details key={f.id} className="faq-item" data-testid={`faq-${f.id}`} role="listitem">
                <summary className="faq-q">
                  <span>{f.q}</span>
                  <ChevronRight className="w-4 h-4 chevron" />
                </summary>
                <div className="answer">
                  <p className="a" style={{ marginTop: 6 }}>{f.a}</p>
                </div>
              </details>
            ))}
          </div>
          {cat === "Toutes" && !showAll && q.trim() === "" && results.length > 5 && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
              <button className="btn btn-outline px-3 py-1.5" onClick={() => setShowAll(true)} aria-label={`Voir plus (${results.length - 5} de plus)`}>
                Voir plus ({results.length - 5} de plus)
              </button>
            </div>
          )}
          {results.length === 0 && (
            <div className="card" style={{ padding: 14 }}>
              <p style={{ color: "#58544E" }}>Aucun résultat. Essaie d'autres mots ou parcours les catégories ci‑dessus.</p>
            </div>
          )}
        </div>
      </section>

      {/* Help Banner */}
      <section className="faq-wrap" style={{ marginTop: 24, marginBottom: 24 }}>
        <div className="card help-banner" style={{ padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div className="feature-title">Besoin d'aide personnalisée ?</div>
            <p className="feature-desc" style={{ marginTop: 4 }}>Contacte‑nous ou consulte le Centre d'aide pour des guides détaillés.</p>
          </div>
          <div className="flex items-center gap-8 help-cta">
            <Link to="/contact" className="btn btn-outline px-3 py-2" style={{ textDecoration: 'none' }}>Contact</Link>
            <Link to="/aide" className="btn btn-help px-3 py-2" style={{ textDecoration: 'none' }}>Centre d'aide</Link>
          </div>
        </div>
      </section>

      {/* Login/Signup Modal */}
      {isLoginOpen && (
        <div className="fixed inset-0 z-[60]" aria-modal role="dialog">
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.3)" }} onClick={() => setLoginOpen(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-md card p-6" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold" style={{ color: "var(--text)" }}>{isSignup ? "Créer un compte" : "Se connecter"}</h2>
                <button onClick={() => setLoginOpen(false)} aria-label="Fermer" className="p-2 rounded-lg hover:opacity-90"><X className="w-4 h-4" /></button>
              </div>
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                {isSignup && (
                  <div>
                    <label className="label" htmlFor="signup-name">Nom complet</label>
                    <input id="signup-name" className="input" placeholder="Jean Dupont" type="text" required />
                  </div>
                )}
                <div>
                  <label className="label" htmlFor="login-email">Email</label>
                  <input id="login-email" className="input" placeholder="email@exemple.com" type="email" required />
                </div>
                <div>
                  <label className="label" htmlFor="login-password">Mot de passe</label>
                  <input id="login-password" className="input" placeholder="••••••••" type="password" required />
                </div>
                {!isSignup && (
                  <div className="text-right">
                    <a href="#" className="text-sm" style={{ color: 'var(--blueText)' }}>Mot de passe oublié ?</a>
                  </div>
                )}
                <button className="btn btn-primary w-full px-4 py-2.5 text-sm" type="submit">
                  {isSignup ? "Créer mon compte" : "Se connecter"}
                </button>
                <div className="text-center text-sm" style={{ color: 'var(--muted)' }}>
                  {isSignup ? (
                    <>Vous avez déjà un compte ? <button type="button" onClick={() => setIsSignup(false)} style={{ color: 'var(--blueText)', fontWeight: 600 }}>Se connecter</button></>
                  ) : (
                    <>Pas encore de compte ? <button type="button" onClick={() => setIsSignup(true)} style={{ color: 'var(--blueText)', fontWeight: 600 }}>Créer un compte</button></>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Cookie bar */}
      {cookieChoice === "" && (
        <div className="cookie-bar" role="region" aria-label="Bannière cookies">
          <div className="cookie-inner">
            <span className="cookie-text text-sm">🍪 Nous utilisons des cookies pour <strong>améliorer ton expérience</strong> — <em>mesures anonymes uniquement</em>.</span>
            <div className="cookie-actions">
              <button className="cookie-accept" onClick={acceptCookies}>OK</button>
              <button className="cookie-decline" onClick={declineCookies}>Refuser</button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="footer-shell" role="contentinfo">
        <div className="footer-inner">
          <div className="footer-grid">
            <div className="footer-brand">
              <span className="brand-badge">mon</span>
              <span className="brand-sep" aria-hidden></span>
              <span className="font-medium">alternance & talent</span>
            </div>
            <div>
              <div className="footer-title">Produit</div>
              <Link className="footer-link" to="/">Rechercher</Link>
              <Link className="footer-link" to="/">Offres</Link>
              <a className="footer-link" href="#">Favoris</a>
              <a className="footer-link" href="#">Estimation salariale</a>
            </div>
            <div>
              <div className="footer-title">Ressources</div>
              <Link className="footer-link" to="/faq">FAQ</Link>
              <Link className="footer-link" to="/aide">Centre d'aide</Link>
              <Link className="footer-link" to="/contact">Contact</Link>
            </div>
            <div>
              <div className="footer-title">Légal</div>
              <Link className="footer-link" to="/cgu">CGU</Link>
              <a className="footer-link" href="#">Cookies</a>
              <Link className="footer-link" to="/confidentialite">Confidentialité</Link>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} Alternance & Talent — Tous droits réservés</span>
            <div>
              <a className="footer-link" href="#">Statut</a>
              <a className="footer-link" href="#">Accessibilité</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
