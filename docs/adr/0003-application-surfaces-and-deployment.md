# ADR 0003: Separate application surfaces and deployment

- Status: Accepted
- Date: 2026-10-02

## Context

The public marketing site, authenticated customer product, and internal admin tools have different audiences, release needs, and authorization boundaries.

## Decision

Build the marketing site with Astro and the customer and admin portals with React and TanStack Router. Deploy them as separate Cloudflare Pages projects, with separate environment variables and Supabase redirect configuration. CI checks each app and the local Supabase schema; deployment is manual and targets an explicitly selected app and environment.

## Consequences

Each application can evolve and deploy independently. The marketing site does not host authenticated product routes, and admin capabilities do not appear in the customer portal. Production deployment remains gated by configured GitHub Environment values and an explicit workflow dispatch.

## Alternatives considered

- Combining all routes in the marketing app: rejected because public pages and authenticated application boundaries would become coupled.
- Sharing one React portal between customers and admins: rejected because the admin portal has a distinct trust boundary and authorization policy.
