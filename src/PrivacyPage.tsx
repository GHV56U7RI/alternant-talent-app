import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronRight as ChevronRightIcon,
  Trash2 as TrashIcon,
  Clock,
  Shield,
  AlertTriangle,
  User,
  Settings,
  HelpCircle,
  Heart,
  BarChart3,
  Cookie as CookieIcon,
  X,
} from "lucide-react";
import AuthPage from "./pages/AuthPage";

/********************* HOOK COMMUN (scroll shrink) ************************/
function useScrollShrink(threshold = 8) {
  const [shrunk, setShrunk] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
      setShrunk(scrollY > threshold);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return shrunk;
}

/********************* UTILS ************************/
function hash(str) { let h = 0; for (let i = 0; i < str.length; i++) { h = (h << 5) - h + str.charCodeAt(i); h |= 0; } return Math.abs(h); }

const VIBRANT = ["#FF3B3B", "#FF6A00", "#FFB800", "#22C55E", "#10B981", "#06B6D4", "#3B82F6", "#6366F1", "#8B5CF6", "#EC4899", "#F43F5E"];

function SquareDotLogo({ name, size = 40 }) {
  const idx = hash(name);
  const color = VIBRANT[idx % VIBRANT.length];
  const r = Math.round(size * 0.34);
  return (
    <div style={{ width: size, height: size, borderRadius: 8, border: '1px solid rgba(0,0,0,.12)', display: 'grid', placeItems: 'center', background: '#fff' }} aria-label={`Logo ${name}`}>
      <div style={{ width: r * 2, height: r * 2, borderRadius: '50%', background: color }} />
    </div>
  );
}

function fmtDateFR(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

/********************* HEADER NON-CONNECTÉ ************************/
function HeaderNotConnected({ onLoginClick }) {
  const shrunk = useScrollShrink(8);
  const pillRef = useRef(null);

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
        .brand-text::after{ content:""; position:absolute; left:-10px; right:-10px; top:-6px; bottom:-6px; border-radius:9999px; background:rgba(255,255,255,0); backdrop-filter:none; -webkit-backdrop-filter:none; transition: background .18s ease, backdrop-filter .18s ease; }
        .brand-text:hover::after{ background:rgba(255,255,255,.25); backdrop-filter: blur(8px) saturate(140%); -webkit-backdrop-filter: blur(8px) saturate(140%); }

        .header-pill{ position:fixed; top: var(--headerTop); left:50%; transform:translateX(-50%); z-index:70; color:#111;
          background:var(--headerPill);
          border:1px solid var(--headerBorder);
          border-radius:9999px; display:flex; align-items:center; gap:10px; white-space:nowrap; overflow:visible;
          backdrop-filter: blur(14px) saturate(160%); -webkit-backdrop-filter: blur(14px) saturate(160%);
          transition: padding .18s ease, gap .18s ease, top .18s ease, background .18s ease, border-color .18s ease;
          padding:10px 16px; isolation:isolate;
          box-shadow:none;
        }
        .header-pill.shrunk{ gap:6px; padding:8px 14px; }
        .header-pill::before, .header-pill::after{ display:none; }

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

/********************* HEADER CONNECTÉ ************************/
function HeaderConnected({ user, onProfileClick, onFavorisClick, onAnalyticsClick, onSettingsClick, onHelpClick, onLogout }) {
  const shrunk = useScrollShrink(8);
  const pillRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    const onClick = (e) => {
      const pill = pillRef.current;
      if (pill && !pill.contains(e.target)) setMenuOpen(false);
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
        .menu-item{ display:flex; align-items:center; gap:10px; padding:10px 12px; text-decoration:none; color:#111; font-weight:600; font-size:13px; cursor:pointer; border:none; background:transparent; width:100%; text-align:left; }
        .menu-item:hover{ background:rgba(0,0,0,.04); }
        .menu-icon{ width:16px; height:16px; opacity:.95; }

        .site-veil{ position:fixed; inset:0; z-index:60; opacity:1; background:rgba(0,0,0,.02); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); transition: opacity .18s ease; }
        .site-veil.hidden{ opacity:0; pointer-events:none; }
        .site-veil.show{ opacity:1; }

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

        <button
          id="btn-profile"
          type="button"
          className="btn-icon"
          aria-label="Profil"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <User />
        </button>

        <div className="profile-menu" aria-hidden={!menuOpen}>
          <div className={`menu-panel ${menuOpen ? "show" : "hidden"}`} role="menu" aria-labelledby="btn-profile">
            <button className="menu-item" role="menuitem" onClick={() => { setMenuOpen(false); onProfileClick(); }}>
              <User className="menu-icon" />
              <span>Profil</span>
            </button>
            <button className="menu-item" role="menuitem" onClick={() => { setMenuOpen(false); onFavorisClick(); }}>
              <Heart className="menu-icon" />
              <span>Favoris</span>
            </button>
            <button className="menu-item" role="menuitem" onClick={() => { setMenuOpen(false); onAnalyticsClick(); }}>
              <BarChart3 className="menu-icon" />
              <span>Statistiques</span>
            </button>
            <button className="menu-item" role="menuitem" onClick={() => { setMenuOpen(false); onSettingsClick(); }}>
              <Settings className="menu-icon" />
              <span>Paramètres</span>
            </button>
            <button className="menu-item" role="menuitem" onClick={() => { setMenuOpen(false); onHelpClick(); }}>
              <HelpCircle className="menu-icon" />
              <span>Aide</span>
            </button>
            <div style={{ borderTop: '1px solid rgba(0,0,0,.08)', margin: '4px 0' }} />
            <button className="menu-item" role="menuitem" onClick={() => { setMenuOpen(false); onLogout(); }}>
              <span style={{ marginLeft: '26px' }}>Déconnexion</span>
            </button>
          </div>
        </div>
      </div>

      <div className={`site-veil ${menuOpen ? "show" : "hidden"}`} onClick={() => setMenuOpen(false)} aria-hidden={!menuOpen} />

      <div className="header-offset" aria-hidden="true" />
    </>
  );
}

export default function PrivacyPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showAuthPage, setShowAuthPage] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error parsing user from localStorage:', e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  // Cookie consent
  const [cookieChoice, setCookieChoice] = useState<string>(() => {
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

  const handleAuthSuccess = (userData) => { setUser(userData); setShowAuthPage(false); };

  const LAST_UPDATED = "2025-10-05";

  if (showAuthPage) return <AuthPage onBack={() => setShowAuthPage(false)} onAuthSuccess={handleAuthSuccess} />;

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #fafafa 0%, #FFFFFF 80%)", color: "var(--text)" }}>
      <style>{`
        :root{
          --bg:#FFFFFF; --panel:#FFFFFF; --text:#0F0F10; --muted:#6F6B65;
          --border:#ECEBEA; --borderStrong:#E6E5E3; --sep:#E6E5E3;
          --pill:#f7f6f4;
        }

        /* ===== Page Content ===== */
        .wrap{ max-width:56rem; margin:0 auto; padding:64px 16px 64px; }
        h1{ font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, "Helvetica Neue", Helvetica, Arial, "Segoe UI", Roboto, sans-serif; font-size:34px; line-height:1; font-weight:800; letter-spacing:-0.01em; color:#171717; text-align:center; }
        .lede{ color:#3F3D39; opacity:.9; font-size:14px; margin-top:10px; text-align:center; }
        .meta{ display:flex; align-items:center; justify-content:center; gap:8px; color:#6F6B65; font-size:13px; margin-top:14px; text-align:center; }

        .section{ margin-top:22px; padding:18px; border:1px solid var(--border); border-radius:10px; background:var(--panel); }
        .section h2{ font-size:18px; line-height:1.3; margin:0 0 6px; }
        .section p, .section li{ color:#3F3D39; font-size:14px; }
        .section ul{ padding-left:0; margin:10px 0; }
        .section li{ margin-left:18px; }
        .align-list{ margin-left:18px; }
        .note{ background:var(--pill); border:1px solid var(--borderStrong); border-radius:8px; padding:10px 12px; color:#6F6B65; font-size:13px; }

        .inline-link{ color:#111; text-decoration:underline; text-underline-offset:2px; }
        .cta-row{ display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-top:18px; }
        .btn-ghost{ background:#fff; border:1px solid var(--border); border-radius:9999px; padding:8px 12px; font-weight:600; font-size:13px; display:inline-flex; align-items:center; gap:8px; white-space:nowrap; cursor:pointer; color:#6F6B65; text-decoration:none; }
        .btn-ghost:hover{ background:#f9f9f9; color:#3F3D39; }
        .btn-ghost:visited{ color:#6F6B65; }
        .btn-ghost svg{ color:#6F6B65; }
        .btn-ghost:hover svg{ color:#3F3D39; }

        /* ===== Cookie bar (sobre) ===== */
        .cookie-bar{ position:fixed; left:0; right:0; bottom:0; z-index:60; color:#111; background:#fff; border-top:1px solid var(--border); }
        .cookie-inner{ max-width:72rem; margin:0 auto; padding:10px 12px; display:flex; align-items:center; gap:8px; justify-content:space-between; }
        .cookie-text{ opacity:.96; font-size:12.5px; color:#3F3D39; }
        .cookie-actions{ display:flex; align-items:center; gap:8px; }
        .cookie-accept{ background:#111; color:#fff; border:0; border-radius:9999px; padding:6px 10px; font-weight:700; cursor:pointer; }
        .cookie-decline{ background:#fff; color:#111; border:1px solid var(--border); border-radius:9999px; padding:6px 10px; font-weight:700; cursor:pointer; }

        /* ===== Footer ===== */
        .footer-shell{ background:#fff; border-top:1px solid var(--border); }
        .footer-inner{ max-width:72rem; margin:0 auto; padding:24px 16px; }
        .footer-grid{ display:grid; grid-template-columns:1.5fr repeat(3,1fr); gap:24px; align-items:flex-start; }
        .footer-title{ font-weight:700; font-size:14px; color:#1F1E1B; margin-bottom:8px; }
        .footer-link{ display:block; color:#6F6B65; font-size:13px; padding:4px 0; text-decoration:none; }
        .footer-link:hover{ color:#1F1E1B; }
        .footer-brand{ display:flex; align-items:center; gap:8px; color:#1F1E1B; }
        .footer-bottom{ margin-top:16px; padding-top:12px; border-top:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; color:#6F6B65; font-size:12px; }
        .footer-bottom .footer-link{ display:inline-block; padding:0; margin-left:12px; }

        @media (min-width: 768px){
          h1{ font-size:40px; }
          .lede{ font-size:16px; }
        }

        @media (max-width: 640px){
          .wrap{ padding:16px 12px 28px; }
          .section{ padding:14px; }
          .cookie-inner{ flex-direction:column; align-items:stretch; gap:8px; }
          .footer-grid{ grid-template-columns: 1fr 1fr; gap:16px; }
          .footer-inner{ padding:16px 12px; }
          .footer-bottom{ flex-direction:column; align-items:flex-start; gap:8px; }
        }
      `}</style>

      {/* ===== Header ===== */}
      {user ? (
        <HeaderConnected
          user={user}
          onProfileClick={() => { navigate("/"); window.scrollTo(0, 0); }}
          onFavorisClick={() => { navigate("/"); window.scrollTo(0, 0); }}
          onAnalyticsClick={() => { navigate("/"); window.scrollTo(0, 0); }}
          onSettingsClick={() => { navigate("/"); window.scrollTo(0, 0); }}
          onHelpClick={() => navigate("/aide")}
          onLogout={handleLogout}
        />
      ) : (
        <HeaderNotConnected onLoginClick={() => setShowAuthPage(true)} />
      )}

      {/* ===== Content ===== */}
      <main className="wrap" id="content">
        <h1>Confidentialité</h1>
        <p className="lede">Cette politique décrit comment nous collectons, utilisons et protégeons tes données personnelles sur mon alternance talent.</p>
        <div className="meta"><Clock className="w-4 h-4"/><span>Dernière mise à jour&nbsp;: {fmtDateFR(LAST_UPDATED)}</span></div>

        <section className="section" id="principes">
          <h2>Principes & engagement</h2>
          <p>Nous nous engageons à respecter ta vie privée et à traiter tes données de façon transparente, sécurisée et conforme au RGPD.</p>
          <ul>
            <li>Nous ne collectons que les données strictement nécessaires au fonctionnement du service.</li>
            <li>Nous ne vendons jamais tes données à des tiers.</li>
            <li>Tu gardes le contrôle : tu peux accéder, rectifier ou supprimer tes données à tout moment.</li>
          </ul>
        </section>

        <section className="section" id="donnees-collectees">
          <h2>Données collectées</h2>
          <p>Selon ton utilisation du service (candidat, recruteur, visiteur), nous pouvons collecter :</p>
          <ul>
            <li><strong>Informations de compte</strong> : nom, prénom, adresse e-mail, mot de passe (haché), téléphone.</li>
            <li><strong>Profil candidat</strong> : CV, lettre de motivation, parcours académique, expériences, compétences, localisation préférée.</li>
            <li><strong>Profil recruteur</strong> : nom de l'entreprise, SIRET, secteur d'activité, offres publiées.</li>
            <li><strong>Données d'usage</strong> : connexions, recherches, candidatures envoyées, interactions avec les offres.</li>
            <li><strong>Données techniques</strong> : adresse IP, navigateur, appareil, cookies (selon tes préférences).</li>
          </ul>
        </section>

        <section className="section" id="finalites">
          <h2>Finalités du traitement</h2>
          <p>Nous utilisons tes données pour :</p>
          <ul>
            <li>Fournir et améliorer le service (matching, recommandations, notifications).</li>
            <li>Gérer ton compte, tes candidatures et tes offres.</li>
            <li>Assurer la sécurité (détection de fraude, modération).</li>
            <li>Communiquer avec toi (support, mise à jour du service, newsletters si tu as consenti).</li>
            <li>Mesurer l'audience et les performances (analytique agrégée et anonymisée).</li>
            <li>Respecter nos obligations légales (comptabilité, réponse aux autorités).</li>
          </ul>
        </section>

        <section className="section" id="bases-legales">
          <h2>Bases légales</h2>
          <ul>
            <li><strong>Exécution du contrat</strong> : nécessaire pour fournir le service demandé.</li>
            <li><strong>Consentement</strong> : pour les cookies non essentiels, newsletters, etc.</li>
            <li><strong>Intérêt légitime</strong> : amélioration du service, sécurité, analytique.</li>
            <li><strong>Obligation légale</strong> : conservation fiscale, réponse aux demandes judiciaires.</li>
          </ul>
        </section>

        <section className="section" id="partage">
          <h2>Partage & destinataires</h2>
          <p>Tes données peuvent être partagées dans les cas suivants :</p>
          <ul>
            <li><strong>Entre candidats et recruteurs</strong> : lors d'une candidature, le recruteur accède aux informations du profil partagé (CV, lettre).</li>
            <li><strong>Prestataires techniques</strong> : hébergement (UE), e-mail transactionnel, analytique (avec anonymisation si possible).</li>
            <li><strong>Autorités légales</strong> : si requis par la loi ou pour protéger nos droits.</li>
          </ul>
          <div className="note" style={{ marginTop: 10 }}>
            <Shield className="inline-block align-text-top w-4 h-4" aria-hidden />
            <span className="ml-2">Nous ne vendons ni ne louons tes données à des fins de marketing ou de monétisation par segments d'audience.</span>
          </div>
        </section>

        <section className="section" id="conservation">
          <h2>Durée de conservation</h2>
          <ul>
            <li><strong>Compte actif</strong> : tant que le compte existe et est utilisé.</li>
            <li><strong>Compte inactif</strong> : suppression automatique après 3 ans sans activité (avec notification préalable).</li>
            <li><strong>Données de candidature</strong> : conservées 2 ans après la dernière interaction, sauf demande de suppression.</li>
            <li><strong>Obligations légales</strong> : certaines données (factures, logs de sécurité) peuvent être conservées plus longtemps si la loi l'exige.</li>
          </ul>
        </section>

        <section className="section" id="securite">
          <h2>Sécurité</h2>
          <p>Nous mettons en œuvre des mesures techniques et organisationnelles pour protéger tes données :</p>
          <ul>
            <li>Chiffrement des données sensibles (HTTPS, mots de passe hachés).</li>
            <li>Contrôle d'accès strict (authentification, journalisation).</li>
            <li>Surveillance des incidents et plan de réponse.</li>
            <li>Audits réguliers et mises à jour de sécurité.</li>
          </ul>
          <div className="note" style={{ marginTop: 10 }}>
            <AlertTriangle className="inline-block align-text-top w-4 h-4" aria-hidden />
            <span className="ml-2">Aucun système n'est totalement infaillible. En cas de violation de données, nous t'informerons dans les délais légaux.</span>
          </div>
        </section>

        <section className="section" id="droits">
          <h2>Tes droits (RGPD)</h2>
          <p>Tu disposes des droits suivants :</p>
          <ul>
            <li><strong>Accès</strong> : obtenir une copie de tes données.</li>
            <li><strong>Rectification</strong> : corriger des données inexactes.</li>
            <li><strong>Effacement</strong> : demander la suppression de tes données (sous réserve d'obligations légales).</li>
            <li><strong>Portabilité</strong> : récupérer tes données dans un format structuré.</li>
            <li><strong>Opposition</strong> : t'opposer à certains traitements (marketing, profilage).</li>
            <li><strong>Limitation</strong> : demander la limitation temporaire du traitement.</li>
            <li><strong>Retrait du consentement</strong> : pour les traitements basés sur le consentement (cookies, newsletter).</li>
          </ul>
          <div className="cta-row">
            <Link className="btn-ghost" to="/contact">Exercer un droit <ChevronRightIcon className="w-4 h-4"/></Link>
            <button className="btn-ghost">Demander la suppression <TrashIcon className="w-4 h-4"/></button>
          </div>
        </section>

        <section className="section" id="cookies">
          <h2>Cookies & traceurs</h2>
          <p>Nous utilisons des cookies pour améliorer ton expérience :</p>
          <ul>
            <li><strong>Cookies essentiels</strong> : authentification, préférences (pas de consentement requis).</li>
            <li><strong>Cookies d'analyse</strong> : mesure d'audience (avec consentement).</li>
            <li><strong>Cookies de personnalisation</strong> : recommandations, sauvegarde de recherches (avec consentement).</li>
          </ul>
          <p>Tu peux gérer tes préférences à tout moment via ton navigateur ou notre interface.</p>
        </section>

        <section className="section" id="mineurs">
          <h2>Mineurs</h2>
          <p>Le service est accessible aux personnes de 16 ans et plus (âge minimum légal pour consentir au traitement de données en France). Si tu as moins de 16 ans, demande l'autorisation de tes parents avant de créer un compte.</p>
        </section>

        <section className="section" id="modifications">
          <h2>Modifications de la politique</h2>
          <p>Nous pouvons mettre à jour cette politique pour refléter des évolutions du service ou des obligations légales. En cas de changement significatif, nous t'informerons par e-mail ou via une notification sur le site.</p>
        </section>

        <section className="section" id="contact">
          <h2>Contact & réclamation</h2>
          <p>Pour toute question sur cette politique ou pour exercer tes droits :</p>
          <ul>
            <li>Email : <a className="inline-link" href="mailto:confidentialite@monalternancetalent.com">confidentialite@monalternancetalent.com</a></li>
            <li>Formulaire : <Link className="inline-link" to="/contact">Page contact</Link></li>
          </ul>
          <p>Tu peux également déposer une réclamation auprès de la CNIL (autorité française de protection des données) si tu estimes que tes droits ne sont pas respectés.</p>
          <div className="cta-row">
            <a className="btn-ghost" href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">Contacter la CNIL <ChevronRightIcon className="w-4 h-4"/></a>
          </div>
        </section>
      </main>

      {/* ===== Cookie banner ===== */}
      {cookieChoice === "" && (
        <div className="cookie-bar" role="region" aria-label="Bannière cookies">
          <div className="cookie-inner">
            <span className="cookie-text">🍪 Cookies minimaux pour faire fonctionner le site et mesurer l'usage en agrégé.</span>
            <div className="cookie-actions">
              <button className="cookie-accept" onClick={acceptCookies}>Accepter</button>
              <button className="cookie-decline" onClick={declineCookies}>Refuser</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Footer ===== */}
      <footer className="footer-shell" role="contentinfo">
        <div className="footer-inner">
          <div className="footer-grid">
            <div className="footer-brand">
              <SquareDotLogo name="A&T" size={24} />
              <span className="font-medium">Alternance & Talent</span>
            </div>
            <div>
              <div className="footer-title">Produit</div>
              <Link className="footer-link" to="/">Rechercher</Link>
              <Link className="footer-link" to="/">Offres</Link>
              <a className="footer-link" href="#">Favoris</a>
            </div>
            <div>
              <div className="footer-title">Entreprise</div>
              <Link className="footer-link" to="/a-propos">À propos</Link>
              <Link className="footer-link" to="/contact">Contact</Link>
            </div>
            <div>
              <div className="footer-title">Légal</div>
              <Link className="footer-link" to="/cgu">CGU</Link>
              <Link className="footer-link" to="/confidentialite">Confidentialité</Link>
            </div>
          </div>
          <div className="footer-bottom">
            <div>© {new Date().getFullYear()} Alternance & Talent</div>
            <div>
              <a className="footer-link" href="#">Twitter</a>
              <a className="footer-link" href="#">LinkedIn</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
