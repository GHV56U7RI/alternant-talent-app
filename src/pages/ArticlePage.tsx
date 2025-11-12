import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Clock3, Tag, Share2, UserPlus, Headphones, User, Settings, HelpCircle, Heart, BarChart3 } from "lucide-react";
import { getAllPosts, compModules } from "../cms/loadPosts";
import AuthPage from "./AuthPage";
import AnalyticsPage from "./AnalyticsPage";
import ReactMarkdown from "react-markdown";

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
  const pillRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
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
        :root{--bg:#FFF;--text:#0F0F10;--pill:#f7f7f8;--headerPill:rgba(255,255,255,.58);--headerBorder:rgba(0,0,0,.06);--headerTop:28px;}
        .header-pill{position:fixed;top:var(--headerTop);left:50%;transform:translateX(-50%);z-index:70;background:var(--headerPill);border:1px solid var(--headerBorder);border-radius:9999px;display:flex;align-items:center;gap:10px;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);padding:10px 16px;}
        .header-pill.shrunk{padding:8px 14px;gap:6px;}
        .brand-badge{display:inline-flex;align-items:center;justify-content:center;background:#0f0f10;color:#fff;border-radius:10px;height:18px;padding:0 8px;font-weight:700;font-size:10.5px;}
        .brand-sep{width:1px;height:16px;background:rgba(0,0,0,.15);margin:0 8px;}
        .brand-text{font-size:13px;color:#111;opacity:1;transition:opacity .18s;}
        .brand-text.hidden{opacity:0;max-width:0;margin:0;}
        .btn-icon{width:32px;height:32px;border-radius:50%;border:1px solid rgba(0,0,0,.08);background:rgba(0,0,0,.04);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;}
        .btn-icon:hover{background:rgba(0,0,0,.08);}
        .btn-icon svg{width:18px;height:18px;}
        .profile-menu{position:relative;}
        .menu-panel{position:absolute;right:0;top:calc(100% + 12px);background:var(--headerPill);border:1px solid var(--headerBorder);border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.12);min-width:220px;padding:0;opacity:0;transition:opacity .18s,transform .18s;pointer-events:none;transform:translateY(-6px);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);}
        .menu-panel.show{opacity:1;pointer-events:auto;transform:translateY(0);}
        .menu-item{width:100%;display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:0;border:0;background:transparent;text-align:left;cursor:pointer;font-size:13px;font-weight:600;color:#111;}
        .menu-item:hover{background:rgba(0,0,0,.04);}
        .site-veil{position:fixed;inset:0;background:rgba(0,0,0,.02);opacity:0;pointer-events:none;z-index:60;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);transition:opacity .18s;}
        .site-veil.show{opacity:1;pointer-events:auto;}
      `}</style>
      <div ref={pillRef} className={`header-pill ${shrunk ? "shrunk" : ""}`}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="brand-badge">mon</span>
          <span className="brand-sep"></span>
          <span className={`brand-text ${shrunk ? "hidden" : ""}`}>alternance & talent</span>
        </Link>
        <button className="btn-icon" onClick={() => setMenuOpen(!menuOpen)}><User /></button>
        <div className="profile-menu">
          <div className={`menu-panel ${menuOpen ? "show" : ""}`}>
            <button className="menu-item" onClick={() => { setMenuOpen(false); onProfileClick(); }}><User style={{ width: 16, height: 16, opacity: 0.95 }} />Profil</button>
            <button className="menu-item" onClick={() => { setMenuOpen(false); onFavorisClick(); }}><Heart style={{ width: 16, height: 16, opacity: 0.95 }} />Favoris</button>
            <button className="menu-item" onClick={() => { setMenuOpen(false); onAnalyticsClick(); }}><BarChart3 style={{ width: 16, height: 16, opacity: 0.95 }} />Statistiques</button>
            <button className="menu-item" onClick={() => { setMenuOpen(false); onSettingsClick(); }}><Settings style={{ width: 16, height: 16, opacity: 0.95 }} />Paramètres</button>
            <button className="menu-item" onClick={() => { setMenuOpen(false); onHelpClick(); }}><HelpCircle style={{ width: 16, height: 16, opacity: 0.95 }} />Aide</button>
            <div style={{ borderTop: '1px solid rgba(0,0,0,.08)', margin: '4px 0' }} />
            <button className="menu-item" onClick={() => { setMenuOpen(false); onLogout(); }}><span style={{ marginLeft: 26 }}>Déconnexion</span></button>
          </div>
        </div>
      </div>
      <div className={`site-veil ${menuOpen ? "show" : ""}`} onClick={() => setMenuOpen(false)} />
    </>
  );
}

// Header non connecté
function HeaderNotConnected({ onLoginClick }: any) {
  const shrunk = useScrollShrink(8);
  return (
    <>
      <style>{`
        .auth-actions{display:inline-flex;gap:8px;margin-left:8px;}
        .btn-auth{height:32px;padding:0 12px;border-radius:9999px;font-weight:800;font-size:12.5px;cursor:pointer;border:1px solid transparent;}
        .btn-auth--outline{background:#fff;border:1px solid rgba(0,0,0,.10);color:#111;}
      `}</style>
      <div className={`header-pill ${shrunk ? "shrunk" : ""}`}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="brand-badge">mon</span>
          <span className="brand-sep"></span>
          <span className={`brand-text ${shrunk ? "hidden" : ""}`}>alternance & talent</span>
        </Link>
        <div className="auth-actions">
          <button onClick={onLoginClick} className="btn-auth btn-auth--outline">Se connecter</button>
        </div>
      </div>
    </>
  );
}

function labelCategory(k: string) {
  const map: Record<string, string> = {
    alternance: "Alternance",
    securite: "Sécurité",
    produit: "Produit",
    societe: "Société",
  };
  return map[k] ?? k;
}

// Contenu par défaut pour tous les articles
const DEFAULT_ARTICLE_CONTENT = `## Commencer simplement

Tout commence simplement. Dès la première visite, on comprend tout de suite où aller, quoi faire, et comment avancer. L'expérience est claire, naturelle, sans détour. Puis vient la rapidité : les offres apparaissent au bon moment, comme si elles vous attendaient déjà. Vous n'avez plus à chercher longtemps, tout semble fluide, pensé pour votre rythme. Au fil du temps, Mon alternance talent apprend à cerner ce qui vous correspond. Des alertes précises, jamais trop tôt ni trop tard, qui tombent juste quand il faut. Chaque notification devient une vraie opportunité.

## Discrétion & clarté

Et derrière chaque action, la discrétion. Vos choix vous appartiennent. Vos données ne circulent pas, elles restent là, à leur place, entre de bonnes mains. Cette vision, c'est celle d'un outil qui s'efface pour vous laisser avancer. Un compagnon invisible qui simplifie vos démarches et vous fait gagner du temps. Ici, pas de surcharge, pas de distraction : seulement ce qui compte. L'approche est différente. Pas de bruit inutile, pas de doublons. Les informations sont nettes, à jour, fiables. Tout est pensé pour aller à l'essentiel et vous aider à saisir les vraies opportunités.

## Un espace de confiance

Pourquoi Mon alternance talent ? Parce que c'est un espace de confiance. Chaque offre est repérée avec soin, triée avec attention, et présentée avec simplicité. Rien de superflu, juste ce dont vous avez besoin pour avancer sereinement. Derrière tout cela, il y a une promesse : vous faire gagner du temps sans jamais perdre votre liberté. Vous donner accès à ce qui est fiable, clair et pertinent. Et vous accompagner, sans bruit, vers la bonne opportunité.`;

export default function ArticlePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [showAuthPage, setShowAuthPage] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [user, setUser] = useState(null);
  const [listening, setListening] = useState(false);
  const [MDXComp, setMDXComp] = useState<React.ComponentType<any> | null>(null);

  const post = useMemo(() => getAllPosts().find((p) => p.slug === slug), [slug]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('user');
      }
    }
  }, []);

  useEffect(() => {
    if (!slug) return;
    const entry = Object.entries(compModules).find(([path]) => path.includes(`${slug}.mdx`));
    if (!entry) return;
    (entry[1] as any)().then((mod: any) => setMDXComp(() => mod.default));
  }, [slug]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setShowAnalytics(false);
    navigate("/");
  };

  const handleAuthSuccess = (userData: any) => {
    setUser(userData);
    setShowAuthPage(false);
  };

  if (showAuthPage) return <AuthPage onBack={() => setShowAuthPage(false)} onAuthSuccess={handleAuthSuccess} />;
  if (showAnalytics) return <AnalyticsPage onClose={() => setShowAnalytics(false)} />;

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">Article introuvable</h1>
          <Link to="/blog" className="text-blue-600 hover:underline">Retour au blog</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="about-scope not-prose min-h-screen overflow-x-hidden bg-white text-neutral-900 text-center px-6 py-16">
      <style>{`
        .about-scope a:not([data-btn]){color:inherit !important;text-decoration:none !important;}
        .about-scope a:not([data-btn]):hover,.about-scope a:not([data-btn]):focus{color:inherit !important;text-decoration:none !important;}
        .about-scope [data-btn]{ color:#fff !important; }
        .about-scope *{ box-sizing:border-box; }
        .about-scope button,[data-btn]{ -webkit-appearance:none !important; appearance:none !important; box-shadow:none !important; outline:none !important; }
        .about-scope hr{ border:0; height:1px; background:rgba(0,0,0,.08); }
        .about-scope svg{ display:block; }
        .share-text { display: none; }
        @media (min-width: 640px) {
          .share-text { display: inline; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      {/* Header */}
      {user ? (
        <HeaderConnected
          user={user}
          onProfileClick={() => { navigate("/"); window.scrollTo(0, 0); }}
          onFavorisClick={() => { navigate("/"); window.scrollTo(0, 0); }}
          onAnalyticsClick={() => setShowAnalytics(true)}
          onSettingsClick={() => { navigate("/"); window.scrollTo(0, 0); }}
          onHelpClick={() => navigate("/aide")}
          onLogout={handleLogout}
        />
      ) : (
        <HeaderNotConnected onLoginClick={() => setShowAuthPage(true)} />
      )}

      {/* Hero */}
      <section className="max-w-3xl mx-auto mb-6" data-testid="hero-section">
        <p className="text-xs text-black/50">
          {new Date(post.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">{post.title}</h1>
        <p className="mx-auto mt-5 max-w-[48ch] px-4 text-[13px] leading-relaxed text-black/70">{post.excerpt}</p>
        <hr className="mx-auto mt-3 h-px w-full max-w-[52ch] md:max-w-[60ch] bg-black/10 border-0" />

        {/* Infos (chips) */}
        <div className="mt-4 flex justify-center" data-testid="article-info">
          <div className="max-w-[52ch] mx-auto text-left px-0">
            <div
              className="overflow-x-auto sm:overflow-visible w-full px-0 scroll-smooth overscroll-x-contain snap-x snap-mandatory"
              data-testid="chips-scroll"
              aria-label="Défilement horizontal des informations d'article"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              <ul style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-start', gap: '6px', listStyle: 'none', padding: 0, margin: 0, fontSize: '12px', color: 'rgba(0,0,0,0.7)', minWidth: 'max-content', whiteSpace: 'nowrap' }}>
                <li style={{ display: 'inline-flex', flexShrink: 0, alignItems: 'center', gap: '6px', borderRadius: '9999px', background: '#f7f7f8', padding: '4px 10px', lineHeight: 1, whiteSpace: 'nowrap' }}>
                  <Clock3 style={{ width: 16, height: 16, opacity: 0.7 }} aria-hidden="true" />
                  <span>{post.readTime} min</span>
                </li>
                <li style={{ display: 'inline-flex', flexShrink: 0, alignItems: 'center', gap: '6px', borderRadius: '9999px', background: '#f7f7f8', padding: '4px 10px', lineHeight: 1, whiteSpace: 'nowrap' }}>
                  <Tag style={{ width: 16, height: 16, opacity: 0.7 }} aria-hidden="true" />
                  <span>Cat. {labelCategory(post.category)}</span>
                </li>
                <li aria-label="Partager" style={{ display: 'inline-flex', flexShrink: 0, alignItems: 'center', gap: '6px', borderRadius: '9999px', background: '#f7f7f8', padding: '4px 10px', lineHeight: 1, whiteSpace: 'nowrap' }}>
                  <Share2 style={{ width: 16, height: 16, opacity: 0.7 }} aria-hidden="true" />
                  <span className="share-text">Partager</span>
                </li>
                <li role="separator" aria-hidden="true" data-testid="chip-separator" style={{ flexShrink: 0, alignSelf: 'center', width: '1px', height: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '9999px', margin: '0 8px' }}></li>
                <li style={{ display: 'inline-flex', flexShrink: 0, alignItems: 'center', gap: '6px', borderRadius: '9999px', background: '#f7f7f8', padding: '4px 10px', lineHeight: 1, whiteSpace: 'nowrap' }}>
                  <UserPlus style={{ width: 16, height: 16, opacity: 0.7 }} aria-hidden="true" strokeWidth={1.5} />
                  <span>Suivre</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Carte rectangulaire pâle décorative (pas un bouton) — placée au-dessus de "Lire le résumé généré par l'IA" */}
      <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
        {post.cover ? (
          <div style={{ display: 'block', width: '100%', maxWidth: '52ch', margin: '0 auto', borderRadius: '16px', overflow: 'hidden', aspectRatio: '16/9' }} aria-hidden="true" data-testid="hero-pale-card">
            <img src={post.cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ) : (
          <div
            style={{ display: 'block', width: '100%', maxWidth: '52ch', margin: '0 auto', borderRadius: '16px', background: '#f7f7f8', padding: '1rem 1rem 16rem 1rem', userSelect: 'none' }}
            aria-hidden="true"
            data-testid="hero-pale-card"
          ></div>
        )}
      </div>

      {/* Résumé IA + écoute en bas à droite */}
      <section style={{ maxWidth: '48rem', margin: '0.5rem auto 1.5rem' }} data-testid="ai-summary">
        <div style={{ maxWidth: '52ch', margin: '0 auto', background: '#f7f7f8', borderRadius: '16px', padding: '1rem', textAlign: 'left' }}>
          {/* Image pour le résumé IA */}
          {post.summaryImage && (
            <div style={{ marginBottom: '1rem', borderRadius: '12px', overflow: 'hidden' }}>
              <img
                src={post.summaryImage}
                alt={post.summaryImageAlt || "Illustration du résumé"}
                style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'cover' }}
              />
            </div>
          )}
          <p style={{ fontSize: '13px', fontWeight: 500, color: '#171717' }}>Lire le résumé généré par l'IA</p>
          <p style={{ marginTop: '0.5rem', fontSize: '14px', lineHeight: 1.6, color: 'rgba(0,0,0,0.7)' }}>
            {post.aiSummary || post.excerpt}
          </p>
        </div>
        {/* Bouton d'écoute aligné à droite, sous la section IA */}
        <div style={{ maxWidth: '52ch', margin: '0.5rem auto 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
            {listening && (
              <audio
                data-testid="listen-audio"
                style={{ height: '2rem', flex: 1, maxWidth: '70%' }}
                controls
                preload="none"
                src={post.audioUrl || ""}
                autoPlay
              />
            )}
            <button
              type="button"
              data-testid="listen-button"
              aria-pressed={listening}
              onClick={() => setListening(v => !v)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                borderRadius: '9999px',
                border: '1px solid rgba(0,0,0,0.1)',
                background: '#fff',
                padding: '0.5rem 0.75rem',
                fontSize: '13px',
                fontWeight: 500,
                color: '#262626',
                cursor: 'pointer',
                transition: 'all 0.2s',
                flexShrink: 0
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
              title={listening ? "Masquer le lecteur" : "Écouter l'article en entier"}
            >
              <Headphones
                style={{
                  width: 16,
                  height: 16,
                  color: listening ? '#2563eb' : 'currentColor',
                  animation: listening ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
                }}
                aria-hidden="true"
              />
              {!listening && (
                <span style={{ display: 'inline' }}>Écouter l'article en entier</span>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Corps du texte */}
      <section style={{ maxWidth: '48rem', margin: '0 auto', fontSize: '16px', lineHeight: 1.6, color: 'rgba(0,0,0,0.8)' }} data-testid="body-section">
        <style>{`
          .article-body h2 {
            margin-top: 1.5rem;
            margin-bottom: 0.75rem;
            font-size: 1.125rem;
            font-weight: 600;
            color: #0f0f10;
            line-height: 1.3;
          }
          @media (min-width: 640px) {
            .article-body h2 {
              margin-top: 2rem;
              font-size: 1.25rem;
            }
          }
          .article-body p {
            margin: 1rem 0;
            line-height: 1.75;
            color: rgba(0,0,0,0.8);
          }
          .article-body ul, .article-body ol {
            margin: 1rem 0;
            padding-left: 1.5rem;
            line-height: 1.75;
          }
          .article-body li {
            margin-bottom: 0.5rem;
          }
          .article-body strong {
            font-weight: 700;
          }
          .article-body em {
            font-style: italic;
          }
          .article-body h3 {
            margin-top: 1.25rem;
            margin-bottom: 0.5rem;
            font-size: 1rem;
            font-weight: 600;
            color: #171717;
          }
        `}</style>
        <div className="article-body" style={{ maxWidth: '52ch', margin: '0 auto', textAlign: 'left' }} data-testid="collapsible">
          <ReactMarkdown>{DEFAULT_ARTICLE_CONTENT}</ReactMarkdown>
        </div>
        <hr style={{ margin: '1.5rem auto 0', height: '1px', width: '100%', maxWidth: '52ch', background: 'rgba(0,0,0,0.1)', border: 0 }} />
      </section>

      {/* CTA */}
      <section id="cta" style={{ paddingTop: '2rem', paddingBottom: '4rem' }} data-testid="cta-section">
        <style>{`
          .cta-inner {
            border-radius: 28px;
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            padding: 1rem 1.25rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 0.75rem;
            flex-direction: row;
          }
          .cta-text {
            text-align: left;
            color: #fff;
            min-width: 0;
            flex: 1;
          }
          .cta-text h3 {
            font-size: 0.8rem;
            font-weight: 600;
            letter-spacing: -0.025em;
            margin: 0;
            line-height: 1.2;
          }
          .cta-text p {
            color: rgba(255,255,255,0.8);
            font-size: 0.65rem;
            margin-top: 0.25rem;
            margin-bottom: 0;
            line-height: 1.2;
          }
          @media (min-width: 640px) {
            .cta-inner {
              padding: 1.5rem 2rem;
              gap: 1rem;
            }
            .cta-text h3 {
              font-size: 1.125rem;
            }
            .cta-text p {
              font-size: 0.75rem;
            }
          }
        `}</style>
        <div style={{ maxWidth: '52ch', margin: '0 auto', padding: '0 1rem' }}>
          <div style={{ position: 'relative', borderRadius: '28px', background: 'linear-gradient(to right, #60a5fa, #3b82f6, #2563eb)', padding: '2px', boxShadow: '0 10px 30px rgba(59,130,246,0.35)' }}>
            <div className="cta-inner">
              <div className="cta-text">
                <h3>Rejoignez Mon alternance talent aujourd'hui</h3>
                <p>Inscrivez-vous et trouvez votre alternance</p>
              </div>
              <Link
                to="/"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '9999px', border: '1px solid rgba(255,255,255,0.7)', padding: '0.5rem 1rem', fontSize: '0.8rem', fontWeight: 500, color: '#fff', textDecoration: 'none', flexShrink: 0, whiteSpace: 'nowrap', cursor: 'pointer' }}
                data-btn
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                Se connecter
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
