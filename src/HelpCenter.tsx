import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  HelpCircle,
  BookOpen,
  FileText,
  Users,
  Building2,
  Mail,
  MessageCircle,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  X,
  Home,
  Star,
} from "lucide-react";

/* =========================================================
   Centre d'aide — Alternance & Talent (perso + pro) avec routing hash
   ► Version ESPACES améliorés + Suppression du bloc Résultats rapides
   ► Fond de statut = #f7f6f4, bordure grise plus foncée
   - Conserve header/footer, routes: Accueil / Catégorie / Article / Guide
   ========================================================= */

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

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

// === Notation étoiles pour les questions ===
function hash(str){ let h=0; for(let i=0;i<str.length;i++){ h=(h<<5)-h+str.charCodeAt(i); h|=0; } return Math.abs(h); }
function getStars(id){ const n = (hash(String(id)) % 3) + 3; return n; } // 3..5 étoiles
function Stars({ value=4 }){
  const arr = [0,1,2,3,4];
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} étoiles`}>
      {arr.map(i=> i < value
        ? <Star key={i} className="w-3.5 h-3.5" fill="currentColor" stroke="none" style={{ color:'#F59E0B' }}/>
        : <Star key={i} className="w-3.5 h-3.5" style={{ color:'#D6D3CE' }} />
      )}
    </span>
  );
}

// ====== Mini Router basé sur location.hash ======
function parseHash() {
  const raw = (typeof window !== 'undefined' ? window.location.hash : '') || '#/aide';
  const parts = raw.replace(/^#\//, '').split('/');
  // Ex: #/aide/article/perso-001
  let view = 'home';
  let params = {};
  if (parts[0] === 'aide') {
    if (parts[1] === 'article' && parts[2]) { view = 'article'; params.id = parts[2]; }
    else if (parts[1] === 'categorie' && parts[2]) { view = 'category'; params.id = parts[2]; }
    else if (parts[1] === 'guide' && parts[2]) { view = 'guide'; params.id = parts[2]; }
    else { view = 'home'; }
  }
  return { view, params };
}

function useHashRoute(){
  const [route, setRoute] = useState(parseHash());
  useEffect(() => {
    const onChange = () => setRoute(parseHash());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  const go = (hash) => { if (typeof window !== 'undefined') window.location.hash = hash; };
  return [route, go];
}

// ===== Données de base =====
const CATEGORIES = [
  { id: "compte", label: "Compte & Connexion", icon: Users },
  { id: "candidatures", label: "Candidatures", icon: FileText },
  { id: "alertes", label: "Alertes emploi", icon: BellIcon }, // définie plus bas
  { id: "favoris", label: "Favoris & listes", icon: HeartIcon }, // définie plus bas
  { id: "publication", label: "Publier une offre (Pro)", icon: Building2 },
  { id: "abonnements", label: "Abonnements & emails", icon: Mail },
  { id: "facturation", label: "Facturation (Pro)", icon: FileText },
  { id: "securite", label: "Sécurité & RGPD", icon: ShieldCheck },
];

function BellIcon(props){ return <svg {...props} viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6 6 0 1 0-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>; }
function HeartIcon(props){ return <svg {...props} viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>; }

const ARTICLES = [
  { id: "perso-001", role: "perso", category: "compte", title: "Créer mon compte étudiant et vérifier mon email", updatedAt: "2025-09-29T09:00:00.000Z", body: ["Clique sur 'Se connecter' puis 'Créer un compte'.","Renseigne ton email et choisis un mot de passe solide (12 caractères mini).","Vérifie l'email de confirmation (pense à regarder dans les spams)."]},
  { id: "perso-002", role: "perso", category: "candidatures", title: "Suivre mes candidatures et relancer un recruteur", updatedAt: "2025-09-21T14:30:00.000Z", body: ["Depuis la page Offre, clique sur 'Postuler' pour ajouter la candidature à ton suivi.","Ouvre ton tableau de suivi : statut, date d'envoi, relance planifiée.","Relance type (J+7) : message court, courtois, personnalisé."]},
  { id: "perso-003", role: "perso", category: "favoris", title: "Utiliser les Favoris pour comparer plusieurs offres", updatedAt: "2025-09-18T10:00:00.000Z", body: ["Clique sur l'icône cœur pour ajouter une offre aux favoris.","Filtre la liste sur 'Favoris' et compare salaire, localisation et missions.","Export possible en CSV (bientôt) pour partager avec ton école."]},
  { id: "perso-004", role: "perso", category: "alertes", title: "Créer une alerte d'emploi par ville et mot-clé", updatedAt: "2025-09-25T08:00:00.000Z", body: ["Tape un mot-clé (ex: 'marketing') et ta ville (ex: 'Lyon').","Clique 'Créer une alerte'. Tu recevras un email une fois par jour.","Tu peux mettre en pause depuis 'Mon compte' > 'Alertes'."]},
  { id: "pro-001", role: "pro", category: "publication", title: "Publier ma première offre d'alternance", updatedAt: "2025-09-28T12:00:00.000Z", body: ["Accède au tableau Recruteur puis 'Nouvelle annonce'.","Renseigne titre, ville, rythme, salaire, missions, avantages.","Prévisualise et publie. L'offre est modérée en quelques minutes."]},
  { id: "pro-002", role: "pro", category: "facturation", title: "Facturation, reçus et moyens de paiement acceptés", updatedAt: "2025-09-22T09:15:00.000Z", body: ["Cartes Visa/Mastercard, virement SEPA (sur devis), paiement annuel.","Télécharge tes factures depuis 'Paramètres' > 'Facturation'.","Contacte le support pour une commande multi-sièges."]},
  { id: "pro-003", role: "pro", category: "securite", title: "RGPD & sécurité des données candidates", updatedAt: "2025-09-19T16:40:00.000Z", body: ["Chiffrement en transit (TLS) et au repos (AES-256).","Suppression sur demande : profil et candidatures effacés en 30 jours.","Accès restreint, journalisé, conforme au principe du moindre privilège."]},
  { id: "both-001", role: "both", category: "compte", title: "Réinitialiser mon mot de passe ou changer d'email", updatedAt: "2025-09-30T18:20:00.000Z", body: ["Depuis 'Se connecter', clique sur 'Mot de passe oublié'.","Pour changer d'email : 'Mon compte' > 'Sécurité' > 'Email'.","Si tu n'as pas reçu l'email, vérifie les spams ou réessaie dans 10 min."]},
];

const GUIDES = [
  { id: "g-1", role: "perso", title: "Checklist CV Alternance", desc: "Format, impact, mots-clés ATS, erreurs à éviter.", url: "#/aide/guide/g-1" },
  { id: "g-2", role: "perso", title: "Pitch 30 secondes", desc: "Présente-toi efficacement au téléphone.", url: "#/aide/guide/g-2" },
  { id: "g-3", role: "pro", title: "Rédiger une offre attractive", desc: "Titre, missions, fourchette salariale, critères clairs.", url: "#/aide/guide/g-3" },
  { id: "g-4", role: "pro", title: "Conformité alternance", desc: "Points juridiques, rythme école/entreprise, tutorat.", url: "#/aide/guide/g-4" },
];

// ===== Composants UI =====
function SectionTitle({ icon: Icon, title, desc }){
  return (
    <div className="section">
      <div className="section-head">
        <div className="section-left">
          {Icon && <Icon className="w-5 h-5" />}
          <h2 className="section-title">{title}</h2>
        </div>
        {/* Petite illustration en couleur à droite */}
        <span className="section-accent" aria-hidden/>
      </div>
      {desc && <p className="section-desc">{desc}</p>}
    </div>
  );
}

function Accordion({ items, onItemClick, showStars=false }){
  const [open, setOpen] = useState({});
  return (
    <div className="" style={{ border: "none", borderRadius: 0, overflow: "visible", background: "#fff" }}>
      {items.map((it, idx) => {
        const isOpen = !!open[it.id];
        const handleClick = () => {
          if (onItemClick) onItemClick(it); else setOpen((p) => ({ ...p, [it.id]: !p[it.id] }));
        };
        return (
          <div key={it.id}>
            <button className="accordion-btn w-full flex items-center justify-between text-left" onClick={handleClick} style={{ borderTop: idx===0 ? '0' : '1px solid var(--border)' }}>
              <span className="flex items-center gap-3"><span className="font-medium" style={{ color: "var(--text)", lineHeight: 1.5 }}>{it.title}</span>{showStars && <Stars value={getStars(it.id)} />}</span>
              <ChevronDown className="w-4 h-4" style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
            </button>
            {!onItemClick && isOpen && (
              <div className="px-5 pb-5 text-sm" style={{ color: "var(--muted)", lineHeight: 1.65 }}>
                <ul className="list-disc pl-5 space-y-2">
                  {it.body.map((b, i) => (<li key={i}>{b}</li>))}
                </ul>
                {it.updatedAt && (
                  <div className="text-xs mt-3" style={{ color: "#8B877F" }}>Mis à jour le {fmtDate(it.updatedAt)}</div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Badge({ children }){ return <span style={{ background: "var(--counterBg)", borderRadius: 9999, padding: "5px 12px", fontSize: 12.5, color: "#6F6B65" }}>{children}</span>; }
function Pill({ children, active, onClick }){ return <button className={`seg-item ${active ? "active" : ""}`} onClick={onClick}>{children}</button>; }

// ===== Pages =====
function HomeView({ role, setRole, q, setQ, category, setCategory, filteredArticles, goArticle, goCategory }){
  const roleLabel = role === 'perso' ? 'Étudiant' : 'Recruteur';
  return (
    <div className="stack-lg">
      <SectionTitle icon={BookOpen} title="Parcourir par catégorie" desc="Les sujets les plus consultés" />
      <div className="grid grid-cats">
        {CATEGORIES.map((cat)=>{
          const Icon = cat.icon;
          const disabled = (role === "perso" && ["publication","facturation"].includes(cat.id));
          return (
            <a key={cat.id} className="cat-tile" href={`#/aide/categorie/${cat.id}`} onClick={(e)=>{ if(disabled){ e.preventDefault(); return; } goCategory(cat.id); }} aria-disabled={disabled}>
              <Icon className="w-4 h-4"/>
              <div className="text-left">
                <div className="font-medium" style={{ color: disabled? "#A3A29E" : "var(--text)" }}>{cat.label}</div>
                <div className="text-xs" style={{ color: "#8B877F" }}> {disabled? "Réservé aux recruteurs" : "Ouvrir la catégorie"}</div>
              </div>
              <span className="ml-auto" aria-hidden><ChevronRight className="w-4 h-4"/></span>
            </a>
          );
        })}
      </div>

      <div>
        <SectionTitle icon={HelpCircle} title={`Top questions (${roleLabel})`} />
        {/* NAV vers l'article au clic */}
        <Accordion items={filteredArticles.slice(0, 6)} onItemClick={(it)=>goArticle(it.id)} showStars />
      </div>

      <div>
        <SectionTitle icon={FileText} title="Guides rapides" desc="Pas à pas pour bien démarrer" />
        <div className="grid grid-guides">
          {GUIDES.filter(g=>g.role===role).map((g)=> (
            <a key={g.id} className="card card-pad" href={g.url}>
              <div className="font-semibold" style={{ color: "var(--text)" }}>{g.title}</div>
              <p className="text-sm mt-2" style={{ color: "var(--muted)", lineHeight: 1.6 }}>{g.desc}</p>
              <span className="mt-3 inline-flex items-center gap-2 link">Ouvrir <ChevronRight className="w-4 h-4"/></span>
            </a>
          ))}
        </div>
      </div>

      {/* ⚠️ Bloc 'Résultats rapides (liste)' supprimé à la demande */}
    </div>
  );
}

function CategoryView({ role, catId, goArticle }){
  const roleLabel = role === 'perso' ? 'Étudiant' : 'Recruteur';
  const list = ARTICLES.filter(a => (a.role === role || a.role === 'both') && a.category === catId);
  const cat = CATEGORIES.find(c=>c.id===catId);
  return (
    <div className="stack-lg">
      <nav className="text-sm mb-3" aria-label="Breadcrumb" style={{ color: "#8B877F" }}>
        <a href="#/aide" className="inline-flex items-center gap-1"><Home className="w-3.5 h-3.5"/> Accueil</a>
        <span> / </span>
        <span>Catégorie</span>
        <span> / </span>
        <strong style={{ color: 'var(--text)' }}>{cat?.label || catId}</strong>
      </nav>
      <SectionTitle icon={cat?.icon || BookOpen} title={`Catégorie: ${cat?.label || catId}`} desc={`Articles pour ${roleLabel}`} />
      <div className="grid" style={{ gridTemplateColumns: "repeat(1, minmax(0, 1fr))" }}>
        {list.map(a => (
          <a key={a.id} className="card card-pad link" href={`#/aide/article/${a.id}`}>{a.title} <ChevronRight className="w-4 h-4"/></a>
        ))}
        {list.length === 0 && <div className="text-sm" style={{ color: '#6F6B65' }}>Aucun article pour cette catégorie.</div>}
      </div>
    </div>
  );
}

function ArticleView({ id }){
  const art = ARTICLES.find(a=>a.id===id);
  if(!art){
    return (
      <div className="card card-pad">
        <div className="text-sm" style={{ color: '#6F6B65' }}>Article introuvable.</div>
        <a className="link mt-2 inline-flex" href="#/aide">← Retour au centre d'aide</a>
      </div>
    );
  }
  const cat = CATEGORIES.find(c=>c.id===art.category);
  const siblings = ARTICLES.filter(a=>a.category===art.category && a.id!==id && (a.role===art.role || a.role==='both'));
  return (
    <article className="card card-pad">
      <nav className="text-sm mb-3" aria-label="Breadcrumb" style={{ color: "#8B877F" }}>
        <a href="#/aide" className="inline-flex items-center gap-1"><Home className="w-3.5 h-3.5"/> Accueil</a>
        <span> / </span>
        <a href={`#/aide/categorie/${art.category}`}>{cat?.label || art.category}</a>
        <span> / </span>
        <strong style={{ color: 'var(--text)' }}>{art.title}</strong>
      </nav>
      <div className="text-xs mb-1.5" style={{ color: "#8B877F" }}>{cat?.label}</div>
      <h3 className="font-semibold" style={{ color: "var(--text)", fontSize: 20, lineHeight: 1.35 }}>{art.title}</h3>
      <div className="text-xs mt-1" style={{ color: "#8B877F" }}>Mis à jour le {fmtDate(art.updatedAt)}</div>
      <ul className="list-disc pl-5 mt-3 space-y-2 text-sm" style={{ color: "var(--muted)", lineHeight: 1.7 }}>
        {art.body.map((p,i)=>(<li key={i}>{p}</li>))}
      </ul>
      <div className="mt-5 flex items-center gap-4">
        <span className="text-sm" style={{ color: "#6F6B65" }}>Cet article a-t-il été utile ?</span>
        <button className="btn btn-outline px-3 py-1.5 text-sm">Oui</button>
        <button className="btn btn-outline px-3 py-1.5 text-sm">Non</button>
      </div>
      {siblings.length > 0 && (
        <div className="mt-6">
          <SectionTitle icon={FileText} title="À lire aussi" />
          <div className="grid" style={{ gridTemplateColumns: "repeat(1, minmax(0, 1fr))" }}>
            {siblings.map(s => (
              <a key={s.id} className="link" href={`#/aide/article/${s.id}`}>{s.title} <ChevronRight className="w-4 h-4"/></a>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

function GuideView({ id }){
  const g = GUIDES.find(x=>x.id===id);
  if(!g){ return <div className="text-sm" style={{ color: '#6F6B65' }}>Guide introuvable. <a className="link" href="#/aide">Retour</a></div>; }
  return (
    <div className="card card-pad">
      <nav className="text-sm mb-3" aria-label="Breadcrumb" style={{ color: "#8B877F" }}>
        <a href="#/aide" className="inline-flex items-center gap-1"><Home className="w-3.5 h-3.5"/> Accueil</a>
        <span> / </span>
        <strong style={{ color: 'var(--text)' }}>{g.title}</strong>
      </nav>
      <h3 className="font-semibold" style={{ color: 'var(--text)', fontSize: 20, lineHeight: 1.35 }}>{g.title}</h3>
      <p className="text-sm mt-2" style={{ color: 'var(--muted)', lineHeight: 1.7 }}>{g.desc}</p>
      <div className="mt-4 text-sm" style={{ color: '#6F6B65', lineHeight: 1.7 }}>Contenu détaillé du guide — à brancher à ton CMS ou markdown.</div>
    </div>
  );
}

export default function HelpCenter(){
  const [isLoginOpen, setLoginOpen] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [cookieChoice, setCookieChoice] = useState(() => {
    try { return localStorage.getItem("cookieConsent") || ""; } catch { return ""; }
  });
  const acceptCookies = () => { try { localStorage.setItem("cookieConsent", "accepted"); } catch{} setCookieChoice("accepted"); };
  const declineCookies = () => { try { localStorage.setItem("cookieConsent", "declined"); } catch{} setCookieChoice("declined"); };
  const [route, go] = useHashRoute();

  const [role, setRole] = useState("perso"); // perso | pro
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const shrunk = useScrollShrink(8);

  // Filtrage live — utilisé surtout sur l'accueil
  const filteredArticles = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return ARTICLES.filter((a) => {
      const roleOk = a.role === role || a.role === "both";
      const catOk = !category || a.category === category;
      const inText = !ql || a.title.toLowerCase().includes(ql) || a.body.some((p) => p.toLowerCase().includes(ql));
      return roleOk && catOk && inText;
    });
  }, [q, category, role]);

  // Navigation helpers
  const goHome = () => go('#/aide');
  const goArticle = (id) => go(`#/aide/article/${id}`);
  const goCategory = (id) => go(`#/aide/categorie/${id}`);

  // Statut service
  const status = { ok: true, message: "Tous les systèmes opérationnels", lastIncident: { date: "2025-09-28T11:10:00.000Z", duration: "22 min", fixed: true } };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      {/* Styles globaux */}
      <style>{`
        :root{
          --bg:#FFFFFF; --panel:#FFFFFF; --text:#0F0F10; --muted:#6F6B65; --headerPill:rgba(255,255,255,.55);
          --border:#ECEBEA; --borderStrong:#E6E5E3; --sep:#E6E5E3; --heroBg:#F5F6F7; --blueText:#1E40AF;
          --counterBg:#f7f6f4; --redBg:#FFE7E6; --redText:#B3261E; --stickyTop:88px; --radiusSoft:10px;
          --flowCream:#F7F6F4; --flowLavGradStart:#FFFFFF; --flowLavGradEnd:#E6E5E3;
          /* Nouveaux espaces */
          --space-1: 8px; --space-2: 12px; --space-3: 16px; --space-4: 24px; --space-5: 32px; --space-6: 40px;
        }
        .header-shell{ position:static; background:var(--flowCream); }
        .header-pill{ position:fixed; top:8px; left:50%; transform:translateX(-50%); z-index:70; background:var(--headerPill); border:1px solid rgba(255,255,255,.55); backdrop-filter:saturate(180%) blur(8px); -webkit-backdrop-filter:saturate(180%) blur(8px); border-radius:9999px; display:flex; align-items:center; gap:10px; white-space:nowrap; overflow:hidden; transition: padding .18s ease, gap .18s ease, background .2s ease, border-color .2s ease; }
        .header-pill.shrunk{ gap:6px; }
        .brand-badge{ display:inline-flex; align-items:center; justify-content:center; background:#0f0f10; color:#fff; border-radius:10px; height:18px; padding:0 8px; font-weight:800; font-size:10.5px; letter-spacing:.04em; line-height:1; }
        .brand-sep{ width:1px; height:16px; background:rgba(0,0,0,.22); margin:0 8px; display:inline-block; vertical-align:middle; transition:opacity .16s ease, transform .16s ease; }
        .brand-text{ text-overflow: ellipsis; font-size:12.5px; transition:max-width .22s ease, opacity .16s ease, transform .16s ease; }
        .btn{ border-radius:12px; font-weight:600; }
        .btn-outline{ background:#fff; border:1px solid var(--border); color:var(--text); }
        .btn-login{ padding:4px 10px; font-size:12px; border-radius:9999px; }
        .page-sep{ height:1px; background:var(--border); }
        .seg{ display:inline-flex; align-items:center; height:34px; background:#fff; border:1px solid var(--border); border-radius:9999px; padding:3px; gap:4px; }
        .seg-item{ height:30px; display:inline-flex; align-items:center; padding:0 12px; border-radius:9999px; font-weight:500; color:#3F3D39; font-size:13.5px; }
        .seg-item.active{ background:#2B2B2B; color:#fff; font-weight:700; }
        .search-wrap{ display:flex; align-items:center; gap:14px; background:#fff; border:1px solid var(--borderStrong); border-radius:9999px; padding:12px 14px; width:100%; box-sizing:border-box; }
        .input-with-icon{ flex:1; display:flex; align-items:center; gap:10px; color:#8A867F; min-width:0; }
        .input-with-icon input{ flex:1; border:0; outline:none; background:transparent; color:var(--text); font-size:14px; }
        .search-btn{ margin-left:auto; background:#2B2B2B; color:#fff; padding:10px 14px; border-radius:9999px; font-weight:800; font-size:13.5px; display:inline-flex; align-items:center; gap:8px; flex-shrink:0; }
        .hero{ position:relative; padding:72px 0 40px; }
        .hero .bg-bleed{ position:absolute; inset:0; left:50%; width:100vw; transform:translateX(-50%); background:linear-gradient(180deg,var(--flowCream) 0%, #FFFFFF 80%); z-index:0; }
        .hero-wrap{ position:relative; z-index:1; max-width:56rem; margin:0 auto; text-align:center; padding:0 20px; }
        .hero-title{ font-family: ui-serif, Georgia, Cambria, Times, serif; font-weight:800; letter-spacing:-0.01em; font-size:clamp(44px,7vw,92px); line-height:1.02; color:#171717; }
        .hero-sub{ color:#3F3D39; opacity:0.9; font-size:clamp(16px,2.2vw,22px); margin-top:var(--space-3); line-height:1.65; }
        .grid{ display:grid; gap:24px; }
        .card{ background:#fff; border:1px solid var(--border); border-radius: var(--radiusSoft); }
        .card-pad{ padding:22px; }
        .cat-tile{ display:flex; align-items:center; gap:14px; padding:16px 20px; border:1px solid var(--border); border-radius:12px; background:#fff; text-decoration:none; }
        .cat-tile:hover{ box-shadow:0 8px 22px rgba(0,0,0,.06); }
        .link{ color:#1F1E1B; font-weight:600; display:inline-flex; align-items:center; gap:8px; text-decoration:none; }
        /* ===== Section headers améliorés ===== */
        .section{ margin-top: var(--space-4); margin-bottom: var(--space-4); }
        .section-head{ display:flex; align-items:center; justify-content:space-between; gap:12px; }
        .section-left{ display:flex; align-items:center; gap:10px; }
        .section-title{ font-size:18px; font-weight:700; color: var(--text); letter-spacing:-0.01em; }
        .section-desc{ color: var(--muted); font-size: 13.5px; margin-top:8px; line-height:1.65; }
        .section-accent{ display:inline-block; width:56px; height:8px; border-radius:9999px; background:linear-gradient(90deg, #FFFFFF 0%, #E6E5E3 100%); opacity:1; }
        /* Spacing pour listes/questions */
        .accordion-btn{ padding:14px 20px; margin:0 6px; }
        /* Grids responsives */
        .grid-cats{ grid-template-columns: repeat(3, minmax(0, 1fr)); }
        .grid-guides{ grid-template-columns: repeat(2, minmax(0, 1fr)); }
        /* ✅ Fond + bordure de statut mis à jour */
        .status-bar{ display:flex; align-items:center; gap:12px; padding:12px 14px; background:#f7f6f4; border:1px solid #D8D6D2; border-radius:12px; flex-wrap:nowrap; overflow:hidden; }
        .status-bar *{ white-space:nowrap; }
        .stack-lg{ display:grid; gap:var(--space-5); }
        .stack-md{ display:grid; gap:var(--space-4); }
        .cookie-bar{ position:fixed; left:0; right:0; bottom:0; z-index:60; color:#fff; background:rgba(17,17,17,.78); backdrop-filter:saturate(120%) blur(4px); -webkit-backdrop-filter:saturate(120%) blur(4px); border:0; box-shadow:0 -6px 18px rgba(0,0,0,.18); }
        .cookie-inner{ max-width:72rem; margin:0 auto; padding:10px 14px; display:flex; align-items:center; gap:10px; justify-content:space-between; }
        .cookie-accept{ background:#fff; color:#111; border:0; border-radius:9999px; padding:7px 12px; font-weight:800; }
        .cookie-decline{ background:transparent; color:#fff; border:0; padding:7px 10px; text-decoration:underline; }
        .label{ font-size:13px; color:#3F3D39; font-weight:700; margin-bottom:8px; display:block; }
        .input{ width:100%; background:#fff; border:1px solid var(--border); border-radius:12px; padding:12px 14px; font-size:14px; color:var(--text); }
        .footer-shell{ background:#fff; border-top:1px solid var(--border); margin-top:var(--space-6); }
        .footer-inner{ max-width:72rem; margin:0 auto; padding:28px 16px; }
        .footer-grid{ display:grid; grid-template-columns:1.5fr repeat(3,1fr); gap:28px; align-items:flex-start; }
        .footer-title{ font-weight:700; font-size:14px; color:#1F1E1B; margin-bottom:10px; }
        .footer-link{ display:block; color:#6F6B65; font-size:13px; padding:5px 0; text-decoration:none; }
        .footer-link:hover{ color:#1F1E1B; }
        .footer-brand{ display:flex; align-items:center; gap:10px; color:#1F1E1B; }
        .footer-bottom{ margin-top:18px; padding-top:14px; border-top:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; color:#6F6B65; font-size:12px; }
        @media (max-width: 640px){
          .grid{ gap:18px; }
          .hero{ padding:60px 0 32px; }
          .hero-wrap{ padding:0 16px; }
          .footer-grid{ grid-template-columns: 1fr 1fr; gap:16px; }
          .footer-inner{ padding:20px 12px; }
          .footer-bottom{ flex-direction:column; align-items:flex-start; gap:8px; }
          .footer-link{ font-size:12.5px; }
          .header-pill{ max-width: calc(100vw - 12px); }
          /* Grids: de haut en bas sur mobile */
          .grid-cats{ grid-template-columns: 1fr; padding: 2px; }
          .grid-guides{ grid-template-columns: 1fr; padding: 2px; }
          /* Illustration plus compacte */
          .section-accent{ width:40px; height:8px; }
          /* Padding adouci sur mobile */
          .card-pad{ padding:18px; }
          .cat-tile{ padding:14px 18px; }
          .accordion-btn{ padding:14px 16px; margin:0 4px; }
          /* Statut: plus petit sur une ligne */
          .status-bar{ gap:8px; padding:8px 10px; }
          .status-bar .text-sm{ font-size:12px; }
          .status-bar .text-xs{ font-size:11px; }
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

      {/* Hero commun */}
      <section className="mx-auto max-w-6xl px-4 hero">
        <div className="bg-bleed" aria-hidden></div>
        <div className="hero-wrap stack-md">
          <div>
            <h1 className="hero-title">Centre d'aide</h1>
            <p className="hero-sub">Trouve des réponses rapides. Clique — et tu vas sur une <strong>nouvelle page</strong>.</p>
          </div>
          {/* Recherche */}
          <div className="search-wrap" role="search">
            <div className="input-with-icon">
              <Search className="w-4 h-4" />
              <input aria-label="Rechercher dans l'aide" placeholder="Ex: compte, candidature, publier une offre…" value={q} onChange={(e)=>setQ(e.target.value)} />
            </div>
            <button className="search-btn"><Search className="w-4 h-4"/> Rechercher</button>
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: 'wrap' }}>
            <div className="seg">
              <Pill active={role === "perso"} onClick={()=>setRole("perso")}>Étudiant</Pill>
              <Pill active={role === "pro"} onClick={()=>setRole("pro")}>Recruteur</Pill>
            </div>
            {category && <Badge>Filtre: {CATEGORIES.find(c=>c.id===category)?.label}</Badge>}
          </div>
          <div className="status-bar">
            <ShieldCheck className="w-4 h-4"/>
            <span className="text-sm">Statut : <strong>Tous les systèmes opérationnels</strong></span>
            <span className="text-xs" style={{ color: "#6F6B65" }}>Dernier incident : 28 sept. 2025 · 22 min · résolu</span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4" style={{ margin: '20px 0' }}><div className="page-sep" /></div>

      {/* Corps: routeur */}
      <main className="mx-auto max-w-6xl px-4 stack-lg">
        {route.view === 'home' && (
          <HomeView role={role} setRole={setRole} q={q} setQ={setQ} category={category} setCategory={setCategory} filteredArticles={filteredArticles} goArticle={goArticle} goCategory={goCategory} />
        )}
        {route.view === 'category' && (
          <CategoryView role={role} catId={route.params.id} />
        )}
        {route.view === 'article' && (
          <ArticleView id={route.params.id} />
        )}
        {route.view === 'guide' && (
          <GuideView id={route.params.id} />
        )}
      </main>

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
                <button className="btn btn-primary w-full px-4 py-2.5 text-sm" type="submit" style={{ background: '#2B2B2B', color: '#fff' }}>
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
      {cookieChoice === '' && (
        <div className="cookie-bar" role="region" aria-label="Bannière cookies">
          <div className="cookie-inner">
            <span className="text-sm">🍪 Nous utilisons des cookies pour <strong>améliorer ton expérience</strong> — <em>mesures anonymes uniquement</em>.</span>
            <div style={{ display:"flex", gap: 10 }}>
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
              <span className="footer-link" aria-disabled="true">Estimation salariale</span>
            </div>
            <div>
              <div className="footer-title">Ressources</div>
              <a className="footer-link" href="#">FAQ</a>
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
            <span>© {new Date().getFullYear()} Alternance & Talent — Tous droits réservés</span>
            <div><a className="footer-link" href="#">Statut</a><a className="footer-link" href="#">Accessibilité</a></div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Tests rapides
export function __runTests(){
  const results = [];
  const sb = document.querySelector('.status-bar');
  if (sb) {
    const styles = getComputedStyle(sb);
    const bgOK = styles.backgroundColor.replace(/\s/g,'').toLowerCase().includes('247,246,244');
    const borderOK = styles.borderColor.replace(/\s/g,'').toLowerCase().includes('216,214,210'); // rgb(216, 214, 210) ~= #D8D6D2
    results.push(["Status bg = #f7f6f4", bgOK]);
    results.push(["Status border gris foncé", borderOK]);
  }
  console.table(results.map(([name, ok])=>({test:name, ok})));
  return results.every(([,ok])=>ok);
}
