import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  MapPin,
  BriefcaseBusiness,
  Heart,
  Building2,
  Share2,
  ChevronRight,
  Calendar,
  User,
  Settings,
  HelpCircle,
} from "lucide-react";
import AuthPage from "./pages/AuthPage";

/********************* HOOK COMMUN (scroll shrink) ************************/
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

/********************* HEADER NON-CONNECTÉ ************************/
function HeaderNotConnected({ onLoginClick }) {
  const shrunk = useScrollShrink(8);

  return (
    <>
      <style>{`
        :root{
          --bg:#FFFFFF; --panel:#FFFFFF; --text:#0F0F10; --muted:#6F6B65;
          --border:#ECEBEA; --borderStrong:#E6E5E3; --sep:#E6E5E3;
          --pill:#f7f6f4; --link:#1F2937; --linkHover:#0B1220;
          --headerPill:rgba(192,192,192,.84);
          --flowCream:#F5F5F5;
        }
        .header-shell{ position:static; background:transparent; border:0; box-shadow:none; }
        .header-inner{ max-width:72rem; margin:0 auto; display:flex; align-items:center; justify-content:center; padding:0; }

        .brand-badge{ display:inline-flex; align-items:center; justify-content:center; background:#0f0f10; color:#fff; border-radius:10px; height:18px; padding:0 8px; font-weight:700; font-size:10.5px; letter-spacing:.04em; line-height:1; }
        .brand-sep{ width:1px; height:16px; background:rgba(255,255,255,.35); margin:0 8px; display:inline-block; vertical-align:middle; transition:opacity .18s ease, transform .18s ease; }
        .header-pill.shrunk .brand-sep{ opacity:1 !important; transform:none !important; width:1px !important; margin:0 8px !important; }

        .brand-text{ display:inline-block; font-weight:400; font-size:13px; letter-spacing:.01em; color:#FFFFFF; white-space:nowrap; overflow:hidden; max-width:220px; opacity:1; transform:translateY(0) scale(1); transition: opacity .18s ease, transform .18s ease, max-width .22s ease, margin .18s ease; }
        .brand-text.hidden{ opacity:0; transform:translateY(-1px) scale(.97); max-width:0; margin:0; }

        .header-pill{ position:fixed; top:8px; left:50%; transform:translateX(-50%); z-index:70; color:#FFFFFF;
          background:var(--headerPill); border:1px solid rgba(180,180,180,.9);
          border-radius:9999px; display:flex; align-items:center; gap:10px; white-space:nowrap; overflow:visible;
          backdrop-filter:saturate(180%) blur(8px); -webkit-backdrop-filter:saturate(180%) blur(8px);
          transition: padding .18s ease, gap .18s ease, box-shadow .18s ease;
          padding:6px 12px; isolation:isolate;
          box-shadow: 0 12px 32px rgba(0,0,0,.18), 0 2px 10px rgba(0,0,0,.10), inset 0 1px rgba(255,255,255,.08), inset 0 -1px rgba(255,255,255,.04);
        }
        .header-pill.shrunk{ gap:6px; padding:4px 10px; }
        .header-pill::before{ content:""; position:absolute; inset:0; border-radius:inherit; pointer-events:none;
          background:linear-gradient(180deg, rgba(255,255,255,.08) 0%, rgba(255,255,255,.02) 60%, rgba(255,255,255,0) 100%);
          opacity:1;
        }
        .header-pill::after{ content:""; position:absolute; inset:1px; border-radius:calc(9999px - 1px); pointer-events:none;
          background:radial-gradient(120% 90% at 50% -10%, rgba(255,255,255,.25) 0%, rgba(255,255,255,0) 60%);
          opacity:.9;
        }

        .btn-login{ display:inline-flex; align-items:center; justify-content:center; background:rgba(255,255,255,.95); color:#667eea; font-weight:600; font-size:13px; border:1px solid rgba(255,255,255,.3); border-radius:9999px; padding:6px 16px; cursor:pointer; transition: all .18s ease; }
        .btn-login:hover{ background:#fff; box-shadow: 0 4px 12px rgba(102,126,234,.25); }
      `}</style>

      <header className="header-shell" role="banner">
        <div className="header-inner" />
      </header>

      <div className={`header-pill ${shrunk ? "shrunk" : ""}`}>
        <span className="brand-badge">mon</span>
        <span className="brand-sep" aria-hidden></span>
        <span className={`brand-text ${shrunk ? "hidden" : ""}`}>alternance & talent</span>

        <button
          type="button"
          className="btn-login"
          onClick={onLoginClick}
        >
          Se connecter
        </button>
      </div>
    </>
  );
}

/********************* HEADER CONNECTÉ ************************/
function HeaderConnected({ user, onProfileClick, onFavorisClick, onSettingsClick, onHelpClick, onLogout }) {
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
          --headerPill:rgba(192,192,192,.84);
          --flowCream:#F5F5F5;
        }
        .header-shell{ position:static; background:transparent; border:0; box-shadow:none; }
        .header-inner{ max-width:72rem; margin:0 auto; display:flex; align-items:center; justify-content:center; padding:0; }

        .brand-badge{ display:inline-flex; align-items:center; justify-content:center; background:#0f0f10; color:#fff; border-radius:10px; height:18px; padding:0 8px; font-weight:700; font-size:10.5px; letter-spacing:.04em; line-height:1; }
        .brand-sep{ width:1px; height:16px; background:rgba(255,255,255,.35); margin:0 8px; display:inline-block; vertical-align:middle; transition:opacity .18s ease, transform .18s ease; }
        .header-pill.shrunk .brand-sep{ opacity:1 !important; transform:none !important; width:1px !important; margin:0 8px !important; }

        .brand-text{ display:inline-block; font-weight:400; font-size:13px; letter-spacing:.01em; color:#FFFFFF; white-space:nowrap; overflow:hidden; max-width:220px; opacity:1; transform:translateY(0) scale(1); transition: opacity .18s ease, transform .18s ease, max-width .22s ease, margin .18s ease; }
        .brand-text.hidden{ opacity:0; transform:translateY(-1px) scale(.97); max-width:0; margin:0; }

        .header-pill{ position:fixed; top:8px; left:50%; transform:translateX(-50%); z-index:70; color:#FFFFFF;
          background:var(--headerPill); border:1px solid rgba(180,180,180,.9);
          border-radius:9999px; display:flex; align-items:center; gap:10px; white-space:nowrap; overflow:visible;
          backdrop-filter:saturate(180%) blur(8px); -webkit-backdrop-filter:saturate(180%) blur(8px);
          transition: padding .18s ease, gap .18s ease, box-shadow .18s ease;
          padding:6px 12px; isolation:isolate;
          box-shadow: 0 12px 32px rgba(0,0,0,.18), 0 2px 10px rgba(0,0,0,.10), inset 0 1px rgba(255,255,255,.08), inset 0 -1px rgba(255,255,255,.04);
        }
        .header-pill.shrunk{ gap:6px; padding:4px 10px; }
        .header-pill::before{ content:""; position:absolute; inset:0; border-radius:inherit; pointer-events:none;
          background:linear-gradient(180deg, rgba(255,255,255,.08) 0%, rgba(255,255,255,.02) 60%, rgba(255,255,255,0) 100%);
          opacity:1;
        }
        .header-pill::after{ content:""; position:absolute; inset:1px; border-radius:calc(9999px - 1px); pointer-events:none;
          background:radial-gradient(120% 90% at 50% -10%, rgba(255,255,255,.25) 0%, rgba(255,255,255,0) 60%);
          opacity:.9;
        }

        .btn-icon{ width:32px; height:32px; display:inline-flex; align-items:center; justify-content:center; border-radius:9999px; background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.22); color:#FFFFFF; cursor:pointer; }
        .btn-icon:hover{ background:rgba(255,255,255,.14); }
        .btn-icon svg{ width:18px; height:18px; display:block; }

        .profile-menu{ position:absolute; top:100%; right:0; margin-top:8px; width:220px; }
        .menu-panel{ position:relative; background:var(--headerPill); border:1px solid rgba(180,180,180,.9); border-radius:12px;
          box-shadow: 0 8px 24px rgba(0,0,0,.18), 0 2px 8px rgba(0,0,0,.10), inset 0 1px rgba(255,255,255,.08), inset 0 -1px rgba(255,255,255,.04);
          overflow:hidden; transform-origin:top right; backdrop-filter:saturate(180%) blur(8px); -webkit-backdrop-filter:saturate(180%) blur(8px);
        }
        .menu-panel::before{ content:""; position:absolute; inset:0; pointer-events:none;
          background:linear-gradient(180deg, rgba(255,255,255,.12) 0%, rgba(255,255,255,.05) 60%, rgba(255,255,255,0) 100%);
        }
        .menu-panel.hidden{ opacity:0; pointer-events:none; transform:translateY(-6px) scale(0.98); }
        .menu-panel.show{ opacity:1; transform:translateY(0) scale(1); transition:opacity .18s ease, transform .18s ease; }
        .menu-item{ display:flex; align-items:center; gap:10px; padding:10px 12px; text-decoration:none; color:#fff; font-weight:600; font-size:13px; cursor:pointer; border:none; background:transparent; width:100%; text-align:left; }
        .menu-item:hover{ background:rgba(255,255,255,.10); }
        .menu-icon{ width:16px; height:16px; opacity:.95; }

        .site-veil{ position:fixed; inset:0; z-index:60; opacity:1; background:rgba(0,0,0,.06); backdrop-filter: blur(6px) saturate(140%); -webkit-backdrop-filter: blur(6px) saturate(140%); transition: opacity .18s ease, background .18s ease; }
        .site-veil.hidden{ opacity:0; pointer-events:none; }
        .site-veil.show{ opacity:1; }
      `}</style>

      <header className="header-shell" role="banner">
        <div className="header-inner" />
      </header>

      <div
        ref={pillRef}
        className={`header-pill ${shrunk ? "shrunk" : ""}`}
        style={{ padding: shrunk ? "4px 10px" : "6px 12px" }}
      >
        <span className="brand-badge">mon</span>
        <span className="brand-sep" aria-hidden></span>
        <span className={`brand-text ${shrunk ? "hidden" : ""}`}>alternance & talent</span>

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
            <button className="menu-item" role="menuitem" onClick={() => { setMenuOpen(false); onSettingsClick(); }}>
              <Settings className="menu-icon" />
              <span>Paramètres</span>
            </button>
            <button className="menu-item" role="menuitem" onClick={() => { setMenuOpen(false); onHelpClick(); }}>
              <HelpCircle className="menu-icon" />
              <span>Aide</span>
            </button>
            <div style={{ borderTop: '1px solid rgba(255,255,255,.2)', margin: '4px 0' }} />
            <button className="menu-item" role="menuitem" onClick={() => { setMenuOpen(false); onLogout(); }}>
              <span style={{ marginLeft: '26px' }}>Déconnexion</span>
            </button>
          </div>
        </div>
      </div>

      <div className={`site-veil ${menuOpen ? "show" : "hidden"}`} onClick={() => setMenuOpen(false)} aria-hidden={!menuOpen} />
    </>
  );
}

/********************* DONNÉES ************************/
// Les jobs seront chargés depuis l'API

/********************* UTILS ************************/
function hash(str) { let h = 0; for (let i = 0; i < str.length; i++) { h = (h << 5) - h + str.charCodeAt(i); h |= 0; } return Math.abs(h); }
function fmtDate(iso) { try { return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return iso; } }

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

function LightActionHero({ onPrimaryClick }) {
  return (
    <div data-testid="light-hero" className="la-hero flow-hero">
      <div className="bg-bleed" aria-hidden />
      <div className="flow-wrap">
        <h1 className="flow-title">Trouve ton alternance <span className="flow-underline">plus vite</span></h1>
        <p className="flow-sub">Postule en toute simplicité : importe tes offres, suis tes candidatures et décroche ton contrat, le tout au même endroit.</p>
        <div className="flow-cta"><button className="flow-btn flow-btn--compact" onClick={onPrimaryClick} aria-label="Créer un compte pour suivre les annonces"><span className="txt-strong">Créer un compte</span><span className="flow-divider" aria-hidden></span><span className="txt-muted">pour suivre les annonces</span></button></div>
      </div>
    </div>
  );
}

/********************* CONSTANTES ************************/
const WEEKS_PER_MONTH = 4.333;
const NET_RATIO = 0.78;
const clamp = (n, min, max) => Math.min(Math.max(n, min), max);
const toNumber = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const fmtEUR0 = (n) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0, minimumFractionDigits: 0 });
const fmtEUR2 = (n) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2, minimumFractionDigits: 2 });
const parseSalaryAvg = (s) => {
  if (!s) return null;
  const raw = (s.match(/\d+[\s\u00A0\u202F\d]*(?:[\.,]\d+)?/g) || []).map(x => {
    const cleaned = x.replace(/[\s\u00A0\u202F]/g, '').replace(',', '.');
    return parseFloat(cleaned);
  }).filter(x => !isNaN(x));
  if (raw.length === 0) return null;
  if (raw.length === 1) return raw[0];
  return (raw[0] + raw[1]) / 2;
};

/********************* SETTINGS PAGE ************************/
function SettingsPage({ onClose }) {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    newJobAlerts: true,
    weeklyDigest: true,
    theme: 'light'
  });

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleThemeChange = (e) => {
    setSettings(prev => ({ ...prev, theme: e.target.value }));
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: '80px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
          <button
            onClick={onClose}
            style={{ marginRight: '16px', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', fontWeight: '600' }}
          >
            ← Retour
          </button>
          <h1 style={{ fontSize: '32px', fontWeight: '900', margin: 0 }}>Paramètres</h1>
        </div>

        <div style={{ display: 'grid', gap: '16px' }}>
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Notifications</h2>

            <div style={{ display: 'grid', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>Notifications par email</div>
                  <div style={{ fontSize: '14px', color: 'var(--muted)' }}>Recevez des emails pour les nouvelles offres</div>
                </div>
                <input type="checkbox" checked={settings.emailNotifications} onChange={() => handleToggle('emailNotifications')} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>Notifications SMS</div>
                  <div style={{ fontSize: '14px', color: 'var(--muted)' }}>Recevez des SMS pour les alertes importantes</div>
                </div>
                <input type="checkbox" checked={settings.smsNotifications} onChange={() => handleToggle('smsNotifications')} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>Alertes nouvelles offres</div>
                  <div style={{ fontSize: '14px', color: 'var(--muted)' }}>Soyez notifié des nouvelles opportunités</div>
                </div>
                <input type="checkbox" checked={settings.newJobAlerts} onChange={() => handleToggle('newJobAlerts')} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>Résumé hebdomadaire</div>
                  <div style={{ fontSize: '14px', color: 'var(--muted)' }}>Recevez un résumé chaque semaine</div>
                </div>
                <input type="checkbox" checked={settings.weeklyDigest} onChange={() => handleToggle('weeklyDigest')} />
              </div>
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Apparence</h2>
            <div>
              <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Thème</label>
              <select value={settings.theme} onChange={handleThemeChange} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: '#fff', width: '200px' }}>
                <option value="light">Clair</option>
                <option value="dark">Sombre</option>
                <option value="auto">Automatique</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/********************* PROFILE PAGE ************************/
function ProfilePage({ onClose, user }) {
  const [formData, setFormData] = useState({
    prenom: user?.prenom || '',
    nom: user?.nom || '',
    email: user?.email || '',
    entreprise: user?.entreprise || '',
    ville: user?.ville || '',
    telephone: user?.telephone || ''
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // Sauvegarder dans localStorage
    const updatedUser = { ...user, ...formData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    alert('Profil mis à jour !');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: '80px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
          <button
            onClick={onClose}
            style={{ marginRight: '16px', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', fontWeight: '600' }}
          >
            ← Retour
          </button>
          <h1 style={{ fontSize: '32px', fontWeight: '900', margin: 0 }}>Mon Profil</h1>
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>Prénom</label>
              <input
                type="text"
                value={formData.prenom}
                onChange={(e) => handleChange('prenom', e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>Nom</label>
              <input
                type="text"
                value={formData.nom}
                onChange={(e) => handleChange('nom', e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>Entreprise</label>
              <input
                type="text"
                value={formData.entreprise}
                onChange={(e) => handleChange('entreprise', e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>Ville</label>
              <input
                type="text"
                value={formData.ville}
                onChange={(e) => handleChange('ville', e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>Téléphone</label>
              <input
                type="tel"
                value={formData.telephone}
                onChange={(e) => handleChange('telephone', e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', boxSizing: 'border-box' }}
              />
            </div>

            <button
              onClick={handleSave}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                marginTop: '8px'
              }}
            >
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/********************* HELP PAGE ************************/
function HelpPage({ onClose }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: '80px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
          <button
            onClick={onClose}
            style={{ marginRight: '16px', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', fontWeight: '600' }}
          >
            ← Retour
          </button>
          <h1 style={{ fontSize: '32px', fontWeight: '900', margin: 0 }}>Aide</h1>
        </div>

        <div style={{ display: 'grid', gap: '16px' }}>
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Questions fréquentes</h2>

            <div style={{ display: 'grid', gap: '24px' }}>
              <div>
                <h3 style={{ fontWeight: '600', marginBottom: '8px' }}>Comment rechercher une offre ?</h3>
                <p style={{ color: 'var(--muted)', lineHeight: '1.6' }}>
                  Utilisez la barre de recherche en haut de la page pour saisir un mot-clé (métier, compétence) et une ville. Les résultats s'afficheront automatiquement.
                </p>
              </div>

              <div>
                <h3 style={{ fontWeight: '600', marginBottom: '8px' }}>Comment sauvegarder une offre ?</h3>
                <p style={{ color: 'var(--muted)', lineHeight: '1.6' }}>
                  Cliquez sur l'icône cœur ❤️ sur une offre pour l'ajouter à vos favoris. Retrouvez toutes vos offres sauvegardées en cliquant sur "Favoris" dans le menu.
                </p>
              </div>

              <div>
                <h3 style={{ fontWeight: '600', marginBottom: '8px' }}>D'où viennent les offres ?</h3>
                <p style={{ color: 'var(--muted)', lineHeight: '1.6' }}>
                  Les offres proviennent de plusieurs sources : Adzuna, La Bonne Alternance, Jooble, France Travail, Indeed, Welcome to the Jungle, HelloWork, LinkedIn et sites carrières d'entreprises.
                </p>
              </div>

              <div>
                <h3 style={{ fontWeight: '600', marginBottom: '8px' }}>Comment contacter le support ?</h3>
                <p style={{ color: 'var(--muted)', lineHeight: '1.6' }}>
                  Pour toute question, envoyez-nous un email à <a href="mailto:support@alternant-talent.com" style={{ color: '#667eea', textDecoration: 'underline' }}>support@alternant-talent.com</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/********************* APP PRINCIPAL ************************/
export default function App() {
  // État d'authentification
  const [user, setUser] = useState(null);
  const [showAuthPage, setShowAuthPage] = useState(false);

  // Vérifier si l'utilisateur est connecté au démarrage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
  }, []);

  // États pour les jobs et l'interface
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const selectedJob = useMemo(() => jobs.find(j => j.id === selectedId) || jobs[0], [selectedId, jobs]);
  const [liked, setLiked] = useState({});
  const [showFavs, setShowFavs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Charger les jobs depuis l'API au démarrage
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/jobs?limit=20000');
        const data = await response.json();
        if (data.jobs && data.jobs.length > 0) {
          setJobs(data.jobs);
          setSelectedId(data.jobs[0].id);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des jobs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange);
      else mq.removeListener(onChange);
    };
  }, []);

  const [qDraft, setQDraft] = useState("");
  const [cityDraft, setCityDraft] = useState("");
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");

  const [cookieChoice, setCookieChoice] = useState("");
  const acceptCookies = () => { setCookieChoice('accepted'); };
  const declineCookies = () => { setCookieChoice('declined'); };

  const [gross, setGross] = useState(1500);
  const [hours, setHours] = useState(35);
  const hourly = useMemo(() => (hours > 0 && gross > 0) ? gross / (hours * WEEKS_PER_MONTH) : null, [gross, hours]);
  const netMonthly = useMemo(() => (gross > 0) ? gross * NET_RATIO : null, [gross]);

  useEffect(() => {
    if (!selectedJob) return;
    const avg = parseSalaryAvg(selectedJob.salary);
    if (avg && Number.isFinite(avg)) setGross(Math.round(avg));
  }, [selectedJob]);

  const detailRef = useRef(null);
  const scrollToSearch = () => { document.getElementById('search')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  const applySearch = () => {
    setQ(qDraft.trim());
    setCity(cityDraft.trim());
    document.getElementById('jobs-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const handleVoir = (id) => {
    setSelectedId(id);
    setShowFavs(false);
    setTimeout(() => { if (detailRef.current && window.innerWidth >= 641) { detailRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }, 0);
  };
  const handleShare = async () => {
    const data = { title: selectedJob.title, text: `${selectedJob.company} – ${selectedJob.location}`, url: window.location.href };
    try {
      if (navigator.share) { await navigator.share(data); }
      else { await navigator.clipboard.writeText(`${data.title} — ${data.text} — ${data.url}`); alert('Lien copié dans le presse‑papiers'); }
    } catch { /* noop */ }
  };
  const openFullOffer = () => {
    if (selectedJob?.url) {
      window.open(selectedJob.url, '_blank', 'noopener');
    }
  };
  const toggleLike = (id) => setLiked(p => ({ ...p, [id]: !p[id] }));

  const filtered = useMemo(() => {
    const ql = q.toLowerCase();
    const cl = city.toLowerCase();
    return jobs.filter(j => {
      const inQ = !ql || j.title.toLowerCase().includes(ql) || (j.company && j.company.toLowerCase().includes(ql));
      const inC = !cl || (j.location && j.location.toLowerCase().includes(cl));
      return inQ && inC;
    });
  }, [q, city, jobs]);

  const visibleJobs = useMemo(() => showFavs ? filtered.filter(j => liked[j.id]) : filtered, [showFavs, liked, filtered]);

  // Gestion de l'authentification
  const handleLoginClick = () => {
    setShowAuthPage(true);
  };

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    setShowAuthPage(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setShowProfile(false);
    setShowFavs(false);
    setShowSettings(false);
    setShowHelp(false);
  };

  // Afficher la page d'authentification
  if (showAuthPage) {
    return <AuthPage onBack={() => setShowAuthPage(false)} onAuthSuccess={handleAuthSuccess} />;
  }

  // Afficher les pages de profil, paramètres, aide
  if (showProfile) {
    return <ProfilePage user={user} onClose={() => setShowProfile(false)} />;
  }

  if (showSettings) {
    return <SettingsPage onClose={() => setShowSettings(false)} />;
  }

  if (showHelp) {
    return <HelpPage onClose={() => setShowHelp(false)} />;
  }

  // Page principale
  return (
    <div className={`min-h-screen ${showFavs ? 'showFavsMobile' : ''}`} style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <style>{`
        :root{
          --bg:#FFFFFF; --panel:#FFFFFF; --text:#0F0F10; --muted:#6F6B65;
          --border:#ECEBEA; --borderStrong:#E6E5E3; --sep:#E6E5E3; --heroBg:#F5F6F7;
          --blueText:#1E40AF; --counterBg:#f7f6f4; --redBg:#FFE7E6; --redText:#B3261E;
          --stickyTop:88px; --splitH:calc(100vh - 280px);
          --logoS:40px; --likeS:36px; --cardPad:12px; --rowMinH:108px; --titleList:18px; --titleDetail:20px; --meta:13px; --radiusSoft:6px;
          --chipH:30px;
          --flowCream:#F5F6F7;
          --ctaBlue:#2663eb; --ctaBlueDark:#1f4fd1;
          --actionBlue:#2d6cf7;
          --hoverBg:#F7F7F8;
          --searchBg:#EAF2FF;
          --searchBorder: rgba(45,108,247,.38);
          --searchSectionTop: 28px; --searchSectionBottom: 22px;
          --searchMax: 640px;
        }
        .card{ background:var(--panel); border:1px solid var(--border); border-radius:var(--radiusSoft); position:relative; transition: background .15s ease, border-color .15s ease, box-shadow .15s ease; }
        .card:hover{ background: var(--hoverBg); }
        .card--selected{ border-color: var(--actionBlue); box-shadow: 0 0 0 2px rgba(45,108,247,.15) inset; }
        .card--first.card--selected{ border-color: var(--searchBorder) !important; box-shadow:none !important; }
        .card--first:not(.card--selected){ border-color: var(--searchBorder); }

        .search-wrap{ display:flex; align-items:center; gap:14px; background:var(--searchBg); border:1px solid var(--searchBorder); border-radius:9999px; padding:10px 14px; width:100%; max-width: var(--searchMax); margin: 0 auto 16px; box-sizing:border-box; }
        @media (max-width: 640px){ .search-wrap{ margin-top: -35px !important; } }
        .search-section{ margin-top: var(--searchSectionTop); margin-bottom: var(--searchSectionBottom); }
        @media (max-width: 640px){ .search-section{ margin-top: 0 !important; } }

        .filters-row{ display:flex; align-items:center; justify-content:center; gap:16px; white-space:nowrap; flex-wrap:wrap; }
        .filters-row > *{ flex:0 0 auto; }

        .btn{ border-radius:10px; font-weight:600; cursor:pointer; }
        .btn-primary{ background:#2563EB; color:#fff; }
        .btn-outline{ background:#fff; border:1px solid var(--border); color:var(--text); }
        .icon-btn{ width:var(--likeS); height:var(--likeS); display:flex; align-items:center; justify-content:center; background:#fff; border:1px solid var(--border); border-radius:12px; cursor:pointer; }
        .heart-liked{ background:var(--redBg); border-color:rgba(179,38,30,.35); }
        .counter{ display:inline-flex; align-items:center; height:var(--chipH); padding:0 10px; border-radius:9999px; border:none; background:var(--counterBg); font-weight:400; color:#6F6B65; font-size:13px; }
        .input-with-icon{ flex:1; display:flex; align-items:center; gap:8px; color:#8A867F; min-width:0; }
        .input-with-icon input{ border:0; outline:0; background:transparent; width:100%; font-size:14px; color:var(--text); flex:1; font-weight:500; }
        .input-with-icon input::placeholder{ color:#8A867F; font-weight:400; }
        .input-with-icon svg{ width:16px; height:16px; flex-shrink:0; }
        .flow-hero{ position:relative; padding:80px 24px 40px; text-align:center; overflow:hidden; }
        .bg-bleed{ position:absolute; inset:0; background:var(--flowCream); z-index:-1; }
        .flow-wrap{ max-width:42rem; margin:0 auto; position:relative; z-index:1; }
        .flow-title{ font-size:clamp(28px,5vw,56px); font-weight:900; line-height:1.1; color:var(--text); margin-bottom:18px; }
        .flow-underline{ position:relative; white-space:nowrap; }
        .flow-underline::before{ content:''; position:absolute; bottom:-2px; left:0; right:0; height:14px; background:#FFE066; border-radius:8px; z-index:-1; }
        .flow-sub{ font-size:18px; color:var(--muted); max-width:36rem; margin:0 auto 32px; line-height:1.5; }
        .flow-cta{ display:flex; justify-content:center; flex-wrap:wrap; gap:14px; }
        .flow-btn{ display:inline-flex; align-items:center; gap:10px; border-radius:9999px; font-size:14px; cursor:pointer; border:0; transition: transform .18s ease, box-shadow .18s ease; }
        .flow-btn--compact{ background:#fff; border:1px solid rgba(0,0,0,.12); color:var(--text); padding:10px 18px; box-shadow: 0 2px 6px rgba(0,0,0,.06); }
        .flow-btn--compact:hover{ transform:translateY(-1px); box-shadow:0 6px 14px rgba(0,0,0,.1); }
        .txt-strong{ font-weight:700; color:var(--ctaBlue); }
        .txt-muted{ font-weight:400; color:var(--muted); }
        .flow-divider{ width:1px; height:14px; background:rgba(0,0,0,.15); }

        .main-split{ display:grid; gap:20px; padding:20px; max-width:1440px; margin:0 auto; }
        @media (min-width:641px){ .main-split{ grid-template-columns:minmax(380px,480px) 1fr; } }
        @media (max-width:640px){ .main-split{ grid-template-columns:1fr; } }
        .jobs-col{ overflow:visible; }
        .detail-col{ position:sticky; top:var(--stickyTop); height:var(--splitH); overflow-y:auto; }
        @media (max-width:640px){ .detail-col{ position:static; height:auto; overflow:visible; } .detail-col.showFavsMobile{ display:none; } .jobs-col.showFavsMobile .card:not(.card--liked){ display:none; } }

        .job-row{ padding:var(--cardPad); display:flex; align-items:center; gap:12px; min-height:var(--rowMinH); cursor:pointer; }
        .job-row__logo{ flex-shrink:0; }
        .job-row__content{ flex:1; min-width:0; }
        .job-row__like{ flex-shrink:0; }
        .job-title{ font-size:var(--titleList); font-weight:700; color:var(--text); margin-bottom:2px; line-height:1.25; }
        .job-meta{ display:flex; flex-wrap:wrap; align-items:center; gap:6px; margin-bottom:6px; font-size:var(--meta); color:var(--muted); }
        .job-meta .icon-inline{ width:14px; height:14px; vertical-align:middle; margin-right:2px; }
        .job-tags{ display:flex; flex-wrap:wrap; gap:6px; }
        .job-tag{ display:inline-flex; align-items:center; height:var(--chipH); padding:0 10px; background:var(--counterBg); border-radius:9999px; font-size:12px; font-weight:500; color:var(--text); }

        .detail-header{ display:flex; align-items:flex-start; gap:16px; margin-bottom:24px; }
        .detail-header__logo{ flex-shrink:0; }
        .detail-header__info{ flex:1; min-width:0; }
        .detail-title{ font-size:var(--titleDetail); font-weight:700; color:var(--text); margin-bottom:8px; line-height:1.25; }
        .detail-company{ font-size:15px; color:var(--muted); margin-bottom:6px; display:flex; align-items:center; gap:6px; }
        .detail-company .icon-inline{ width:16px; height:16px; }
        .detail-location{ font-size:14px; color:var(--muted); margin-bottom:12px; display:flex; align-items:center; gap:6px; }
        .detail-location .icon-inline{ width:16px; height:16px; }
        .date-inline{ display:flex; align-items:center; gap:6px; font-size:13px; color:var(--muted); margin-bottom:4px; }
        .date-inline .w-3\.5{ width:14px; height:14px; }
        .date-strong{ font-weight:600; color:var(--text); }
        .date-normal{ font-weight:400; color:var(--muted); }

        .detail-body{ overflow-y:auto; }
        .hr{ height:1px; background:var(--border); margin:20px 0; }
        .actions-row{ display:flex; gap:12px; justify-content:flex-end; }
        .action-pill{ display:inline-flex; align-items:center; gap:8px; padding:10px 18px; border-radius:9999px; font-size:14px; font-weight:600; cursor:pointer; border:1px solid var(--border); background:#fff; transition:transform .12s ease, box-shadow .12s ease; }
        .action-pill:hover{ transform:translateY(-1px); box-shadow:0 4px 12px rgba(0,0,0,.08); }
        .action-share{ color:var(--muted); }
        .action-apply{ background:var(--ctaBlue); color:#fff; border-color:var(--ctaBlue); }
        .action-apply:hover{ background:var(--ctaBlueDark); border-color:var(--ctaBlueDark); }

        .salary-tool{ background:var(--counterBg); border-radius:10px; padding:16px; }
        .tool-title{ font-weight:700; margin-bottom:12px; color:var(--text); }
        .tool-inputs{ display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:16px; }
        .tool-input-group{ display:flex; flex-direction:column; gap:4px; }
        .tool-input-group label{ font-size:12px; font-weight:600; color:var(--muted); }
        .tool-input-group input{ border:1px solid var(--border); border-radius:6px; padding:8px; font-size:14px; outline:0; background:#fff; }
        .tool-results{ display:grid; gap:8px; }
        .tool-results > div{ display:flex; justify-content:space-between; font-size:14px; }
        .tool-results .k{ font-weight:400; color:var(--muted); }
        .tool-results .v{ font-weight:700; color:var(--text); }
        .tool-note{ margin-top:12px; font-size:12px; color:var(--muted); }

        .job-bullets{ list-style:disc; margin-left:20px; margin-top:8px; color:var(--muted); font-size:14px; line-height:1.6; }
        .job-bullets li{ margin-bottom:6px; }

        .footer-shell{ border-top:1px solid var(--border); padding:48px 24px; background:var(--flowCream); margin-top:80px; }
        .footer-inner{ max-width:1200px; margin:0 auto; }
        .footer-grid{ display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:32px; }
        .footer-brand{ display:flex; align-items:center; gap:8px; font-weight:700; margin-bottom:12px; }
        .footer-title{ font-weight:700; margin-bottom:12px; color:var(--text); }
        .footer-link{ display:block; margin-bottom:8px; color:var(--muted); text-decoration:none; font-size:14px; }
        .footer-link:hover{ color:var(--text); text-decoration:underline; }
        .footer-bottom{ display:flex; justify-content:space-between; flex-wrap:wrap; align-items:center; margin-top:32px; padding-top:24px; border-top:1px solid var(--border); font-size:14px; color:var(--muted); }
        .footer-bottom > div{ display:flex; gap:16px; }

        .cookie-bar{ position:fixed; bottom:0; left:0; right:0; background:#fff; border-top:1px solid var(--border); padding:16px; z-index:100; box-shadow:0 -2px 8px rgba(0,0,0,.08); }
        .cookie-inner{ max-width:1200px; margin:0 auto; display:flex; justify-content:space-between; align-items:center; gap:16px; flex-wrap:wrap; }
        .cookie-text{ font-size:14px; color:var(--text); }
        .cookie-actions{ display:flex; gap:12px; }
        .cookie-decline{ padding:8px 16px; border:1px solid var(--border); border-radius:8px; background:#fff; cursor:pointer; font-weight:600; }
        .cookie-accept{ padding:8px 16px; border:1px solid var(--ctaBlue); border-radius:8px; background:var(--ctaBlue); color:#fff; cursor:pointer; font-weight:600; }
      `}</style>

      {/* Header conditionnel */}
      {user ? (
        <HeaderConnected
          user={user}
          onProfileClick={() => setShowProfile(true)}
          onFavorisClick={() => setShowFavs(v => !v)}
          onSettingsClick={() => setShowSettings(true)}
          onHelpClick={() => setShowHelp(true)}
          onLogout={handleLogout}
        />
      ) : (
        <HeaderNotConnected onLoginClick={handleLoginClick} />
      )}

      {!user && <LightActionHero onPrimaryClick={handleLoginClick} />}

      {/* Illustration */}
      <div style={{ marginBottom: '0px' }}>
        <img
          src={isMobile ? "/icons/Image PNG 2.png" : "/icons/Image PNG.png"}
          alt="Illustration recherche alternance"
          style={{
            maxWidth: '1200px',
            height: 'auto',
            margin: '0 auto',
            display: 'block',
            width: '100%'
          }}
        />
      </div>

      {/* Barre de recherche */}
      <div id="search" className="search-section" style={{ padding: '0 20px' }}>
        <div className="search-wrap">
          <div className="input-with-icon">
            <Search />
            <input
              type="text"
              value={qDraft}
              onChange={(e) => setQDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') applySearch(); }}
              placeholder="Métier, mot-clé, entreprise…"
              data-testid="search-input"
            />
          </div>
          <div className="input-with-icon">
            <MapPin />
            <input
              type="text"
              value={cityDraft}
              onChange={(e) => setCityDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') applySearch(); }}
              placeholder="Ville…"
              data-testid="city-input"
            />
          </div>
          <button className="btn btn-primary" style={{ padding: '10px 20px', flexShrink: 0 }} onClick={applySearch}>
            Rechercher
          </button>
        </div>

        <div className="filters-row">
          <span className="counter" data-testid="job-counter">{visibleJobs.length} offres</span>
          {user && (
            <button
              className={`btn ${showFavs ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => setShowFavs(v => !v)}
              data-testid="favs-toggle"
            >
              <Heart className="w-4 h-4" />
              <span>Favoris</span>
            </button>
          )}
        </div>
      </div>

      {/* Jobs */}
      <main className="main-split" id="jobs-list">
        <div className={`jobs-col ${showFavs ? 'showFavsMobile' : ''}`} style={{ display: 'grid', gap: '8px', alignContent: 'start' }}>
          {loading && <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>Chargement des offres...</div>}
          {!loading && visibleJobs.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>Aucune offre trouvée</div>}
          {visibleJobs.map((j, i) => {
            const isLiked = liked[j.id];
            const isSel = selectedId === j.id;
            const isFirst = i === 0;
            return (
              <article
                key={j.id}
                className={`card job-row ${isLiked ? 'card--liked' : ''} ${isSel ? 'card--selected' : ''} ${isFirst ? 'card--first' : ''}`}
                onClick={() => handleVoir(j.id)}
                tabIndex={0}
                role="button"
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleVoir(j.id); }}
                aria-label={`Voir l'offre ${j.title} chez ${j.company}`}
              >
                <div className="job-row">
                  <div className="job-row__logo">
                    <SquareDotLogo name={j.company} size={48} />
                  </div>
                  <div className="job-row__content">
                    <h2 className="job-title">{j.title}</h2>
                    <div className="job-meta">
                      <span><Building2 className="icon-inline" />{j.company}</span>
                      {j.location && <span><MapPin className="icon-inline" />{j.location}</span>}
                    </div>
                    <div className="date-inline mb-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="date-strong">{j.posted}</span>
                      {j.publishedAt && (
                        <>
                          <span>·</span>
                          <span className="date-normal">{fmtDate(j.publishedAt)}</span>
                        </>
                      )}
                    </div>
                    <div className="job-tags">
                      {(j.tags || []).map((t, ti) => <span key={ti} className="job-tag">{t}</span>)}
                    </div>
                  </div>
                  {user && (
                    <div className="job-row__like">
                      <button
                        className={`icon-btn ${isLiked ? 'heart-liked' : ''}`}
                        onClick={(e) => { e.stopPropagation(); toggleLike(j.id); }}
                        aria-label={isLiked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                      >
                        <Heart style={{ fill: isLiked ? '#B3261E' : 'none' }} className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {selectedJob && (
        <aside ref={detailRef} className={`detail-col ${showFavs ? 'showFavsMobile' : ''}`} aria-label="Détail de l'offre">
          <div style={{ position: 'sticky', top: 0 }}>
            <div className="detail-header">
              <div className="detail-header__logo">
                <SquareDotLogo name={selectedJob.company} size={64} />
              </div>
              <div className="detail-header__info">
                <h1 className="detail-title">{selectedJob.title}</h1>
                <div className="detail-company"><Building2 className="icon-inline" />{selectedJob.company}</div>
                {selectedJob.location && <div className="detail-location"><MapPin className="icon-inline" />{selectedJob.location}</div>}
                <div className="date-inline mb-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="date-strong">{selectedJob.posted}</span>
                  {selectedJob.publishedAt && (
                    <>
                      <span>·</span>
                      <span className="date-normal">{fmtDate(selectedJob.publishedAt)}</span>
                    </>
                  )}
                </div>
                <div className="job-tags" style={{ marginTop: '8px' }}>
                  {(selectedJob.tags || []).map((t, ti) => <span key={ti} className="job-tag">{t}</span>)}
                </div>
              </div>
            </div>

            <div className="detail-body">
              <div className="salary-tool">
                <h3 className="tool-title">Simulateur de salaire</h3>
                <div className="tool-inputs">
                  <div className="tool-input-group">
                    <label htmlFor="input-gross">Brut mensuel (€)</label>
                    <input id="input-gross" type="number" value={gross} onChange={(e) => setGross(toNumber(e.target.value))} min="0" data-testid="gross-input" />
                  </div>
                  <div className="tool-input-group">
                    <label htmlFor="input-hours">Heures / semaine</label>
                    <input id="input-hours" type="number" value={hours} onChange={(e) => setHours(clamp(toNumber(e.target.value), 1, 80))} min="1" max="80" data-testid="hours-input" />
                  </div>
                </div>
                <div className="tool-results">
                  <div>
                    <span className="k">Taux horaire brut</span>
                    <span className="v" data-testid="salary-hourly" data-val={hourly ? hourly.toFixed(2) : ''}> {hourly ? fmtEUR2(hourly) : '—'} </span>
                  </div>
                  <div>
                    <span className="k">Net estimé / mois</span>
                    <span className="v" data-testid="salary-net" data-val={netMonthly ? netMonthly.toFixed(2) : ''}> {netMonthly ? fmtEUR0(netMonthly) : '—'} </span>
                  </div>
                </div>
                <p className="tool-note">Calcul indicatif. Le net dépend du statut et des cotisations.</p>
              </div>

              <div style={{flex:1}}>
                <h3 className="font-semibold" style={{ color:'var(--text)' }}>À propos du poste</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color:'var(--muted)' }}>A un rôle essentiel d'interface entre l'entreprise et sa clientèle. Promeut efficacement, avec une fine connaissance des enjeux de son secteur d'activité et ses talents en communication, l'offre de l'entreprise auprès de clients fidélisés ou de prospects. Participe à augmenter les parts de marché de l'entreprise.</p>
                <ul className="job-bullets">
                  <li>Participer au développement commercial et au suivi des prospects.</li>
                  <li>Assurer le reporting hebdomadaire des actions menées.</li>
                  <li>Collaborer avec l'équipe marketing pour les campagnes.</li>
                </ul>
              </div>

              <div className="hr" />
              <div className="actions-row">
                <button className="action-pill action-share" onClick={handleShare} aria-label="Partager l'offre">
                  <Share2 className="w-4 h-4" />
                  <span>Partager</span>
                </button>
                <button className="action-pill action-apply" onClick={openFullOffer} aria-label="Postuler à l'offre">
                  <ChevronRight className="w-4 h-4" />
                  <span>Postuler</span>
                </button>
              </div>
            </div>
          </div>
        </aside>
        )}
      </main>

      <footer className="footer-shell" role="contentinfo">
        <div className="footer-inner">
          <div className="footer-grid">
            <div>
              <div className="footer-brand"><span className="brand-badge">mon</span><span>alternance & talent</span></div>
              <p className="mt-2" style={{color:'var(--muted)'}}>Aide les candidats à trouver une alternance plus vite et à suivre leurs candidatures simplement.</p>
            </div>
            <div>
              <div className="footer-title">Produit</div>
              <a className="footer-link" href="#/fonctionnalites">Fonctionnalités</a>
              <a className="footer-link" href="#/tarifs">Tarifs</a>
              <a className="footer-link" href="#/faq">FAQ</a>
            </div>
            <div>
              <div className="footer-title">Ressources</div>
              <a className="footer-link" href="#/blog">Blog</a>
              <a className="footer-link" href="#/guides">Guides</a>
              <a className="footer-link" href="#/contact">Contact</a>
            </div>
            <div>
              <div className="footer-title">Légal</div>
              <a className="footer-link" href="#/mentions">Mentions légales</a>
              <a className="footer-link" href="#/confidentialite">Confidentialité</a>
              <a className="footer-link" href="#/cookies">Cookies</a>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} Mon Alternance & Talent</span>
            <div>
              <a href="#/mentions" className="footer-link">Mentions légales</a>
              <a href="#/confidentialite" className="footer-link">Confidentialité</a>
              <a href="#/cookies" className="footer-link">Cookies</a>
            </div>
          </div>
        </div>
      </footer>

      {!cookieChoice && (
        <div className="cookie-bar">
          <div className="cookie-inner">
            <div className="cookie-text">Nous utilisons des cookies pour améliorer votre expérience. Vous pouvez accepter ou refuser.</div>
            <div className="cookie-actions">
              <button className="cookie-decline" onClick={declineCookies}>Refuser</button>
              <button className="cookie-accept" onClick={acceptCookies}>Accepter</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
