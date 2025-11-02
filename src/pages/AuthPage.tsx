import React, { useEffect, useMemo, useState } from "react";
import { ShieldCheck, Mail, Eye, EyeOff, ChevronDown, ChevronUp, ArrowLeft, Apple, Github, Loader2, Send } from "lucide-react";

/*
  Page d'authentification « email d'abord » — Alternance & Talent
  • Détecte automatiquement si l'email existe -> connexion (mot de passe)
    sinon -> création de compte (nom + mot de passe)
  • Bouton SSO Google + options additionnelles (Apple, GitHub) masquées par défaut
  • Design compact, mobile‑first, arrondis façon screenshot Mobbin

  ⚙️ Intégration backend:
    - /api/auth/check-email    { email }        => { exists: boolean }
    - /api/auth/login          { email, password }
    - /api/auth/register       { email, password, firstName, lastName }

  👉 En attendant votre backend, laissez MOCK=true pour une démo 100% front.
     Règle démo: tous les emails finissant par "@demo.com" EXISTENT déjà.
*/

const MOCK = true;

async function apiCheckEmail(email: string){
  if(MOCK){
    await new Promise(r=>setTimeout(r, 500));
    return { exists: email.trim().toLowerCase().endsWith("@demo.com") };
  }
  const res = await fetch("/api/auth/check-email",{ method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({email})});
  if(!res.ok) throw new Error("check-email failed");
  return res.json();
}

async function apiLogin({email,password}: {email: string, password: string}){
  if(MOCK){
    await new Promise(r=>setTimeout(r, 700));
    if(password === "password") return { ok:true };
    throw new Error("Mot de passe incorrect");
  }
  const res = await fetch("/api/auth/login",{ method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({email,password})});
  if(!res.ok) throw new Error("login failed");
  return res.json();
}

async function apiRegister({email,password,firstName,lastName}: {email: string, password: string, firstName: string, lastName: string}){
  if(MOCK){
    await new Promise(r=>setTimeout(r, 800));
    if(password.length < 6) throw new Error("Mot de passe trop court (min. 6)");
    return { ok:true };
  }
  const res = await fetch("/api/auth/register",{ method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({email,password,firstName,lastName})});
  if(!res.ok) throw new Error("register failed");
  return res.json();
}

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

interface AuthEmailFirstProps {
  onBack: () => void;
  onAuthSuccess: (user: any) => void;
}

export default function AuthEmailFirst({ onBack, onAuthSuccess }: AuthEmailFirstProps){
  const [step, setStep] = useState("email"); // 'email' | 'login' | 'register' | 'done'
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

  async function onContinue(){
    setMsg("");
    if(!canContinueEmail) return setMsg("Entre une adresse e‑mail valide");
    setLoading(true);
    try{
      const { exists } = await apiCheckEmail(email);
      if(exists){
        setStep("login");
      }else{
        setStep("register");
      }
    }catch(e: any){ setMsg(e.message || "Erreur réseau"); }
    finally{ setLoading(false); }
  }

  async function onLogin(){
    setLoading(true); setMsg("");
    try{
      await apiLogin({email, password: pwd});
      setStep("done");
      setMsg("Connexion réussie. Redirection…");

      // Connexion réussie - créer l'utilisateur et appeler onAuthSuccess
      const user = { email, nom: "User", prenom: "Test" };
      localStorage.setItem('user', JSON.stringify(user));
      setTimeout(() => onAuthSuccess(user), 1000);
    }
    catch(e: any){ setMsg(e.message || "Échec de connexion"); }
    finally{ setLoading(false); }
  }

  async function onRegister(){
    setLoading(true); setMsg("");
    try{
      if(pwd !== pwd2) throw new Error("Les mots de passe ne correspondent pas");
      await apiRegister({email, password: pwd, firstName, lastName});
      setStep("done");
      setMsg("Compte créé ! Vérifie ta boîte mail.");

      // Inscription réussie - créer l'utilisateur et appeler onAuthSuccess
      const user = { email, nom: lastName, prenom: firstName };
      localStorage.setItem('user', JSON.stringify(user));
      setTimeout(() => onAuthSuccess(user), 1000);
    }catch(e: any){ setMsg(e.message || "Échec de l'inscription"); }
    finally{ setLoading(false); }
  }

  function Header(){
    return (
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-center">Ravi de t'alter‑voir</h1>
        <p className="-mt-2 text-base text-neutral-500 text-center">Se connecter ou créer un compte</p>
      </div>
    );
  }

  function Separator(){
    return (
      <div className="relative my-6">
        <div className="h-px bg-neutral-200" />
        <span className="absolute -translate-x-1/2 left-1/2 -top-3 bg-white px-3 text-sm text-neutral-500">ou</span>
      </div>
    );
  }

  function GoogleButton(){
    return (
      <button className="w-full h-12 rounded-full border border-neutral-200 bg-white hover:bg-neutral-50 transition flex items-center justify-center gap-3 text-[15px]" onClick={()=>alert("TODO: OAuth Google")}>
        <GoogleLogo />
        <span>Continuer avec Google</span>
      </button>
    );
  }

  function OtherOptions(){
    return (
      <>
        <button onClick={()=>setOtherSSO(v=>!v)} className="w-full h-12 rounded-full border border-neutral-200 bg-white hover:bg-neutral-50 transition flex items-center justify-center gap-2 text-[15px]">
          {otherSSO ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
          <span>Voir d'autres options</span>
        </button>
        {otherSSO && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <button className="h-12 rounded-full border border-neutral-200 bg-white hover:bg-neutral-50 transition flex items-center justify-center gap-2" onClick={()=>alert("TODO: Apple OAuth")}>
              <Apple className="w-5 h-5"/> <span>Apple</span>
            </button>
            <button className="h-12 rounded-full border border-neutral-200 bg-white hover:bg-neutral-50 transition flex items-center justify-center gap-2" onClick={()=>alert("TODO: GitHub OAuth")}>
              <Github className="w-5 h-5"/> <span>GitHub</span>
            </button>
          </div>
        )}
      </>
    );
  }

  function EmailStep(){
    return (
      <div className="mt-6">
        <Separator />
        <label htmlFor="email" className="sr-only">Adresse e‑mail</label>
        <div className="w-full h-12 rounded-2xl border border-neutral-200 bg-neutral-100/70 flex items-center px-4">
          <Mail className="w-5 h-5 text-neutral-500"/>
          <input id="email" type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} className="ml-3 w-full bg-transparent outline-none text-[15px] placeholder:text-neutral-400" placeholder="Entrez l'adresse e‑mail" onKeyDown={(e)=>{ if(e.key==='Enter'){ onContinue(); }}}/>
        </div>
        <button
          onClick={onContinue}
          disabled={!canContinueEmail || loading}
          className="mt-4 w-full h-11 rounded-full text-white text-[15px] font-semibold inline-flex items-center justify-center gap-2 transition transform hover:-translate-y-[1px] active:translate-y-0 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2663eb]/30 disabled:cursor-not-allowed shadow-[inset_0_1px_0_rgba(255,255,255,.35),_0_6px_16px_rgba(38,99,235,.28)] hover:shadow-[inset_0_1.5px_0_rgba(255,255,255,.45),_0_10px_24px_rgba(38,99,235,.34)]"
          style={{ background: 'linear-gradient(180deg, #2e6ffa 0%, #2663eb 70%)', border: '1px solid #1f4fd1' }}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4 -ml-1"/>}
          <span>Continuer</span>
        </button>
      </div>
    );
  }

  function LoginStep(){
    return (
      <div className="mt-6 space-y-3">
        <button onClick={()=>setStep("email")} className="text-sm text-neutral-600 hover:text-black inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4"/> Changer d'adresse
        </button>
        <div className="text-sm text-neutral-600">Adresse reconnue: <span className="font-medium text-neutral-900">{email}</span></div>
        <div className="w-full h-12 rounded-2xl border border-neutral-200 bg-white flex items-center px-4">
          <button type="button" onClick={()=>setShowPwd(s=>!s)} className="text-neutral-500">
            {showPwd ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
          </button>
          <input type={showPwd?"text":"password"} value={pwd} onChange={e=>setPwd(e.target.value)} className="ml-3 w-full bg-transparent outline-none text-[15px] placeholder:text-neutral-400" placeholder="Mot de passe" onKeyDown={(e)=>{ if(e.key==='Enter'){ onLogin(); }}}/>
        </div>
        <div className="flex items-center justify-between">
          <a className="text-sm text-neutral-600 hover:text-black" href="#">Mot de passe oublié ?</a>
        </div>
        <button onClick={onLogin} disabled={!pwd || loading} className="w-full h-12 rounded-full bg-black text-white text-[15px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin"/>}
          <span>Se connecter</span>
        </button>
      </div>
    );
  }

  function RegisterStep(){
    return (
      <div className="mt-6 space-y-3">
        <button onClick={()=>setStep("email")} className="text-sm text-neutral-600 hover:text-black inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4"/> Changer d'adresse
        </button>
        <div className="text-sm text-neutral-600">Nouvelle adresse détectée: <span className="font-medium text-neutral-900">{email}</span></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input className="h-12 rounded-2xl border border-neutral-200 px-4 text-[15px]" placeholder="Prénom" value={firstName} onChange={e=>setFirstName(e.target.value)} />
          <input className="h-12 rounded-2xl border border-neutral-200 px-4 text-[15px]" placeholder="Nom" value={lastName} onChange={e=>setLastName(e.target.value)} />
        </div>
        <div className="w-full h-12 rounded-2xl border border-neutral-200 bg-white flex items-center px-4">
          <button type="button" onClick={()=>setShowPwd(s=>!s)} className="text-neutral-500">
            {showPwd ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
          </button>
          <input type={showPwd?"text":"password"} value={pwd} onChange={e=>setPwd(e.target.value)} className="ml-3 w-full bg-transparent outline-none text-[15px] placeholder:text-neutral-400" placeholder="Mot de passe (min. 6)" />
        </div>
        <div className="w-full h-12 rounded-2xl border border-neutral-200 bg-white flex items-center px-4">
          <button type="button" onClick={()=>setShowPwd2(s=>!s)} className="text-neutral-500">
            {showPwd2 ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
          </button>
          <input type={showPwd2?"text":"password"} value={pwd2} onChange={e=>setPwd2(e.target.value)} className="ml-3 w-full bg-transparent outline-none text-[15px] placeholder:text-neutral-400" placeholder="Confirmer le mot de passe" />
        </div>
        <button onClick={onRegister} disabled={!firstName || !lastName || !pwd || !pwd2 || loading} className="w-full h-12 rounded-full bg-black text-white text-[15px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin"/>}
          <span>Créer mon compte</span>
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Bouton retour en haut à gauche */}
        <button
          onClick={onBack}
          className="mb-4 text-sm text-neutral-600 hover:text-black inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4"/> Retour
        </button>

        <Header />

        {/* Bloc SSO + Email flow */}
        <div className="mt-8">
          <div className="flex flex-col gap-3">
            <GoogleButton />
            <OtherOptions />
          </div>

          {step === "email" && <EmailStep />}
          {step === "login" && <LoginStep />}
          {step === "register" && <RegisterStep />}
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
