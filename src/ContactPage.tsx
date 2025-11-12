import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Send,
  User,
  Settings,
  HelpCircle,
  Heart,
  BarChart3,
  CheckCircle2,
  AlertCircle,
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
          --siteBg: linear-gradient(180deg, #fafafa 0%, #FFFFFF 70%);
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
          --siteBg: linear-gradient(180deg, #fafafa 0%, #FFFFFF 70%);
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

export default function ContactPage() {
  const navigate = useNavigate();
  const [showAuthPage, setShowAuthPage] = useState(false);

  // User state (check localStorage)
  const [user, setUser] = useState(null);
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try { setUser(JSON.parse(storedUser)); } catch { localStorage.removeItem('user'); }
    }
  }, []);

  // Cookies (réutilisé)
  const [cookieChoice, setCookieChoice] = useState(() => {
    try { return localStorage.getItem("cookieConsent") || ""; } catch { return ""; }
  });
  const acceptCookies = () => { try { localStorage.setItem("cookieConsent", "accepted"); } catch {} setCookieChoice("accepted"); };
  const declineCookies = () => { try { localStorage.setItem("cookieConsent", "declined"); } catch {} setCookieChoice("declined"); };

  // Role fixe
  const [role] = useState<"etudiant" | "recruteur">("etudiant");

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [agree, setAgree] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showValidationError, setShowValidationError] = useState(false);

  // Valeurs sujet par rôle
  const defaultStudent = "Question candidature / CV";
  const defaultRecruiter = "Publier une offre / Devenir partenaire";

  // Pré-fill sujet
  useEffect(() => {
    if (!subject) setSubject(defaultStudent);
  }, []);

  // Validation simple
  const problems = useMemo(() => {
    const errs: string[] = [];
    if (!name.trim()) errs.push("Le nom est requis");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.push("Email invalide");
    if (!subject.trim()) errs.push("Objet requis");
    if (message.trim().length < 10) errs.push("Message trop court (min. 10 caractères)");
    if (!agree) errs.push("Veuillez accepter la politique de confidentialité");
    return errs;
  }, [name, email, subject, message, agree]);

  const canSubmit = problems.length === 0 && !submitting;

  // Masquer le message de validation quand le formulaire devient valide
  useEffect(() => {
    if (canSubmit && showValidationError) {
      setShowValidationError(false);
    }
  }, [canSubmit, showValidationError]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!canSubmit) {
      setShowValidationError(true);
      return;
    }
    setShowValidationError(false);
    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role, name, email, phone, subject, message }),
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      setSuccess(true);
      setName(""); setEmail(""); setPhone(""); setSubject(defaultStudent);
      setMessage(""); setAgree(false);
    } catch {
      setError("Impossible d'envoyer le message. Réessaie dans un instant.");
    } finally { setSubmitting(false); }
  }

  const handleLogout = () => { localStorage.removeItem('user'); setUser(null); };
  const handleAuthSuccess = (userData) => { setUser(userData); setShowAuthPage(false); };

  if (showAuthPage) return <AuthPage onBack={() => setShowAuthPage(false)} onAuthSuccess={handleAuthSuccess} />;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Styles */}
      <style>{`
        :root{
          --bg:#FFFFFF; --panel:#FFFFFF; --text:#0F0F10; --muted:#6F6B65; --sep:#E6E5E3;
          --flowCream:#fafafa;
          --font-sans: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
          --blue:#2663eb;
          --blueDark:#1f4fd1;
        }
        html, body { font-family: var(--font-sans); -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; text-rendering: optimizeLegibility; margin:0; background: linear-gradient(180deg, #fafafa 0%, #FFFFFF 80%); }

        .container{ max-width:72rem; margin:0 auto; padding:0 16px; }
        .card{ background:transparent; border:0; border-radius:0; }
        .hr{ height:1px; background:var(--sep); }

        /* CTA pill */
        .cta-wrap{ display:flex; flex-direction:column; align-items:center; justify-content:center; margin-bottom:48px; gap:12px; }
        .form-notice{
          font-size:12px;
          color:#6F6B65;
          text-align:center;
          display:flex;
          align-items:center;
          gap:6px;
          animation: fadeInUp 0.5s ease-out;
          opacity:0;
          animation-fill-mode: forwards;
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .cta-pill{
          display:inline-flex; align-items:center; justify-content:center; gap:6px;
          padding:10px 16px; border-radius:9999px; text-decoration:none; user-select:none;
          font-weight:600; letter-spacing:.2px; line-height:1; color:#fff; cursor:pointer;
          appearance:none; -webkit-appearance:none; border:0;
          background: linear-gradient(180deg, #2e6ffa 0%, var(--blue) 70%);
          border:1px solid var(--blueDark);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.35), 0 6px 16px rgba(38,99,235,.28);
          transition: transform .08s ease, box-shadow .2s ease, filter .2s ease;
        }
        .cta-pill:hover{ transform: translateY(-1px); box-shadow: inset 0 1.5px 0 rgba(255,255,255,.45), 0 10px 24px rgba(38,99,235,.34); filter:saturate(1.05); }
        .cta-pill:active{ transform: translateY(0); box-shadow: inset 0 2px 6px rgba(0,0,0,.18), 0 6px 14px rgba(38,99,235,.25); }
        .cta-pill:focus-visible{ outline: 3px solid rgba(38,99,235,.45); outline-offset: 3px; }
        .cta-pill svg{ vertical-align:middle; margin-left:4px; }
        .cta-pill[disabled]{ opacity:1; filter:none; cursor:not-allowed; pointer-events:none; transform:none; box-shadow: inset 0 1px 0 rgba(255,255,255,.35), 0 6px 16px rgba(38,99,235,.28); }
        .cta-wrap{ display:flex; flex-direction:column; align-items:center; justify-content:center; margin-bottom:48px; gap:12px; }
        .form-notice{
          font-size:12px;
          color:#6F6B65;
          text-align:center;
          display:flex;
          align-items:center;
          gap:6px;
          animation: fadeInUp 0.5s ease-out;
          opacity:0;
          animation-fill-mode: forwards;
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Hero */
        .flow-hero{ position:relative; padding:56px 0 28px; }
        .flow-hero .bg-bleed{ position:absolute; inset:0; left:50%; width:100vw; transform:translateX(-50%); background:linear-gradient(180deg,var(--flowCream) 0%, #FFFFFF 80%); z-index:0; }
        .flow-wrap{ position:relative; z-index:1; max-width:56rem; margin:0 auto; text-align:center; padding:0 16px; }

        /* Page title */
        .page-title{ margin:0; padding:0; font-family: var(--font-sans); font-weight: 700; font-size: 34px; line-height:1.15; letter-spacing: -0.01em; text-align:center; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; text-rendering: optimizeLegibility; }
        @media (min-width:768px){ .page-title{ font-size: 40px; letter-spacing:-0.012em; } }

        /* Form */
        .form-grid{ display:grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap:16px; }
        .col-6{ grid-column: span 6 / span 6; }
        .col-12{ grid-column: span 12 / span 12; }
        .label{ font-size:13px; color:#3F3D39; font-weight:700; margin-bottom:8px; display:block; }
        .input{ width:100%; box-sizing: border-box; background:#fff; border:1px solid var(--sep); border-radius:12px; padding:12px 14px; font-size:14px; color:var(--text); }
        .textarea{ min-height:140px; resize:vertical; display:block; }
        .help{ font-size:12.5px; color:#6F6B65; }
        .error{ color:#B3261E; display:flex; align-items:center; gap:8px; font-size:13px; }
        .success-banner{ display:flex; align-items:flex-start; gap:10px; background:#F0FDF4; border:0; color:#14532D; border-radius:10px; padding:12px; }

        /* Consent */
        .consent-row{ display:flex; align-items:flex-start; gap:8px; }
        .consent-row input[type="checkbox"]{ margin-top: 4px; }
        .consent-label{ white-space: nowrap; display:inline-flex; align-items:center; gap:4px; flex:1; }
        .consent-label .footer-link{ display:inline; padding:0; margin:0 2px; text-decoration:underline; }

        /* Cookie */
        .cookie-bar{ position:fixed; left:0; right:0; bottom:0; z-index:60; color:#fff; background:rgba(17,17,17,.78); backdrop-filter:saturate(120%) blur(4px); -webkit-backdrop-filter:saturate(120%) blur(4px); border:0; box-shadow:0 -6px 18px rgba(0,0,0,.18); }
        .cookie-inner{ max-width:72rem; margin:0 auto; padding:8px 12px; display:flex; align-items:center; gap:8px; justify-content:space-between; }
        .cookie-text{ opacity:.96; font-size:12.5px; }
        .cookie-actions{ display:flex; align-items:center; gap:8px; }
        .cookie-accept{ background:#fff; color:#111; border:0; border-radius:9999px; padding:6px 10px; font-weight:700; cursor:pointer; }
        .cookie-decline{ background:transparent; color:#fff; border:0; padding:6px 8px; text-decoration:underline; cursor:pointer; }

        /* Footer */
        .footer-shell{ background:#fff; border-top:1px solid var(--sep); }
        .footer-inner{ max-width:72rem; margin:0 auto; padding:24px 16px; }
        .footer-grid{ display:grid; grid-template-columns:1.5fr repeat(3,1fr); gap:24px; align-items:flex-start; }
        .footer-title{ font-weight:700; font-size:14px; color:#1F1E1B; margin-bottom:8px; }
        .footer-link{ display:block; color:#6F6B65; font-size:13px; padding:4px 0; text-decoration:none; }
        .footer-link:hover{ color:#1F1E1B; }
        .footer-brand{ display:flex; align-items:center; gap:8px; color:#1F1E1B; }
        .footer-bottom{ margin-top:16px; padding-top:12px; border-top:1px solid var(--sep); display:flex; justify-content:space-between; align-items:center; color:#6F6B65; font-size:12px; }
        .footer-bottom .footer-link{ display:inline-block; padding:0; margin-left:12px; }

        /* Mobile */
        @media (max-width: 640px){
          .container{ max-width:none; width:100vw; margin:0; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }
          .flow-hero{ padding:28px 0 10px; }
          .flow-wrap{ max-width:none; padding: 0 16px; }
          .page-title{ font-size:36px; }
          .form-grid{ grid-template-columns: repeat(6, minmax(0, 1fr)); gap:14px; }
          .col-6{ grid-column: 1 / -1; }
          .col-12{ grid-column: 1 / -1; }
          .label{ font-size:13.5px; margin-bottom:6px; }
          .input{ font-size:16px; padding:12px 14px; }
          .help{ font-size:12px; }
          #message + .help{ text-align:right; }
          .consent-row{ align-items:flex-start; }
          .consent-label{ white-space: normal !important; display:block; line-height:1.45; }
          .form-card{ margin-top: 6px; border-radius:0; padding-left: 16px !important; padding-right: 16px !important; }
          .cookie-inner{ flex-direction:column; align-items:stretch; gap:8px; }
          .cookie-actions{ justify-content:flex-end; }
          .footer-grid{ grid-template-columns: 1fr 1fr; gap:16px; }
          .footer-inner{ padding:16px 12px; }
          .footer-bottom{ flex-direction:column; align-items:flex-start; gap:8px; }
        }
      `}</style>

      {/* Header */}
      {user ? (
        <HeaderConnected
          user={user}
          onProfileClick={() => navigate("/")}
          onFavorisClick={() => navigate("/")}
          onAnalyticsClick={() => navigate("/")}
          onSettingsClick={() => navigate("/")}
          onHelpClick={() => navigate("/")}
          onLogout={handleLogout}
        />
      ) : (
        <HeaderNotConnected onLoginClick={() => setShowAuthPage(true)} />
      )}

      {/* HERO avec titre centré */}
      <section className="container mt-0">
        <div data-testid="contact-hero" className="flow-hero">
          <div className="bg-bleed" aria-hidden />
          <div className="flow-wrap">
            <h1 className="page-title">Contact</h1>
          </div>
        </div>
      </section>

      <div className="container my-4"><div className="hr" /></div>

      {/* Contenu */}
      <main className="container pb-12">
        <section className="card form-card" style={{ padding: 16 }}>
          <form onSubmit={onSubmit} noValidate>
            {success && (
              <div className="success-banner" role="status" aria-live="polite">
                <CheckCircle2 className="w-5 h-5" />
                <div>
                  <div className="font-semibold">Message envoyé 🎉</div>
                  <div className="help">Merci ! Nous te revenons rapidement par email.</div>
                </div>
              </div>
            )}

            {!success && problems.length > 0 && (
              <div className="card" style={{ padding: 12, borderColor: "#FEE2E2", background: "#FEF2F2", marginBottom: 12 }}>
                <div className="error"><AlertCircle className="w-4 h-4" /><span>Vérifie les champs ci‑dessous :</span></div>
                <ul style={{ marginTop: 6, paddingLeft: 18, color: "#7F1D1D", fontSize: 13 }}>{problems.map((p, i) => (<li key={i}>{p}</li>))}</ul>
              </div>
            )}

            <div className="form-grid" data-testid="mobile-stack">
              <div className="col-6">
                <label className="label" htmlFor="name">Nom complet</label>
                <input id="name" className="input" placeholder="Prénom Nom" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="col-6">
                <label className="label" htmlFor="email">Email</label>
                <input id="email" className="input" type="email" placeholder="nom@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="col-6">
                <label className="label" htmlFor="phone">Téléphone <span className="help">(optionnel)</span></label>
                <input id="phone" className="input" placeholder="06 12 34 56 78" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="col-6">
                <label className="label" htmlFor="subject">Objet</label>
                <select id="subject" className="input" value={subject} onChange={(e) => setSubject(e.target.value)} required>
                  <option>{defaultStudent}</option>
                  <option>Problème technique</option>
                  <option>{defaultRecruiter}</option>
                  <option>Demande de démo</option>
                  <option>Autre</option>
                </select>
              </div>
              <div className="col-12">
                <label className="label" htmlFor="message">Message</label>
                <textarea id="message" className="input textarea" placeholder={role === "etudiant" ? "Explique ta question sur l'alternance, ton CV, l'offre…" : "Dis‑nous ce dont tu as besoin (publication d'offre, intégration ATS, partenariat)…"} value={message} onChange={(e) => setMessage(e.target.value)} />
                <div className="help" style={{ marginTop: 6 }}>{message.length}/2000</div>
              </div>

              <div className="col-12 consent-row">
                <input id="agree" type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
                <label htmlFor="agree" className="help consent-label">J'accepte la <Link className="footer-link" to="/confidentialite">politique de confidentialité</Link> et le traitement de mes données pour ce contact.</label>
              </div>
            </div>

            <div className="hr" style={{ margin: "16px 0" }} />

            <div className="cta-wrap">
              <button className="cta-pill" type="submit" aria-label="Envoyer le message">
                {submitting ? "Envoi…" : "Envoyer"}
                <Send size={18} aria-hidden="true" focusable="false" />
              </button>
              {showValidationError && (
                <p className="form-notice">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                  Pour envoyer votre message, merci de remplir l'ensemble des informations
                </p>
              )}
            </div>

            {error && <div style={{ marginTop: 24 }} className="error"><AlertCircle className="w-4 h-4" /> {error}</div>}
          </form>
        </section>
      </main>

      {/* Cookies */}
      {cookieChoice === "" && (
        <div className="cookie-bar" role="region" aria-label="Bannière cookies">
          <div className="cookie-inner">
            <div className="cookie-text">Nous utilisons des cookies pour améliorer votre expérience.</div>
            <div className="cookie-actions">
              <button className="cookie-decline" onClick={declineCookies}>Refuser</button>
              <button className="cookie-accept" onClick={acceptCookies}>Accepter</button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="footer-shell">
        <div className="footer-inner">
          <div className="footer-grid">
            <div>
              <div className="footer-brand"><SquareDotLogo name="A&T" size={24}/> Alternance & Talent</div>
              <p style={{ color:'#6F6B65', fontSize:13, marginTop:8 }}>Le moteur pour trouver plus vite votre alternance.</p>
            </div>
            <div>
              <div className="footer-title">Ressources</div>
              <Link className="footer-link" to="/faq">FAQ</Link>
              <a className="footer-link" href="#">Blog</a>
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

// ——— TESTS ———
export function __runTests(){
  const results: Array<[string, boolean]> = [];
  const label = document.querySelector('.consent-label');
  const hero = document.querySelector('[data-testid="contact-hero"]');
  const title = document.querySelector('.page-title');
  const styleText = Array.from(document.querySelectorAll('style')).map(s=>s.textContent||'').join('\n');

  results.push(["Consent label présent", !!label]);
  results.push(["Hero présent", !!hero]);
  results.push(["Titre Contact présent", !!title && /Contact/.test(title.textContent||"")]);
  results.push(["CSS .page-title avec -apple-system", /\.page-title\{[\s\S]*font-family:[^;]*-apple-system/i.test(styleText)]);
  results.push(["CTA .cta-pill présent", /\.cta-pill\{[\s\S]*background:\s*linear-gradient\(180deg,\s*#2e6ffa 0%,\s*var\(--blue\)\s*70%\)/i.test(styleText)]);
  results.push(["CTA hover translateY(-1px)", /\.cta-pill:hover\{[\s\S]*transform:\s*translateY\(-1px\)/i.test(styleText)]);
  results.push(["Container desktop défini", /\.container\{[\s\S]*max-width:\s*72rem/i.test(styleText)]);

  console.table(results.map(([t, ok])=>({test:t, ok})));
  return results.every(([,ok])=>ok);
}
