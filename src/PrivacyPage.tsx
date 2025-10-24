import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Cookie as CookieIcon,
  Trash2 as TrashIcon,
  ChevronRight as ChevronRightIcon,
  Globe,
  Clock,
  X,
} from "lucide-react";

/* =========================================================
   Page Confidentialité — Alternance & Talent (très minimal)
   ► Conserve le header + footer (mêmes styles que la page d'offres)
   ► Palette sobre, responsive, accessible
   ► Icônes Cookie / Flèche / Poubelle alignées à DROITE du texte
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

export default function PrivacyPage() {
  const shrunk = useScrollShrink(8);
  const [isLoginOpen, setLoginOpen] = useState(false);

  // Cookie consent (léger)
  const [cookieChoice, setCookieChoice] = useState<string>(() => {
    try {
      return localStorage.getItem("cookieConsent") || "";
    } catch {
      return "";
    }
  });
  const acceptCookies = () => {
    try { localStorage.setItem("cookieConsent", "accepted"); } catch {}
    setCookieChoice("accepted");
  };
  const declineCookies = () => {
    try { localStorage.setItem("cookieConsent", "declined"); } catch {}
    setCookieChoice("declined");
  };
  const forceCookieBanner = () => {
    try { localStorage.removeItem("cookieConsent"); } catch {}
    setCookieChoice("");
  };

  const LAST_UPDATED = "2025-10-05"; // Mets à jour la date quand tu modifies le texte

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <style>{`
        :root{ --headerPill:rgba(255,255,255,.55); --flowCream:#F3F4F6; --flowLavGradStart:#DCCBFF; --flowLavGradEnd:#CFE5FF; }
        :root{ --bg:#FFFFFF; --panel:#FFFFFF; --text:#0F0F10; --muted:#6F6B65; --border:#ECEBEA; --borderStrong:#E6E5E3; --sep:#E6E5E3; --pill:#f7f6f4; --link:#1F2937; --linkHover:#0B1220; }

        /* ===== Header (reprend le style de la page d'offres) ===== */
        .header-shell{ position:static; background:var(--flowCream); }
        .header-shell.blurred{ background:rgba(243,244,246,0.85); backdrop-filter:saturate(180%) blur(10px); box-shadow:0 6px 24px rgba(0,0,0,.04); }
        .header-pill{ position:fixed; top:8px; left:50%; transform:translateX(-50%); z-index:70; background:var(--headerPill); border:1px solid rgba(255,255,255,.55); backdrop-filter:saturate(180%) blur(8px); -webkit-backdrop-filter:saturate(180%) blur(8px); border-radius:9999px; display:flex; align-items:center; gap:10px; white-space:nowrap; overflow:hidden; transition: padding .18s ease, gap .18s ease, background .2s ease, border-color .2s ease; padding:6px 12px; }
        .header-pill.shrunk{ gap:6px; padding:4px 10px; }
        .brand-badge{ display:inline-flex; align-items:center; justify-content:center; background:#0f0f10; color:#fff; border-radius:10px; height:18px; padding:0 8px; font-weight:700; font-size:10.5px; letter-spacing:.04em; line-height:1; }
        .brand-sep{ width:1px; height:16px; background:rgba(0,0,0,.22); margin:0 8px; display:inline-block; vertical-align:middle; transition:opacity .16s ease, transform .16s ease; }
        .header-pill.shrunk .brand-sep{ opacity:0; transform:scaleY(0.2); width:0; margin:0; }
        .btn{ border-radius:10px; font-weight:600; }
        .btn-outline{ background:#fff; border:1px solid var(--border); color:var(--text); }

        /* ===== Page Content ===== */
        .wrap{ max-width:56rem; margin:0 auto; padding:64px 16px 64px; }
        h1{ font-family: ui-serif, Georgia, Cambria, Times, serif; font-size:clamp(36px,6vw,64px); line-height:1; font-weight:800; letter-spacing:-0.01em; color:#171717; }
        .lede{ color:#3F3D39; opacity:.9; font-size:clamp(15px,2vw,18px); margin-top:10px; }
        .meta{ display:flex; align-items:center; gap:8px; color:#6F6B65; font-size:13px; margin-top:14px; }

        .section{ margin-top:22px; padding:18px; border:1px solid var(--border); border-radius:10px; background:var(--panel); }
        .section h2{ font-size:18px; line-height:1.3; margin:0 0 6px; }
        .section p, .section li{ color:#3F3D39; font-size:14px; }
        .section ul{ padding-left:0; margin:10px 0; }
        .section li{ margin-left:18px; }
        .align-list{ margin-left:18px; }
        .note{ background:var(--pill); border:1px solid var(--borderStrong); border-radius:8px; padding:10px 12px; color:#6F6B65; font-size:13px; }

        .inline-link{ color:#111; text-decoration:underline; text-underline-offset:2px; }
        .cta-row{ display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-top:18px; }
        .btn-ghost{ background:#fff; border:1px solid var(--border); border-radius:9999px; padding:8px 12px; font-weight:600; font-size:13px; display:inline-flex; align-items:center; gap:8px; white-space:nowrap; }
        .btn-ghost:hover{ background:#f9f9f9; }

        /* ===== Cookie bar (sobre) ===== */
        .cookie-bar{ position:fixed; left:0; right:0; bottom:0; z-index:60; color:#111; background:#fff; border-top:1px solid var(--border); }
        .cookie-inner{ max-width:72rem; margin:0 auto; padding:10px 12px; display:flex; align-items:center; gap:8px; justify-content:space-between; }
        .cookie-text{ opacity:.96; font-size:12.5px; color:#3F3D39; }
        .cookie-actions{ display:flex; align-items:center; gap:8px; }
        .cookie-accept{ background:#111; color:#fff; border:0; border-radius:9999px; padding:6px 10px; font-weight:700; }
        .cookie-decline{ background:#fff; color:#111; border:1px solid var(--border); border-radius:9999px; padding:6px 10px; font-weight:700; }

        /* ===== Footer (reprise de la page d'offres) ===== */
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
          .wrap{ padding:16px 12px 28px; }
          .section{ padding:14px; }
          .cookie-inner{ flex-direction:column; align-items:stretch; gap:8px; }
          .footer-grid{ grid-template-columns: 1fr 1fr; gap:16px; }
          .footer-inner{ padding:16px 12px; }
          .footer-bottom{ flex-direction:column; align-items:flex-start; gap:8px; }
        }
      `}</style>

      {/* ===== Header (même header que HelpCenter) ===== */}
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

      {/* ===== Content ===== */}
      <main className="wrap" id="content">
        <h1>Confidentialité</h1>
        <p className="lede">Nous protégeons tes données personnelles et limitons le suivi au strict nécessaire pour faire fonctionner le service.</p>
        <div className="meta"><Clock className="w-4 h-4"/><span>Dernière mise à jour : {fmtDateFR(LAST_UPDATED)}</span></div>

        {/* Aucune table des matières cliquable (demandé) */}

        <section id="donnees" className="section">
          <h2>Données que nous traitons</h2>
          <ul>
            <li>Compte : email, mot de passe haché, prénom/nom (si fournis).</li>
            <li>Recherche & candidatures : mots-clés, lieux, favoris, historique d'actions.</li>
            <li>Technique : logs serveur, adresse IP abrégée, navigateur, pages vues.</li>
          </ul>
          <p className="align-list">Sous réserve de consentement, nous pouvons partager ou vendre des segments de données agrégées ou pseudonymisées (informations statistiques) à des entreprises (études de marché, analyses de recrutement) et à des partenaires publicitaires afin de mesurer les performances et améliorer la pertinence des contenus. Ces usages sont désactivés par défaut et peuvent être modifiés à tout moment via « Gérer mes cookies ».</p>
        </section>

        <section id="usage" className="section">
          <h2>Finalités d'utilisation</h2>
          <ul>
            <li>Fournir le service (recherche d'offres, favoris, candidature).</li>
            <li>Sécuriser et maintenir la plateforme (détection d'abus, debug).</li>
            <li>Mesurer l'usage en agrégé pour améliorer les fonctionnalités.</li>
          </ul>
        </section>

        <section id="cookies" className="section">
          <h2>Cookies & mesures</h2>
          <ul>
            <li>Cookie de session (strictement nécessaire).</li>
            <li>Préférence de consentement (pour mémoriser ton choix).</li>
            <li>Métriques anonymisées en local ou via outils respectueux (sans suivi publicitaire).</li>
            <li>Publicité et monétisation (optionnel, désactivé par défaut) : partage et/ou vente de segments de données agrégées ou d'identifiants en ligne <em>pseudonymisés</em> avec des partenaires/publicitaires et des entreprises clientes, uniquement avec consentement.</li>
          </ul>
          <div className="cta-row">
            {/* Icône à DROITE du texte */}
            <button className="btn-ghost" onClick={forceCookieBanner}>Gérer mes cookies <CookieIcon className="w-4 h-4"/></button>
          </div>
        </section>

        <section id="base-legale" className="section">
          <h2>Base légale (RGPD)</h2>
          <ul>
            <li><strong>Exécution du contrat</strong> — créer un compte, postuler.</li>
            <li><strong>Intérêt légitime</strong> — sécuriser, prévenir la fraude, statistiques essentielles.</li>
            <li><strong>Consentement</strong> — pour les cookies non essentiels et pour la publicité / monétisation de segments (après consentement).</li>
          </ul>
        </section>

        <section id="duree" className="section">
          <h2>Durées de conservation</h2>
          <ul>
            <li>Compte actif : tant que tu utilises le service.</li>
            <li>Logs techniques : durée limitée (max 12 mois) pour sécurité et audit.</li>
            <li>Demandes RGPD : preuves conservées pendant la durée légale.</li>
          </ul>
        </section>

        <section id="droits" className="section">
          <h2>Tes droits</h2>
          <ul>
            <li>Accès, rectification, effacement ("droit à l'oubli").</li>
            <li>Limitation et opposition au traitement dans certains cas.</li>
            <li>Portabilité des données sur demande.</li>
            <li>Révocation du consentement à tout moment (si applicable).</li>
          </ul>
          <div className="cta-row">
            {/* Icône à DROITE du texte */}
            <a className="btn-ghost" href="#contact">Exercer un droit <ChevronRightIcon className="w-4 h-4"/></a>
          </div>
        </section>

        <section id="contact" className="section">
          <h2>Contact DPO / confidentialité</h2>
          <p>Pour toute question ou demande liée à tes données personnelles :</p>
          <ul>
            <li>Email : <a className="inline-link" href="mailto:confidentialite@alternance-talent.example">confidentialite@alternance-talent.example</a></li>
            <li>Ou directement via la page Contact du site.</li>
            <li>Autorité de contrôle : CNIL (France) si besoin de réclamation.</li>
          </ul>
          <div className="note" style={{ marginTop: 10 }}>Nous te répondrons dans un délai maximal d'un mois (prolongeable selon complexité).</div>
        </section>

        <section className="section" aria-label="Suppression de compte">
          <h2>Supprimer mon compte</h2>
          <p>Tu peux demander la suppression définitive de ton compte et de tes données associées (hors obligations légales de conservation).</p>
          <div className="cta-row">
            {/* Icône à DROITE du texte */}
            <button className="btn-ghost">Demander la suppression <TrashIcon className="w-4 h-4"/></button>
          </div>
        </section>

        {/* Mention de conformité : pas de dissimulation de pratiques publicitaires */}
        <p className="meta" style={{ marginTop: 22 }}>
          <Globe className="w-4 h-4"/> Hébergement UE · RGPD appliqué
        </p>
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
              <span className="brand-badge">mon</span>
              <span className="brand-sep" aria-hidden="true"></span>
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

      {/* ===== Modal login (léger, pour cohérence header) ===== */}
      {isLoginOpen && (
        <div className="fixed inset-0 z-[60]" aria-modal role="dialog">
          <div className="absolute inset-0" style={{ background:"rgba(0,0,0,0.3)" }} onClick={() => setLoginOpen(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-sm" style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, padding:20 }}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold" style={{ color:'var(--text)' }}>Se connecter</h2>
                <button onClick={() => setLoginOpen(false)} aria-label="Fermer" className="p-2 rounded-lg hover:opacity-90"><X className="w-4 h-4" /></button>
              </div>
              <p className="mt-3 text-sm" style={{ color:'var(--muted)' }}>(Démo) Branche ton endpoint quand tu veux.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =====================
// Tests basiques (DOM)
// =====================
export function __runTests(){
  const results: Array<[string, boolean]> = [];

  // 1) H1 présent
  results.push(["Titre Confidentialité présent", /Confidentialité/.test(document.body.innerText)]);

  // 2) Icônes à DROITE du texte dans 3 CTA (cookie, droits, suppression)
  const cookieBtn = Array.from(document.querySelectorAll('button.btn-ghost'))
    .find((b) => /Gérer mes cookies/.test(b.textContent || '')) as HTMLButtonElement | undefined;
  const rightsLink = Array.from(document.querySelectorAll('a.btn-ghost'))
    .find((a) => /Exercer un droit/.test(a.textContent || '')) as HTMLAnchorElement | undefined;
  const deleteBtn = Array.from(document.querySelectorAll('button.btn-ghost'))
    .find((b) => /Demander la suppression/.test(b.textContent || '')) as HTMLButtonElement | undefined;

  const isIconRight = (el?: HTMLElement) => {
    if (!el) return false;
    const last = el.lastElementChild;
    return !!last && last.tagName.toLowerCase() === 'svg';
  };

  results.push(["Cookie: icône à droite", isIconRight(cookieBtn)]);
  results.push(["Droits: icône à droite", isIconRight(rightsLink as unknown as HTMLElement)]);
  results.push(["Suppression: icône à droite", isIconRight(deleteBtn)]);

  // 3) Pas de table des matières cliquable
  results.push(["Pas de nav .toc", !document.querySelector('nav.toc')]);

  // 4) Bannière cookies visible par défaut puis disparaît après Accept
  const cookieBar = document.querySelector('.cookie-bar');
  results.push(["Bannière cookies visible", !!cookieBar]);
  (document.querySelector('.cookie-accept') as HTMLButtonElement)?.click?.();
  results.push(["Bannière cookies disparaît", !document.querySelector('.cookie-bar')]);

  // 5) Mention explicite de monétisation / vente de segments
  const monetizationMention = /monétisation|vente de segments|vendre des segments/i.test(document.body.innerText);
  results.push(["Mention monétisation/vente de segments", monetizationMention]);

  // 6) Alignement du paragraphe de monétisation avec le premier <li> de la section données
  const donnees = document.getElementById('donnees') as HTMLElement | null;
  const firstLi = donnees?.querySelector('ul li') as HTMLElement | null;
  const monetP = Array.from(donnees?.querySelectorAll('p') || [])
    .find((p) => /vendre des segments/i.test(p.textContent || '')) as HTMLElement | undefined;
  const sameLeft = !!(firstLi && monetP) && Math.abs(firstLi.getBoundingClientRect().left - monetP.getBoundingClientRect().left) < 2;
  results.push(["Alignement paragraphe/li (donnees)", sameLeft]);

  // 7) Vérification structure footer: présence de .footer-inner, .footer-grid, .footer-bottom
  const footer = document.querySelector('footer.footer-shell');
  const footerOk = !!(footer && footer.querySelector('.footer-inner') && footer.querySelector('.footer-grid') && footer.querySelector('.footer-bottom'));
  results.push(["Footer structure ok", footerOk]);

  // 8) Barre violette > gris (variable CSS)
  const styleText = document.querySelector('style')?.textContent || '';
  results.push(["Header en gris (var)", styleText.includes('--flowCream:#F3F4F6')]);

  // 9) Espace supplémentaire en haut de la page
  results.push(["Padding top augmenté", /\.wrap\{[^}]*padding:64px 16px 64px;/.test(styleText)]);

  console.table(results.map(([name, ok]) => ({ test: name, ok })));
  return results.every(([, ok]) => ok);
}
