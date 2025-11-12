import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ChevronUp,
  User,
  Settings,
  HelpCircle,
  Heart,
  BarChart3,
  Cookie as CookieIcon,
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

/********************* CTA JOIN ************************/
function CTAJoin() {
  const navigate = useNavigate();

  return (
    <section id="cta" style={{ paddingTop: '2rem', paddingBottom: '4rem' }} data-testid="cta-section">
      <div style={{ maxWidth: '52ch', margin: '0 auto' }}>
        <div style={{
          position: 'relative',
          borderRadius: '28px',
          background: 'linear-gradient(to right, #60a5fa, #3b82f6, #2563eb)',
          padding: '0.125rem',
          boxShadow: '0 10px 30px rgba(59,130,246,.35)'
        }}>
          <div style={{
            borderRadius: '28px',
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            padding: '1.5rem 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ textAlign: 'left', color: 'white' }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                letterSpacing: '-0.025em',
                margin: 0
              }}>
                Rejoignez Mon alternance talent aujourd&apos;hui
              </h3>
              <p style={{
                color: 'rgba(255,255,255,0.8)',
                fontSize: '0.75rem',
                marginTop: '0.125rem',
                marginBottom: 0
              }}>
                Inscrivez-vous et trouvez votre alternance
              </p>
            </div>
            <button
              onClick={() => navigate("/")}
              style={{
                marginLeft: '1.5rem',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '9999px',
                border: '1px solid rgba(255,255,255,0.7)',
                padding: '0.5rem 1.25rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: 'white',
                background: 'transparent',
                cursor: 'pointer',
                transition: 'background 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              Choisir
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// Page À propos avec header et footer
export default function AboutPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showAuthPage, setShowAuthPage] = useState(false);
  const [showMore, setShowMore] = useState(false);

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

  if (showAuthPage) return <AuthPage onBack={() => setShowAuthPage(false)} onAuthSuccess={handleAuthSuccess} />;

  return (
    <div className="min-h-screen" style={{ background: "#FFFFFF", color: "var(--text)" }}>
      <style>{`
        :root{
          --bg:#FFFFFF; --panel:#FFFFFF; --text:#0F0F10; --muted:#6F6B65;
          --border:#ECEBEA; --borderStrong:#E6E5E3; --sep:#E6E5E3;
          --pill:#f7f6f4;
        }

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

        @media (max-width: 640px){
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
      <div style={{ minHeight: '100vh', background: 'white', color: '#171717', textAlign: 'center', padding: '4rem 1.5rem' }}>
        {/* Hero */}
        <section style={{ maxWidth: '48rem', margin: '0 auto 4rem' }}>
          <h1 style={{ fontSize: '2.25rem', fontWeight: '600', letterSpacing: '-0.025em', lineHeight: '1.1' }}>
            L'alternance, enfin simple et précise.
          </h1>
          <p style={{ maxWidth: '60ch', margin: '1.25rem auto 0', fontSize: '15px', lineHeight: '1.6', color: 'rgba(0,0,0,0.7)' }}>
            Mon alternance talent met en avant des opportunités fiables et claires, juste l'essentiel, au bon moment.
          </p>
          <div style={{ marginTop: '2rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
            <a
              href="#offres"
              onClick={(e) => { e.preventDefault(); navigate("/"); }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1.25rem',
                color: 'white',
                fontWeight: '600',
                fontSize: '0.875rem',
                borderRadius: '9999px',
                textDecoration: 'none',
                cursor: 'pointer',
                userSelect: 'none',
                background: "linear-gradient(180deg, #2e6ffa 0%, #2663eb 70%)",
                border: "1px solid #1f4fd1",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,.35), 0 6px 16px rgba(38,99,235,.28)",
                transition: "transform .08s ease, box-shadow .2s ease, filter .2s ease",
              }}
            >
              Voir les offres
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
                style={{ marginLeft: '0.25rem' }}
              >
                <path
                  d="M10 6l6 6-6 6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M4 12h11"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
            </a>
          </div>
        </section>

        {/* Corps du texte avec texte masqué et flèche plus proche */}
        <section style={{ maxWidth: '48rem', margin: '0 auto', fontSize: '16px', lineHeight: '1.6', color: 'rgba(0,0,0,0.8)', position: 'relative' }}>
          <div
            style={{
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 700ms ease-in-out',
              maxHeight: showMore ? '3000px' : '260px'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <p>
                Tout commence simplement. Dès la première visite, on comprend tout de suite où aller, quoi faire, et comment avancer. L'expérience est claire, naturelle, sans détour.
              </p>
              <p>
                Puis vient la rapidité : les offres apparaissent au bon moment, comme si elles vous attendaient déjà. Vous n'avez plus à chercher longtemps, tout semble fluide, pensé pour votre rythme.
              </p>
              <p>
                Au fil du temps, Mon alternance talent apprend à cerner ce qui vous correspond. Des alertes précises, jamais trop tôt ni trop tard, qui tombent juste quand il faut. Chaque notification devient une vraie opportunité.
              </p>
              <p>
                Et derrière chaque action, la discrétion. Vos choix vous appartiennent. Vos données ne circulent pas, elles restent là, à leur place, entre de bonnes mains.
              </p>
              <p>
                Cette vision, c'est celle d'un outil qui s'efface pour vous laisser avancer. Un compagnon invisible qui simplifie vos démarches et vous fait gagner du temps. Ici, pas de surcharge, pas de distraction : seulement ce qui compte.
              </p>
              <p>
                L'approche est différente. Pas de bruit inutile, pas de doublons. Les informations sont nettes, à jour, fiables. Tout est pensé pour aller à l'essentiel et vous aider à saisir les vraies opportunités.
              </p>
              <p>
                Pourquoi Mon alternance talent ? Parce que c'est un espace de confiance. Chaque offre est repérée avec soin, triée avec attention, et présentée avec simplicité. Rien de superflu, juste ce dont vous avez besoin pour avancer sereinement.
              </p>
              <p>
                Derrière tout cela, il y a une promesse : vous faire gagner du temps sans jamais perdre votre liberté. Vous donner accès à ce qui est fiable, clair et pertinent. Et vous accompagner, sans bruit, vers la bonne opportunité.
              </p>
            </div>
            {!showMore && (
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '100%',
                height: '6rem',
                background: 'linear-gradient(to top, white, rgba(255,255,255,0.8), transparent)'
              }}></div>
            )}
          </div>

          {/* Bouton plus proche du texte */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
            <button
              type="button"
              onClick={() => setShowMore(!showMore)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#2563eb',
                fontWeight: '500',
                transition: 'all 0.2s',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#1e40af'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#2563eb'}
            >
              {showMore ? (
                <>
                  <ChevronUp style={{ width: '1.25rem', height: '1.25rem' }} /> Masquer
                </>
              ) : (
                <>
                  <ChevronDown style={{ width: '1.25rem', height: '1.25rem' }} /> Lire la suite
                </>
              )}
            </button>
          </div>
        </section>

        {/* Nouveau CTA bleu */}
        <CTAJoin />
      </div>

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
