# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary audience is small-business owners broadly. No narrower business segment is committed.

## Product Purpose

Showoff helps small businesses plan, create, capture, distribute, nurture, analyze, and optimize their marketing in one AI-powered application. Phase 1 succeeds when paying customers can complete the core marketing workflow and manage it without developer intervention.

## Positioning

Working draft: Showoff connects the marketing workflow from campaign planning through optimization in one AI-assisted product, so customers do not have to coordinate separate tools and dashboards. AI assists while the customer stays in control, including approval of consequential actions. The user plans to refine the final differentiation.

## Operating Context

- The public marketing site is a standalone Astro app, separate from the authenticated customer portal and internal admin portal.
- The canonical marketing domain is `showoff.marketing`.
- The same site supports prelaunch, live, and maintenance modes. Prelaunch can collect interest; live mode connects visitors to pricing and account creation.
- The detailed Phase 1 workflows and acceptance criteria live in [`../../docs/prd.md`](../../docs/prd.md).

## Capabilities and Constraints

- The product spans planning, content and creative creation, lead capture, organic and paid distribution, customer nurture, analytics, and optimization.
- AI-generated work remains editable and customer work must survive failures and retries.
- Consequential actions, including ad budget changes and paid campaign go-live, require explicit customer approval.
- Organization boundaries, permissions, plan entitlements, and feature flags are enforced server-side as well as in the interface.
- Replaceable external services sit behind Showoff-owned provider interfaces. Email and SMS are feature-flagged and do not block the Phase 1 launch path.
- Public messaging should lead with customer outcomes rather than provider names.

## Brand Commitments

- The product is named Showoff.
- The AI assistant's display name is configurable; Ziggy is the current planned name. Product behavior must not depend on that display name as a stable identifier.

## Evidence on Hand

- `docs/prd.md` is the source of truth for product behavior and Phase 1 scope.
- The marketing app is currently an Astro starter. Its favicon is the starter icon, not a verified Showoff logo.
- No verified customer testimonials, case studies, production product demonstration, Showoff logo, or pricing are present in this app. Do not invent or present placeholders as real evidence.

## Product Principles

- Keep the customer's marketing work connected across the full campaign lifecycle.
- Let AI assist while the customer retains control and approves consequential actions.
- Preserve customer work and keep generated output editable.
- Enforce access, entitlements, and feature availability on the server.
- Keep provider integrations replaceable and the Phase 1 launch viable without email or SMS approval.
