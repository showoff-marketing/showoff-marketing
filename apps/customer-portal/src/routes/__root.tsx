import { createRootRoute, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: Outlet,
  errorComponent: ({ error, reset }) => (
    <main className="customer-loading">
      <section className="auth-panel" aria-labelledby="page-error-title">
        <h1 id="page-error-title">We couldn’t open your account</h1>
        <p className="panel-intro">
          {error instanceof Error ? error.message : "Check your connection and try again."}
        </p>
        <button className="primary-button" type="button" onClick={reset}>
          Try again
        </button>
      </section>
    </main>
  ),
});
