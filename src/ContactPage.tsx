import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  Building2,
  GraduationCap,
  MessageSquare,
  ShieldCheck,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

// ===== Utils =====
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

export default function ContactPage() {
  const shrunk = useScrollShrink(8);
  const [isLoginOpen, setLoginOpen] = useState(false);
  const [isSignup, setIsSignup] = useState(false);

  // Cookies (réutilisé)
  const [cookieChoice, setCookieChoice] = useState(() => {
    try { return localStorage.getItem("cookieConsent") || ""; } catch { return ""; }
  });
  const acceptCookies = () => { try { localStorage.setItem("cookieConsent", "accepted"); } catch {} setCookieChoice("accepted"); };
  const declineCookies = () => { try { localStorage.setItem("cookieConsent", "declined"); } catch {} setCookieChoice("declined"); };

  // Segmented: Étudiant / Recruteur
  const [role, setRole] = useState<"etudiant" | "recruteur">("etudiant");

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

  // Valeurs sujet par rôle
  const defaultStudent = "Question candidature / CV";
  const defaultRecruiter = "Publier une offre / Devenir partenaire";

  // Pré-fill sujet
  useEffect(() => {
    if (!subject) setSubject(role === "etudiant" ? defaultStudent : defaultRecruiter);
  }, [role]);

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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role, name, email, phone, subject, message }),
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      setSuccess(true);
      setName(""); setEmail(""); setPhone(""); setSubject(role === "etudiant" ? defaultStudent : defaultRecruiter);
      setMessage(""); setAgree(false);
    } catch {
      setError("Impossible d'envoyer le message. Réessaie dans un instant.");
    } finally { setSubmitting(false); }
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      {/* Styles — IMPORTANT: CSS inline string WITHOUT any backslash escapes */}
      <style>{`
:root{
  --bg:#FFFFFF; --panel:#FFFFFF; --text:#0F0F10; --muted:#6F6B65; --headerPill:rgba(255,255,255,.55);
  --border:#ECEBEA; --borderStrong:#E6E5E3; --sep:#E6E5E3; --heroBg:#F5F6F7; --blueText:#1E40AF; --counterBg:#f7f6f4;
  --redBg:#FFE7E6; --redText:#B3261E; --stickyTop:88px; --radiusSoft:10px; --chipH:30px; --cardPad:14px;
  /* Remplacement violet -> gris clair */
  --flowCream:#F3F4F6; /* gris très clair */
  --flowLavGradStart:#EDEDED; /* gris clair */
  --flowLavGradEnd:#FAFAFA; /* gris presque blanc */
}
.card{ background:transparent; border:0; border-radius:0; }
.hr{ height:1px; background:var(--border); }
.btn{ border-radius:10px; font-weight:700; }
.btn-primary{ background:#2563EB; color:#fff; }
.btn-outline{ background:#fff; border:1px solid var(--border); color:var(--text); }
.icon-btn{ width:36px; height:36px; display:flex; align-items:center; justify-content:center; background:#fff; border:1px solid var(--border); border-radius:12px; }

/* Header */
.header-shell{ position:static; background:var(--flowCream); }
.header-pill{ position:fixed; top:8px; left:50%; transform:translateX(-50%); z-index:70; background:var(--headerPill);
  border:1px solid rgba(255,255,255,.55); backdrop-filter:saturate(180%) blur(8px); -webkit-backdrop-filter:saturate(180%) blur(8px);
  border-radius:9999px; display:flex; align-items:center; gap:10px; white-space:nowrap; overflow:hidden; transition: padding .18s ease, gap .18s ease; }
.header-pill.shrunk{ gap:6px; }
.brand-badge{ display:inline-flex; align-items:center; justify-content:center; background:#0f0f10; color:#fff; border-radius:10px; height:18px; padding:0 8px; font-weight:800; font-size:10.5px; letter-spacing:.04em; line-height:1; }
.brand-sep{ width:1px; height:16px; background:rgba(0,0,0,.22); margin:0 8px; display:inline-block; vertical-align:middle; transition:opacity .16s ease, transform .16s ease; }
.brand-text{ text-overflow: ellipsis; font-size:12.5px; transition:max-width .22s ease, opacity .16s ease, transform .16s ease; }

/* Hero */
.flow-hero{ position:relative; padding:56px 0 28px; }
.flow-hero .bg-bleed{ position:absolute; inset:0; left:50%; width:100vw; transform:translateX(-50%);
  /* Dégradé gris -> blanc (80%) */
  background:linear-gradient(180deg,var(--flowCream) 0%, #FFFFFF 80%); z-index:0; }
.flow-wrap{ position:relative; z-index:1; max-width:56rem; margin:0 auto; text-align:center; padding:0 16px; }

/* Segmented */
.seg{ display:inline-flex; align-items:center; height:var(--chipH); background:#fff; border:0; border-radius:9999px; padding:2px; }
.seg-item{ height:calc(var(--chipH) - 4px); display:inline-flex; align-items:center; padding:0 10px; border-radius:9999px; font-weight:600; color:#3F3D39; font-size:13px; }
.seg-item.active{ background:#2B2B2B; color:#fff; }

/* Form grid */
.form-grid{ display:grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap:16px; }
.col-6{ grid-column: span 6 / span 6; }
.col-12{ grid-column: span 12 / span 12; }
.label{ font-size:13px; color:#3F3D39; font-weight:700; margin-bottom:8px; display:block; }
.input{ width:100%; background:#fff; border:1px solid var(--border); border-radius:12px; padding:12px 14px; font-size:14px; color:var(--text); }
.textarea{ min-height:140px; resize:vertical; }
.help{ font-size:12.5px; color:#6F6B65; }
.error{ color:#B3261E; display:flex; align-items:center; gap:8px; font-size:13px; }
.success-banner{ display:flex; align-items:flex-start; gap:10px; background:#F0FDF4; border:0; color:#14532D; border-radius:10px; padding:12px; }

/* Info row + slider mobile */
.info-title{ font-weight:700; color:#1F1E1B; margin-bottom:6px; }
.info-line{ display:flex; align-items:center; gap:8px; color:#6F6B65; font-size:13px; }
.info-block{ padding:8px 0; }
.info-row{ display:flex; justify-content:center; gap:40px; align-items:flex-start; flex-wrap:wrap; }
.hide-on-mobile{ display:flex; }
@media (max-width: 640px){
  .info-row{ display:flex; overflow-x:auto; -webkit-overflow-scrolling:touch; scroll-snap-type:x mandatory; gap:12px; padding-bottom:6px; }
  .info-block{ min-width:88%; scroll-snap-align:start; }
  .hide-on-mobile{ display:none; }
}

/* Consent — Desktop: en une ligne, Mobile: retour à la ligne (pas de slide) */
.consent-row{ display:flex; align-items:flex-start; gap:8px; }
.consent-row input[type="checkbox"]{ margin-top: 4px; }
.consent-label{ white-space: nowrap; display:inline-flex; align-items:center; gap:4px; flex:1; }
.consent-label .footer-link{ display:inline; padding:0; margin:0 2px; text-decoration:underline; }

/* Mobile: WRAP proprement, aucune barre de défilement */
@media (max-width: 640px){
  .form-grid{ grid-template-columns: repeat(6, minmax(0, 1fr)); gap:14px; }
  .col-6{ grid-column: span 6 / span 6; }
  .label{ font-size:13.5px; margin-bottom:6px; }
  .input{ font-size:16px; padding:12px 14px; }
  .help{ font-size:12px; }
  #message + .help{ text-align:right; }
  .consent-row{ align-items:flex-start; }
  .consent-label{ white-space: normal !important; display:block; line-height:1.45; }
}

/* Cookie */
.cookie-bar{ position:fixed; left:0; right:0; bottom:0; z-index:60; color:#fff; background:rgba(17,17,17,.78);
  backdrop-filter:saturate(120%) blur(4px); -webkit-backdrop-filter:saturate(120%) blur(4px); border:0; box-shadow:0 -6px 18px rgba(0,0,0,.18); }
.cookie-inner{ max-width:72rem; margin:0 auto; padding:8px 12px; display:flex; align-items:center; gap:8px; justify-content:space-between; }
.cookie-text{ opacity:.96; font-size:12.5px; }
.cookie-actions{ display:flex; align-items:center; gap:8px; }
.cookie-accept{ background:#fff; color:#111; border:0; border-radius:9999px; padding:6px 10px; font-weight:700; }
.cookie-decline{ background:transparent; color:#fff; border:0; padding:6px 8px; text-decoration:underline; }

/* Footer */
.footer-shell{ background:#fff; border-top:1px solid var(--border); }
.footer-inner{ max-width:72rem; margin:0 auto; padding:24px 16px; }
.footer-grid{ display:grid; grid-template-columns:1.5fr repeat(3,1fr); gap:24px; align-items:flex-start; }
.footer-title{ font-weight:700; font-size:14px; color:#1F1E1B; margin-bottom:8px; }
.footer-link{ display:block; color:#6F6B65; font-size:13px; padding:4px 0; text-decoration:none; }
.footer-link:hover{ color:#1F1E1B; }
.footer-brand{ display:flex; align-items:center; gap:8px; color:#1F1E1B; }
.footer-bottom{ margin-top:16px; padding-top:12px; border-top:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; color:#6F6B65; font-size:12px; }
.footer-bottom .footer-link{ display:inline-block; padding:0; margin-left:12px; }
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

      {/* HERO */}
      <section className="mx-auto max-w-6xl px-4 mt-0">
        <div data-testid="contact-hero" className="flow-hero">
          <div className="bg-bleed" aria-hidden />
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 my-4"><div className="hr" /></div>

      {/* Contenu */}
      <main className="mx-auto max-w-6xl px-4 pb-12">
        <section className="card" style={{ padding: 16 }}>
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

              {/* Consent — mobile wrap */}
              <div className="col-12 consent-row">
                <input id="agree" type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
                <label htmlFor="agree" className="help consent-label">J'accepte la <a className="footer-link" href="#">politique de confidentialité</a> et le traitement de mes données pour ce contact.</label>
              </div>
            </div>

            <div className="hr" style={{ margin: "16px 0" }} />
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button className="btn btn-primary px-4 py-2 text-sm inline-flex items-center gap-2" type="submit" disabled={!canSubmit}><Send className="w-4 h-4" /> {submitting ? "Envoi…" : "Envoyer"}</button>
              {error && <span className="error"><AlertCircle className="w-4 h-4" /> {error}</span>}
            </div>
          </form>
        </section>

        <div className="hr" style={{ margin: "20px 0" }} />

        {/* Infos (contacts en ligne + slider mobile) */}
        <section className="card" style={{ padding: 16 }}>
          <div className="info-row" role="group" aria-label="Contacts et informations">
            <div className="info-block">
              <div className="info-title">Support candidats</div>
              <div className="info-line"><Mail className="w-4 h-4" /> <a className="footer-link" href="mailto:etudiants@alternance-talent.test">etudiants@alternance-talent.test</a></div>
              <div className="info-line"><MessageSquare className="w-4 h-4" /> <span>Aide CV, candidatures, suivi</span></div>
              <div className="info-line"><ShieldCheck className="w-4 h-4" /> <span>Réponse sous 24 h ouvrées</span></div>
            </div>
            <div className="info-block">
              <div className="info-title">Support recruteurs</div>
              <div className="info-line"><Mail className="w-4 h-4" /> <a className="footer-link" href="mailto:recruteurs@alternance-talent.test">recruteurs@alternance-talent.test</a></div>
              <div className="info-line"><ShieldCheck className="w-4 h-4" /> <span>Publication & intégration ATS</span></div>
            </div>
            <div className="info-block">
              <div className="info-title">Nos bureaux</div>
              <div className="info-line"><MapPin className="w-4 h-4" /> <span>Paris & Montréal</span></div>
              <div className="info-line"><MessageSquare className="w-4 h-4" /> <a className="footer-link" href="#">Centre d'aide</a></div>
              <div className="info-line"><ShieldCheck className="w-4 h-4" /> <span>Lun–Ven — 9h–18h</span></div>
            </div>
          </div>
        </section>
      </main>

      {/* Login dialog */}
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

      {/* Cookies */}
      {cookieChoice === "" && (
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
              <a className="footer-link" href="#">Estimation salariale</a>
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

// ——— TESTS ———
export function __runTests(){
  const results: Array<[string, boolean]> = [];
  const label = document.querySelector('.consent-label');
  const hero = document.querySelector('[data-testid="contact-hero"]');
  const styleText = Array.from(document.querySelectorAll('style')).map(s=>s.textContent||'').join('\n');

  results.push(["Consent label présent", !!label]);
  results.push(["CSS desktop nowrap", /\.consent-label\{[^}]*white-space:\s*nowrap/.test(styleText)]);
  results.push(["CSS mobile wrap", /@media \(max-width: 640px\)[\s\S]*\.consent-label\{[\s\S]*white-space:\s*normal/.test(styleText)]);
  results.push(["Checkbox align top", /input\[type="checkbox"\]\{[^}]*margin-top:\s*4px/.test(styleText)]);
  // Vérifs couleurs: plus de violet, gris présent
  results.push(["Gris clair appliqué (flowCream)", /--flowCream:\s*#F3F4F6/i.test(styleText)]);
  results.push(["Plus de violet (aucun #DCCBFF/#CFE5FF/#F4ECFF)", !/(#DCCBFF|#CFE5FF|#F4ECFF)/i.test(styleText)]);
  // Tests additionnels
  results.push(["Hero présent", !!hero]);
  results.push(["Dégradé gris→blanc présent", /linear-gradient\(180deg,var\(--flowCream\) 0%, #FFFFFF 80%\)/.test(styleText)]);

  console.table(results.map(([t, ok])=>({test:t, ok})));
  return results.every(([,ok])=>ok);
}
