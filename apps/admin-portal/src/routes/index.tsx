import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";

import { getAdminAccess } from "../lib/auth";
import { createSupabaseBrowserClient } from "../lib/supabase/client";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const access = await getAdminAccess();
    if (!access.authenticated || !access.authorized) throw redirect({ to: "/login" });
  },
  component: AdminEntry,
});

function AdminEntry() {
  const [activeSection, setActiveSection] = useState("Overview");
  const [message, setMessage] = useState("");
  const sections = ["Overview", "Tenants", "Support", "Provider health", "Settings"];

  async function signOut() {
    setMessage("");
    const { error } = await createSupabaseBrowserClient().auth.signOut();
    if (error) {
      setMessage("We could not sign you out. Please try again.");
      return;
    }
    window.location.assign("/login");
  }

  return (
    <main className="admin-page">
      <header className="admin-heading">
        <div>
          <a className="admin-brand" href="/">
            SHOWOFF ADMIN
          </a>
          <h1>{activeSection}</h1>
        </div>
        <div className="connection-status" aria-label="Data connections: not connected">
          <span>Data connections</span>
          <strong>Not connected</strong>
        </div>
      </header>

      <nav className="admin-nav" aria-label="Admin sections">
        {sections.map((section) => (
          <button
            className={activeSection === section ? "is-active" : ""}
            type="button"
            key={section}
            aria-current={activeSection === section ? "page" : undefined}
            onClick={() => setActiveSection(section)}
          >
            {section}
          </button>
        ))}
      </nav>

      {activeSection === "Overview" ? (
        <div className="admin-index">
          <UnavailableSection title="Tenants" />
          <UnavailableSection title="Support" />
          <UnavailableSection title="Provider health" />
        </div>
      ) : activeSection === "Settings" ? (
        <section className="admin-detail" aria-labelledby="settings-title">
          <h2 id="settings-title">Settings</h2>
          <p>Admin access is verified by Showoff’s server-side permission check.</p>
          <button className="admin-signout" type="button" onClick={() => void signOut()}>
            Sign out
          </button>
        </section>
      ) : (
        <section className="admin-detail" aria-labelledby="section-title">
          <h2 id="section-title">{activeSection}</h2>
          <UnavailableState />
        </section>
      )}

      {message && (
        <p className="admin-feedback" role="alert">
          {message}
        </p>
      )}
      {activeSection !== "Settings" && (
        <button className="quiet-signout" type="button" onClick={() => void signOut()}>
          Sign out
        </button>
      )}
    </main>
  );
}

function UnavailableSection({ title }: { title: string }) {
  return (
    <section
      className="admin-index-column"
      aria-labelledby={`heading-${title.toLowerCase().replaceAll(" ", "-")}`}
    >
      <h2 id={`heading-${title.toLowerCase().replaceAll(" ", "-")}`}>{title}</h2>
      <UnavailableState />
    </section>
  );
}

function UnavailableState() {
  return (
    <div className="admin-unavailable">
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path d="M15 6.5h23l13 13V56H15z" />
        <path d="M38 7v13h13M23 44l18-18" />
      </svg>
      <span className="unavailable-label">Unavailable</span>
      <p>No operational data is connected yet.</p>
    </div>
  );
}
