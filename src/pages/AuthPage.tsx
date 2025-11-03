import React, { useState, memo } from "react";
import { ShieldCheck, Mail, Eye, EyeOff, ChevronDown, ChevronUp, ArrowLeft, Apple, Github, Loader2, Send } from "lucide-react";

/*
  Auth Email First — Lucide Style Match (v6 - Focus Fix)
  - Sous-composants sortis au niveau module et memo-ïsés
  - Pas de remount à chaque frappe
  - type="button" + preventBlur sur tous les boutons/icônes
*/

function GoogleLogo(){
  return (
    <svg aria-hidden viewBox="0 0 48 48" className="w-5 h-5">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.043 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.651-.389-3.917z"/>
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.043 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.197l-6.191-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.62-3.319-11.283-7.946l-6.53 5.027C9.49 39.556 16.227 44 24 44z"/>
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.095 5.565l.003-.002 6.191 5.238C36.965 40.645 44 36 44 24c0-1.341-.138-2.651-.389-3.917z"/>
    </svg>
  );
}

const MOCK = true;
async function apiCheckEmail(email:string){
  if(MOCK){ await new Promise(r=>setTimeout(r,500)); return { exists: email.trim().toLowerCase().endsWith("@demo.com") }; }
  const res = await fetch("/api/auth/check-email",{ method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({email})});
  if(!res.ok) throw new Error("check-email failed");
  return res.json();
}
async function apiLogin({email,password}:{email:string,password:string}){
  if(MOCK){ await new Promise(r=>setTimeout(r,700)); if(password==="password") return {ok:true}; throw new Error("Mot de passe incorrect"); }
  const res = await fetch("/api/auth/login",{ method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({email,password})});
  if(!res.ok) throw new Error("login failed");
  return res.json();
}
async function apiRegister({email,password,firstName,lastName}:{email:string,password:string,firstName:string,lastName:string}){
  if(MOCK){ await new Promise(r=>setTimeout(r,800)); if(password.length<6) throw new Error("Mot de passe trop court (min. 6)"); return {ok:true}; }
  const res = await fetch("/api/auth/register",{ method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({email,password,firstName,lastName})});
  if(!res.ok) throw new Error("register failed");
  return res.json();
}

const preventBlur = (e: React.MouseEvent) => e.preventDefault();

// ==================== SOUS-COMPOSANTS SORTIS AU NIVEAU MODULE ====================

const Header = memo(() => {
  return (
    <div className="flex flex-col items-center gap-6">
      <img
        src="/icons/connection .png"
        alt="Illustration de connexion"
        style={{ width: "100%", maxWidth: "288px", height: "auto" }}
      />
      <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-center">Ravi de t'alter‑voir</h1>
      <p className="-mt-2 text-base text-neutral-500 text-center">Se connecter ou créer un compte</p>
    </div>
  );
});

const Separator = memo(() => {
  return (
    <div className="relative my-6">
      <div className="h-px bg-neutral-200" />
      <span className="absolute -translate-x-1/2 left-1/2 -top-3 bg-white px-3 text-sm text-neutral-500">ou</span>
    </div>
  );
});

const GoogleButton = memo(() => {
  return (
    <button type="button" className="w-full h-14 rounded-full bg-white hover:bg-neutral-50 transition flex items-center justify-center gap-3 text-[15px]" style={{border: "1px solid rgba(0,0,0,0.08)"}} onMouseDown={preventBlur} onClick={()=>alert("TODO: OAuth Google")}>
      <GoogleLogo />
      <span>Continuer avec Google</span>
    </button>
  );
});

interface OtherOptionsProps {
  otherSSO: boolean;
  setOtherSSO: (v: boolean | ((prev: boolean) => boolean)) => void;
}

const OtherOptions = memo<OtherOptionsProps>(({ otherSSO, setOtherSSO }) => {
  return (
    <>
      <button type="button" onClick={()=>setOtherSSO(v=>!v)} onMouseDown={preventBlur} className="w-full h-14 rounded-full bg-white hover:bg-neutral-50 transition flex items-center justify-center gap-2 text-[15px]" style={{border: "1px solid rgba(0,0,0,0.08)"}}>
        {otherSSO ? <ChevronUp className="w-4 h-4 text-neutral-600"/> : <ChevronDown className="w-4 h-4 text-neutral-600"/>}
        <span>Voir d'autres options</span>
      </button>
      {otherSSO && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          <button type="button" className="h-14 rounded-full bg-white hover:bg-neutral-50 transition flex items-center justify-center gap-2" style={{border: "1px solid rgba(0,0,0,0.08)"}} onMouseDown={preventBlur}>
            <Apple className="w-5 h-5 text-neutral-900"/> <span>Apple</span>
          </button>
          <button type="button" className="h-14 rounded-full bg-white hover:bg-neutral-50 transition flex items-center justify-center gap-2" style={{border: "1px solid rgba(0,0,0,0.08)"}} onMouseDown={preventBlur}>
            <Github className="w-5 h-5 text-neutral-900"/> <span>GitHub</span>
          </button>
        </div>
      )}
    </>
  );
});

interface EmailStepProps {
  email: string;
  setEmail: (v: string) => void;
  canContinueEmail: boolean;
  loading: boolean;
  onContinue: () => void;
}

const EmailStep = memo<EmailStepProps>(({ email, setEmail, canContinueEmail, loading, onContinue }) => {
  return (
    <div className="mt-6">
      <Separator />
      <label htmlFor="email" className="sr-only">Adresse e‑mail</label>
      <div className="w-full h-14 rounded-[18px] bg-neutral-100/70 flex items-center px-4" style={{border: "1px solid rgba(0,0,0,0.06)"}}>
        <Mail className="w-5 h-5 text-neutral-500"/>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          spellCheck={false}
          autoFocus
          value={email}
          onChange={e=>setEmail(e.target.value)}
          className="ml-3 w-full text-[15px]"
          placeholder="Entrez l'adresse e‑mail"
          style={{
            color: "#111",
            background: "transparent",
            outline: 0,
            border: 0,
            boxShadow: "none",
            WebkitAppearance: "none",
            MozAppearance: "none",
            appearance: "none"
          }}
          onKeyDown={(e)=>{ if(e.key==='Enter'){ onContinue(); }}}
        />
      </div>
      <button
        type="button"
        onClick={onContinue}
        disabled={!canContinueEmail || loading}
        className="mt-4 w-full h-14 rounded-full text-white text-[15px] font-semibold inline-flex items-center justify-center gap-2 transition transform hover:-translate-y-[1px] active:translate-y-0 focus:outline-none disabled:cursor-not-allowed"
        style={{ background: "linear-gradient(180deg, #3d6fff 0%, #2e63f2 55%, #2557e4 100%)", border: "1px solid #1f4fd1", boxShadow: "0 10px 22px rgba(37,87,228,.28), inset 0 1px 0 rgba(255,255,255,.35)" }}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4 -ml-1"/>}
        <span>Continuer</span>
      </button>
    </div>
  );
});

interface LoginStepProps {
  email: string;
  pwd: string;
  setPwd: (v: string) => void;
  showPwd: boolean;
  setShowPwd: (v: boolean | ((prev: boolean) => boolean)) => void;
  loading: boolean;
  setStep: (step: "email"|"login"|"register"|"done") => void;
  onLogin: () => void;
}

const LoginStep = memo<LoginStepProps>(({ email, pwd, setPwd, showPwd, setShowPwd, loading, setStep, onLogin }) => {
  return (
    <div className="mt-6 space-y-3">
      <button type="button" onClick={()=>setStep("email")} onMouseDown={preventBlur} className="text-sm text-neutral-600 hover:text-black inline-flex items-center gap-2" style={{background: "none", border: "none", padding: 0}}>
        <ArrowLeft className="w-4 h-4"/> Changer d'adresse
      </button>
      <div className="text-sm text-neutral-600">Adresse reconnue: <span className="font-medium text-neutral-900">{email}</span></div>
      <div className="w-full h-14 rounded-[18px] bg-white flex items-center px-4" style={{border: "1px solid rgba(0,0,0,0.08)"}}>
        <button type="button" onMouseDown={preventBlur} onClick={()=>setShowPwd(s=>!s)} className="text-neutral-500" style={{background: "none", border: "none", padding: 0, display: "flex", alignItems: "center", cursor: "pointer"}}>
          {showPwd ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
        </button>
        <input
          name="password"
          type={showPwd?"text":"password"}
          autoComplete="current-password"
          spellCheck={false}
          autoFocus
          value={pwd}
          onChange={e=>setPwd(e.target.value)}
          className="ml-3 w-full text-[15px]"
          placeholder="Mot de passe"
          style={{
            color: "#111",
            background: "transparent",
            outline: 0,
            border: 0,
            boxShadow: "none",
            WebkitAppearance: "none",
            MozAppearance: "none",
            appearance: "none"
          }}
          onKeyDown={(e)=>{ if(e.key==='Enter'){ onLogin(); }}}
        />
      </div>
      <div className="flex items-center justify-between">
        <a className="text-sm text-neutral-600 hover:text-black" href="#">Mot de passe oublié ?</a>
      </div>
      <button type="button" onClick={onLogin} disabled={!pwd || loading} className="w-full h-14 rounded-full bg-black text-white text-[15px] flex items-center justify-center gap-2" style={{opacity: (!pwd || loading) ? 0.4 : 1, cursor: (!pwd || loading) ? "not-allowed" : "pointer"}}>
        {loading && <Loader2 className="w-4 h-4 animate-spin"/>}
        <span>Se connecter</span>
      </button>
    </div>
  );
});

interface RegisterStepProps {
  email: string;
  firstName: string;
  setFirstName: (v: string) => void;
  lastName: string;
  setLastName: (v: string) => void;
  pwd: string;
  setPwd: (v: string) => void;
  pwd2: string;
  setPwd2: (v: string) => void;
  showPwd: boolean;
  setShowPwd: (v: boolean | ((prev: boolean) => boolean)) => void;
  showPwd2: boolean;
  setShowPwd2: (v: boolean | ((prev: boolean) => boolean)) => void;
  loading: boolean;
  canSubmit: boolean;
  setStep: (step: "email"|"login"|"register"|"done") => void;
  onRegister: () => void;
}

const RegisterStep = memo<RegisterStepProps>(({ email, firstName, setFirstName, lastName, setLastName, pwd, setPwd, pwd2, setPwd2, showPwd, setShowPwd, showPwd2, setShowPwd2, loading, canSubmit, setStep, onRegister }) => {
  return (
    <div className="mt-6 space-y-3">
      <button type="button" onClick={()=>setStep("email")} onMouseDown={preventBlur} className="text-sm text-neutral-600 hover:text-black inline-flex items-center gap-2" style={{background: "none", border: "none", padding: 0}}>
        <ArrowLeft className="w-4 h-4"/> Changer d'adresse
      </button>
      <div className="text-sm text-neutral-600">Nouvelle adresse détectée: <span className="font-medium text-neutral-900">{email}</span></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          name="firstName"
          type="text"
          autoComplete="given-name"
          spellCheck={false}
          className="h-14 rounded-[18px] px-4 text-[15px]"
          style={{
            border: "1px solid rgba(0,0,0,0.08)",
            color: "#111",
            background: "white",
            outline: 0,
            boxShadow: "none",
            WebkitAppearance: "none",
            MozAppearance: "none",
            appearance: "none"
          }}
          placeholder="Prénom"
          value={firstName}
          onChange={e=>setFirstName(e.target.value)}
        />
        <input
          name="lastName"
          type="text"
          autoComplete="family-name"
          spellCheck={false}
          className="h-14 rounded-[18px] px-4 text-[15px]"
          style={{
            border: "1px solid rgba(0,0,0,0.08)",
            color: "#111",
            background: "white",
            outline: 0,
            boxShadow: "none",
            WebkitAppearance: "none",
            MozAppearance: "none",
            appearance: "none"
          }}
          placeholder="Nom"
          value={lastName}
          onChange={e=>setLastName(e.target.value)}
        />
      </div>
      <div className="w-full h-14 rounded-[18px] bg-white flex items-center px-4" style={{border: "1px solid rgba(0,0,0,0.08)"}}>
        <button type="button" onMouseDown={preventBlur} onClick={()=>setShowPwd(s=>!s)} className="text-neutral-500" style={{background: "none", border: "none", padding: 0, display: "flex", alignItems: "center", cursor: "pointer"}}>
          {showPwd ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
        </button>
        <input
          name="new-password"
          type={showPwd?"text":"password"}
          autoComplete="new-password"
          spellCheck={false}
          value={pwd}
          onChange={e=>setPwd(e.target.value)}
          className="ml-3 w-full text-[15px]"
          placeholder="Mot de passe (min. 6)"
          style={{
            color: "#111",
            background: "transparent",
            outline: 0,
            border: 0,
            boxShadow: "none",
            WebkitAppearance: "none",
            MozAppearance: "none",
            appearance: "none"
          }}
        />
      </div>
      <div className="w-full h-14 rounded-[18px] bg-white flex items-center px-4" style={{border: "1px solid rgba(0,0,0,0.08)"}}>
        <button type="button" onMouseDown={preventBlur} onClick={()=>setShowPwd2(s=>!s)} className="text-neutral-500" style={{background: "none", border: "none", padding: 0, display: "flex", alignItems: "center", cursor: "pointer"}}>
          {showPwd2 ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
        </button>
        <input
          name="confirm-password"
          type={showPwd2?"text":"password"}
          autoComplete="new-password"
          spellCheck={false}
          value={pwd2}
          onChange={e=>setPwd2(e.target.value)}
          className="ml-3 w-full text-[15px]"
          placeholder="Confirmer le mot de passe"
          style={{
            color: "#111",
            background: "transparent",
            outline: 0,
            border: 0,
            boxShadow: "none",
            WebkitAppearance: "none",
            MozAppearance: "none",
            appearance: "none"
          }}
        />
      </div>
      <button type="button" onClick={onRegister} disabled={!canSubmit} className="w-full h-14 rounded-full text-white text-[15px] flex items-center justify-center gap-2" style={{backgroundColor: canSubmit ? "#000" : "#d1d1d1", cursor: canSubmit ? "pointer" : "not-allowed"}}>
        {loading && <Loader2 className="w-4 h-4 animate-spin"/>}
        <span>Créer mon compte</span>
      </button>
    </div>
  );
});

// ==================== COMPOSANT PRINCIPAL ====================

interface AuthEmailFirstProps {
  onBack: () => void;
  onAuthSuccess: (user: any) => void;
}

export default function AuthEmailFirst({ onBack, onAuthSuccess }: AuthEmailFirstProps){
  const [step, setStep] = useState<"email"|"login"|"register"|"done">("email");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);
  const [otherSSO, setOtherSSO] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const canContinueEmail = /.+@.+\..+/.test(email);
  const canSubmit = firstName && lastName && pwd && pwd2 && !loading;

  async function onContinue(){
    setMsg("");
    if(!canContinueEmail){ setMsg("Entre une adresse e‑mail valide"); return; }
    setLoading(true);
    try{
      const { exists } = await apiCheckEmail(email);
      setStep(exists?"login":"register");
    }
    catch(e:any){ setMsg(e.message || "Erreur réseau"); }
    finally{ setLoading(false); }
  }

  async function onLogin(){
    setLoading(true); setMsg("");
    try{
      await apiLogin({email,password:pwd});
      setStep("done");
      setMsg("Connexion réussie. Redirection…");
      const user = { email, nom: "User", prenom: "Test" };
      localStorage.setItem('user', JSON.stringify(user));
      setTimeout(() => onAuthSuccess(user), 1000);
    }catch(e:any){ setMsg(e.message||"Échec de connexion"); }finally{ setLoading(false);}
  }

  async function onRegister(){
    setLoading(true); setMsg("");
    try{
      if(pwd!==pwd2) throw new Error("Les mots de passe ne correspondent pas");
      await apiRegister({email,password:pwd,firstName,lastName});
      setStep("done");
      setMsg("Compte créé ! Vérifie ta boîte mail.");
      const user = { email, nom: lastName, prenom: firstName };
      localStorage.setItem('user', JSON.stringify(user));
      setTimeout(() => onAuthSuccess(user), 1000);
    }catch(e:any){ setMsg(e.message||"Échec de l'inscription"); }finally{ setLoading(false);}
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex items-center justify-center px-4 py-4 relative" style={{ overflowX: "hidden", width: "100vw", boxSizing: "border-box" }}>
      <button
        type="button"
        onClick={onBack}
        className="absolute top-4 left-4 sm:top-6 sm:left-6 text-sm text-neutral-600 hover:text-black inline-flex items-center gap-2 transition-colors"
        style={{background: "none", border: "none", padding: 0, cursor: "pointer"}}
        aria-label="Retour"
      >
        <ArrowLeft className="w-4 h-4"/> Retour
      </button>

      <div className="w-full max-w-md">
        <Header />
        <div className="mt-8">
          <div className="flex flex-col gap-3">
            <GoogleButton />
            <OtherOptions otherSSO={otherSSO} setOtherSSO={setOtherSSO} />
          </div>

          {step === "email" && <EmailStep email={email} setEmail={setEmail} canContinueEmail={canContinueEmail} loading={loading} onContinue={onContinue} />}
          {step === "login" && <LoginStep email={email} pwd={pwd} setPwd={setPwd} showPwd={showPwd} setShowPwd={setShowPwd} loading={loading} setStep={setStep} onLogin={onLogin} />}
          {step === "register" && <RegisterStep email={email} firstName={firstName} setFirstName={setFirstName} lastName={lastName} setLastName={setLastName} pwd={pwd} setPwd={setPwd} pwd2={pwd2} setPwd2={setPwd2} showPwd={showPwd} setShowPwd={setShowPwd} showPwd2={showPwd2} setShowPwd2={setShowPwd2} loading={loading} canSubmit={canSubmit} setStep={setStep} onRegister={onRegister} />}
          {step === "done" && (
            <div className="mt-6 rounded-2xl border border-neutral-200 p-4 bg-neutral-50 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 mt-0.5"/>
              <div className="text-sm">
                <div className="font-medium">Tout est bon.</div>
                <div>Tu vas être redirigé. Ferme cet onglet si rien ne se passe.</div>
              </div>
            </div>
          )}

          {msg && (
            <div aria-live="polite" className="mt-4 text-[14px] text-center text-red-600">{msg}</div>
          )}

          <p className="mt-8 text-xs text-center text-neutral-500 leading-relaxed">
            En continuant, vous acceptez les <a className="underline hover:text-neutral-800" href="#">conditions d'utilisation</a> et la <a className="underline hover:text-neutral-800" href="#">politique de confidentialité</a> d'Alternance & Talent.
          </p>
        </div>
      </div>
    </div>
  );
}
