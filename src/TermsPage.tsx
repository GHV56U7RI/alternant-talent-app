import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Cookie as CookieIcon,
  ChevronRight as ChevronRightIcon,
  Globe,
  Clock,
  X,
  FileText,
  Shield,
  AlertTriangle,
} from "lucide-react";

/* =========================================================
   Page Conditions Générales d'Utilisation — Alternance & Talent
   ► Conserve le header + footer (style "flow" que tu as fourni)
   ► Palette sobre (blanc, gris clair), responsive et accessible
   ► Icônes alignées à DROITE du texte dans les CTA
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

export default function TermsPage() {
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
  const forceCookieBanner = () => {
    try {
      localStorage.removeItem("cookieConsent");
    } catch {}
    setCookieChoice("");
  };

  const LAST_UPDATED = "2025-10-05"; // Mets à jour la date quand tu modifies le texte
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <style>{`
        :root{
          --bg:#FFFFFF; --panel:#FFFFFF; --text:#0F0F10; --muted:#6F6B65;
          --border:#ECEBEA; --borderStrong:#E6E5E3; --sep:#E6E5E3;
          --pill:#f7f6f4; --link:#1F2937; --linkHover:#0B1220;
          --headerPill:rgba(255,255,255,.55); --flowCream:#F3F4F6;
        }
        /* ===== Header ===== */
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
        <h1>Conditions générales d'utilisation</h1>
        <p className="lede">En utilisant Alternance & Talent, tu acceptes ces conditions qui encadrent l'accès et l'usage du service.</p>
        <div className="meta"><Clock className="w-4 h-4"/><span>Dernière mise à jour&nbsp;: {fmtDateFR(LAST_UPDATED)}</span></div>

        {/* Aucune table des matières cliquable (demandé) */}

        <section className="section" id="acceptation">
          <h2>Acceptation & champ d'application</h2>
          <p>Ces conditions s'appliquent à tous les utilisateurs (candidats, recruteurs, visiteurs). Si tu utilises le service pour une organisation, tu confirmes être habilité à accepter ces conditions en son nom.</p>
        </section>

        <section className="section" id="definitions">
          <h2>Définitions</h2>
          <ul>
            <li>« Service » : plateforme de recherche d'alternance, publication d'offres et gestion de candidatures.</li>
            <li>« Recruteur » : personne ou entité qui publie des offres ou consulte des profils.</li>
            <li>« Candidat » : personne qui recherche des offres et postule.</li>
          </ul>
        </section>

        <section className="section" id="acces">
          <h2>Accès au service</h2>
          <ul>
            <li>Le service est fourni « en l'état ». Nous faisons des efforts raisonnables pour assurer la disponibilité et la qualité.</li>
            <li>Des interruptions planifiées ou imprévues peuvent survenir pour maintenance, sécurité ou évolutions.</li>
            <li>Nous pouvons modifier ou retirer des fonctionnalités sans préavis si nécessaire.</li>
          </ul>
        </section>

        <section className="section" id="compte">
          <h2>Compte et sécurité</h2>
          <ul>
            <li>Tu es responsable des identifiants associés à ton compte et des actions effectuées avec celui‑ci.</li>
            <li>Informe‑nous rapidement en cas d'usage non autorisé ou de suspicion de faille.</li>
            <li>Nous pouvons suspendre ou résilier un compte en cas de non‑respect des conditions ou de risque pour la sécurité.</li>
          </ul>
        </section>

        <section className="section" id="recruteurs">
          <h2>Recruteurs — publication & modération</h2>
          <ul>
            <li>Les offres doivent être exactes, licites et conformes aux règles applicables (notamment non‑discrimination, informations essentielles, mentions légales).</li>
            <li>Nous pouvons refuser, déréférencer ou retirer une offre non conforme ou trompeuse.</li>
            <li>Les communications avec les candidats doivent rester respectueuses et pertinentes.</li>
          </ul>
        </section>

        <section className="section" id="candidats">
          <h2>Candidats — candidatures & profils</h2>
          <ul>
            <li>Tu garantis l'exactitude des informations fournies dans ton profil et tes candidatures.</li>
            <li>Nous ne promettons pas d'embauche et ne validons pas les offres au nom des recruteurs.</li>
            <li>Ne partage pas d'informations sensibles non nécessaires dans tes candidatures.</li>
          </ul>
        </section>

        <section className="section" id="paiements">
          <h2>Paiements et facturation (le cas échéant)</h2>
          <ul>
            <li>Les prix et modalités d'abonnement ou d'options payantes sont présentés au moment de la souscription.</li>
            <li>Sauf indication contraire, les paiements sont non remboursables après consommation ou début de période.</li>
            <li>Des taxes peuvent s'appliquer selon ta localisation.</li>
          </ul>
          <div className="cta-row">
            <Link className="btn-ghost" to="/contact">Obtenir une facture PDF <FileText className="w-4 h-4"/></Link>
          </div>
        </section>

        <section className="section" id="contenus">
          <h2>Contenus & propriété intellectuelle</h2>
          <ul>
            <li>Tu conserves tes droits sur les contenus que tu soumets. Tu nous accordes une licence limitée pour héberger et afficher ces contenus aux fins du service.</li>
            <li>Ne publie pas de contenus illicites, contrefaisants, diffamatoires ou portant atteinte à la vie privée d'autrui.</li>
            <li>Le nom, le logo et l'interface du service sont protégés ; toute réutilisation nécessite notre accord écrit.</li>
          </ul>
        </section>

        <section className="section" id="interdictions">
          <h2>Interdictions</h2>
          <ul>
            <li>Pas de spam, d'extraction massive non autorisée (scraping) ni d'ingénierie inverse des fonctionnalités protégées.</li>
            <li>Pas d'utilisation du service d'une manière qui perturbe, surcharge ou compromet la sécurité.</li>
            <li>Pas d'usurpation d'identité ou de fausse représentation.</li>
          </ul>
        </section>

        <section className="section" id="donnees">
          <h2>Protection des données</h2>
          <p>Le traitement des données personnelles est décrit dans notre page <Link className="inline-link" to="/confidentialite">Confidentialité</Link>. Tu peux à tout moment ajuster tes préférences via le bouton ci‑dessous.</p>
          <div className="cta-row">
            <button className="btn-ghost" onClick={forceCookieBanner}>Gérer mes cookies <CookieIcon className="w-4 h-4"/></button>
          </div>
          <div className="note" style={{ marginTop: 10 }}>Mesures de sécurité proportionnées aux risques, journalisation technique et contrôle d'accès. En cas d'incident, information dans des délais raisonnables.</div>
        </section>

        <section className="section" id="responsabilite">
          <h2>Responsabilité</h2>
          <ul>
            <li>Le service est fourni sans garantie d'adéquation à un besoin particulier.</li>
            <li>Nous ne sommes pas responsables des décisions d'embauche, des contenus tiers ou des liens externes.</li>
            <li>Notre responsabilité globale, si elle est engagée, est limitée au montant payé pour le service sur les 12 derniers mois.</li>
          </ul>
          <div className="note" style={{ marginTop: 10 }}>
            <AlertTriangle className="inline-block align-text-top w-4 h-4" aria-hidden />
            <span className="ml-2">Certaines limitations peuvent ne pas s'appliquer selon la loi de ton pays. Elles ne restreignent pas les droits légaux impératifs.</span>
          </div>
        </section>

        <section className="section" id="duree">
          <h2>Durée, suspension et résiliation</h2>
          <ul>
            <li>Ces conditions s'appliquent tant que tu utilises le service.</li>
            <li>Tu peux résilier à tout moment en supprimant ton compte. Certaines données peuvent être conservées si la loi l'exige.</li>
            <li>Nous pouvons suspendre l'accès en cas de violation, de risque pour la sécurité ou d'obligation légale.</li>
          </ul>
          <div className="cta-row">
            <Link className="btn-ghost" to="/contact">Contacter le support <ChevronRightIcon className="w-4 h-4"/></Link>
          </div>
        </section>

        <section className="section" id="modifications">
          <h2>Modifications des conditions</h2>
          <p>Nous pouvons mettre à jour ces conditions pour des raisons juridiques, techniques ou opérationnelles. En cas de changement significatif, une information raisonnable sera fournie. La poursuite de l'usage après l'entrée en vigueur vaut acceptation.</p>
        </section>

        <section className="section" id="droit-applicable">
          <h2>Droit applicable et litiges</h2>
          <ul>
            <li>Ces conditions sont régies par le droit français.</li>
            <li>À défaut d'accord amiable, les tribunaux compétents de Paris seront saisis, sous réserve des règles protectrices applicables au consommateur.</li>
          </ul>
          <div className="cta-row">
            <a className="btn-ghost" href="#content">Télécharger en PDF (à venir) <FileText className="w-4 h-4"/></a>
          </div>
        </section>

        <p className="meta" style={{ marginTop: 22 }}>
          <Globe className="w-4 h-4"/> Hébergement UE · RGPD appliqué · Sécurité proportionnée au risque
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
  results.push(["Titre CGU présent", /Conditions générales d'utilisation/.test(document.body.innerText)]);

  // 2) Icônes à DROITE du texte dans 3 CTA (cookies, support, PDF)
  const cookieBtn = Array.from(document.querySelectorAll('button.btn-ghost'))
    .find((b) => /Gérer mes cookies/.test(b.textContent || '')) as HTMLButtonElement | undefined;
  const supportLink = Array.from(document.querySelectorAll('a.btn-ghost'))
    .find((a) => /Contacter le support/.test(a.textContent || '')) as HTMLAnchorElement | undefined;
  const pdfLink = Array.from(document.querySelectorAll('a.btn-ghost'))
    .find((a) => /Télécharger en PDF/.test(a.textContent || '')) as HTMLAnchorElement | undefined;

  const isIconRight = (el?: HTMLElement) => {
    if (!el) return false;
    const last = el.lastElementChild;
    return !!last && last.tagName.toLowerCase() === 'svg';
  };

  results.push(["Cookies: icône à droite", isIconRight(cookieBtn)]);
  results.push(["Support: icône à droite", isIconRight(supportLink as unknown as HTMLElement)]);
  results.push(["PDF: icône à droite", isIconRight(pdfLink as unknown as HTMLElement)]);

  // 3) Pas de table des matières cliquable
  results.push(["Pas de nav .toc", !document.querySelector('nav.toc')]);

  // 4) Bannière cookies visible par défaut puis disparaît après Accept
  const cookieBar = document.querySelector('.cookie-bar');
  results.push(["Bannière cookies visible", !!cookieBar]);
  (document.querySelector('.cookie-accept') as HTMLButtonElement)?.click?.();
  results.push(["Bannière cookies disparaît", !document.querySelector('.cookie-bar')]);

  // 5) Présence sections clés
  const hasModif = /Modifications des conditions/i.test(document.body.innerText);
  const hasDroit = /Droit applicable/i.test(document.body.innerText);
  results.push(["Section Modifications présente", hasModif]);
  results.push(["Section Droit applicable présente", hasDroit]);

  // 6) Vérification structure footer: présence de .footer-inner, .footer-grid, .footer-bottom
  const footer = document.querySelector('footer.footer-shell');
  const footerOk = !!(footer && footer.querySelector('.footer-inner') && footer.querySelector('.footer-grid') && footer.querySelector('.footer-bottom'));
  results.push(["Footer structure ok", footerOk]);

  // 7) Header & footer présents
  results.push(["Header présent", !!document.querySelector('header.header-shell')]);
  results.push(["Footer présent", !!document.querySelector('footer.footer-shell')]);

  // 8) Styles: violet -> gris (header)
  const styleText = document.querySelector('style')?.textContent || '';
  results.push(["Header en gris (var)", styleText.includes('--flowCream:#F3F4F6')]);

  // 9) Espace supplémentaire en haut de la page
  results.push(["Padding top augmenté", /\.wrap\{[^}]*padding:64px 16px 64px;/.test(styleText)]);

  console.table(results.map(([name, ok]) => ({ test: name, ok })));
  return results.every(([, ok]) => ok);
}
