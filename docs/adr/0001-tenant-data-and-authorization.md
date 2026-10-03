# ADR 0001: Tenant data and authorization

- Status: Accepted
- Date: 2026-10-02

## Context

Showoff hosts independent organizations in shared product applications. A browser route check cannot protect customer data, and editable profile metadata cannot grant platform administration access.

## Decision

Use Supabase Auth for identity. Store organization ownership and memberships in Postgres, enforce tenant boundaries with RLS, and expose only explicitly granted table operations. Use `auth.uid()` and trusted `app_metadata` for identity and the initial `platform_admin` permission. Keep privilege-elevated functions in the unexposed `private` schema, set an empty `search_path`, fully qualify database objects, check the caller explicitly, and expose narrow invoker wrappers.

## Consequences

New public tables require deliberate grants and RLS policies. Customer and admin portals remain separate applications, and admin access is checked by the database before the shell loads. Owners decide organization approvals; authenticated organization members can request approvals and reserve configured usage. Only server-side service credentials can commit or release usage.

## Alternatives considered

- Client-only organization filtering: rejected because a missed filter can leak another tenant's rows.
- User-editable metadata for admin permissions: rejected because customers can edit it.
- Exposed `SECURITY DEFINER` RPCs: rejected in favor of private definer functions behind narrow invoker wrappers.
