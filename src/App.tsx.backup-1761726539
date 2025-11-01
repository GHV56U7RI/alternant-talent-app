import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  MapPin,
  BriefcaseBusiness,
  Heart,
  X,
  Building2,
  Share2,
  ChevronRight,
  Calendar,
} from "lucide-react";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  posted: string;
  tags: string[];
  url: string;
  source: string;
  logo_domain?: string;
  logo_url?: string;
}

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

function useMobileDetect() {
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
  return isMobile;
}

function hash(str: string){ let h=0; for(let i=0;i<str.length;i++){ h=(h<<5)-h+str.charCodeAt(i); h|=0; } return Math.abs(h); }
function fmtDate(iso: string){ try{ return new Date(iso).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'}); }catch{ return iso; }}

const VIBRANT = ["#FF3B3B","#FF6A00","#FFB800","#22C55E","#10B981","#06B6D4","#3B82F6","#6366F1","#8B5CF6","#EC4899","#F43F5E"];

function CompanyLogo({ company, logoDomain, logoUrl, size=40 }: { company: string; logoDomain?: string; logoUrl?: string; size?: number }){
  const [imgError, setImgError] = useState(false);

  const logoSrc = useMemo(() => {
    if (logoUrl && logoUrl.trim()) return logoUrl;
    if (logoDomain && logoDomain.trim()) {
      return `https://logo.clearbit.com/${logoDomain}`;
    }
    return null;
  }, [logoUrl, logoDomain]);

  if (!logoSrc || imgError) {
    const idx = hash(company);
    const color = VIBRANT[idx % VIBRANT.length];
    const r = Math.round(size*0.34);
    return (
      <div style={{ width:size, height:size, borderRadius:8, border:'1px solid rgba(0,0,0,.12)', display:'grid', placeItems:'center', background:'#fff' }} aria-label={`Logo ${company}`}>
        <div style={{ width:r*2, height:r*2, borderRadius:'50%', background:color }} />
      </div>
    );
  }

  return (
    <div style={{ width:size, height:size, borderRadius:8, border:'1px solid rgba(0,0,0,.12)', display:'grid', placeItems:'center', background:'#fff', overflow:'hidden' }} aria-label={`Logo ${company}`}>
      <img
        src={logoSrc}
        alt={company}
        style={{ width: '80%', height: '80%', objectFit: 'contain' }}
        onError={() => setImgError(true)}
        loading="lazy"
      />
    </div>
  );
}

function LightActionHero({ onPrimaryClick }:{ onPrimaryClick?: ()=>void }){
  return (
    <div data-testid="light-hero" className="la-hero flow-hero">
      <div className="bg-bleed" aria-hidden />
      <div className="flow-wrap">
        <h1 className="flow-title">Trouve ton alternance <span className="flow-underline">plus vite</span></h1>
        <p className="flow-sub">Postule en toute simplicité : importe tes offres, suis tes candidatures et décroche ton contrat, le tout au même endroit.</p>
        <div className="flow-cta"><button className="flow-btn" onClick={onPrimaryClick}><BriefcaseBusiness className="w-4 h-4"/> Voir les offres</button></div>
      </div>
    </div>
  );
}

export default function App(){
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedJob = useMemo(()=> jobs.find(j=>j.id===selectedId) || jobs[0], [selectedId, jobs]);
  const shrunk = useScrollShrink(8);
  const isMobile = useMobileDetect();
  const [isLoginOpen, setLoginOpen] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [showFavs, setShowFavs] = useState(false);

  const [qDraft, setQDraft] = useState("");
  const [cityDraft, setCityDraft] = useState("");
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");

  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const [cookieChoice, setCookieChoice] = useState<string>(()=>{
    try{ return localStorage.getItem('cookieConsent') || ""; }catch{ return ""; }
  });
  const acceptCookies = ()=>{ try{ localStorage.setItem('cookieConsent','accepted'); }catch{} setCookieChoice('accepted'); };
  useEffect(() => {
    try {
      const sp = new URL(window.location.href).searchParams;
      const mode = sp.get('cookies');
      if (mode === 'show' || mode === 'force') {
        try { localStorage.removeItem('cookieConsent'); } catch {}
        setCookieChoice('');
      }
    } catch {}
  }, []);
  const declineCookies = ()=>{ try{ localStorage.setItem('cookieConsent','declined'); }catch{} setCookieChoice('declined'); };

  // Initial load
  useEffect(() => {
    const loadJobs = async () => {
      try {
        setLoading(true);
        setOffset(0);
        setHasMore(true);
        const params = new URLSearchParams({
          limit: '1000',
          offset: '0',
          q: q.trim(),
          location: city.trim()
        });
        const response = await fetch(`/api/jobs?${params}`);
        const data = await response.json();
        setJobs(data.jobs || []);
        setHasMore((data.jobs || []).length >= 1000);
        if (data.jobs && data.jobs.length > 0 && !selectedId) {
          setSelectedId(data.jobs[0].id);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des jobs:', error);
      } finally {
        setLoading(false);
      }
    };
    loadJobs();
  }, [q, city]);

  // Load more jobs
  const loadMoreJobs = async () => {
    if (loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      const newOffset = offset + 1000;
      const params = new URLSearchParams({
        limit: '1000',
        offset: String(newOffset),
        q: q.trim(),
        location: city.trim()
      });
      const response = await fetch(`/api/jobs?${params}`);
      const data = await response.json();
      const newJobs = data.jobs || [];

      if (newJobs.length > 0) {
        setJobs(prev => [...prev, ...newJobs]);
        setOffset(newOffset);
        setHasMore(newJobs.length >= 1000);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de plus de jobs:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMoreJobs();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [hasMore, loadingMore, loading, offset, q, city]);

  const detailRef = useRef<HTMLDivElement|null>(null);
  const scrollToSearch = ()=>{
    document.getElementById('search')?.scrollIntoView({behavior:'smooth', block:'start'});
  };
  const applySearch = ()=>{
    setQ(qDraft.trim());
    setCity(cityDraft.trim());
    document.getElementById('jobs-list')?.scrollIntoView({behavior:'smooth', block:'start'});
  };
  const handleVoir = (id:string)=>{
    setSelectedId(id);
    setShowFavs(false);
    setTimeout(()=>{
      if (detailRef.current && window.innerWidth >= 641) {
        detailRef.current.scrollIntoView({behavior:'smooth', block:'start'});
      }
    },0);
  };
  const handleShare = async ()=>{
    if (!selectedJob) return;
    const data = { title: selectedJob.title, text: `${selectedJob.company} – ${selectedJob.location}`, url: selectedJob.url };
    try{
      if (navigator.share){
        await navigator.share(data);
      } else {
        await navigator.clipboard.writeText(`${data.title} — ${data.text} — ${data.url}`);
        alert('Lien copié dans le presse‑papiers');
      }
    }catch{}
  };
  const openFullOffer = ()=>{
    if (!selectedJob) return;
    window.open(selectedJob.url, '_blank', 'noopener');
  };

  const toggleLike = (id:string)=> setLiked(p=>({ ...p, [id]: !p[id] }));

  const filtered = useMemo(()=>{
    return jobs;
  },[jobs]);

  const visibleJobs = useMemo(()=> showFavs ? filtered.filter(j=>liked[j.id]) : filtered, [showFavs, liked, filtered]);

  if (loading && jobs.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background:'var(--bg)' }}>
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Chargement des offres...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${showFavs ? 'showFavsMobile' : ''}`} style={{ background:'var(--bg)', color:'var(--text)' }}>
      <style>{`
        :root{
          --bg:#FFFFFF; --panel:#FFFFFF; --text:#0F0F10; --muted:#6F6B65; --headerPill:rgba(255,255,255,.55);
          --border:#ECEBEA; --borderStrong:#E6E5E3; --sep:#E6E5E3; --heroBg:#F5F6F7;
          --blueText:#1E40AF; --counterBg:#f7f6f4; --redBg:#FFE7E6; --redText:#B3261E;
          --stickyTop:88px; --splitH:calc(100vh - 280px);
          --logoS:40px; --likeS:36px; --cardPad:12px; --rowMinH:108px; --titleList:18px; --titleDetail:20px; --meta:13px; --radiusSoft:6px;
          --chipH:30px;
          --flowCream:#F4ECFF;
          --flowLavGradStart:#DCCBFF; --flowLavGradEnd:#CFE5FF;
        }
        .card{ background:var(--panel); border:1px solid var(--border); border-radius:var(--radiusSoft); position:relative; }
        .search-wrap{ display:flex; align-items:center; gap:10px; background:#fff; border:1px solid var(--borderStrong); border-radius:9999px; padding:10px 12px; width:100%; box-sizing:border-box; }
        .btn{ border-radius:10px; font-weight:600; cursor:pointer; }
        .btn-primary{ background:#2563EB; color:#fff; border:none; }
        .btn-outline{ background:#fff; border:1px solid var(--border); color:var(--text); }
        .icon-btn{ width:var(--likeS); height:var(--likeS); display:flex; align-items:center; justify-content:center; background:#fff; border:1px solid var(--border); border-radius:12px; cursor:pointer; }
        .heart-liked{ background:var(--redBg); border-color:rgba(179,38,30,.35); }
        .counter{ display:inline-flex; align-items:center; height:var(--chipH); padding:0 10px; border-radius:9999px; border:none; background:var(--counterBg); font-weight:400; color:#6F6B65; font-size:13px; }
        .input-with-icon{ flex:1; display:flex; align-items:center; gap:8px; color:#8A867F; min-width:0; }
        .input-with-icon input{ flex:1; border:0; outline:none; background:transparent; color:var(--text); font-size:13px; }
        .mini-divider{ width:1px; height:14px; background:rgba(0,0,0,.14); }
        .search-btn{ margin-left:auto; background:#2B2B2B; color:#fff; padding:8px 12px; border-radius:9999px; font-weight:700; font-size:13px; display:inline-flex; align-items:center; gap:6px; flex-shrink:0; border:none; cursor:pointer; }
        .seg{ display:inline-flex; align-items:center; height:var(--chipH); background:#fff; border:1px solid var(--border); border-radius:9999px; padding:2px; }
        .seg-item{ height:calc(var(--chipH) - 4px); display:inline-flex; align-items:center; padding:0 10px; border-radius:9999px; font-weight:500; color:#3F3D39; font-size:13px; border:none; background:transparent; cursor:pointer; }
        .seg-item.active{ background:#2B2B2B; color:#fff; font-weight:600; }
        .date-inline{ display:inline-flex; align-items:center; gap:6px; color:var(--blueText); font-size:12.5px; } .date-strong{ font-weight:700; } .date-normal{ font-weight:400; }
        .header-shell{ position:static; background:var(--flowCream); }
        .header-shell.blurred{ background:rgba(244,236,255,0.85); backdrop-filter:saturate(180%) blur(10px); box-shadow:0 6px 24px rgba(0,0,0,.04); }
        .header-pill{ position:fixed; top:8px; left:50%; transform:translateX(-50%); z-index:70; background:var(--headerPill); border:1px solid rgba(255,255,255,.55); backdrop-filter:saturate(180%) blur(8px); -webkit-backdrop-filter:saturate(180%) blur(8px); border-radius:9999px; }
        .header-pill.blurred{ background:rgba(255,255,255,.55); }
        .page-sep{ height:1px; background:var(--border); }
        .like-top-right{ position:absolute; top:10px; right:10px; }
        .see-bottom-right{ position:absolute; right:12px; bottom:10px; display:flex; align-items:center; gap:6px; font-weight:600; font-size:13px; border:none; background:transparent; cursor:pointer; }
        .split-area{ display:grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap:18px; align-items:start; }
        .list-scroll{ grid-column: span 7 / span 7; height: var(--splitH); overflow-y:auto; padding-right:4px; }
        .detail-col{ grid-column: span 5 / span 5; position:relative; }
        .detail-sticky{ position:sticky; top: var(--stickyTop); }
        .with-like{ padding-right: calc(var(--likeS) + 22px); }

        .flow-hero{ position:relative; padding:56px 0 28px; }
        .flow-hero .bg-bleed{ position:absolute; inset:0; left:50%; width:100vw; transform:translateX(-50%); background:linear-gradient(180deg,var(--flowCream) 0%, #FFFFFF 80%); z-index:0; }
        .flow-wrap{ position:relative; z-index:1; max-width:56rem; margin:0 auto; text-align:center; padding:0 16px; }
        .flow-title{ font-family: ui-serif, Georgia, Cambria, Times, serif; font-weight:800; letter-spacing:-0.01em; font-size:clamp(42px,7vw,88px); line-height:1; color:#171717; }
        .flow-sub{ color:#3F3D39; opacity:0.85; font-size:clamp(16px,2.2vw,22px); margin-top:18px; }
        .flow-cta{ display:flex; justify-content:center; margin-top:22px; }
        .flow-btn{ display:inline-flex; align-items:center; gap:10px; background:#FAF7FF; border:1px solid #E9E1FF; border-radius:9999px; padding:12px 18px; font-weight:700; cursor:pointer; }
        .flow-btn:hover{ box-shadow:0 6px 18px rgba(0,0,0,0.06); }
        .flow-underline{ position:relative; display:inline-block; }
        .flow-underline::after{ content:""; position:absolute; left:0; right:0; bottom:-8px; height:12px; border-radius:8px; background:linear-gradient(90deg, var(--flowLavGradStart) 0%, var(--flowLavGradEnd) 100%); }

        .tool-card{ border:1px solid var(--borderStrong); border-radius:var(--radiusSoft); padding:10px; background:#fff; display:grid; gap:8px; }
        .tool-row{ display:flex; align-items:center; justify-content:space-between; gap:10px; }
        .tool-row label{ color:#3F3D39; font-size:13px; }
        .tool-row input{ width:120px; background:#fff; border:1px solid var(--border); border-radius:6px; padding:6px 8px; font-size:13px; color:var(--text); }
        .tool-results{ display:grid; gap:6px; padding-top:4px; }
        .tool-results .k{ color:#6F6B65; font-size:12.5px; }
        .tool-results .v{ font-weight:700; color:#1F1E1B; }
        .tool-note{ color:#8B877F; font-size:12px; }

        .filters-row{ display:flex; align-items:center; gap:12px; white-space:nowrap; }
        .filters-row > *{ flex:0 0 auto; }
        .brand-text{ text-overflow: ellipsis; font-size:12.5px; transition:max-width .22s ease, opacity .16s ease, transform .16s ease; }

        .header-pill{ display:flex; align-items:center; gap:10px; white-space:nowrap; overflow:hidden; transition: padding .18s ease, gap .18s ease, background .2s ease, border-color .2s ease; }
        .header-pill.shrunk{ gap:6px; }
        .header-pill .btn-login{ white-space:nowrap; }
        .brand-badge{ display:inline-flex; align-items:center; justify-content:center; background:#0f0f10; color:#fff; border-radius:10px; height:18px; padding:0 8px; font-weight:700; font-size:10.5px; letter-spacing:.04em; line-height:1; }
        .brand-sep{ width:1px; height:16px; background:rgba(0,0,0,.22); margin:0 8px; display:inline-block; vertical-align:middle; transition:opacity .16s ease, transform .16s ease; }
        .header-pill.shrunk .brand-sep{ opacity:0; transform:scaleY(0.2); width:0; margin:0; }
        .pad-card{ padding: var(--cardPad); padding-bottom: 32px; }

        .cookie-bar{ position:fixed; left:0; right:0; bottom:0; z-index:60; color:#fff; background:rgba(17,17,17,.78); backdrop-filter:saturate(120%) blur(4px); -webkit-backdrop-filter:saturate(120%) blur(4px); border:0; box-shadow:0 -6px 18px rgba(0,0,0,.18); }
        .cookie-bar::before{ display:none; }
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

        @media (max-width: 640px){
          :root{ --chipH:24px; }
          .filters-row{ gap:6px; overflow-x:auto; padding-bottom:2px; }
          .counter{ padding:0 8px; font-size:11px; }
          .seg-item{ padding:0 8px; font-size:11px; }
          .search-wrap{ padding:8px 8px; gap:8px; }
          .search-btn{ padding:6px 10px; font-size:12px; }
          .city-input{ max-width:140px; }
          .split-area{ display:block; }
          .list-scroll{ height:auto; overflow:visible; padding-right:0; }
          .detail-col{ display:none; }
          .cookie-inner{ flex-direction:column; align-items:stretch; gap:8px; }
          .cookie-actions{ justify-content:flex-end; }
          .header-pill{ max-width: calc(100vw - 12px); white-space:nowrap; }
          .header-pill .brand-text{ display:inline-block; font-size:12px; }
          .header-pill .btn-login{ padding:2px 8px; font-size:11px; border-radius:9999px; white-space:nowrap; }
          .brand-badge{ height:16px; padding:0 6px; font-size:9.5px; }
        }

        @media (max-width: 1024px){ .split-area{ display:block; } .list-scroll{ height:auto; overflow:visible; } .detail-sticky{ position:static; } }
        @media (min-width: 641px){ .detail-col{ display:block; } }
      `}</style>

      <header className="header-shell">
        <div className="mx-auto max-w-6xl px-4 flex items-center justify-between" style={{ paddingTop: shrunk ? 4 : 8, paddingBottom: shrunk ? 4 : 8 }}>
          <div className={`header-pill ${shrunk ? 'shrunk' : ''}`} style={{ padding: shrunk ? "4px 10px" : "6px 12px" }}>
            <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="brand-badge">mon</span>
              <span className="brand-sep" aria-hidden></span>
              <span className="brand-text inline-block font-medium whitespace-nowrap overflow-hidden" style={{ color: "var(--text)", maxWidth: shrunk ? 0 : 160, opacity: shrunk ? 0 : 1, transform: shrunk ? "translateY(-1px) scale(0.98)" : "none" }} aria-hidden={shrunk}>alternance & talent</span>
            </Link>
            <button onClick={() => setLoginOpen(true)} className="btn btn-outline px-3 py-1 text-sm" data-testid="btn-login">Se connecter</button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 mt-5" id="search">
        <div className="search-wrap">
          <div className="input-with-icon">
            <BriefcaseBusiness className="w-4 h-4" />
            <input
              aria-label="Poste, entreprise, mot-clé"
              placeholder="Poste, entreprise, mot-clé"
              value={qDraft}
              onChange={e=>setQDraft(e.target.value)}
              onKeyDown={e=>{ if(e.key==='Enter') applySearch(); }}
            />
          </div>
          <div className="input-with-icon city-input">
            <MapPin className="w-4 h-4" />
            <span className="mini-divider" />
            <input
              aria-label="Ville"
              placeholder="Ville"
              value={cityDraft}
              onChange={e=>setCityDraft(e.target.value)}
              onKeyDown={e=>{ if(e.key==='Enter') applySearch(); }}
            />
          </div>
          <button className="search-btn" onClick={applySearch}><Search className="w-4 h-4"/> Rechercher</button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 mt-3">
        <div className="filters-row">
          <span className="counter">{visibleJobs.length} offres visibles</span>
          <span className="counter">{Object.values(liked).filter(Boolean).length} favoris</span>
          <div className="seg">
            <button className={`seg-item ${!showFavs ? 'active' : ''}`} onClick={()=>setShowFavs(false)}>Toutes les offres</button>
            <button className={`seg-item ${showFavs ? 'active' : ''}`} onClick={()=>setShowFavs(true)}>Favoris</button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 my-4"><div className="page-sep" /></div>

      <main className="mx-auto max-w-6xl px-4 mt-5 pb-8 split-area" id="jobs-list">
        <div className="list-scroll">
          <div className="space-y-3">
            {visibleJobs.map((job) => {
              const isLiked = !!liked[job.id];
              return (
                <article key={job.id} className={`relative card overflow-hidden`} data-testid={`job-${job.id}`}>
                  <div className="like-top-right">
                    <button aria-label={isLiked?"Retirer des favoris":"Ajouter aux favoris"} className={`icon-btn ${isLiked? 'heart-liked':''}`} onClick={()=>toggleLike(job.id)}>
                      <Heart className="w-4 h-4" style={{ color: isLiked? 'var(--redText)' : 'inherit' }} fill={isLiked? 'currentColor' : 'none'} />
                    </button>
                  </div>
                  <button onClick={() => (isMobile ? openFullOffer() : handleVoir(job.id))} className="see-bottom-right" style={{ color:"var(--text)" }} data-testid={`voir-${job.id}`}>
                    {isMobile ? 'Postuler' : 'Voir'} <ChevronRight className="w-4 h-4" />
                  </button>

                  <div className="pad-card with-like" style={{minHeight:'var(--rowMinH)'}}>
                    <div className="date-inline mb-1">
                      <Calendar className="w-3.5 h-3.5"/>
                      <span className="date-strong">{job.posted}</span>
                    </div>

                    <div className="flex items-start gap-3 md:gap-4">
                      <CompanyLogo company={job.company} logoDomain={job.logo_domain} logoUrl={job.logo_url} size={40} />

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold leading-snug" style={{ fontSize:'var(--titleList)', color:'var(--text)' }}>{job.title}</h3>
                        <div className="mt-1.5 flex flex-wrap items-center gap-3" style={{fontSize:'var(--meta)'}}>
                          <span className="inline-flex items-center gap-2" style={{color:'#6F6B65'}}><Building2 className="w-4 h-4"/> {job.company}</span>
                          <span className="inline-flex items-center gap-2" style={{color:'#6F6B65'}}><MapPin className="w-4 h-4"/> {job.location}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Infinite scroll trigger */}
          {!showFavs && (
            <div ref={loadMoreRef} className="mt-6 pb-4 text-center">
              {loadingMore && (
                <div className="flex items-center justify-center gap-2">
                  <div className="inline-block w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                  <span className="text-sm" style={{ color: 'var(--muted)' }}>Chargement d'autres offres...</span>
                </div>
              )}
              {!hasMore && !loadingMore && visibleJobs.length > 0 && (
                <p className="text-sm" style={{ color: 'var(--muted)' }}>Vous avez vu toutes les offres disponibles</p>
              )}
            </div>
          )}
        </div>

        {!isMobile && selectedJob && (
          <aside className="detail-col">
            <div className="card overflow-hidden detail-sticky" ref={detailRef}>
              <div className="p-5 space-y-3" style={{display:'flex', flexDirection:'column', flex:1}}>
                <div className="date-inline">
                  <Calendar className="w-3.5 h-3.5"/>
                  <span className="date-normal">{selectedJob.posted}</span>
                </div>
                <div className="flex items-start gap-3">
                  <CompanyLogo company={selectedJob.company} logoDomain={selectedJob.logo_domain} logoUrl={selectedJob.logo_url} size={40} />
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

                <div className="hr" style={{margin:'12px 0', height:1, background:'var(--border)'}} />

                <div className="tool-card">
                  <div className="tool-row">
                    <label>Brut mensuel (€)</label>
                    <input type="number" min={0} step={50} defaultValue={1500} />
                  </div>
                  <div className="tool-row">
                    <label>Heures / semaine</label>
                    <input type="number" min={1} max={45} step={1} defaultValue={35} />
                  </div>
                  <div className="tool-results">
                    <div><span className="k">Taux horaire brut</span> <span className="v">(outil démo)</span></div>
                    <div><span className="k">Net estimé / mois</span> <span className="v">(outil démo)</span></div>
                  </div>
                  <p className="tool-note">Calcul indicatif. Le net dépend du statut et des cotisations.</p>
                </div>

                <div className="hr" style={{margin:'16px 0', height:1, background:'var(--border)'}} />

                <div style={{flex:1}}>
                  <h3 className="font-semibold" style={{ color:'var(--text)' }}>À propos du poste</h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color:'var(--muted)' }}>
                    Rejoignez <strong>{selectedJob.company}</strong> pour cette opportunité d'alternance.
                    {selectedJob.tags && selectedJob.tags.length > 0 && (
                      <span> Compétences recherchées : {selectedJob.tags.join(', ')}.</span>
                    )}
                  </p>
                  <ul className="mt-3 space-y-1 text-sm list-disc pl-5" style={{ color:'#58544E' }}>
                    <li><span className="font-medium">Localisation:</span> {selectedJob.location}</li>
                    <li><span className="font-medium">Publication:</span> {selectedJob.posted}</li>
                    <li><span className="font-medium">Source:</span> {selectedJob.source}</li>
                  </ul>
                </div>

                <div className="hr" style={{margin:'16px 0', height:1, background:'var(--border)'}} />

                <div className="flex gap-3 pt-2">
                  <button className="btn btn-outline px-4 py-2 text-sm inline-flex items-center gap-2" onClick={handleShare}><Share2 className="w-4 h-4" /> Partager</button>
                  <button className="btn btn-primary px-4 py-2 text-sm inline-flex items-center gap-2" onClick={openFullOffer}>Voir l'offre complète <ChevronRight className="w-4 h-4" /></button>
                </div>

                <div className="hr" style={{margin:'16px 0 0', height:1, background:'var(--border)'}} />
              </div>
            </div>
          </aside>
        )}
      </main>

      {isLoginOpen && (
        <div className="fixed inset-0 z-[60]" aria-modal role="dialog">
          <div className="absolute inset-0" style={{ background:"rgba(0,0,0,0.3)" }} onClick={() => setLoginOpen(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-md card p-6" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold" style={{ color: "var(--text)" }}>{isSignup ? "Créer un compte" : "Se connecter"}</h2>
                <button onClick={() => setLoginOpen(false)} aria-label="Fermer" className="p-2 rounded-lg hover:opacity-90"><X className="w-4 h-4" /></button>
              </div>
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                {isSignup && (
                  <div>
                    <label className="font-bold text-sm mb-2 block" htmlFor="signup-name" style={{ color: '#3F3D39' }}>Nom complet</label>
                    <input id="signup-name" className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-sm" placeholder="Jean Dupont" type="text" required style={{ borderColor: 'var(--border)' }} />
                  </div>
                )}
                <div>
                  <label className="font-bold text-sm mb-2 block" htmlFor="login-email" style={{ color: '#3F3D39' }}>Email</label>
                  <input id="login-email" className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-sm" placeholder="email@exemple.com" type="email" required style={{ borderColor: 'var(--border)' }} />
                </div>
                <div>
                  <label className="font-bold text-sm mb-2 block" htmlFor="login-password" style={{ color: '#3F3D39' }}>Mot de passe</label>
                  <input id="login-password" className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-sm" placeholder="••••••••" type="password" required style={{ borderColor: 'var(--border)' }} />
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

      {cookieChoice === '' && (
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
              <Link className="footer-link" to="/confidentialite">Confidentialité</Link>
              <a className="footer-link" href="#">Cookies</a>
              <Link className="footer-link" to="/conditions">Conditions</Link>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} Alternance & Talent. Tous droits réservés.</span>
            <div>
              <a className="footer-link" href="#">Statut</a>
              <a className="footer-link" href="#">Sécurité</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
