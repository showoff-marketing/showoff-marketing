# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React + TanStack Router + Tailwind CSS + shadcn/ui + Impeccable, as specified for the Admin Portal in [`docs/prd.md`](../../docs/prd.md). The app is a static client-side application; trusted access checks and data policies live in Supabase Auth and Postgres RLS/functions.

## Users

Showoff operations and support staff who operate the platform and help customer organizations resolve issues. The detailed internal role and permission matrix has not been defined.

## Product Purpose

The Admin Portal is Showoff's internal application for operating the platform and supporting its customer organizations. Phase 1 succeeds when Showoff can use it for tenant and support visibility, human review of proposed support actions, provider and infrastructure monitoring, alert and error intelligence, billing health, and usage and margin operations.

## Positioning

The Admin Portal provides one Showoff-owned operational surface over Showoff's canonical product data and action policies, while replaceable external services remain behind provider interfaces. This gives internal staff product-level tenant, support, approval, billing, and reliability context without making an external provider's console the source of Showoff's product state.

## Operating Context

- This is a separate internal application surface from the customer portal and public marketing site.
- Operators work with tenants, subscriptions, usage and margin, support cases, approvals, violations, infrastructure, provider health, alerts, messaging status, logs, errors, feature flags, security, analytics, marketing-site operations, and settings. The PRD's recommended navigation is the current scope reference.
- Support conversations are handled in Chatwoot. Captain AI may diagnose and propose using read-only account context; escalated actions go through a SupportCase and ProposedSupportAction for human approval in Showoff Admin, then the Action Policy Layer, domain service, and audit log.
- Auditable timestamps are stored in UTC and displayed in the operator's local timezone.

## Capabilities and Constraints

- The PRD is the source of truth for Phase 1 workflows and acceptance criteria. The required Admin Portal capabilities include tenant profiles; provider and infrastructure monitoring; alerts; recurring-error intelligence; billing health; support visibility and approvals; and security, logging, and audit visibility.
- Tenant profiles include organization, plan and subscription state, users, usage and allowances, estimated cost and margin, integrations, feature flags, email and SMS status, support cases, pending approvals, violations, and recent jobs, actions, and errors.
- Showoff owns canonical product state, including organizations, memberships, subscriptions and billing metadata, usage, approvals, feature flags, support cases, alerts, logs, and compliance state. Provider status and data are integrated through Showoff-owned interfaces; feature code must not call provider SDKs directly.
- Organization boundaries, permissions, plan entitlements, and feature flags are enforced server-side as well as in the interface. Every state-changing admin action is traceable. Logs must not contain secrets, authentication headers, payment credentials, or unnecessary sensitive payloads.
- Support AI is read-only by default and may diagnose, summarize, and propose. It may not autonomously refund, reissue credits, change subscriptions or plans, change ad budgets or campaigns, override feature flags, suspend accounts, or retry expensive jobs. Consequential support actions require human approval and pass through the Action Policy Layer.
- Email and SMS are feature-flagged provider capabilities. Provider approval status must not block the Phase 1 launch path.
- The portal may be visually basic in Phase 1; a polished admin interface is not a launch blocker. Advanced RBAC is Phase 2. Until the role matrix is defined, Week 1 access is protected by one server-checked `platform_admin` permission; do not infer granular roles or per-action permissions.

## Brand Commitments

- The product is named Showoff.

## Evidence on Hand

- [`docs/prd.md`](../../docs/prd.md) is the consolidated source of truth for product behavior and Phase 1 scope, including the Admin Portal requirements.
- `apps/admin-portal` contains no app implementation or admin-specific demonstration data yet. Do not present fabricated tenants, incidents, usage, margins, or provider health as real operational data.

## Product Principles

- Operate Showoff-owned product state through one internal surface while keeping replaceable providers behind Showoff-owned interfaces.
- Preserve organization boundaries and enforce access, entitlements, and feature availability on the server.
- Require human approval for consequential support actions and record state-changing actions in the audit trail.
- Give operators enough correlated support, provider, billing, and reliability context to investigate and resolve issues.
- Keep email and SMS provider readiness from blocking the Phase 1 launch path.
