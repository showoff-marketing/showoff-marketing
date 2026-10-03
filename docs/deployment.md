# Deployment setup

The marketing, customer, and admin applications are separate static sites hosted on Cloudflare Pages. Astro builds the public marketing site; the customer and admin React applications use TanStack Router for client-side routing. Authenticated data access and authorization are checked by Supabase Auth and Postgres functions/RLS, not by client-side route guards.

## Environments

Use separate Cloudflare Pages projects, Supabase projects, OAuth callbacks, provider credentials, feature flags, and Stripe test configuration for development, staging, and production. Do not use production credentials for local or CI tests.

The repository contains separate Cloudflare Pages project configuration for each application. Store Cloudflare credentials as protected GitHub Environment secrets (`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`). Supply `CLOUDFLARE_PAGES_PROJECT`, `CUSTOMER_PAGES_PROJECT`, `ADMIN_PAGES_PROJECT`, `SUPABASE_URL`, and `SUPABASE_PUBLISHABLE_KEY` as non-secret GitHub Environment variables. The deployment workflow is manual, deploys `staging` to the Pages staging branch and `production` to the existing `main` branch, and does not deploy as part of CI.

For the marketing site, configure `PUBLIC_SITE_URL`, `PUBLIC_APP_URL`, `PUBLIC_SITE_MODE`, and `CLOUDFLARE_PAGES_PROJECT` per GitHub Environment. Set `PUBLIC_WAITLIST_ENDPOINT` to the approved HTTPS waitlist endpoint when it is available; until then, the form stays disabled and says sign-up is not connected. Use `prelaunch` in staging and set the production mode to `live` only when launch is approved. The prelaunch home page is indexable; hidden or unpublished pages are excluded from the sitemap. Maintenance mode blocks indexing.

For the customer and admin Pages sites, configure the Supabase URL and publishable key as build-time public values. Their browser clients use `@supabase/ssr` cookie-backed sessions. Database access relies on the signed user token, explicit table grants, server-side Postgres functions, and RLS; never put a service-role/secret key in a browser-prefixed variable. Google and Apple OAuth credentials and callback URLs must be configured in the Supabase Auth environment before those providers can sign in.

The billing foundation accepts Stripe test secret keys only. Set `STRIPE_SECRET_KEY` as a server-only secret for development/staging; do not set it in production until live billing is separately authorized and implemented.

## Local development

Install and start Docker Desktop, then run `pnpm supabase:start`. The default local setup starts Postgres, Supabase Auth, PostgREST, and the API gateway; `pnpm supabase:start:full` also starts Studio, Realtime, Storage, Edge Functions, and observability services. Get the generated local `API_URL` and `PUBLISHABLE_KEY` from `pnpm dlx supabase@2.119.0 status --output env`. Put those two public values in each app's ignored `.env.local` file as `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Do not copy the local service-role key into an app. Run `pnpm test:db` to execute migrations and pgTAP policies; use `pnpm supabase:stop` when finished.

The local seed intentionally contains no fabricated customer records or pricing. pgTAP suites create synthetic fixtures inside rollback-only transactions. Set up `PUBLIC_WAITLIST_ENDPOINT` separately when a permitted prelaunch endpoint exists; until then, the marketing form remains disabled.

## Required pull request checks

Configure the repository's protected primary branch to require the `quality` GitHub Actions check before merging. Required checks are formatting, lint, TypeScript/Astro checks, unit tests, Playwright E2E tests, application builds, and local Supabase migration/pgTAP tests. CI pins Supabase CLI `2.119.0` so migration behavior does not drift between runs. Repository protection is a GitHub administrator task and is intentionally not changed by this setup.

## Deployment commands

Use the repository's manual `Deploy to Cloudflare` workflow after the corresponding GitHub Environment and Cloudflare project are configured. The workflow supports the marketing site, customer portal, or admin portal and staging or production. It is not triggered by pull requests or ordinary pushes.
