# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Business owners and their teams who are Showoff SaaS customers. They use the customer portal to run their business's marketing operations.

## Product Purpose

Showoff brings a small business's marketing operations into one application: plan campaigns, create content, capture leads, distribute marketing, nurture prospects, and review results. AI assists with this work while the customer remains in control.

## Positioning

Showoff connects the marketing workflow from strategy through optimization in one AI-assisted product, instead of leaving customers to coordinate separate tools and dashboards.

## Operating Context

Customers work across campaigns, business and brand profiles, content and media, lead capture, organic and paid distribution, customer journeys, and analytics. Owners and team members work within an organization account and may have different roles and permissions.

## Capabilities and Constraints

- Detailed Phase 1 workflows, provider boundaries, and acceptance criteria are maintained in [`docs/prd.md`](../../docs/prd.md).
- AI-generated content remains editable, and customer work must survive failures and retries.
- Consequential actions, including ad budget approval and campaign go-live, require explicit customer approval.
- Organization boundaries, permissions, plan entitlements, and feature flags are enforced on the server as well as in the interface.
- Replaceable external services remain behind Showoff-owned provider interfaces. Email and SMS availability is feature-flagged and does not block the Phase 1 launch path.
- The customer portal remains a distinct product surface from the public marketing site and internal admin portal.

## Brand Commitments

- The product is named Showoff.
- The AI assistant's display name is configurable; the current planned name is Ziggy. Product code must not depend on that display name as a stable identifier.

## Evidence on Hand

- The current app is a starter scaffold, not evidence of completed customer workflows.
- No customer testimonials, case studies, or production product demonstrations are present in this app. Do not invent customer proof or present placeholder data as real usage.

## Product Principles

- Keep the customer's marketing work connected across the full campaign lifecycle.
- Let AI assist and orchestrate while the customer retains control.
- Preserve customer work and keep generated output editable.
- Require approval for consequential actions and enforce access rules server-side.
- Keep provider integrations replaceable behind Showoff-owned interfaces.
