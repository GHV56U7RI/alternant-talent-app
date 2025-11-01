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

/********************* NOUVEAU HEADER — HeaderGlassDropdown ************************/
function HeaderGlassDropdown() {
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
        .menu-item{ display:flex; align-items:center; gap:10px; padding:10px 12px; text-decoration:none; color:#fff; font-weight:600; font-size:13px; cursor:pointer; }
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
            <a href="#/profil" className="menu-item" role="menuitem" onClick={() => setMenuOpen(false)}>
              <User className="menu-icon" />
              <span>Profil</span>
            </a>
            <a href="#/favoris" className="menu-item" role="menuitem" onClick={() => setMenuOpen(false)}>
              <Heart className="menu-icon" />
              <span>Favoris</span>
            </a>
            <a href="#/parametres" className="menu-item" role="menuitem" onClick={() => setMenuOpen(false)}>
              <Settings className="menu-icon" />
              <span>Paramètres</span>
            </a>
            <a href="#/aide" className="menu-item" role="menuitem" onClick={() => setMenuOpen(false)}>
              <HelpCircle className="menu-icon" />
              <span>Aide</span>
            </a>
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

/********************* APP ************************/
export default function App() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const selectedJob = useMemo(() => jobs.find(j => j.id === selectedId) || jobs[0], [selectedId, jobs]);
  const [liked, setLiked] = useState({});
  const [showFavs, setShowFavs] = useState(false);

  // Charger les jobs depuis l'API au démarrage
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/jobs?limit=50');
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
  const openFullOffer = () => { const url = `https://example.com/offre/${encodeURIComponent(selectedJob.title)}`; window.open(url, '_blank', 'noopener'); };
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
        .search-section{ margin-top: var(--searchSectionTop); margin-bottom: var(--searchSectionBottom); }

        .filters-row{ display:flex; align-items:center; justify-content:center; gap:16px; white-space:nowrap; flex-wrap:wrap; }
        .filters-row > *{ flex:0 0 auto; }

        .btn{ border-radius:10px; font-weight:600; cursor:pointer; }
        .btn-primary{ background:#2563EB; color:#fff; }
        .btn-outline{ background:#fff; border:1px solid var(--border); color:var(--text); }
        .icon-btn{ width:var(--likeS); height:var(--likeS); display:flex; align-items:center; justify-content:center; background:#fff; border:1px solid var(--border); border-radius:12px; cursor:pointer; }
        .heart-liked{ background:var(--redBg); border-color:rgba(179,38,30,.35); }
        .counter{ display:inline-flex; align-items:center; height:var(--chipH); padding:0 10px; border-radius:9999px; border:none; background:var(--counterBg); font-weight:400; color:#6F6B65; font-size:13px; }
        .input-with-icon{ flex:1; display:flex; align-items:center; gap:8px; color:#8A867F; min-width:0; }
        .input-with-icon input{ flex:1; border:0; outline:none; background:transparent; color:var(--text); font-size:13px; }
        .mini-divider{ width:1px; height:14px; background:rgba(0,0,0,.14); }
        .search-btn{ margin-left:auto; display:inline-flex; align-items:center; gap:6px; font-weight:600; font-size:13px; padding:10px 16px; border-radius:9999px; color:#fff; background: linear-gradient(180deg, #2e6ffa 0%, var(--ctaBlue) 70%); border:1px solid var(--ctaBlueDark); box-shadow: inset 0 1px 0 rgba(255,255,255,.35), 0 6px 16px rgba(38,99,235,.28); transition: transform .08s ease, box-shadow .2s ease, filter .2s ease; cursor:pointer; }
        .search-btn:hover{ transform: translateY(-1px); box-shadow: inset 0 1.5px 0 rgba(255,255,255,.45), 0 10px 24px rgba(38,99,235,.34); filter:saturate(1.05); }
        .search-btn:active{ transform: translateY(0); box-shadow: inset 0 2px 6px rgba(0,0,0,.18), 0 6px 14px rgba(38,99,235,.25); }
        .search-btn svg{ width:16px; height:16px; }

        .seg{ display:inline-flex; align-items:center; height:var(--chipH); background:#fff; border:1px solid var(--border); border-radius:9999px; padding:2px; }
        .seg-item{ height:calc(var(--chipH) - 4px); display:inline-flex; align-items:center; padding:0 10px; border-radius:9999px; font-weight:500; color:#3F3D39; font-size:13px; cursor:pointer; }
        .seg-item.active{ background:#2B2B2B; color:#fff; font-weight:600; }
        .date-inline{ display:inline-flex; align-items:center; gap:6px; color:#1E40AF; font-size:12.5px; } .date-strong{ font-weight:700; } .date-normal{ font-weight:400; }
        .date-hr{ height:1px; background:var(--sep); margin:6px 0 8px; }
        .page-sep{ height:1px; background:var(--border); }
        .hr{ height:1px; background:var(--sep); }
        .like-top-right{ position:absolute; top:10px; right:10px; }
        .see-bottom-right{ position:absolute; right:12px; bottom:10px; display:inline-flex; align-items:center; gap:6px; font-weight:700; font-size:13px; padding:0; border:0; background:transparent; color:#2d6cf7; border-radius:0; box-shadow:none; cursor:pointer; }
        .see-bottom-right svg{ width:16px; height:16px; }
        @media (min-width:641px){ .see-bottom-right{ color: rgba(45,108,247,.85); } .see-bottom-right:hover{ color:#2d6cf7; } }
        .split-area{ display:grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap:18px; align-items:start; }
        .list-scroll{ grid-column: span 7 / span 7; height: var(--splitH); overflow-y:auto; padding-right:4px; }
        .detail-col{ grid-column: span 5 / span 5; position:relative; }
        .detail-sticky{ position:sticky; top: var(--stickyTop); }
        .with-like{ padding-right: calc(var(--likeS) + 22px); }

        .flow-hero{ position:relative; padding:72px 0 36px; }
        .flow-hero .bg-bleed{ position:absolute; inset:0; left:50%; width:100vw; transform:translateX(-50%); background:linear-gradient(180deg,#F7F7F8 0%, #FFFFFF 70%); z-index:0; }
        .flow-wrap{ position:relative; z-index:1; max-width:72rem; margin:0 auto; text-align:center; padding:0 16px; }
        .flow-title{ font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial; font-weight:900; letter-spacing:-.02em; font-size:clamp(40px, 6.5vw, 96px); line-height:.95; color:#111111; margin:0 0 10px; }
        .flow-sub{ color:#6b7280; font-weight:500; font-size:clamp(18px, 2.3vw, 28px); margin-top:8px; }
        @media (min-width: 1024px){ .flow-wrap{ padding-left:160px; padding-right:160px; } .flow-title{ font-size:clamp(20px, 3.25vw, 48px); } .flow-sub{ font-size:clamp(9px, 1.15vw, 14px); } }
        .flow-cta{ display:flex; justify-content:center; margin-top:28px; }
        .flow-btn{ display:inline-flex; align-items:center; gap:10px; background:#FAFAFA; border:1px solid #EAEAEA; border-radius:9999px; padding:12px 18px; font-weight:700; cursor:pointer; }
        .flow-btn--compact{ padding:4px 6px; font-size:10px; gap:6px; }
        .flow-divider{ width:1px; height:12px; background:rgba(0,0,0,.14); margin:0 6px; }
        .flow-btn .txt-muted{ color:#6F6B65; font-weight:600; }
        .flow-btn .txt-strong{ font-weight:700; }
        .flow-underline{ position:relative; display:inline-block; }

        .tool-card{ border:1px solid var(--borderStrong); border-radius:var(--radiusSoft); padding:10px; background:#fff; display:grid; gap:8px; }
        .tool-row{ display:flex; align-items:center; justify-content:space-between; gap:10px; }
        .tool-row label{ color:#3F3D39; font-size:13px; }
        .tool-row input{ width:120px; background:#fff; border:1px solid var(--border); border-radius:6px; padding:6px 8px; font-size:13px; color:var(--text); }
        .tool-results{ display:grid; gap:6px; padding-top:4px; }
        .tool-results .k{ color:#6F6B65; font-size:12.5px; }
        .tool-results .v{ font-weight:700; color:#1F1E1B; }
        .tool-note{ color:#8B877F; font-size:12px; }

        .pad-card{ padding: var(--cardPad); padding-bottom: 32px; }

        .cookie-bar{ position:fixed; left:0; right:0; bottom:0; z-index:60; color:#fff; background:rgba(17,17,17,.78); backdrop-filter:saturate(120%) blur(4px); -webkit-backdrop-filter:saturate(120%) blur(4px); border:0; box-shadow:0 -6px 18px rgba(0,0,0,.18); }
        .cookie-inner{ max-width:72rem; margin:0 auto; padding:8px 12px; display:flex; align-items:center; gap:8px; justify-content:space-between; }
        .cookie-text{ opacity:.96; font-size:12.5px; }
        .cookie-actions{ display:flex; align-items:center; gap:8px; }
        .cookie-accept{ background:#fff; color:#111; border:0; border-radius:9999px; padding:6px 10px; font-weight:700; cursor:pointer; }
        .cookie-decline{ background:transparent; color:#fff; border:0; padding:6px 8px; text-decoration:underline; cursor:pointer; }

        .footer-shell{ background:#fff; border-top:1px solid var(--border); }
        .footer-inner{ max-width:72rem; margin:0 auto; padding:24px 16px; }
        .footer-grid{ display:grid; grid-template-columns:1.5fr repeat(3,1fr); gap:24px; align-items:flex-start; }
        .footer-title{ font-weight:700; font-size:14px; color:#1F1E1B; margin-bottom:8px; }
        .footer-link{ display:block; color:#6F6B65; font-size:13px; padding:4px 0; text-decoration:none; }
        .footer-link:hover{ color:#1F1E1B; }
        .footer-brand{ display:flex; align-items:center; gap:8px; color:#1F1E1B; }
        .footer-bottom{ margin-top:16px; padding-top:12px; border-top:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; color:#6F6B65; font-size:12px; }
        .footer-bottom .footer-link{ display:inline-block; padding:0; margin-left:12px; }

        .job-bullets{ margin: 8px 0 0 18px; padding: 0; list-style: disc; color: var(--muted); font-size: 13px; }
        .job-bullets li{ line-height: 1.5; }

        .actions-row{ display:flex; align-items:center; gap:10px; justify-content:flex-end; }
        .action-pill{ display:inline-flex; align-items:center; gap:8px; height:40px; padding:0 12px; background:#fff; border-radius:10px; font-weight:700; font-size:13px; }
        .action-share{ border:1px solid var(--border); color:var(--text); }
        .action-share:hover{ background:var(--hoverBg); }
        .action-apply{ border:1px solid var(--ctaBlue); color:var(--ctaBlue); font-weight:800; }
        .action-apply:hover{ background:rgba(45,108,247,.06); }
        .action-apply:active{ background:rgba(45,108,247,.12); }

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

      <HeaderGlassDropdown />

      <section className="mx-auto max-w-6xl px-4 mt-0">
        <LightActionHero onPrimaryClick={scrollToSearch} />
      </section>

      <section className="mx-auto max-w-6xl px-4 mt-5 search-section" id="search">
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
        <div className="filters-row" data-testid="filters-inline">
          <span className="counter">{visibleJobs.length} offres visibles</span>
          <span className="counter">{Object.values(liked).filter(Boolean).length} favoris</span>
          <div className="seg">
            <button className={`seg-item ${!showFavs ? 'active' : ''}`} onClick={() => setShowFavs(false)}>Toutes les offres</button>
            <button className={`seg-item ${showFavs ? 'active' : ''}`} onClick={() => setShowFavs(true)}>Favoris</button>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 mt-5 pb-8 split-area" id="jobs-list">
        <div className="list-scroll">
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
              Chargement des offres...
            </div>
          ) : visibleJobs.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
              Aucune offre trouvée
            </div>
          ) : (
            <div className="space-y-3">
            {visibleJobs.map((job, idx) => {
              const isLiked = !!liked[job.id];
              const isSelected = job.id === selectedId;
              const isFirst = idx === 0;
              return (
                <article
                  key={job.id}
                  className={`relative card overflow-hidden ${isSelected ? 'card--selected' : ''} ${isFirst ? 'card--first' : ''}`}
                  data-testid={`job-${job.id}`}
                >
                  <div className="like-top-right">
                    <button
                      aria-label={isLiked ? "Retirer des favoris" : "Ajouter aux favoris"}
                      className={`icon-btn ${isLiked ? 'heart-liked' : ''}`}
                      onClick={() => toggleLike(job.id)}
                    >
                      <Heart
                        className="w-4 h-4"
                        style={{ color: isLiked ? 'var(--redText)' : 'inherit' }}
                        fill={isLiked ? 'currentColor' : 'none'}
                      />
                    </button>
                  </div>
                  <button
                    onClick={() => (isMobile ? openFullOffer() : handleVoir(job.id))}
                    className="see-bottom-right"
                    data-testid={`voir-${job.id}`}
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
                        <h3 className="font-semibold leading-snug" style={{ fontSize: 'var(--titleList)', color: 'var(--text)' }}>{job.title}</h3>
                        <div className="mt-1.5 flex flex-wrap items-center gap-3" style={{ fontSize: 'var(--meta)', color: 'var(--muted)' }}>
                          <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" />{job.company}</span>
                          <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{job.location}</span>
                          {job.salary && <span className="font-semibold">{job.salary}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        </div>

        {!loading && selectedJob && (
          <aside className="detail-col" ref={detailRef}>
          <div className="card overflow-hidden detail-sticky">
            <div className="p-5 space-y-3" style={{display:'flex', flexDirection:'column', flex:1}}>
              <div className="date-inline"><Calendar className="w-3.5 h-3.5"/> <span className="date-normal">{fmtDate(selectedJob.publishedAt)}</span></div>
              <div className="flex items-start gap-3">
                <SquareDotLogo name={selectedJob.company} size={40} />
                <div className="flex-1">
                  <h2 className="font-semibold leading-snug" data-testid="detail-title" style={{ fontSize:'var(--titleDetail)', color:'var(--text)' }}>{selectedJob.title}</h2>
                  <div className="mt-1 flex flex-wrap items-center gap-3" style={{color:'#6F6B65', fontSize:'var(--meta)'}}>
                    <span className="inline-flex items-center gap-2"><Building2 className="w-4 h-4"/> {selectedJob.company}</span>
                    <span className="inline-flex items-center gap-2"><MapPin className="w-4 h-4"/> {selectedJob.location}</span>
                  </div>
                </div>
                <button className={`icon-btn ${liked[selectedJob.id]? 'heart-liked':''}`} aria-label="Aimer" onClick={()=>toggleLike(selectedJob.id)}>
                  <Heart className="w-4 h-4" style={{ color: liked[selectedJob.id]? 'var(--redText)' : 'inherit' }} fill={liked[selectedJob.id]? 'currentColor' : 'none'} />
                </button>
              </div>
              <div className="hr" />

              {selectedJob.salary && (
                <div className="inline-flex items-center gap-2 salary-chip" style={{ borderRadius:8, padding:'6px 10px', background:'#f7f6f4', border:'1px solid var(--border)' }}>
                  <span>{selectedJob.salary}</span>
                  <span style={{ color:'#8B877F', display:'inline-flex', alignItems:'center', gap:4 }}>estimation <ChevronRight className="w-3 h-3"/></span>
                </div>
              )}

              <div className="tool-card">
                <div className="tool-row">
                  <label>Brut mensuel (€)</label>
                  <input data-testid="salary-gross-input" type="number" min={0} step={50} value={gross} onChange={(e)=> setGross(clamp(toNumber(e.target.value), 0, 100000))} />
                </div>
                <div className="tool-row">
                  <label>Heures / semaine</label>
                  <input data-testid="salary-hours-input" type="number" min={1} max={45} step={1} value={hours} onChange={(e)=> setHours(clamp(toNumber(e.target.value), 1, 60))} />
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
