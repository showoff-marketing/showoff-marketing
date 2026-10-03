import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";

import { createOrganization } from "../lib/organizations";
import { signInWithPassword, signInWithProvider, signUpWithPassword } from "../lib/auth";
import { createSupabaseBrowserClient } from "../lib/supabase/client";

type View = "loading" | "auth" | "workspace" | "app" | "account";

export const Route = createFileRoute("/")({ component: CustomerEntry });

function CustomerEntry() {
  const [view, setView] = useState<View>("loading");
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [email, setEmail] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [signedInEmail, setSignedInEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!data.session) {
          if (!cancelled) setView("auth");
          return;
        }

        const { data: userResult, error: userError } = await supabase.auth.getUser();
        if (userError || !userResult.user)
          throw userError ?? new Error("Sign in again to continue.");

        const { data: organizations, error: organizationError } = await supabase
          .from("organizations")
          .select("id, name")
          .order("created_at", { ascending: true });
        if (organizationError) throw organizationError;

        if (cancelled) return;
        setSignedInEmail(userResult.user.email ?? "");
        if (organizations?.length) {
          setOrganizationName(organizations[0].name);
          setView("app");
        } else {
          setView("workspace");
        }
      } catch {
        if (!cancelled) setView("auth");
      }
    }

    void restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setErrorMessage("");
    setNotice("");

    try {
      if (creatingAccount) {
        const password = new FormData(event.currentTarget).get("password");
        if (typeof password !== "string") throw new Error("Enter a password to continue.");
        const result = await signUpWithPassword(email.trim(), password);
        if (!result.session) {
          setNotice("Check your email to confirm your account before creating a workspace.");
          return;
        }
      } else {
        await signInWithPassword(
          email.trim(),
          String(new FormData(event.currentTarget).get("password") ?? ""),
        );
      }

      await loadSignedInWorkspace();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "We could not sign you in. Try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleProviderSignIn(provider: "google" | "apple") {
    setBusy(true);
    setErrorMessage("");
    try {
      await signInWithProvider(provider);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "That sign-in method is unavailable. Try again.",
      );
      setBusy(false);
    }
  }

  async function loadSignedInWorkspace() {
    const supabase = createSupabaseBrowserClient();
    const { data: userResult, error: userError } = await supabase.auth.getUser();
    if (userError || !userResult.user) throw userError ?? new Error("Sign in again to continue.");

    const { data: organizations, error: organizationError } = await supabase
      .from("organizations")
      .select("id, name")
      .order("created_at", { ascending: true });
    if (organizationError) throw organizationError;

    setSignedInEmail(userResult.user.email ?? "");
    if (organizations?.length) {
      setOrganizationName(organizations[0].name);
      setView("app");
    } else {
      setView("workspace");
    }
  }

  async function handleOrganizationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setErrorMessage("");
    try {
      await createOrganization({ name: organizationName });
      setView("app");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "We could not create your workspace. Try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    setBusy(true);
    setErrorMessage("");
    try {
      const { error } = await createSupabaseBrowserClient().auth.signOut();
      if (error) throw error;
      setView("auth");
      setOrganizationName("");
      setSignedInEmail("");
      setNotice("You are signed out.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "We could not sign you out. Try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (view === "loading") {
    return (
      <main className="customer-loading" aria-live="polite">
        Loading your account…
      </main>
    );
  }

  if (view === "workspace") {
    return (
      <main className="auth-page">
        <BrandHeader />
        <Progress current="workspace" />
        <section className="auth-panel onboarding-panel" aria-labelledby="workspace-title">
          <p className="step-label">WORKSPACE SETUP</p>
          <h1 id="workspace-title">Name your workspace</h1>
          <p className="panel-intro">
            Start with the business or team you’ll be marketing with Showoff.
          </p>
          <form className="auth-form" onSubmit={handleOrganizationSubmit}>
            <label htmlFor="organization-name">Business or workspace name</label>
            <input
              id="organization-name"
              name="organizationName"
              autoComplete="organization"
              maxLength={160}
              required
              value={organizationName}
              onChange={(event) => setOrganizationName(event.currentTarget.value)}
            />
            <button className="primary-button" type="submit" disabled={busy}>
              {busy ? "Creating workspace…" : "Create workspace"}
            </button>
          </form>
          <p className="progress-note">Team invitations aren’t part of this setup flow.</p>
          <Feedback error={errorMessage} notice={notice} />
          <button
            className="text-button"
            type="button"
            onClick={() => void handleSignOut()}
            disabled={busy}
          >
            Sign out
          </button>
        </section>
      </main>
    );
  }

  if (view === "app" || view === "account") {
    return (
      <main className="product-shell">
        <header className="product-header">
          <a className="wordmark" href="/" aria-label="Showoff home">
            SHOWOFF
          </a>
          <div className="product-header-actions">
            <span className="workspace-name">{organizationName}</span>
            <button
              className="account-button"
              type="button"
              aria-expanded={view === "account"}
              onClick={() => setView(view === "account" ? "app" : "account")}
            >
              Account
            </button>
          </div>
        </header>
        {view === "account" ? (
          <section className="account-panel" aria-labelledby="account-title">
            <p className="step-label">ACCOUNT</p>
            <h1 id="account-title">Your account</h1>
            <dl className="account-details">
              <div>
                <dt>Email</dt>
                <dd>{signedInEmail || "Signed-in account"}</dd>
              </div>
              <div>
                <dt>Workspace</dt>
                <dd>{organizationName}</dd>
              </div>
            </dl>
            <button
              className="secondary-button"
              type="button"
              onClick={() => void handleSignOut()}
              disabled={busy}
            >
              {busy ? "Signing out…" : "Sign out"}
            </button>
            <Feedback error={errorMessage} notice={notice} />
          </section>
        ) : (
          <section className="workspace-home" aria-labelledby="workspace-home-title">
            <p className="step-label">YOUR WORKSPACE</p>
            <h1 id="workspace-home-title">{organizationName}</h1>
            <p className="panel-intro">
              Your Showoff workspace is ready. The connected marketing workflow is taking shape
              here.
            </p>
            <div className="workflow-list" aria-label="Showoff workflow">
              {["Plan", "Create", "Capture", "Distribute", "Nurture", "Analyze", "Optimize"].map(
                (stage) => (
                  <span className="workflow-stage" key={stage}>
                    {stage}
                  </span>
                ),
              )}
            </div>
            <p className="workspace-status" role="status">
              Campaign tools will appear here as they become available.
            </p>
          </section>
        )}
      </main>
    );
  }

  return (
    <main className="auth-page">
      <BrandHeader />
      <Progress current="account" />
      <section className="auth-panel" aria-labelledby="auth-title">
        <h1 id="auth-title">{creatingAccount ? "CREATE YOUR ACCOUNT" : "SIGN IN TO SHOWOFF"}</h1>
        <div className="provider-actions" aria-label="Sign-in options">
          <button
            className="provider-button"
            type="button"
            onClick={() => void handleProviderSignIn("google")}
            disabled={busy}
          >
            <GoogleMark /> <span>Continue with Google</span>
          </button>
          <button
            className="provider-button"
            type="button"
            onClick={() => void handleProviderSignIn("apple")}
            disabled={busy}
          >
            <AppleMark /> <span>Continue with Apple</span>
          </button>
        </div>
        <div className="form-divider">
          <span>OR</span>
        </div>
        <form className="auth-form" onSubmit={(event) => void handlePasswordSubmit(event)}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.currentTarget.value)}
          />
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={creatingAccount ? "new-password" : "current-password"}
            minLength={creatingAccount ? 8 : undefined}
            required
          />
          <button className="primary-button" type="submit" disabled={busy}>
            {busy ? "Please wait…" : creatingAccount ? "Create account" : "Continue"}
          </button>
        </form>
        <div className="account-switch">
          <span>{creatingAccount ? "Already have an account?" : "New to Showoff?"}</span>
          <button
            className="text-button"
            type="button"
            onClick={() => {
              setCreatingAccount(!creatingAccount);
              setErrorMessage("");
              setNotice("");
            }}
          >
            {creatingAccount ? "Sign in" : "Create account"}
          </button>
        </div>
        <Feedback error={errorMessage} notice={notice} />
      </section>
    </main>
  );
}

function BrandHeader() {
  return (
    <header className="auth-header">
      <a className="wordmark" href="/" aria-label="Showoff">
        SHOWOFF
      </a>
    </header>
  );
}

function Progress({ current }: { current: "account" | "workspace" }) {
  const steps = ["Account", "Workspace", "Team"] as const;
  return (
    <ol className="setup-progress" aria-label="Account setup progress">
      {steps.map((step, index) => {
        const active = step.toLowerCase() === current;
        const complete = current === "workspace" && step === "Account";
        return (
          <li
            className={active ? "is-current" : complete ? "is-complete" : ""}
            key={step}
            aria-current={active ? "step" : undefined}
          >
            <span className="progress-dot" aria-hidden="true">
              {complete ? "✓" : ""}
            </span>
            <span className="progress-name">{step}</span>
            {index < steps.length - 1 && <span className="progress-rule" aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}

function Feedback({ error, notice }: { error: string; notice: string }) {
  if (error)
    return (
      <p className="form-feedback is-error" role="alert">
        {error}
      </p>
    );
  if (notice)
    return (
      <p className="form-feedback is-notice" role="status">
        {notice}
      </p>
    );
  return null;
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="provider-mark">
      <path
        fill="#4285F4"
        d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.8 6.1-15Z"
      />
      <path
        fill="#34A853"
        d="M24 44c5.5 0 10.1-1.8 13.5-4.9L30.9 34c-1.9 1.3-4.2 2.1-6.9 2.1-5.3 0-9.8-3.6-11.4-8.5H5.8V33A20 20 0 0 0 24 44Z"
      />
      <path fill="#FBBC05" d="M12.6 27.6a12 12 0 0 1 0-7.2v-5.5H5.8a20 20 0 0 0 0 18.2l6.8-5.5Z" />
      <path
        fill="#EA4335"
        d="M24 11.9c3 0 5.7 1 7.8 3.1l5.8-5.8C34.1 5.9 29.5 4 24 4A20 20 0 0 0 5.8 14.9l6.8 5.5c1.6-4.9 6.1-8.5 11.4-8.5Z"
      />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="provider-mark apple-mark">
      <path d="M16.5 12.8c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3-1.6-1.3-.1-2.5.8-3.2.8-.7 0-1.7-.8-2.8-.8-1.5 0-2.9.9-3.6 2.3-1.5 2.7-.4 6.7 1.1 8.9.7 1.1 1.5 2.3 2.6 2.2 1-.1 1.4-.7 2.7-.7s1.7.7 2.8.7c1.2 0 1.9-1.1 2.6-2.2.8-1.3 1.1-2.5 1.1-2.6-.1 0-2.1-.8-2.1-3.8ZM14.4 6.6c.6-.8 1-1.9.9-3-.9 0-2 .6-2.6 1.4-.6.7-1.1 1.8-1 2.9 1 .1 2.1-.5 2.7-1.3Z" />
    </svg>
  );
}
