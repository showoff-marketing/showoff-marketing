# Repository guidance

## Project map

- `apps/marketing` is the public marketing site, built with Astro. Read its `AGENTS.md` before changing that app.
- `apps/customer-portal` is the customer application, built with React and TanStack Router.
- `apps/admin-portal` is a separate internal React application, built with React and TanStack Router.
- `docs/prd.md` is the consolidated product requirements document and source of truth for product behavior and Phase 1 scope.
- The admin portal is a separate planned application surface. Do not fold it into the customer portal or marketing site.

## Architecture and product rules

- Keep the public marketing site and authenticated product applications as separate surfaces. Use Astro for marketing and TanStack Router for customer/admin client-side routing. Keep authorization and tenant isolation enforced by Supabase Auth, Postgres functions, and RLS.
- Showoff owns its core product data and policies. Keep replaceable external services behind Showoff-owned provider interfaces and adapters; feature code should not call provider SDKs directly.
- Enforce organization boundaries, permissions, plan entitlements, and feature flags on the server as well as in the interface.
- Require explicit customer approval for consequential actions, including ad budget approval and campaign go-live.
- Keep AI-generated output editable and preserve user work across failures and retries.
- Treat email and SMS availability as feature-flagged provider capabilities; their approval status must not block the Phase 1 launch path.
- Consult `docs/prd.md` for detailed workflows, provider boundaries, and acceptance criteria instead of duplicating those details here.

## Workspace commands

Run these from the repository root:

| Command | Purpose |
| --- | --- |
| `pnpm dev:customer` | Start the customer portal |
| `pnpm dev:admin` | Start the admin portal |
| `pnpm dev:marketing` | Start the marketing site |
| `pnpm build:customer` | Build the customer portal |
| `pnpm build:admin` | Build the admin portal |
| `pnpm build:marketing` | Build the marketing site |
| `pnpm lint` | Run Oxlint |
| `pnpm format:check` | Check formatting with Oxfmt |

The repository requires Node.js `>=22.13.0` and uses pnpm `12.8.1`. Follow any app-level `AGENTS.md` for app-specific development and verification instructions.
