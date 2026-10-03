import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

import { signInWithPassword, signInWithProvider } from "../lib/auth";

export const Route = createFileRoute("/login")({ component: AdminLogin });

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      await signInWithPassword(email.trim(), String(form.get("password") ?? ""));
      window.location.assign("/");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "We could not sign you in. Try again.");
      setBusy(false);
    }
  }

  async function oauth(provider: "google" | "apple") {
    setBusy(true);
    setMessage("");
    try {
      await signInWithProvider(provider);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "That sign-in method is unavailable. Try again.",
      );
      setBusy(false);
    }
  }

  return (
    <main className="admin-login-page">
      <a className="admin-brand" href="/">
        SHOWOFF ADMIN
      </a>
      <section className="admin-login-panel" aria-labelledby="admin-login-title">
        <p className="admin-login-label">INTERNAL ACCESS</p>
        <h1 id="admin-login-title">Sign in to Admin</h1>
        <p className="admin-login-intro">Only accounts with platform admin access can continue.</p>
        <div className="admin-login-providers">
          <button type="button" disabled={busy} onClick={() => void oauth("google")}>
            Continue with Google
          </button>
          <button type="button" disabled={busy} onClick={() => void oauth("apple")}>
            Continue with Apple
          </button>
        </div>
        <div className="admin-login-divider">
          <span>OR</span>
        </div>
        <form className="admin-login-form" onSubmit={(event) => void submit(event)}>
          <label htmlFor="admin-email">Email</label>
          <input
            id="admin-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.currentTarget.value)}
          />
          <label htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
          <button className="admin-login-submit" type="submit" disabled={busy}>
            {busy ? "Please wait…" : "Continue"}
          </button>
        </form>
        {message && (
          <p className="admin-feedback" role="alert">
            {message}
          </p>
        )}
      </section>
    </main>
  );
}
