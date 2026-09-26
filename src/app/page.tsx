"use client";

import { useState, type FormEvent } from "react";

function Icon({ name }: { name: "user" | "lock" | "eye" | "hidden" | "login" }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name === "user" && <><circle cx="12" cy="7" r="4" /><path d="M3 21v-2a7 5 0 0 1 18 0v2Z" /></>}
    {name === "lock" && <><rect x="4" y="10" width="16" height="12" rx="2" /><path d="M7 10V7a5 5 0 0 1 10 0v3" /></>}
    {(name === "eye" || name === "hidden") && <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" />{name === "hidden" && <path d="m3 3 18 18" />}</>}
    {name === "login" && <><path d="M14 3h6v18h-6M3 12h12m-5-5 5 5-5 5" /></>}
  </svg>;
}

export default function Home() {
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState("");
  const [signingIn, setSigningIn] = useState(false);
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (!String(data.get("accountId") ?? "").trim()) {
      setNotice("Please enter your Account ID.");
      event.currentTarget.querySelector<HTMLInputElement>("#account-id")?.focus();
      return;
    }
    setNotice("");
    setSigningIn(true);
    let navigating = false;
    try {
      const response = await fetch("/api/demo/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accountId: String(data.get("accountId") ?? ""), password: String(data.get("password") ?? "") }) });
      const result = await response.json() as { error?: string; redirectTo?: string };
      if (!response.ok || !result.redirectTo) { setNotice(result.error ?? "Unable to sign in. Please try again."); return; }
      navigating = true;
      window.location.replace(result.redirectTo);
    } catch { setNotice("Unable to reach the system. Please try again."); }
    finally { if (!navigating) setSigningIn(false); }
  }
  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="welcome-title">
        <header className="brand">
          <span className="brand-crest" role="img" aria-label="National University crest" />
          <div><p className="brand-name">NU Fairview</p><p className="brand-service">Laboratory Services</p></div>
        </header>
        <div className="welcome"><h1 id="welcome-title">Welcome Back</h1><p>Sign in to continue to your account.</p></div>
        <form onSubmit={handleSubmit} onChange={() => notice && setNotice("")}>
          <div className="field-group">
            <label htmlFor="account-id">Account ID</label>
            <div className="input-wrap"><span className="field-icon"><Icon name="user" /></span><input id="account-id" name="accountId" type="text" placeholder="Enter your Account ID" autoComplete="username" autoCapitalize="none" spellCheck={false} required aria-describedby="account-hint" /></div>
            <span id="account-hint" className="sr-only">Use your NU Student ID or NU Fairview email address.</span>
          </div>
          <div className="field-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrap"><span className="field-icon"><Icon name="lock" /></span><input id="password" name="password" type={showPassword ? "text" : "password"} placeholder="Password" autoComplete="current-password" required /><button className="password-toggle" type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}><Icon name={showPassword ? "hidden" : "eye"} /></button></div>
          </div>
          <button className="sign-in" type="submit" disabled={signingIn} aria-busy={signingIn}><Icon name="login" /><span>{signingIn ? "Signing In..." : "Sign In"}</span></button>
          <p className="form-notice" role="status">{notice}</p>
        </form>
        <footer className="login-footer"><div className="footer-divider"><span>NU Fairview</span></div><p>Physics and Circuits Laboratory Service</p><small className="login-demo-note">Demo workspace</small></footer>
      </section>
    </main>
  );
}
