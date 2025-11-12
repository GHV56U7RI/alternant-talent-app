import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Settings, HelpCircle, Heart, BarChart3 } from "lucide-react";
import AuthPage from "./AuthPage";
import AnalyticsPage from "./AnalyticsPage";
import { getAllPosts } from "../cms/loadPosts";
import type { PostIndexItem } from "../cms/types";

/**
 * BlogPage — v2.1 (Alternance & Talent)
 * Utilise le composant NewsBlockOpenAIStyle avec corrections CSS complètes
 */

// =============================
// UI constants (scoped, non-colliding)
// =============================
const NBOS_TILE_SIZE = 120;
const NBOS_FEATURED_MOBILE_AR = "9/16";
const NBOS_FEATURED_DESKTOP_MIN_H = 280;
const NBOS_FEATURED_DESKTOP_MAX_H = 420;
const NBOS_FEATURED_MOBILE_MAX_H = 360;
const NBOS_SECTION_DIVIDER_HEIGHT = 1;
const NBOS_SECTION_DIVIDER_COLOR = "#e5e5e5";
const NBOS_FEATURES_SEE_ALL_LABEL = "Tout afficher";
const NBOS_SEARCH_PLACEHOLDER = "Rechercher une offre, un secteur, une ville…";
const NBOS_SEARCH_BUTTON_LABEL = "Chercher";
const NBOS_AUDIO_BADGE_LABEL = "Audio";

const NBOS_NEWS_PAGE_BASE = 4;
const NBOS_NEWS_PAGE_SIZE = 4;
const NBOS_FEAT_PAGE_BASE = 4;
const NBOS_FEAT_PAGE_SIZE = 4;

const NBOS_DENSE = true;
const NBOS_TILE_DIM = NBOS_DENSE ? 92 : NBOS_TILE_SIZE;
const NBOS_SP = NBOS_DENSE ? {
  section: "px-4 py-2 md:px-6 md:py-4",
  searchMb: "mb-2",
  h2Wrap: "mt-4 md:mt-6 mb-3 md:mb-4",
  gridGap: "gap-y-3 md:gap-y-4 md:gap-x-6",
  colStack: "space-y-3 md:space-y-4",
  dividerMb: "mb-4 md:mb-5",
  featuresWrap: "mt-6 md:mt-8",
  featuresHeadMb: "mb-3 md:mb-4",
} : {
  section: "px-5 md:px-8 lg:px-10 py-10 md:py-14",
  searchMb: "mb-6",
  h2Wrap: "mt-10 md:mt-14 mb-8 md:mb-12",
  gridGap: "gap-y-10 md:gap-y-14 md:gap-x-20",
  colStack: "space-y-10 md:space-y-14",
  dividerMb: "mb-6 md:mb-8",
  featuresWrap: "mt-14 md:mt-16",
  featuresHeadMb: "mb-8 md:mb-10",
};

function toCssRatio(v: string) { return v.includes("/") ? v.replace("/", " / ") : v; }
function splitInTwo<T>(arr: T[]): [T[], T[]] { const a: T[] = [], b: T[] = []; arr.forEach((x,i)=> (i%2?a:b).push(x)); return [a,b]; }

// Demo data
const NBOS_featured = {
  title: "Nouveau : Alternance & Talent Pro — ciblage étudiants et dashboard RH",
  tag: "Produit",
  readTime: "3 min de lecture",
  bg: "#f5f5f5",
  href: "#",
};

const NBOS_leftCol = [
  { title: "Guide 2025 : rémunération en alternance (âge, diplôme, convention)", tag: "Salaire", date: "7 nov. 2025", bg: "#f5f5f5" },
  { title: "Candidatures 2026 : calendrier des écoles partenaires", tag: "Écoles", date: "6 nov. 2025", bg: "#f4f4f5" },
  { title: "Diffusion des offres : Mon Alternance Talent × France Travail", tag: "Partenariat", date: "3 nov. 2025", bg: "#ededed", label: "Réseau public" },
];

const NBOS_rightCol = [
  { title: "Top secteurs qui recrutent en alternance cet automne", tag: "Marché", date: "6 nov. 2025", bg: "#f3f4f6" },
  { title: "CV alternance : 8 erreurs qui font perdre des entretiens", tag: "Conseils", date: "5 nov. 2025", bg: "#f6f6f6" },
  { title: "Ouverture des postes Bac+3/Bac+5 — Rentrée 2026", tag: "Offres", date: "30 oct. 2025", bg: "#fafafa" },
];

const NBOS_newsMore = [
  { title: "Contrat d'apprentissage vs pro : différences clés 2025", tag: "Contrats", date: "2 nov. 2025", bg: "#f5f5f5" },
  { title: "Alternance en Data/IA : compétences les plus demandées", tag: "Tech", date: "1 nov. 2025", bg: "#f4f4f5" },
  { title: "Aides employeurs 2025 : ce qui change", tag: "Aides", date: "31 oct. 2025", bg: "#ededed" },
  { title: "Préparer un entretien d'alternance : checklist 24h", tag: "Conseils", date: "29 oct. 2025", bg: "#f3f4f6" },
  { title: "Comment choisir sa convention collective en alternance ?", tag: "RH", date: "28 oct. 2025", bg: "#f6f6f6" },
  { title: "Modèle d'email de relance après entretien", tag: "Outils", date: "27 oct. 2025", bg: "#fafafa" },
  { title: "Visa & mobilité : stages/alternance au Québec (guide FR)", tag: "International", date: "26 oct. 2025", bg: "#f5f5f5" },
  { title: "Taux de transformation : KPI à suivre côté RH", tag: "RH", date: "25 oct. 2025", bg: "#f4f4f5" },
];

const NBOS_features = [
  { title: "Recherche avancée d'offres", desc: "Filtres précis par secteur, localisation et expérience.", bg: "#f4f4f5", tag: "Produit", date: "7 nov. 2025" },
  { title: "Alertes en temps réel", desc: "Soyez notifié·e dès qu'une nouvelle opportunité apparaît.", bg: "#f5f5f5", tag: "Produit", date: "6 nov. 2025" },
  { title: "Candidature 1 clic", desc: "Profils pré‑remplis pour postuler plus vite.", bg: "#ededed", tag: "Produit", date: "3 nov. 2025" },
  { title: "Tableau de bord RH", desc: "Suivi des candidatures et statistiques utiles.", bg: "#f3f4f6", tag: "Produit", date: "30 oct. 2025" },
];

const NBOS_featuresMore = [
  { title: "Export PDF & partage", desc: "Partagez vos sélections en un clic.", bg: "#fafafa", tag: "Produit", date: "24 oct. 2025" },
  { title: "Intégrations ATS/Slack/Gmail", desc: "Connectez Slack, Gmail, ATS et plus.", bg: "#f6f6f6", tag: "Produit", date: "23 oct. 2025" },
  { title: "Rappels & relances auto", desc: "Ne ratez aucune échéance.", bg: "#f5f5f5", tag: "Produit", date: "22 oct. 2025" },
  { title: "Espace d'équipe (RH/Écoles)", desc: "Collaborez en temps réel.", bg: "#ededed", tag: "Produit", date: "21 oct. 2025" },
];

// Hook scroll
function useScrollShrink(threshold = 8) {
  const [shrunk, setShrunk] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
      setShrunk(scrollY > threshold);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return shrunk;
}

// Header connecté
function HeaderConnected({ user, onProfileClick, onFavorisClick, onAnalyticsClick, onSettingsClick, onHelpClick, onLogout }: any) {
  const shrunk = useScrollShrink(8);
  const pillRef = React.useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);

  React.useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      const pill = pillRef.current;
      if (pill && !(pill as HTMLElement).contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, [menuOpen]);

  return (
    <>
      <style>{`
        :root{
          --bg:#FFFFFF; --panel:#FFFFFF; --text:#0F0F10; --muted:#6F6B65;
          --border:#ECEBEA; --borderStrong:#E6E5E3; --sep:#E6E5E3;
          --pill:#f7f6f4; --link:#1F2937; --linkHover:#0B1220;
          --headerPill:rgba(255,255,255,.58);
          --headerBorder:rgba(0,0,0,.06);
          --flowCream:#F5F5F5;
          --headerTop: 28px;
          --headerBottomOffset: 56px;
          --siteBg: linear-gradient(180deg, #F7F7F8 0%, #FFFFFF 70%);
        }
        @media (max-width:640px){
          :root{ --headerTop: 22px; --headerBottomOffset: 64px; }
        }

        html, body { background: var(--siteBg); margin:0; }

        .header-shell{ position:static; background:transparent; border:0; box-shadow:none; }
        .header-inner{ max-width:72rem; margin:0 auto; display:flex; align-items:center; justify-content:center; padding:0; }

        .brand-badge{ display:inline-flex; align-items:center; justify-content:center; background:#0f0f10; color:#fff; border-radius:10px; height:18px; padding:0 8px; font-weight:700; font-size:10.5px; letter-spacing:.04em; line-height:1; }
        .brand-sep{ width:1px; height:16px; background:rgba(0,0,0,.15); margin:0 8px; display:inline-block; vertical-align:middle; transition:opacity .18s ease, transform .18s ease; }
        .header-pill.shrunk .brand-sep{ opacity:1 !important; transform:none !important; width:1px !important; margin:0 8px !important; }

        .brand-text{ display:inline-block; font-weight:400; font-size:13px; letter-spacing:.01em; color:#111; white-space:nowrap; overflow:hidden; max-width:220px; opacity:1; transform:translateY(0) scale(1); transition: opacity .18s ease, transform .18s ease, max-width .22s ease, margin .18s ease; position:relative; z-index:1; }
        .brand-text.hidden{ opacity:0; transform:translateY(-1px) scale(.97); max-width:0; margin:0; }

        .header-pill{ position:fixed; top: var(--headerTop); left:50%; transform:translateX(-50%); z-index:70; color:#111;
          background:var(--headerPill);
          border:1px solid var(--headerBorder);
          border-radius:9999px; display:flex; align-items:center; gap:10px; white-space:nowrap; overflow:visible;
          backdrop-filter: blur(14px) saturate(160%); -webkit-backdrop-filter: blur(14px) saturate(160%);
          transition: padding .18s ease, gap .18s ease;
          padding:10px 16px; isolation:isolate;
          box-shadow:none;
        }
        .header-pill.shrunk{ gap:6px; padding:8px 14px; }

        .btn-icon{ width:32px; height:32px; display:inline-flex; align-items:center; justify-content:center; border-radius:9999px; background:rgba(0,0,0,.04); border:1px solid rgba(0,0,0,.08); color:#111; cursor:pointer; margin-left:8px; }
        .btn-icon:hover{ background:rgba(0,0,0,.08); }
        .btn-icon svg{ width:18px; height:18px; display:block; }

        .profile-menu{ position:absolute; top:100%; right:0; margin-top:8px; width:220px; }
        .menu-panel{ position:relative; background:var(--headerPill); border:1px solid var(--headerBorder); border-radius:12px;
          box-shadow: 0 8px 24px rgba(0,0,0,.12);
          overflow:hidden; transform-origin:top right; backdrop-filter: blur(14px) saturate(160%); -webkit-backdrop-filter: blur(14px) saturate(160%);
        }
        .menu-panel.hidden{ opacity:0; pointer-events:none; transform:translateY(-6px) scale(0.98); }
        .menu-panel.show{ opacity:1; transform:translateY(0) scale(1); transition:opacity .18s ease, transform .18s ease; }

        .menu-list{ list-style:none; margin:0; padding:8px; }
        .menu-item{ width:100%; display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:8px; border:0; background:transparent; text-align:left; cursor:pointer; font-size:14px; color:#111; }
        .menu-item:hover{ background:rgba(0,0,0,.04); }
        .menu-item svg{ width:18px; height:18px; flex-shrink:0; }
        .menu-divider{ height:1px; background:var(--border); margin:8px 12px; }

        .header-offset{ height: var(--headerBottomOffset); }
      `}</style>

      <header className="header-shell" role="banner">
        <div className="header-inner" />
      </header>

      <div ref={pillRef} className={`header-pill ${shrunk ? "shrunk" : ""}`}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="brand-badge">mon</span>
          <span className="brand-sep" aria-hidden></span>
          <span className={`brand-text ${shrunk ? "hidden" : ""}`}>alternance & talent</span>
        </Link>

        <button className="btn-icon" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu utilisateur">
          <User />
        </button>

        {menuOpen && (
          <div className="profile-menu">
            <div className={`menu-panel ${menuOpen ? "show" : "hidden"}`}>
              <ul className="menu-list">
                <li><button className="menu-item" onClick={() => { setMenuOpen(false); onProfileClick(); }}><User />Profil</button></li>
                <li><button className="menu-item" onClick={() => { setMenuOpen(false); onFavorisClick(); }}><Heart />Favoris</button></li>
                <li><button className="menu-item" onClick={() => { setMenuOpen(false); onAnalyticsClick(); }}><BarChart3 />Statistiques</button></li>
                <li><button className="menu-item" onClick={() => { setMenuOpen(false); onSettingsClick(); }}><Settings />Paramètres</button></li>
                <li><button className="menu-item" onClick={() => { setMenuOpen(false); onHelpClick(); }}><HelpCircle />Aide</button></li>
                <li><div className="menu-divider" /></li>
                <li><button className="menu-item" onClick={() => { setMenuOpen(false); onLogout(); }}>Déconnexion</button></li>
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className="header-offset" aria-hidden="true" />
    </>
  );
}

function HeaderNotConnected({ onLoginClick }: any) {
  const shrunk = useScrollShrink(8);
  const pillRef = React.useRef(null);

  return (
    <>
      <style>{`
        :root{
          --bg:#FFFFFF; --panel:#FFFFFF; --text:#0F0F10; --muted:#6F6B65;
          --border:#ECEBEA; --borderStrong:#E6E5E3; --sep:#E6E5E3;
          --pill:#f7f6f4; --link:#1F2937; --linkHover:#0B1220;
          --headerPill:rgba(255,255,255,.58);
          --headerBorder:rgba(0,0,0,.06);
          --flowCream:#F5F5F5;
          --headerTop: 28px;
          --headerBottomOffset: 56px;
          --siteBg: linear-gradient(180deg, #F7F7F8 0%, #FFFFFF 70%);
          --authBlue:#4285f4;
          --authBlueDark:#2f6fe6;
        }
        @media (max-width:640px){
          :root{ --headerTop: 22px; --headerBottomOffset: 64px; }
        }

        html, body { background: var(--siteBg); margin:0; }

        .header-shell{ position:static; background:transparent; border:0; box-shadow:none; }
        .header-inner{ max-width:72rem; margin:0 auto; display:flex; align-items:center; justify-content:center; padding:0; }

        .brand-badge{ display:inline-flex; align-items:center; justify-content:center; background:#0f0f10; color:#fff; border-radius:10px; height:18px; padding:0 8px; font-weight:700; font-size:10.5px; letter-spacing:.04em; line-height:1; }
        .brand-sep{ width:1px; height:16px; background:rgba(0,0,0,.15); margin:0 8px; display:inline-block; vertical-align:middle; transition:opacity .18s ease, transform .18s ease; }
        .header-pill.shrunk .brand-sep{ opacity:1 !important; transform:none !important; width:1px !important; margin:0 8px !important; }

        .brand-text{ display:inline-block; font-weight:400; font-size:13px; letter-spacing:.01em; color:#111; white-space:nowrap; overflow:hidden; max-width:220px; opacity:1; transform:translateY(0) scale(1); transition: opacity .18s ease, transform .18s ease, max-width .22s ease, margin .18s ease; position:relative; z-index:1; }
        .brand-text.hidden{ opacity:0; transform:translateY(-1px) scale(.97); max-width:0; margin:0; }

        .header-pill{ position:fixed; top: var(--headerTop); left:50%; transform:translateX(-50%); z-index:70; color:#111;
          background:var(--headerPill);
          border:1px solid var(--headerBorder);
          border-radius:9999px; display:flex; align-items:center; gap:10px; white-space:nowrap; overflow:visible;
          backdrop-filter: blur(14px) saturate(160%); -webkit-backdrop-filter: blur(14px) saturate(160%);
          transition: padding .18s ease, gap .18s ease;
          padding:10px 16px; isolation:isolate;
          box-shadow:none;
        }
        .header-pill.shrunk{ gap:6px; padding:8px 14px; }

        .auth-actions{ display:inline-flex; align-items:center; gap:8px; margin-left:8px; }
        .btn-auth{ height:32px; display:inline-flex; align-items:center; justify-content:center; padding:0 12px; border-radius:9999px; font-weight:800; font-size:12.5px; letter-spacing:.01em; cursor:pointer; border:1px solid transparent; text-decoration:none; }
        .btn-auth--outline{ background:#fff; border:1px solid rgba(0,0,0,.10); color:#111; }
        .btn-auth--outline:hover{ background:#fff; border-color: rgba(0,0,0,.18); }

        .header-offset{ height: var(--headerBottomOffset); }
      `}</style>

      <header className="header-shell" role="banner">
        <div className="header-inner" />
      </header>

      <div
        ref={pillRef}
        className={`header-pill ${shrunk ? "shrunk" : ""}`}
      >
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="brand-badge">mon</span>
          <span className="brand-sep" aria-hidden></span>
          <span className={`brand-text ${shrunk ? "hidden" : ""}`}>alternance & talent</span>
        </Link>

        <div className="auth-actions" role="group" aria-label="Authentification">
          <button onClick={onLoginClick} className="btn-auth btn-auth--outline" aria-label="Se connecter">
            Se connecter
          </button>
        </div>
      </div>

      <div className="header-offset" aria-hidden="true" />
    </>
  );
}

function FeaturedStory({ data }: any) {
  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    console.log("[search]", fd.get("q"));
  }

  if (!data) return null;

  return (
    <>
      <div style={{ marginBottom: "24px" }}>
        <form onSubmit={onSubmit} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              role="searchbox"
              inputMode="search"
              enterKeyHint="search"
              name="q"
              placeholder={NBOS_SEARCH_PLACEHOLDER}
              style={{
                WebkitAppearance: "none",
                appearance: "none",
                width: "100%",
                background: "#fff",
                border: "1px solid #e5e5e5",
                borderRadius: "12px",
                padding: "8px 16px",
                fontSize: "14px",
                color: "#0f0f10",
                outline: "none",
                boxShadow: "none"
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              WebkitAppearance: "none",
              appearance: "none",
              background: "#fff",
              border: "1px solid #e5e5e5",
              borderRadius: "12px",
              padding: "8px 16px",
              fontSize: "14px",
              fontWeight: 500,
              color: "#525252",
              cursor: "pointer",
              boxShadow: "none"
            }}
          >
            {NBOS_SEARCH_BUTTON_LABEL}
          </button>
        </form>
      </div>

      <Link to={`/blog/${data.slug}`} className="block" style={{ textDecoration: "none", color: "inherit" }}>
        <div style={{ width: "100%", borderRadius: "20px", overflow: "hidden" }}>
          {data.cover ? (
            <>
              <div className="relative w-full md:hidden" style={{ aspectRatio: toCssRatio(NBOS_FEATURED_MOBILE_AR), maxHeight: NBOS_FEATURED_MOBILE_MAX_H, overflow: "hidden" }}>
                <img src={data.cover} alt={data.coverAlt || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div className="relative w-full hidden md:block" style={{ height: `clamp(${NBOS_FEATURED_DESKTOP_MIN_H}px, 28vw, ${NBOS_FEATURED_DESKTOP_MAX_H}px)`, overflow: "hidden" }}>
                <img src={data.cover} alt={data.coverAlt || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            </>
          ) : (
            <>
              <div className="relative w-full md:hidden" style={{ aspectRatio: toCssRatio(NBOS_FEATURED_MOBILE_AR), background: data.bg || "#f5f5f5", maxHeight: NBOS_FEATURED_MOBILE_MAX_H }} />
              <div className="relative w-full hidden md:block" style={{ height: `clamp(${NBOS_FEATURED_DESKTOP_MIN_H}px, 28vw, ${NBOS_FEATURED_DESKTOP_MAX_H}px)`, background: data.bg || "#f5f5f5" }} />
            </>
          )}
        </div>
        <h1 style={{ marginTop: "24px", fontSize: "26px", lineHeight: "1.05", fontWeight: 600, color: "#0f0f10" }}>{data.title}</h1>
        <div className={`${NBOS_DENSE ? "mt-1.5" : "mt-3"} text-[14px] text-neutral-500 flex items-center gap-2`}>
          <span className="capitalize">{data.category || data.tag}</span>
          <span aria-hidden>·</span>
          <span>{data.readTime} min de lecture</span>
        </div>
      </Link>
    </>
  );
}

function AudioIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" style={{ width: "14px", height: "14px", display: "inline-block", verticalAlign: "middle" }} {...props}>
      <path d="M4 4l8 4-8 4V4z" />
    </svg>
  );
}

function Item({ item }: any) {
  return (
    <Link to={`/blog/${item.slug}`} style={{ textDecoration: "none", color: "inherit", display: "flex", gap: "24px", alignItems: "flex-start" }}>
      <div style={{
        width: NBOS_TILE_DIM,
        height: NBOS_TILE_DIM,
        minWidth: NBOS_TILE_DIM,
        minHeight: NBOS_TILE_DIM,
        maxWidth: NBOS_TILE_DIM,
        maxHeight: NBOS_TILE_DIM,
        background: item.cover ? "transparent" : (item.bg || "#f5f5f5"),
        borderRadius: "16px",
        overflow: "hidden",
        flexShrink: 0
      }}>
        {item.cover ? (
          <img src={item.cover} alt={item.coverAlt || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: item.bg || "#f5f5f5" }} />
        )}
      </div>
      <div className="min-w-0" style={{ paddingTop: "4px" }}>
        <h3 style={{ fontSize: "20px", lineHeight: "1.2", fontWeight: 500, color: "#0f0f10", marginBottom: "12px" }}>{item.title}</h3>
        <div className="text-[12px] md:text-[14px] text-neutral-500 flex flex-row items-center gap-1 md:gap-2">
          {item.audioUrl && <><span className="flex items-center gap-1.5"><AudioIcon />{NBOS_AUDIO_BADGE_LABEL}</span><span aria-hidden>·</span></>}
          <span className="capitalize">{item.category || item.tag}</span>
          <span aria-hidden>·</span>
          <time>{new Date(item.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}</time>
        </div>
      </div>
    </Link>
  );
}

function FeatureCard({ item }: any) {
  return (
    <Link to={`/blog/${item.slug}`} style={{ textDecoration: "none", color: "inherit", display: "flex", gap: "24px", alignItems: "flex-start" }}>
      <div style={{
        width: NBOS_TILE_DIM,
        height: NBOS_TILE_DIM,
        minWidth: NBOS_TILE_DIM,
        minHeight: NBOS_TILE_DIM,
        maxWidth: NBOS_TILE_DIM,
        maxHeight: NBOS_TILE_DIM,
        background: item.cover ? "transparent" : (item.bg || "#f4f4f5"),
        borderRadius: "16px",
        overflow: "hidden",
        flexShrink: 0
      }}>
        {item.cover ? (
          <img src={item.cover} alt={item.coverAlt || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: item.bg || "#f4f4f5" }} />
        )}
      </div>
      <div className="min-w-0" style={{ paddingTop: "4px" }}>
        <h3 style={{ fontSize: "22px", lineHeight: "1.2", fontWeight: 500, color: "#0f0f10", marginBottom: "12px" }}>{item.title}</h3>
        <div className="text-[12px] md:text-[14px] text-neutral-500 flex flex-row items-center gap-1 md:gap-2">
          {item.audioUrl && <><span className="flex items-center gap-1.5"><AudioIcon />{NBOS_AUDIO_BADGE_LABEL}</span><span aria-hidden>·</span></>}
          <span className="capitalize">{item.category || item.tag}</span>
          <span aria-hidden>·</span>
          <time>{new Date(item.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}</time>
        </div>
        {(item.desc || item.excerpt) && (
          <p style={{ marginTop: "8px", fontSize: "14px", color: "#525252" }}>{item.desc || item.excerpt}</p>
        )}
      </div>
    </Link>
  );
}

function Pagination({ total, current, onGo }: any) {
  if (total <= 1) return null;
  return (
    <nav className="mt-8 flex items-center gap-2" aria-label="Pagination">
      {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          onClick={() => onGo(n)}
          type="button"
          style={{
            WebkitAppearance: "none",
            appearance: "none",
            background: "#fff",
            minWidth: "36px",
            height: "36px",
            borderRadius: "8px",
            border: "1px solid #e5e5e5",
            fontSize: "14px",
            color: n === current ? "#0f0f10" : "#737373",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          {n}
        </button>
      ))}
    </nav>
  );
}

export default function BlogPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [showAuthPage, setShowAuthPage] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("user");
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setShowAnalytics(false);
    navigate("/");
  };

  // Charger les articles depuis search.json
  const allPosts = useMemo(() => getAllPosts(), []);

  // Séparer actualités et fonctionnalités
  const allNews = useMemo(() => allPosts.filter(p => p.articleType === "actualite"), [allPosts]);
  const allFeatures = useMemo(() => allPosts.filter(p => p.articleType === "fonctionnalite"), [allPosts]);

  const totalNews = allNews.length;
  const [newsVisible, setNewsVisible] = useState(NBOS_NEWS_PAGE_BASE);

  const newsTotalPages = Math.max(1, 1 + Math.ceil(Math.max(0, totalNews - NBOS_NEWS_PAGE_BASE) / NBOS_NEWS_PAGE_SIZE));
  const newsCurrentPage = Math.min(newsTotalPages, Math.max(1, Math.ceil(Math.max(0, newsVisible - NBOS_NEWS_PAGE_BASE) / NBOS_NEWS_PAGE_SIZE) + 1));
  const newsShown = allNews.slice(0, Math.min(newsVisible, totalNews));
  const [newsLeft, newsRight] = splitInTwo(newsShown);

  const totalFeat = allFeatures.length;
  const [featVisible, setFeatVisible] = useState(NBOS_FEAT_PAGE_BASE);
  const featTotalPages = Math.max(1, Math.ceil(totalFeat / NBOS_FEAT_PAGE_SIZE));
  const featCurrentPage = Math.min(featTotalPages, Math.max(1, Math.ceil(featVisible / NBOS_FEAT_PAGE_SIZE)));
  const featShown = allFeatures.slice(0, Math.min(featVisible, totalFeat));

  const handleSeeAllNews = (e: React.MouseEvent) => { e.preventDefault(); setNewsVisible((v) => Math.min(v + NBOS_NEWS_PAGE_SIZE, totalNews)); };
  const handleSeeAllFeat = (e: React.MouseEvent) => { e.preventDefault(); setFeatVisible((v) => Math.min(v + NBOS_FEAT_PAGE_SIZE, totalFeat)); };
  const handleSeeLessNews = (e: React.MouseEvent) => { e.preventDefault(); setNewsVisible(NBOS_NEWS_PAGE_BASE); };
  const handleSeeLessFeat = (e: React.MouseEvent) => { e.preventDefault(); setFeatVisible(NBOS_FEAT_PAGE_BASE); };

  if (showAuthPage) {
    return <AuthPage onBack={() => setShowAuthPage(false)} />;
  }

  if (showAnalytics) {
    return <AnalyticsPage onClose={() => setShowAnalytics(false)} />;
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-neutral-900 px-0 py-0">
      {user ? (
        <HeaderConnected
          user={user}
          onProfileClick={() => navigate("/")}
          onFavorisClick={() => navigate("/")}
          onAnalyticsClick={() => setShowAnalytics(true)}
          onSettingsClick={() => navigate("/")}
          onHelpClick={() => navigate("/aide")}
          onLogout={handleLogout}
        />
      ) : (
        <HeaderNotConnected onLoginClick={() => setShowAuthPage(true)} />
      )}

      <div className="news-openai-scope bg-white not-prose">
        <style>{`
          .news-openai-scope a{color:inherit !important;text-decoration:none !important;}
          .news-openai-scope a:hover,.news-openai-scope a:focus{color:inherit !important;text-decoration:none !important;}
          .news-openai-scope *{ box-sizing: border-box; }
          /* Strong reset for Safari (WebKit) + frameworks globaux (DaisyUI/Flowbite/Forms) */
          .news-openai-scope input, .news-openai-scope button{
            -webkit-appearance: none !important;
            appearance: none !important;
            box-shadow: none !important;
            background: #fff !important;
          }
          .news-openai-scope input[type="search"]::-webkit-search-cancel-button,
          .news-openai-scope input[type="search"]::-webkit-search-decoration{ display:none !important; }

          /* Grille 2 colonnes pour desktop */
          .news-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 12px;
          }
          @media (min-width: 768px) {
            .news-grid {
              grid-template-columns: 1fr 1fr;
              gap: 24px 96px;
            }
          }
        `}</style>
        <section className={`max-w-6xl mx-auto ${NBOS_SP.section}`}>
          <FeaturedStory data={allPosts.find(p => p.featured)} />

          <div className={`flex items-center justify-between ${NBOS_SP.h2Wrap}`}>
            <h2 className="text-[22px] md:text-[26px] font-semibold text-neutral-900">Actualités</h2>
            {newsVisible > NBOS_NEWS_PAGE_BASE ? (
              <a href="#" onClick={handleSeeLessNews} className="text-sm font-medium text-neutral-500 hover:text-neutral-900" style={{ textDecoration: "none", color: "inherit" }}>Voir moins</a>
            ) : newsVisible < totalNews ? (
              <a href="#" onClick={handleSeeAllNews} className="text-sm font-medium text-neutral-500 hover:text-neutral-900" style={{ textDecoration: "none", color: "inherit" }}>Tout afficher</a>
            ) : null}
          </div>

          <div className="news-grid">
            <div className={NBOS_SP.colStack}>
              {newsLeft.map((it, i) => (
                <Item key={`nl-${i}`} item={it} />
              ))}
            </div>
            <div className={NBOS_SP.colStack}>
              {newsRight.map((it, i) => (
                <Item key={`nr-${i}`} item={it} />
              ))}
            </div>
          </div>

          <Pagination total={newsTotalPages} current={newsCurrentPage} onGo={(page: number) => {
            if (page === 1) setNewsVisible(NBOS_NEWS_PAGE_BASE);
            else setNewsVisible(Math.min(NBOS_NEWS_PAGE_BASE + (page - 1) * NBOS_NEWS_PAGE_SIZE, totalNews));
          }} />

          <div className={NBOS_SP.featuresWrap}>
            <div className={`w-full rounded-full ${NBOS_SP.dividerMb}`} style={{ height: NBOS_SECTION_DIVIDER_HEIGHT, background: NBOS_SECTION_DIVIDER_COLOR }} />
            <div className={`flex items-center justify-between ${NBOS_SP.featuresHeadMb}`}>
              <h2 className="text-[22px] md:text-[26px] font-semibold text-neutral-900">Fonctionnalités</h2>
              {featVisible > NBOS_FEAT_PAGE_BASE ? (
                <a href="#" onClick={handleSeeLessFeat} className="text-sm font-medium text-neutral-500 hover:text-neutral-900" style={{ textDecoration: "none", color: "inherit" }}>Voir moins</a>
              ) : featVisible < totalFeat ? (
                <a href="#" onClick={handleSeeAllFeat} className="text-sm font-medium text-neutral-500 hover:text-neutral-900" style={{ textDecoration: "none", color: "inherit" }}>{NBOS_FEATURES_SEE_ALL_LABEL}</a>
              ) : null}
            </div>
            <div className="news-grid">
              {featShown.map((it, i) => (
                <FeatureCard key={`f-${i}`} item={it} />
              ))}
            </div>

            <Pagination
              total={featTotalPages}
              current={featCurrentPage}
              onGo={(page: number) => setFeatVisible(Math.min(page * NBOS_FEAT_PAGE_SIZE, totalFeat))}
            />
          </div>
        </section>
      </div>

      <footer style={{ background: "#fafafa", borderTop: "1px solid #e5e5e5", marginTop: "80px", padding: "48px 24px 32px" }}>
        <div style={{ maxWidth: "1152px", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "40px", marginBottom: "40px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", fontWeight: 600, fontSize: "16px" }}>
                <span style={{ background: "#0f0f10", color: "#fff", borderRadius: "10px", height: "18px", padding: "0 8px", fontWeight: 700, fontSize: "10.5px", display: "inline-flex", alignItems: "center" }}>mon</span>
                Alternance & Talent
              </div>
              <p style={{ color: "#6F6B65", fontSize: "13px", margin: "8px 0 0 0" }}>Le moteur pour trouver plus vite votre alternance.</p>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "12px", color: "#0f0f10" }}>Ressources</div>
              <Link to="/faq" style={{ display: "block", color: "#6F6B65", fontSize: "13px", marginBottom: "8px", textDecoration: "none" }}>FAQ</Link>
              <Link to="/blog" style={{ display: "block", color: "#6F6B65", fontSize: "13px", marginBottom: "8px", textDecoration: "none" }}>Blog</Link>
              <Link to="/aide" style={{ display: "block", color: "#6F6B65", fontSize: "13px", marginBottom: "8px", textDecoration: "none" }}>Centre d'aide</Link>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "12px", color: "#0f0f10" }}>Entreprise</div>
              <Link to="/a-propos" style={{ display: "block", color: "#6F6B65", fontSize: "13px", marginBottom: "8px", textDecoration: "none" }}>À propos</Link>
              <Link to="/contact" style={{ display: "block", color: "#6F6B65", fontSize: "13px", marginBottom: "8px", textDecoration: "none" }}>Contact</Link>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "12px", color: "#0f0f10" }}>Légal</div>
              <Link to="/cgu" style={{ display: "block", color: "#6F6B65", fontSize: "13px", marginBottom: "8px", textDecoration: "none" }}>CGU</Link>
              <Link to="/confidentialite" style={{ display: "block", color: "#6F6B65", fontSize: "13px", marginBottom: "8px", textDecoration: "none" }}>Confidentialité</Link>
            </div>
          </div>
          <div style={{ borderTop: "1px solid #e5e5e5", paddingTop: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", fontSize: "13px", color: "#6F6B65" }}>
            <div>© {new Date().getFullYear()} Alternance & Talent</div>
            <div style={{ display: "flex", gap: "16px" }}>
              <a href="#" style={{ color: "#6F6B65", textDecoration: "none" }}>Twitter</a>
              <a href="#" style={{ color: "#6F6B65", textDecoration: "none" }}>LinkedIn</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
