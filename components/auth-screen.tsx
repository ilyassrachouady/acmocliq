"use client";

/* eslint-disable @next/next/no-img-element */
import { FormEvent, useState } from "react";
import { ArrowRight, Check, LoaderCircle, LockKeyhole, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function AuthScreen() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") || "");
    const password = String(data.get("password") || "");
    const fullName = String(data.get("fullName") || "");
    const supabase = createClient();
    const result = mode === "signin"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
    setLoading(false);
    if (result.error) return setMessage(result.error.message);
    if (mode === "signup" && !result.data.session) {
      setMessage("Compte créé. Confirmez votre adresse courriel pour continuer.");
      return;
    }
    window.location.reload();
  };

  const resetPassword = async () => {
    const email = (document.querySelector('input[name="email"]') as HTMLInputElement | null)?.value;
    if (!email) return setMessage("Entrez d’abord votre adresse courriel.");
    setLoading(true);
    const { error } = await createClient().auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/` });
    setLoading(false);
    setMessage(error ? error.message : "Un lien sécurisé vient d’être envoyé par courriel.");
  };

  return (
    <main className="auth-shell">
      <img className="auth-page-backdrop" src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2200&q=90" alt="Résidence contemporaine"/>
      <div className="auth-page-shade"/>
      <section className="auth-brand-panel">
        <header className="auth-brand-header"><img src="/ocliq-logo.png" alt="Ocliq"/><span>ACM STUDIO</span></header>
        <div className="auth-hero-copy"><span className="auth-overline"><Sparkles/> L’ACM réinventée pour le courtier québécois</span><h1>Transformez les données<br/>en <em>confiance.</em></h1><p>Une analyse claire, une recommandation défendable et une présentation que vos vendeurs comprennent vraiment.</p></div>
        <div className="auth-market-proof"><span><b>389 000 $</b> valeur recommandée</span><span><b>5</b> comparables vérifiés</span><span><b>24 jours</b> délai moyen</span></div>
        <footer className="auth-trust"><span><ShieldCheck/> Données protégées par utilisateur</span><span><Check/> Sauvegarde automatique</span></footer>
      </section>
      <section className="auth-form-panel">
        <div className="auth-form-brand"><img src="/ocliq-logo.png" alt="Ocliq"/><span>ACM Studio</span></div>
        <form className="auth-card" onSubmit={submit}>
          <span className="auth-card-kicker">ESPACE COURTIER SÉCURISÉ</span>
          <h2>{mode === "signin" ? "Heureux de vous revoir." : "Bienvenue chez Ocliq."}</h2>
          <p>{mode === "signin" ? "Retrouvez vos dossiers et poursuivez exactement où vous étiez." : "Créez votre espace pour produire des ACM qui font avancer vos mandats."}</p>
          {mode === "signup" && <label><span>Nom complet</span><div><input name="fullName" required placeholder="Gabriel Arseneault"/></div></label>}
          <label><span>Adresse courriel</span><div><Mail/><input name="email" type="email" required placeholder="vous@agence.ca"/></div></label>
          <label><span>Mot de passe {mode === "signin" && <button type="button" onClick={() => void resetPassword()}>Mot de passe oublié?</button>}</span><div><LockKeyhole/><input name="password" type="password" minLength={8} required placeholder="8 caractères minimum"/></div></label>
          {message && <div className="auth-message">{message}</div>}
          <button className="primary-action auth-submit" disabled={loading}>{loading ? <LoaderCircle className="pdf-spinner"/> : <ArrowRight/>}{loading ? "Un instant…" : mode === "signin" ? "Accéder à mon espace" : "Créer mon espace"}</button>
          <button type="button" className="auth-switch" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMessage(""); }}>{mode === "signin" ? "Première visite? Créer un compte" : "Déjà un compte? Se connecter"}</button>
          <div className="auth-privacy"><ShieldCheck/> Connexion chiffrée. Vos données ne sont accessibles que par vous.</div>
        </form>
        <p className="auth-legal">En continuant, vous acceptez les conditions d’utilisation et la politique de confidentialité d’Ocliq.</p>
      </section>
    </main>
  );
}
