import { createRootRoute, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: Outlet,
  errorComponent: ({ error, reset }) => (
    <main className="admin-error-page">
      <div>
        <a className="admin-brand" href="/">
          SHOWOFF ADMIN
        </a>
        <h1>Admin access could not be verified</h1>
        <p>{error instanceof Error ? error.message : "Check your connection and try again."}</p>
        <button type="button" onClick={reset}>
          Try again
        </button>
      </div>
    </main>
  ),
});
