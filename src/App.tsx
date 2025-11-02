import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  FileText,
  Bell,
  Lock,
  Upload,
  Loader2,
  Pencil,
  ShieldCheck,
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
        <span className="brand-badge">mon</span>
        <span className="brand-sep" aria-hidden></span>
        <span className={`brand-text ${shrunk ? "hidden" : ""}`}>alternance & talent</span>

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
        <div className="flow-cta">
          <button className="flow-btn flow-btn--compact" onClick={onPrimaryClick} aria-label="Aller à la recherche">
            <span className="txt-strong">Commencer</span>
            <span className="flow-divider" aria-hidden></span>
            <span className="txt-muted">aller à la recherche</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/********************* PAGES SETTINGS, PROFILE, HELP ************************/
function SettingsPage({ onClose }) {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    newJobAlerts: true,
    weeklyDigest: true,
    theme: 'light'
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: '80px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 16px' }}>
        <button onClick={onClose} style={{ marginBottom: '24px', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--sep)', background: '#fff', cursor: 'pointer', fontWeight: '600' }}>← Retour</button>
        <h1 style={{ fontSize: '32px', fontWeight: '900', margin: '0 0 24px' }}>Paramètres</h1>
        <div style={{ background: '#fff', border: '1px solid var(--sep)', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Notifications</h2>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div><div style={{ fontWeight: '600' }}>Notifications par email</div><div style={{ fontSize: '14px', color: 'var(--muted)' }}>Recevez des emails</div></div>
              <input type="checkbox" checked={settings.emailNotifications} onChange={() => setSettings(p => ({ ...p, emailNotifications: !p.emailNotifications }))} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// TitleRow component extracted to module level and memoized
interface TitleRowProps {
  id: string;
  Icon?: React.ComponentType<{ className?: string }>;
  title: string;
  suffix?: number;
  isOpen: boolean;
  onClick: () => void;
}

const TitleRow = memo<TitleRowProps>(({ id, Icon, title, suffix, isOpen, onClick }) => {
  return (
    <li style={{ listStyle: "none" }}>
      <button
        id={`${id}-title`}
        type="button"
        className="group flex w-full items-center justify-between py-3 md:py-3.5 text-left"
        aria-expanded={isOpen}
        aria-controls={`${id}-panel`}
        onClick={onClick}
        data-testid={`title-${id}`}
        style={{ background: "none", border: "none", padding: "0.75rem 0" }}
      >
        <span className="inline-flex items-center gap-2 min-w-0">
          {Icon ? (
            <Icon className="h-4 w-4 text-neutral-500 group-hover:text-neutral-700" />
          ) : null}
          <span className="truncate text-[15px] font-medium text-neutral-900">{title}</span>
        </span>

        <span className="flex items-center gap-2">
          {suffix != null && (
            <span className="text-[12px] text-neutral-500">{suffix}</span>
          )}
          <ChevronRight
            data-testid={`chev-${id}`}
            className={`h-4 w-4 transition-transform duration-200 ${
              isOpen ? "rotate-90" : "rotate-0"
            } text-neutral-500 group-hover:text-neutral-700`}
          />
        </span>
      </button>
    </li>
  );
});

TitleRow.displayName = "TitleRow";

function ProfilePage({ onClose, user: initialUser }) {
  const [user, setUser] = useState({
    firstName: initialUser?.prenom || "Élodie",
    lastName: initialUser?.nom || "Martin",
    title: "Chargée de communication",
    email: initialUser?.email || "elodie.martin@demo.com",
    phone: "+33 6 12 34 56 78",
    city: "Lyon, Auvergne-Rhône-Alpes",
    visibility: "public",
  });

  const initials = useMemo(() => {
    const f = user.firstName?.[0] || "?";
    const l = user.lastName?.[0] || "";
    return (f + l).toUpperCase();
  }, [user.firstName, user.lastName]);

  const [applications] = useState(2);
  const [favorites] = useState(1);
  const [alerts] = useState(1);

  const [edit, setEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  const [open, setOpen] = useState({
    perso: false,
    docs: false,
    apps: false,
    fav: false,
    alerts: false,
    privacy: false,
  });

  const togglePerso = useCallback(() => setOpen((o) => ({ ...o, perso: !o.perso })), []);
  const toggleDocs = useCallback(() => setOpen((o) => ({ ...o, docs: !o.docs })), []);
  const toggleApps = useCallback(() => setOpen((o) => ({ ...o, apps: !o.apps })), []);
  const toggleFav = useCallback(() => setOpen((o) => ({ ...o, fav: !o.fav })), []);
  const toggleAlerts = useCallback(() => setOpen((o) => ({ ...o, alerts: !o.alerts })), []);
  const togglePrivacy = useCallback(() => setOpen((o) => ({ ...o, privacy: !o.privacy })), []);

  const onClickEditSave = useCallback(async () => {
    if (!edit) { setEdit(true); return; }
    try {
      setSaving(true);
      await new Promise((r) => setTimeout(r, 800));
      setEdit(false);
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 1600);
    } finally {
      setSaving(false);
    }
  }, [edit]);

  // Smoke tests simples
  useEffect(() => {
    const editBtn = document.querySelector('[data-testid="edit-save"]');
    const titles = document.querySelectorAll('[data-testid^="title-"]');
    console.assert(!!editBtn, "[TEST] Bouton Éditer/Enregistrer présent");
    console.assert(titles.length === 6, "[TEST] 6 sections attendues");
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <main className="mx-auto max-w-3xl px-4 py-6">
        {/* Header centré */}
        <section className="px-6 py-8">
          <div className="flex w-full flex-col items-center text-center">
            <div
              aria-label="Avatar"
              className="flex h-20 w-20 items-center justify-center rounded-2xl bg-neutral-900 text-white text-2xl font-semibold shadow-sm"
            >
              {initials}
            </div>

            <div className="mt-4">
              <div className="text-[18px] font-semibold">
                {user.firstName} {user.lastName}
              </div>
              <div className="mt-0.5 text-[13px] text-neutral-600">{user.title}</div>
            </div>

            <span className="mt-4 inline-flex items-center gap-1 rounded-full border border-neutral-300 px-3 py-1 text-[12px] text-neutral-700">
              <ShieldCheck className="h-3.5 w-3.5" /> Profil {user.visibility}
            </span>
          </div>
        </section>

        {/* Sections FAQ */}
        <nav aria-label="Sections du profil" className="mt-6">
          <ul className="divide-y divide-neutral-200" style={{ listStyle: "none", padding: 0 }}>
            <TitleRow
              id="perso"
              Icon={User}
              title="Informations personnelles"
              isOpen={open.perso}
              onClick={togglePerso}
            />
            {open.perso && (
              <li id="perso-panel" className="pb-3" role="region" aria-labelledby="perso-title">
                <div className="pl-[22px] md:pl-6 text-[14px] text-neutral-700">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-1">
                      <span className="text-[12px] text-neutral-500">Prénom</span>
                      {edit ? (
                        <input
                          data-testid="input-firstName"
                          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-[14px] focus:outline-none focus:ring-4 focus:ring-blue-500/20"
                          value={user.firstName}
                          onChange={(e) => setUser({ ...user, firstName: e.target.value })}
                        />
                      ) : (
                        <span className="text-neutral-900">{user.firstName}</span>
                      )}
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="text-[12px] text-neutral-500">Nom</span>
                      {edit ? (
                        <input
                          data-testid="input-lastName"
                          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-[14px] focus:outline-none focus:ring-4 focus:ring-blue-500/20"
                          value={user.lastName}
                          onChange={(e) => setUser({ ...user, lastName: e.target.value })}
                        />
                      ) : (
                        <span className="text-neutral-900">{user.lastName}</span>
                      )}
                    </label>

                    <label className="flex flex-col gap-1 sm:col-span-2">
                      <span className="text-[12px] text-neutral-500">Intitulé de poste</span>
                      {edit ? (
                        <input
                          data-testid="input-title"
                          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-[14px] focus:outline-none focus:ring-4 focus:ring-blue-500/20"
                          value={user.title}
                          onChange={(e) => setUser({ ...user, title: e.target.value })}
                        />
                      ) : (
                        <span className="text-neutral-900">{user.title}</span>
                      )}
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="text-[12px] text-neutral-500">Email</span>
                      {edit ? (
                        <input
                          type="email"
                          data-testid="input-email"
                          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-[14px] focus:outline-none focus:ring-4 focus:ring-blue-500/20"
                          value={user.email}
                          onChange={(e) => setUser({ ...user, email: e.target.value })}
                        />
                      ) : (
                        <span className="text-neutral-900">{user.email}</span>
                      )}
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-[12px] text-neutral-500">Téléphone</span>
                      {edit ? (
                        <input
                          data-testid="input-phone"
                          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-[14px] focus:outline-none focus:ring-4 focus:ring-blue-500/20"
                          value={user.phone}
                          onChange={(e) => setUser({ ...user, phone: e.target.value })}
                        />
                      ) : (
                        <span className="text-neutral-900">{user.phone}</span>
                      )}
                    </label>

                    <label className="flex flex-col gap-1 sm:col-span-2">
                      <span className="text-[12px] text-neutral-500">Ville</span>
                      {edit ? (
                        <input
                          data-testid="input-city"
                          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-[14px] focus:outline-none focus:ring-4 focus:ring-blue-500/20"
                          value={user.city}
                          onChange={(e) => setUser({ ...user, city: e.target.value })}
                        />
                      ) : (
                        <span className="text-neutral-900">{user.city}</span>
                      )}
                    </label>
                  </div>
                </div>
              </li>
            )}

            <TitleRow
              id="docs"
              Icon={FileText}
              title="CV & documents"
              isOpen={open.docs}
              onClick={toggleDocs}
            />
            {open.docs && (
              <li id="docs-panel" className="pb-3" role="region" aria-labelledby="docs-title">
                <div className="pl-[22px] md:pl-6 text-[14px] text-neutral-700">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={!edit}
                      className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-[13px] disabled:opacity-60"
                      data-testid="btn-upload"
                    >
                      <Upload className="h-4 w-4" />
                      Importer un document
                    </button>
                    <div className="inline-flex items-center gap-2 text-neutral-600">
                      <FileText className="h-4 w-4" /> Aucun document
                    </div>
                  </div>
                </div>
              </li>
            )}

            <TitleRow
              id="apps"
              Icon={BriefcaseBusiness}
              title="Candidatures (résumé)"
              suffix={applications}
              isOpen={open.apps}
              onClick={toggleApps}
            />
            {open.apps && (
              <li id="apps-panel" className="pb-3" role="region" aria-labelledby="apps-title">
                <div className="pl-[22px] md:pl-6 text-[14px] text-neutral-700">
                  <p>Aucune action ici pour l'instant. Résumé: {applications} candidatures.</p>
                </div>
              </li>
            )}

            <TitleRow
              id="fav"
              Icon={Heart}
              title="Favoris"
              suffix={favorites}
              isOpen={open.fav}
              onClick={toggleFav}
            />
            {open.fav && (
              <li id="fav-panel" className="pb-3" role="region" aria-labelledby="fav-title">
                <div className="pl-[22px] md:pl-6 text-[14px] text-neutral-700">
                  <div className="inline-flex items-center gap-2 text-neutral-600">
                    <Heart className="h-4 w-4" /> {favorites} offre(s) favorite(s)
                  </div>
                </div>
              </li>
            )}

            <TitleRow
              id="alerts"
              Icon={Bell}
              title="Alertes d'emploi"
              suffix={alerts}
              isOpen={open.alerts}
              onClick={toggleAlerts}
            />
            {open.alerts && (
              <li id="alerts-panel" className="pb-3" role="region" aria-labelledby="alerts-title">
                <div className="pl-[22px] md:pl-6 text-[14px] text-neutral-700">
                  <div className="inline-flex items-center gap-2 text-neutral-600">
                    <Bell className="h-4 w-4" /> {alerts} alerte(s) active(s)
                  </div>
                </div>
              </li>
            )}

            <TitleRow
              id="privacy"
              Icon={Lock}
              title="Confidentialité"
              isOpen={open.privacy}
              onClick={togglePrivacy}
            />
            {open.privacy && (
              <li id="privacy-panel" className="pb-3" role="region" aria-labelledby="privacy-title">
                <div className="pl-[22px] md:pl-6 text-[14px] text-neutral-700">
                  <div className="flex items-center gap-2 text-neutral-700">
                    <Lock className="h-4 w-4" />
                    <span className="text-[14px]">Visibilité du profil :</span>
                    {edit ? (
                      <select
                        data-testid="select-visibility"
                        className="ml-2 rounded-lg border border-neutral-300 bg-white px-2 py-1 text-[13px] focus:outline-none focus:ring-4 focus:ring-blue-500/20"
                        value={user.visibility}
                        onChange={(e) => setUser({ ...user, visibility: e.target.value })}
                      >
                        <option value="public">public</option>
                        <option value="private">private</option>
                        <option value="réseau">réseau</option>
                      </select>
                    ) : (
                      <span className="ml-2 rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[12px] text-neutral-600">
                        {user.visibility}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            )}
          </ul>
        </nav>

        {/* Liens du bas — uniquement Déconnexion, aligné à droite */}
        <section className="mt-3 flex items-center justify-end text-[13px]">
          <a
            href="#"
            onClick={onClose}
            className="inline-flex items-center gap-2 text-neutral-600 hover:text-red-600 hover:underline"
          >
            Déconnexion
          </a>
        </section>
      </main>

      {/* Bouton Éditer / Enregistrer */}
      <button
        aria-label={edit ? "Enregistrer" : "Éditer"}
        onClick={onClickEditSave}
        disabled={saving}
        data-testid="edit-save"
        className="fixed bottom-5 right-4 z-40 inline-flex h-11 items-center gap-2 rounded-full bg-[#2663eb] px-4 text-[13px] text-white disabled:opacity-70"
        style={{ outline: "none", border: "none", boxShadow: "none" }}
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
        {saving ? "Enregistrement…" : edit ? "Enregistrer" : "Éditer"}
      </button>

      {savedToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-[13px] text-neutral-800 shadow-sm">
          Modifications enregistrées ✅
        </div>
      )}

      <footer className="mx-auto max-w-3xl px-4 py-10 text-center text-[12px] text-neutral-500">
        © 2025 Alternance & Talent — Profil
      </footer>
    </div>
  );
}

function HelpPage({ onClose }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: '80px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 16px' }}>
        <button onClick={onClose} style={{ marginBottom: '24px', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--sep)', background: '#fff', cursor: 'pointer', fontWeight: '600' }}>← Retour</button>
        <h1 style={{ fontSize: '32px', fontWeight: '900', margin: '0 0 24px' }}>Aide</h1>
        <div style={{ background: '#fff', border: '1px solid var(--sep)', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ fontWeight: '600', marginBottom: '8px' }}>Comment rechercher une offre ?</h3>
          <p style={{ color: 'var(--muted)', lineHeight: '1.6' }}>Utilisez la barre de recherche en haut de la page.</p>
        </div>
      </div>
    </div>
  );
}

/********************* APP PRINCIPAL ************************/
export default function App() {
  // Auth
  const [user, setUser] = useState(null);
  const [showAuthPage, setShowAuthPage] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try { setUser(JSON.parse(storedUser)); } catch { localStorage.removeItem('user'); }
    }
  }, []);

  // Jobs
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const selectedJob = useMemo(() => jobs.find(j => j.id === selectedId) || jobs[0], [selectedId, jobs]);
  const [liked, setLiked] = useState({});
  const [showFavs, setShowFavs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

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
        console.error('Erreur chargement jobs:', error);
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
    return () => { if (mq.removeEventListener) mq.removeEventListener('change', onChange); else mq.removeListener(onChange); };
  }, []);

  const [qDraft, setQDraft] = useState("");
  const [cityDraft, setCityDraft] = useState("");
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [cookieChoice, setCookieChoice] = useState("");
  const [activeTab, setActiveTab] = useState('annonces');

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
    if (isMobile) setActiveTab('infos');
    setTimeout(() => { if (detailRef.current && window.innerWidth >= 641) detailRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 0);
  };
  const handleShare = async () => {
    const data = { title: selectedJob.title, text: `${selectedJob.company} – ${selectedJob.location}`, url: window.location.href };
    try {
      if (navigator.share) await navigator.share(data);
      else { await navigator.clipboard.writeText(`${data.title} — ${data.text} — ${data.url}`); alert('Lien copié'); }
    } catch { }
  };
  const openFullOffer = () => { if (selectedJob?.url) window.open(selectedJob.url, '_blank', 'noopener'); };
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

  useEffect(() => {
    if (!visibleJobs.some(j => j.id === selectedId) && visibleJobs.length > 0) setSelectedId(visibleJobs[0].id);
  }, [visibleJobs, selectedId]);

  // Auth handlers
  const handleLoginClick = () => setShowAuthPage(true);
  const handleAuthSuccess = (userData) => { setUser(userData); setShowAuthPage(false); };
  const handleLogout = () => { localStorage.removeItem('user'); setUser(null); setShowProfile(false); setShowFavs(false); setShowSettings(false); setShowHelp(false); };

  if (showAuthPage) return <AuthPage onBack={() => setShowAuthPage(false)} onAuthSuccess={handleAuthSuccess} />;
  if (showProfile) return <ProfilePage user={user} onClose={() => setShowProfile(false)} />;
  if (showSettings) return <SettingsPage onClose={() => setShowSettings(false)} />;
  if (showHelp) return <HelpPage onClose={() => setShowHelp(false)} />;

  return (
    <div className={`min-h-screen ${showFavs ? 'showFavsMobile' : ''} ${isMobile ? (activeTab==='infos' ? 'tabs-infos' : 'tabs-annonces') : ''}`} style={{ background: 'transparent', color: 'var(--text)' }}>
      <style>{`
        :root{
          --bg:#FFFFFF; --panel:#FFFFFF; --text:#0F0F10; --muted:#6F6B65; --sep:#E6E5E3; --borderStrong:#E6E5E3; --heroBg:#F5F6F7;
          --blueText:#1E40AF; --counterBg:#f7f6f4; --redBg:#FFE7E6; --redText:#B3261E;
          --stickyTop:104px; --splitH:calc(100vh - 280px);
          --logoS:40px; --likeS:36px; --cardPad:12px; --rowMinH:108px; --titleList:18px; --titleDetail:20px; --meta:13px; --radiusSoft:6px;
          --chipH:30px;
          --flowCream:#F5F6F7;
          --ctaBlue:#2663eb; --ctaBlueDark:#1f4fd1; --actionBlue:#2d6cf7; --hoverBg:#F7F7F8;
          --searchBg:#EAF2FF; --searchBorder: rgba(45,108,247,.38);
          --searchSectionTop: 28px; --searchSectionBottom: 22px; --searchMax: 640px;
        }
        .card{ background:var(--panel); border:1px solid var(--sep); border-radius:var(--radiusSoft); position:relative; transition: background .15s ease, border-color .15s ease, box-shadow .15s ease; }
        .card:hover{ background: var(--hoverBg); }
        .card--clickable{ cursor:pointer; }
        .card--selected{ border-color: var(--searchBorder); box-shadow:none; }
        .card--first.card--selected{ border-color: var(--searchBorder) !important; box-shadow:none !important; }
        .card--first:not(.card--selected){ border-color: var(--searchBorder); }

        .search-wrap{ display:flex; align-items:center; gap:14px; background:var(--searchBg); border:1px solid var(--searchBorder); border-radius:9999px; padding:10px 14px; width:100%; max-width: var(--searchMax); margin: 0 auto 16px; box-sizing:border-box; }
        .search-section{ margin-top: var(--searchSectionTop); margin-bottom: var(--searchSectionBottom); }
        .hero-illustration{ display:block; width:100%; max-width:1200px; margin:0 auto 4px; height:auto; }
        @media (max-width: 640px){ .hero-illustration{ max-width:100%; margin-bottom:-24px; } }
        .filters-row{ display:flex; align-items:center; justify-content:center; gap:16px; white-space:nowrap; flex-wrap:wrap; }
        .filters-row > *{ flex:0 0 auto; }

        .counter{ display:inline-flex; align-items:center; height:var(--chipH); padding:0 10px; border-radius:9999px; border:none; background:var(--counterBg); font-weight:400; color:#6F6B65; font-size:13px; }
        .input-with-icon{ flex:1; display:flex; align-items:center; gap:8px; color:#8A867F; min-width:0; }
        .input-with-icon input{ flex:1; border:0; outline:none; background:transparent; color:var(--text); font-size:13px; }
        .mini-divider{ width:1px; height:10px; background:rgba(0,0,0,.14); }
        .search-btn{ margin-left:auto; display:inline-flex; align-items:center; gap:6px; font-weight:600; font-size:13px; padding:10px 16px; border-radius:9999px; color:#fff; background: linear-gradient(180deg, #2e6ffa 0%, var(--ctaBlue) 70%); border:1px solid var(--ctaBlueDark); box-shadow: inset 0 1px 0 rgba(255,255,255,.35), 0 6px 16px rgba(38,99,235,.28); transition: transform .08s ease, box-shadow .2s ease, filter .2s ease; cursor:pointer; }
        .search-btn:hover{ transform: translateY(-1px); box-shadow: inset 0 1.5px 0 rgba(255,255,255,.45), 0 10px 24px rgba(38,99,235,.34); filter:saturate(1.05); }
        .search-btn:active{ transform: translateY(0); box-shadow: inset 0 2px 6px rgba(0,0,0,.18), 0 6px 14px rgba(38,99,235,.25); }

        .seg{ display:inline-flex; align-items:center; height:var(--chipH); background:#fff; border:1px solid var(--sep); border-radius:9999px; padding:2px; }
        .seg-item{ height:calc(var(--chipH) - 4px); display:inline-flex; align-items:center; padding:0 10px; border-radius:9999px; font-weight:500; color:#3F3D39; font-size:13px; cursor:pointer; border:none; background:transparent; transition: all 0.2s ease; }
        .seg-item.active{ background:#2B2B2B; color:#fff; font-weight:600; }
        .date-inline{ display:inline-flex; align-items:center; gap:6px; color:#1E40AF; font-size:12.5px; } .date-strong{ font-weight:700; } .date-normal{ font-weight:400; }
        .date-hr{ height:1px; background:var(--sep); margin:6px 0 8px; }
        .pad-card.with-like .date-hr{ margin-right: calc(var(--likeS) + 24px); }
        .hr{ height:1px; background:var(--sep); }
        .like-top-right{ position:absolute; top:18px; right:18px; }
        .see-bottom-right{ position:absolute; right:12px; bottom:10px; display:inline-flex; align-items:center; gap:6px; font-weight:700; font-size:13px; padding:0; border:0; background:transparent; color:#2d6cf7; border-radius:0; box-shadow:none; cursor:pointer; }
        .icon-btn{ width:var(--likeS); height:var(--likeS); display:flex; align-items:center; justify-content:center; background:#fff; border:1px solid var(--sep); border-radius:12px; cursor:pointer; }
        .heart-liked{ background:var(--redBg); border-color:rgba(179,38,30,.35); }
        .split-area{ display:grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap:18px; align-items:start; }
        .list-scroll{ grid-column: span 7 / span 7; height: var(--splitH); overflow-y:auto; padding-right:4px; }
        .detail-col{ grid-column: span 5 / span 5; position:relative; }
        .detail-sticky{ position:sticky; top: var(--stickyTop); }
        .with-like{ padding-right: calc(var(--likeS) + 28px); }

        .flow-hero{ position:relative; padding:48px 0 24px; }
        .flow-hero .bg-bleed{ position:absolute; inset:0; background: transparent; z-index:0; }
        .flow-wrap{ position:relative; z-index:1; max-width:72rem; margin:0 auto; text-align:center; padding:0 16px; }
        .flow-title{ font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial; font-weight:900; letter-spacing:-.02em; font-size:clamp(40px, 6.5vw, 96px); line-height:.95; color:#111111; margin:0 0 10px; }
        .flow-sub{ color:#6b7280; font-weight:500; font-size:clamp(18px, 2.3vw, 28px); margin-top:8px; }
        @media (min-width: 1024px){ .flow-wrap{ padding-left:160px; padding-right:160px; } .flow-title{ font-size:clamp(20px, 3.25vw, 48px); } .flow-sub{ font-size:clamp(9px, 1.15vw, 14px); } }
        .flow-cta{ display:flex; justify-content:center; margin-top:28px; }
        .flow-btn{ display:inline-flex; align-items:center; gap:10px; background:#FAFAFA; border:1px solid #EAEAEA; border-radius:9999px; padding:12px 18px; font-weight:700; cursor:pointer; }
        .flow-btn--compact{ padding:4px 6px; font-size:10px; gap:6px; }
        .flow-divider{ width:1px; height:12px; background:rgba(0,0,0,.14); }
        .flow-btn .txt-muted{ color:#6F6B65; font-weight:600; }
        .flow-btn .txt-strong{ font-weight:700; }
        .flow-underline{ position:relative; display:inline-block; }

        .pad-card{ padding: var(--cardPad); padding-bottom: 32px; }

        .cookie-bar{ position:fixed; left:0; right:0; bottom:0; z-index:60; color:#fff; background:rgba(17,17,17,.78); backdrop-filter:saturate(120%) blur(4px); -webkit-backdrop-filter:saturate(120%) blur(4px); border:0; box-shadow:0 -6px 18px rgba(0,0,0,.18); }
        .cookie-inner{ max-width:72rem; margin:0 auto; padding:8px 12px; display:flex; align-items:center; gap:8px; justify-content:space-between; }
        .cookie-text{ opacity:.96; font-size:12.5px; }
        .cookie-actions{ display:flex; align-items:center; gap:8px; }
        .cookie-accept{ background:#fff; color:#111; border:0; border-radius:9999px; padding:6px 10px; font-weight:700; cursor:pointer; }
        .cookie-decline{ background:transparent; color:#fff; border:0; padding:6px 8px; text-decoration:underline; cursor:pointer; }

        .footer-shell{ background:#fff; border-top:1px solid var(--sep); }
        .footer-inner{ max-width:72rem; margin:0 auto; padding:24px 16px; }
        .footer-grid{ display:grid; grid-template-columns:1.5fr repeat(3,1fr); gap:24px; align-items:flex-start; }
        .footer-title{ font-weight:700; font-size:14px; color:#1F1E1B; margin-bottom:8px; }
        .footer-link{ display:block; color:#6F6B65; font-size:13px; padding:4px 0; text-decoration:none; }
        .footer-link:hover{ color:#1F1E1B; }
        .footer-brand{ display:flex; align-items:center; gap:8px; color:#1F1E1B; }
        .footer-bottom{ margin-top:16px; padding-top:12px; border-top:1px solid var(--sep); display:flex; justify-content:space-between; align-items:center; color:#6F6B65; font-size:12px; }
        .footer-bottom .footer-link{ display:inline-block; padding:0; margin-left:12px; }

        .detail-card{ background:var(--panel); border:1px solid var(--sep); border-radius:var(--radiusSoft); padding:14px; }
        .actions-row{ display:flex; align-items:center; gap:10px; justify-content:flex-end; }
        .action-pill{ display:inline-flex; align-items:center; gap:8px; height:40px; padding:0 12px; background:#fff; border-radius:10px; font-weight:700; font-size:13px; cursor:pointer; }
        .action-share{ border:1px solid var(--sep); color:var(--text); }
        .action-share:hover{ background:var(--hoverBg); }
        .action-apply{ border:1px solid var(--ctaBlue); color:var(--ctaBlue); font-weight:800; }
        .action-apply:hover{ background:rgba(45,108,247,.06); }

        @media (max-width: 640px){
          :root{ --chipH:24px; }
          .filters-row{ gap:6px; padding-bottom:2px; }
          .counter{ padding:0 8px; font-size:11px; }
          .seg-item{ padding:0 8px; font-size:11px; }
          .search-wrap{ padding:10px 12px; gap:10px; }
          .search-btn{ padding:8px 12px; font-size:12px; }
          .city-input{ max-width:140px; }
          .split-area{ display:block; }
          .list-scroll{ height:auto; overflow:visible; padding-right:0; }
          .detail-col{ display:none; }
          .tabs-infos .detail-col{ display:block; }
          .tabs-infos .list-scroll{ display:none; }
          .cookie-inner{ flex-direction:column; align-items:stretch; gap:8px; }
          .cookie-actions{ justify-content:flex-end; }
          .header-pill{ max-width: calc(100vw - 12px); white-space:nowrap; }
          .flow-title{ font-size:clamp(28px, 8.5vw, 48px); line-height:1; }
          .flow-sub{ font-size:clamp(14px, 4vw, 18px); }
          .footer-grid{ grid-template-columns: 1fr 1fr; gap:16px; }
          .footer-inner{ padding:16px 12px; }
          .footer-bottom{ flex-direction:column; align-items:flex-start; gap:8px; }
        }

        @media (max-width: 1024px){ .split-area{ display:block; } .list-scroll{ height:auto; overflow:visible; } .detail-sticky{ position:static; } }
        @media (min-width: 641px){ .detail-col{ display:block; } }
      `}</style>

      {user ? (
        <HeaderConnected
          user={user}
          onProfileClick={() => setShowProfile(true)}
          onFavorisClick={() => { setShowFavs(true); document.getElementById('search')?.scrollIntoView({behavior:'smooth'}); }}
          onSettingsClick={() => setShowSettings(true)}
          onHelpClick={() => setShowHelp(true)}
          onLogout={handleLogout}
        />
      ) : (
        <HeaderNotConnected onLoginClick={handleLoginClick} />
      )}

      {!user && (
        <section className="mx-auto max-w-6xl px-4 mt-0">
          <LightActionHero onPrimaryClick={scrollToSearch} />
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 mt-5 search-section" id="search">
        {/* Illustration responsive - desktop et mobile */}
        <img
          src={isMobile ? "/icons/Image PNG 2.png" : "/icons/Image PNG.png"}
          alt="Illustration alternance"
          className="hero-illustration"
          loading="eager"
        />

        <div className="search-wrap">
          <div className="input-with-icon">
            <BriefcaseBusiness className="w-4 h-4" />
            <input
              aria-label="Poste, entreprise, mot-clé"
              placeholder="Poste, entreprise, mot-clé"
              value={qDraft}
              onChange={(e) => setQDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') applySearch(); }}
            />
          </div>
          <div className="input-with-icon city-input">
            <MapPin className="w-4 h-4" />
            <span className="mini-divider" />
            <input
              aria-label="Ville"
              placeholder="Ville"
              value={cityDraft}
              onChange={(e) => setCityDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') applySearch(); }}
            />
          </div>
          <button className="search-btn" onClick={applySearch}><Search className="w-4 h-4" /> Rechercher</button>
        </div>
        <div className="filters-row">
          <span className="counter">{visibleJobs.length} offres visibles</span>
          <span className="counter">{Object.values(liked).filter(Boolean).length} favoris</span>
          <div className="seg">
            <button className={`seg-item ${!showFavs ? 'active' : ''}`} onClick={() => setShowFavs(false)}>Toutes les offres</button>
            <button className={`seg-item ${showFavs ? 'active' : ''}`} onClick={() => setShowFavs(true)}>Favoris</button>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 mt-8 md:mt-12 pb-8 split-area" id="jobs-list">
        <div className="list-scroll">
          <div className="space-y-3">
            {loading && <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>Chargement...</div>}
            {!loading && visibleJobs.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>Aucune offre</div>}
            {visibleJobs.map((job, idx) => {
              const isLiked = !!liked[job.id];
              const isSelected = job.id === selectedId;
              const isFirst = idx === 0;
              return (
                <article
                  key={job.id}
                  className={`relative card card--clickable overflow-hidden ${isSelected ? 'card--selected' : ''} ${isFirst ? 'card--first' : ''}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleVoir(job.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleVoir(job.id); } }}
                >
                  <div className="like-top-right">
                    <button
                      aria-label={isLiked ? "Retirer des favoris" : "Ajouter aux favoris"}
                      className={`icon-btn ${isLiked ? 'heart-liked' : ''}`}
                      onClick={(e) => { e.stopPropagation(); toggleLike(job.id); }}
                    >
                      <Heart
                        className="w-4 h-4"
                        style={{ color: isLiked ? 'var(--redText)' : 'inherit' }}
                        fill={isLiked ? 'currentColor' : 'none'}
                      />
                    </button>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleVoir(job.id); }}
                    className="see-bottom-right"
                  >
                    {isMobile ? 'Postuler' : 'Voir'} <ChevronRight />
                  </button>

                  <div className="pad-card with-like" style={{ minHeight: 'var(--rowMinH)' }}>
                    <div className="date-inline mb-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="date-strong">{job.posted}</span>
                      <span>·</span>
                      <span className="date-normal">{fmtDate(job.publishedAt)}</span>
                    </div>
                    <div className="date-hr" />

                    <div className="flex items-start gap-3 md:gap-4">
                      <SquareDotLogo name={job.company} size={40} />

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold leading-snug" style={{ fontSize: 'var(--titleList)', color: 'var(--text)', margin: 0 }}>
                          {job.title}
                        </h3>
                        <div className="mt-1" style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap', fontSize:'var(--meta)' }}>
                          <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
                            <Building2 className="w-4 h-4" /> {job.company}
                          </span>
                          <span style={{ display:'inline-flex', alignItems:'center', gap:6, color:'#3F3D39' }}>
                            <MapPin className="w-4 h-4" /> {job.location}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {selectedJob && (
        <aside className="detail-col">
          <div className="detail-sticky" ref={detailRef}>
            <div className="detail-card">
              <div className="date-inline mb-2">
                <Calendar className="w-3.5 h-3.5" />
                <span className="date-strong">{selectedJob.posted}</span>
                <span>·</span>
                <span className="date-normal">{fmtDate(selectedJob.publishedAt)}</span>
              </div>
              <h2 style={{ fontSize:'var(--titleDetail)', margin:'4px 0 8px', lineHeight:1.15 }}>{selectedJob.title}</h2>
              <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap', color:'#3F3D39', fontSize:'var(--meta)' }}>
                <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}><Building2 className="w-4 h-4"/> {selectedJob.company}</span>
                <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}><MapPin className="w-4 h-4"/> {selectedJob.location}</span>
              </div>

              <div className="hr" style={{ margin:'12px 0' }} />

              <div className="actions-row">
                <button className="action-pill action-share" onClick={handleShare}><Share2 className="w-4 h-4"/> Partager</button>
                <button className="action-pill action-apply" onClick={openFullOffer}>Postuler</button>
              </div>

              <div className="hr" style={{ margin:'12px 0' }} />

              <div>
                <div style={{ fontWeight:700, marginBottom:6 }}>À propos du poste</div>
                <p style={{ color:'#3F3D39', fontSize:'14px', lineHeight:1.5 }}>
                  A un rôle essentiel d'interface entre l'entreprise et sa clientèle. Promeut efficacement, avec une fine connaissance des enjeux de son secteur d'activité et ses talents en communication, l'offre de l'entreprise auprès de clients fidélisés ou de prospects.
                </p>
              </div>
            </div>
          </div>
        </aside>
        )}
      </main>

      {!cookieChoice && (
        <div className="cookie-bar">
          <div className="cookie-inner">
            <div className="cookie-text">Nous utilisons des cookies pour améliorer votre expérience.</div>
            <div className="cookie-actions">
              <button className="cookie-decline" onClick={() => setCookieChoice('declined')}>Refuser</button>
              <button className="cookie-accept" onClick={() => setCookieChoice('accepted')}>Accepter</button>
            </div>
          </div>
        </div>
      )}

      <footer className="footer-shell">
        <div className="footer-inner">
          <div className="footer-grid">
            <div>
              <div className="footer-brand"><SquareDotLogo name="A&T" size={24}/> Alternance & Talent</div>
              <p style={{ color:'#6F6B65', fontSize:13, marginTop:8 }}>Le moteur pour trouver plus vite votre alternance.</p>
            </div>
            <div>
              <div className="footer-title">Ressources</div>
              <a className="footer-link" href="#">FAQ</a>
              <a className="footer-link" href="#">Blog</a>
            </div>
            <div>
              <div className="footer-title">Entreprise</div>
              <a className="footer-link" href="#">À propos</a>
              <a className="footer-link" href="#">Contact</a>
            </div>
            <div>
              <div className="footer-title">Légal</div>
              <a className="footer-link" href="#">CGU</a>
              <a className="footer-link" href="#">Confidentialité</a>
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
