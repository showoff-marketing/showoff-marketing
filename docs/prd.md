# Showoff - Phased Product Requirements Document

**Version:** 9.0<br>
**Status:** Current consolidated source of truth<br>
**Phase 1 Target:** 6 weeks<br>
**Phase 1 Contingency:** Up to 7 weeks<br>
**Phase 1 Objective:** Production-ready, sellable MVP<br>
**Category:** AI Marketing & Sales Growth Platform

---

# 1. Product Overview

## 1.1 Product Promise

Showoff helps small businesses plan, create, capture, distribute, nurture, analyze, and optimize their marketing from one unified AI-powered application.

## 1.2 Core Customer Workflow

```text
1. PLAN
   AI marketing strategy

2. CREATE
   Content + creative assets

3. CAPTURE
   Landing pages + forms + lead magnets

4. DISTRIBUTE
   Organic social + AI-assisted paid advertising

5. NURTURE
   CRM + customer journeys + email + SMS + lead scoring

6. ANALYZE & OPTIMIZE
   Unified analytics + AI recommendations
```

## 1.3 Phase 1 Success Outcome

A paying customer must be able to:

```text
Create account
-> Subscribe
-> Complete business onboarding
-> Plan a campaign with the Showoff AI assistant
-> Generate/edit content and media
-> Build lead capture
-> Configure organic distribution
-> Configure paid ads
-> Approve ad budget
-> Approve go-live
-> Capture leads
-> Nurture leads
-> Send email if enabled
-> Send SMS if enabled
-> Review analytics
-> Receive optimization recommendations
```

Email and SMS are not blockers for MVP launch because they depend on third-party approval and compliance timelines. Both must be feature-flagged.

---

# 2. Product Principles

1. **One platform, not disconnected tools.**
2. **AI assists and orchestrates; the customer retains control.**
3. **Consequential actions require approval.**
4. **Approved ad budgets cannot be changed without explicit customer approval.**
5. **The user should not lose work.**
6. **AI output must remain editable.**
7. **Feature access is enforced server-side.**
8. **Every external provider sits behind a Showoff-owned adapter.**
9. **Long-running work uses status-backed background jobs.**
10. **Every state-changing action is traceable.**
11. **Tenant isolation is enforced at the application and database levels.**
12. **Testing, failure handling, logging, monitoring, and supportability are part of implementation - not cleanup.**
13. **Build the direct/manual product action before allowing the AI assistant to orchestrate it.**
14. **Provider availability, entitlements, permissions, and feature flags are separate checks.**
15. **Phase 1 must remain launchable even if email or SMS providers are not yet approved.**

---

# 3. Core Technology Architecture

| Capability | Phase 1 Technology |
|---|---|
| Public marketing site | Astro + Tailwind CSS |
| Customer portal | React + TanStack Router + Tailwind CSS + shadcn/ui + Impeccable |
| Admin portal | React + TanStack Router + Tailwind CSS + shadcn/ui + Impeccable |
| Marketing animation/demo | Remotion |
| Database | PostgreSQL via Supabase |
| Authentication | Supabase Auth |
| Object storage | S3-compatible storage, initially Cloudflare R2 |
| AI reasoning/text | OpenAI |
| AI media | Higgsfield |
| Image editing | Fabric.js |
| Video composition/rendering | JSON2Video |
| Landing page editor | GrapesJS |
| Email editor | GrapesJS + MJML where appropriate |
| CRM | Mautic behind CRMProvider |
| Marketing automation | Mautic behind MarketingAutomationProvider |
| Cross-system automation | Activepieces |
| Organic social | PostPeer |
| Paid advertising | Zernio |
| Email delivery | Amazon SES |
| SMS delivery | Telnyx |
| Product analytics | PostHog |
| Subscription billing | Stripe |
| Customer support | Chatwoot + Captain AI |

The public marketing site is a standalone Astro application. The customer portal and admin portal are separate React single-page applications, each using TanStack Router for route definitions and navigation. They are hosted as separate static Cloudflare Pages sites. Supabase Auth, Postgres functions, and row-level security provide trusted authentication and server-side authorization; client-side route guards only control navigation and never replace those checks. The admin portal remains a separate application. These assignments apply throughout the repository.

---

# 4. Canonical Architecture Boundaries

## 4.1 Showoff Owns

Showoff is the canonical owner of:

```text
Organizations
Users
Organization memberships
Brands
Business profiles
Campaigns
Strategies
Content
Assets
Landing page metadata
Lead form metadata
VideoProject
Approvals
Action Registry
Action Policy
Feature flags
Plan entitlements
Usage counters
Credit ledger
Billing metadata
Provider-cost metadata
Analytics normalization
Recommendations
Support cases
Admin actions
Logs
Alerts
Compliance state
```

## 4.2 External Engines Execute Specialized Work

```text
OpenAI       -> AI reasoning/text
Higgsfield   -> AI media generation
Mautic       -> CRM + customer marketing automation
Activepieces -> cross-system technical orchestration
PostPeer     -> organic social publishing
Zernio       -> paid advertising
Amazon SES   -> email delivery
Telnyx       -> SMS delivery
JSON2Video   -> deterministic video composition/rendering
Stripe       -> payments and subscriptions
Chatwoot     -> customer support workspace and AI intake
```

---

# 5. Mandatory Provider Adapter Pattern

Every replaceable provider must sit behind a Showoff-owned interface.

Required interfaces:

```text
AIProvider
MediaGenerationProvider
SocialPublishingProvider
AdvertisingProvider
EmailProvider
SmsProvider
VideoRendererProvider
CRMProvider
MarketingAutomationProvider
```

Required call path:

```text
Feature
-> Showoff domain service
-> Provider interface
-> Provider adapter
-> External provider
```

Feature code must not call provider SDKs directly.

---

# 6. Mautic Abstraction

Mautic must sit behind two independent abstractions:

```text
Showoff
  |
  +-> CRMProvider
  |      -> MauticCRMAdapter
  |
  +-> MarketingAutomationProvider
         -> MauticAutomationAdapter
```

## 6.1 CRM Responsibilities

- contacts
- companies where useful
- segments
- lead scores
- contact activities
- forms
- marketing contact data

## 6.2 Marketing Automation Responsibilities

- nurture journeys
- delays
- branching
- behavioral triggers
- scoring actions
- dynamic content
- marketing campaign logic

Showoff must be able to replace CRM and automation independently later.

---

# 7. Canonical Domain Model

At minimum:

```text
Organization
User
OrganizationMember
Brand
BusinessProfile
Campaign
Strategy
Content
Asset
VideoProject
LandingPage
LeadForm
Contact
Lead
Segment
Automation
Approval
ActionDefinition
AgentRun
AgentRunStep
UsageCounter
CreditAdjustment
ProviderCost
ActivityLog
ApiLog
WebhookLog
Recommendation
FeatureFlag
EmailTenant
SmsRegistration
SupportCase
ProposedSupportAction
SupportActionDecision
BackgroundJob
Alert
ErrorFingerprint
Subscription
```

Agents must not invent competing versions of shared concepts without architecture review.

---

# 8. Tenant Isolation and Authentication

## 8.1 Authentication

Use Supabase Auth.

Phase 1 methods:

- Continue with Google
- Continue with Apple
- Email + Password

Authentication identifies the user. Showoff owns authorization.

## 8.2 Authorization

Authorization is based on:

- organization membership
- role
- permissions
- plan entitlement
- feature flags
- approval rights

## 8.3 Database-Level Tenant Isolation

Every tenant-owned business table must include `organization_id` and use Supabase/Postgres Row Level Security where applicable.

Tenant isolation must exist at both:

```text
Application/service layer
+
Database/RLS layer
```

Required negative test:

```text
Org A requests Org B resource
-> denied
-> security event logged
```

---

# 9. Feature Availability Gate

A feature is usable only when all applicable checks pass:

```text
Feature flag enabled
AND
Organization entitled
AND
User permitted
AND
Provider available
AND
Compliance/registration state permits action
```

All checks must be server-enforced.

---

# 10. Feature Flags

## 10.1 Required Messaging Flags

```text
feature.email.enabled
feature.email.marketing_enabled
feature.email.transactional_enabled

feature.sms.enabled
feature.sms.marketing_enabled
feature.sms.transactional_enabled

feature.support_chat.enabled
feature.support_ai.enabled
```

## 10.2 Required Capabilities

Feature flags must support:

- global enable/disable
- per-organization override
- environment-specific state
- emergency kill switch
- disablement reason
- actor
- timestamp
- audit event
- optional scheduled activation

Messaging flags are operational controls and must not be confused with plan entitlements.

---

# 11. Configurable AI Assistant Identity

The AI assistant display name must never be hard-coded.

```text
internal_key = showoff_assistant
display_name = Ziggy
```

Use the stable internal key for:

- logs
- permissions
- actions
- analytics
- agent runs
- database references

Use the configurable display name for:

- chat UI
- recommendations
- notifications
- marketing copy
- activity history
- onboarding

Changing the display name must not require a schema or event migration.

---

# 12. Action Registry and Action Policy Layer

## 12.1 Action Registry

Every AI-executable operation must be registered.

Suggested metadata:

```text
action_key
risk_level
required_permission
required_feature
required_entitlement
requires_approval
input_schema
executor
```

The AI assistant may not dynamically invent privileged backend operations.

## 12.2 Action Policy Layer

All consequential AI or automated actions pass through:

```text
Assistant / Automation
-> Proposed Action
-> Action Registry
-> Action Policy Layer
-> Allowed / Approval Required / Blocked
-> Showoff domain service
```

Checks include:

- budget boundaries
- go-live approval
- SMS consent
- email/sender state
- usage balance
- plan entitlement
- feature flags
- permissions
- automation authorization
- provider health

---

# 13. Approval Risk Classes

## Low Risk

Normally no explicit approval:

- read data
- research
- summarize
- generate copy draft
- generate image/video draft
- create draft campaign
- create draft automation
- analyze campaign performance

## Medium Risk

May require approval based on policy:

- schedule organic content
- activate certain automations
- bulk CRM state changes

## High / Consequential Risk

Approval required by default:

- launch paid ads
- change approved ad budget
- send bulk external communications
- issue refund
- reissue manual credits
- modify billing
- change security roles
- delete significant data

---

# 14. AI Advertising Requirements

## 14.1 AI Ad Preparation

The AI assistant should prepare ads from:

- business goal
- campaign objective
- audience
- creative
- landing destination
- channels
- campaign dates
- customer-provided budget

It may recommend:

- channels
- objectives
- audiences
- placements
- copy
- creative
- initial allocation

## 14.2 Budget Approval

Budget approval is mandatory.

Persist:

```text
campaign_id
approved_budget
approved_allocation
approved_by
approved_at
approval_version
```

## 14.3 Budget Recommendations

The AI assistant may recommend increasing, decreasing, or reallocating budget when performance data supports it.

Example:

```text
Current approved Meta budget: $300

Recommendation:
Increase to $450 because CPL decreased 31%.

[Keep Current Budget]
[Approve $450 Budget]
```

The current approved budget remains active until the customer explicitly approves a new version.

Required events:

```text
ad_budget.change_recommended
ad_budget.change_approved
ad_budget.change_rejected
```

## 14.4 Hard Budget Rule

The AI assistant and automations may never independently execute a budget change.

## 14.5 Go-Live Approval

Budget approval is separate from go-live approval.

Paid ads cannot launch until the customer explicitly approves go-live unless a previously authorized automation permits launch within its fixed constraints.

## 14.6 Autonomous Advertising

Autonomous execution requires a customer-created automation defining:

```text
trigger
conditions
allowed_actions
platforms
approved_budget_ceiling
start_date
end_date
approval_mode
```

AI may operate within those limits but may never change the budget ceiling without approval.

---

# 15. Resumable Agent Runs

Persist:

```text
goal
plan
task graph
action inputs
relevant model outputs
tool results
approvals
timestamps
failures
retries
final outcome
```

Canonical entities:

```text
AgentRun
AgentRunStep
ActionExecution
Approval
```

Agent workflows must survive browser closure and resume only where policy permits.

---

# 16. Business Onboarding

Collect enough context to power AI workflows:

- business name
- website
- industry
- products/services
- target audience
- geography
- goals
- offer
- brand description
- connected/current channels

Create a reusable business/brand profile.

---

# 17. AI Strategy

Generate structured strategy including:

```text
Objective
Audience
Core message
Offer
Content themes
Recommended channels
Content formats
Lead magnet recommendation
CTA
Nurture recommendation
Measurement plan
Risks/assumptions
```

Store strategy as structured product data, not only chat history.

---

# 18. Campaign Domain

Campaign is the root marketing object.

```text
Campaign
├── name
├── goal
├── strategy
├── audience
├── content
├── assets
├── organic destinations
├── paid destinations
├── lead capture
├── nurture
├── schedule
├── approvals
├── analytics
└── recommendations
```

Statuses:

```text
Draft
Ready
Scheduled
Active
Paused
Completed
Needs Attention
```

Provider-specific campaign IDs map back to the Showoff Campaign.

---

# 19. Content Creation

Phase 1 supports generation of:

- social captions
- hooks
- headlines
- ad copy
- CTAs
- landing-page copy
- email copy
- SMS copy
- scripts
- content ideas

Content should link to business, campaign, channel, and content type.

---

# 20. AI Media and Asset Library

## 20.1 AI Media

Use Higgsfield behind `MediaGenerationProvider`.

Support:

- images
- short-form video
- audio where appropriate

## 20.2 Asset Library

Support:

```text
Uploaded images
Generated images
Uploaded video
Generated video
Audio
Rendered outputs
Editable projects
```

Store metadata including:

- organization
- campaign
- owner
- media type
- MIME type
- dimensions/duration
- provider/model where applicable
- generation source
- created/updated timestamps

---

# 21. Image Editor

Use Fabric.js.

Phase 1 capabilities:

- upload
- crop
- resize
- text
- typography controls
- shapes
- layers
- logo/brand assets
- reposition/scale/rotate
- undo/redo
- editable project persistence
- export

Manual editing does not consume AI/media credits.

AI-powered transformations do consume credits.

---

# 22. Video Architecture

## 22.1 Canonical VideoProject

Showoff owns:

```text
VideoProject
├── scenes
├── layers
├── text
├── captions
├── media
├── transitions
├── audio
├── brand
└── render_settings
```

## 22.2 Renderer Abstraction

```text
VideoProject
-> VideoRendererProvider
-> JSON2Video Adapter
```

JSON2Video is a Phase 1 implementation detail.

OpenShot Cloud may be evaluated in Phase 2 if scale, cost, or deeper editing warrants migration.

## 22.3 Phase 1 Editor

Support:

- preview
- scene list
- text
- images
- video clips
- captions
- caption styling
- logo
- music/audio
- basic timing
- template selection
- render action

Avoid a professional multi-track editor in Phase 1.

---

# 23. Landing Pages and Lead Capture

Use GrapesJS for the customer-facing page editor.

Phase 1 blocks:

```text
Hero
Text
Image
Video
Benefits
Social Proof
CTA
Lead Form
FAQ
Footer
```

Support:

- create
- edit
- autosave
- responsive preview
- publish
- campaign association
- form association
- analytics

Lead-magnet landing pages are unlimited by page count.

---

# 24. CRM and Lead Management

Mautic-backed through adapters.

Showoff should surface:

- contacts
- source
- campaign
- lead magnet
- email
- phone
- segment
- score
- consent
- status
- activity

Customers should not need to use the Mautic admin interface.

---

# 25. Lead Segmentation and Scoring

Support:

- manual segmentation
- source segmentation
- campaign segmentation
- behavior segmentation
- score-based segmentation

Example scores:

```text
Form submitted        +10
Lead magnet downloaded +10
Email clicked          +5
Landing page revisit   +5
CTA clicked           +10
```

---

# 26. Nurture Automation

Mautic is the customer-journey engine.

Phase 1 actions:

```text
Form submitted
Add tag
Add to segment
Increase score
Wait
Send email
Send SMS
Opened?
Clicked?
Change segment
End journey
```

Activepieces handles cross-system technical orchestration, not the customer nurture engine.

---

# 27. Amazon SES Email Architecture

## 27.1 Phase 1 Provider

Amazon SES behind `EmailProvider`.

Support:

- transactional email
- marketing email

## 27.2 Multi-Tenant Model

```text
Showoff Organization
-> SES Tenant
-> Sending Identity
-> Domain Authentication
-> Configuration Set
-> Reputation Monitoring
-> Sending Enabled
```

## 27.3 Platform Prerequisites

- AWS account ready
- SES region selected
- production access requested/approved as needed
- tenant-management approach confirmed
- event architecture selected
- sender/domain verification workflow built

If prerequisites are delayed, email remains feature-flagged off.

## 27.4 Email Tenant States

```text
Not Configured
Domain Entered
DNS Required
Pending DNS Verification
Verified
DKIM Ready
Sending Enabled
Paused
Suspended
```

## 27.5 Domain Setup

Support:

- domain entry
- SES identity creation
- DKIM records
- SPF guidance where appropriate
- DMARC guidance
- verification checks

## 27.6 Transactional vs Marketing

Use separate logical streams and configuration sets.

## 27.7 Reputation Monitoring

Track:

- sends
- deliveries
- bounces
- complaints
- suppression
- sending status
- reputation findings
- blocklist findings

Showoff must be able to suspend a tenant's marketing sending without disabling other tenants.

---

# 28. Telnyx SMS Architecture

## 28.1 Provider

Telnyx behind `SmsProvider`.

## 28.2 ISV / Reseller Architecture

Use a multi-tenant ISV/partner model.

```text
Showoff Platform
-> Tenant Business Registration
-> 10DLC Brand/Campaign
-> Tenant Messaging Profile
-> Tenant Phone Number
```

## 28.3 Platform Prerequisites

- Showoff Telnyx master account
- required business/account verification
- ISV/reseller onboarding confirmed
- partner campaign/API access confirmed
- webhook setup
- billing setup

If prerequisites are delayed, SMS remains feature-flagged off.

## 28.4 SMS Tenant Onboarding

Collect:

### Business
- legal name
- DBA
- entity type
- EIN/Tax ID
- country
- business address

### Authorized Representative
- name
- title
- email
- phone

### Online Presence
- website
- privacy policy
- terms URL where needed

### Messaging Use Case
- use case
- expected volume
- sample messages
- opt-in method
- opt-out language
- HELP language where required

### Consent Evidence
- form/landing page URL
- consent text
- checkbox configuration
- privacy-policy confirmation

## 28.5 Compliance Preflight

Validate before submission:

- website
- privacy policy
- SMS disclosure
- no pre-checked consent
- STOP language
- HELP language where required
- complete business identity
- compliant sample messages
- consistent registration data

## 28.6 Registration States

```text
Not Activated
Draft
Validation Required
Ready for Submission
Submitted
Pending Review
More Information Required
Approved
Provisioning
Active
Rejected
Suspended
Disabled
```

## 28.7 Phase 1 Limits

```text
1 registered SMS use case per organization
1 sending number per organization
many Showoff campaigns may use the approved telecom use case
```

---

# 29. SMS Fees and Customer Explanation

SMS activation is optional.

Customer-facing guidance:

> Business SMS activation typically costs about $20 one time + $2-$10/month in carrier registration fees. Exact fees depend on business type and messaging use case.

Actual applicable amount must be shown before activation.

Carrier/compliance fees should be passed through where practical and should not consume the customer's normal SMS usage allowance.

---

# 30. SMS Usage and Segment Education

Plans include approximate U.S. SMS segment allowances:

| Plan | U.S. SMS segments |
|---|---:|
| Launch | ~300 |
| Growth | ~750 |
| Scale | ~2,000 |

Meter provider-billable segments.

Composer must show:

```text
Characters: 214
Segments per recipient: 2
Recipients: 150
Estimated usage: 300 SMS credits
Remaining after send: 450
```

Also show examples of single-segment vs multi-segment messages.

Longer or Unicode messages may use multiple segments.

---

# 31. Organic Social Distribution

Use PostPeer behind `SocialPublishingProvider`.

Phase 1 capabilities:

- connect account
- destination selection
- media
- caption
- hashtags
- publish now
- schedule
- status
- retry
- analytics retrieval where available

Maintain a channel capability matrix so unsupported platform operations are not offered.

---

# 32. Paid Advertising

Use Zernio behind `AdvertisingProvider`.

Phase 1 capabilities:

- connect ad account
- AI-assisted campaign setup
- objective
- audience inputs
- creative
- copy
- budget
- schedule
- launch after approvals
- pause
- basic performance retrieval

Connected ad accounts aggregate beneath Showoff's developer account where provider pricing supports this model.

---

# 33. Channel Capability Matrix

Maintain configuration such as:

```text
provider
channel
operation
supported
constraints
```

Potential operations include:

```text
image_post
video_post
carousel
schedule
analytics
comments
lead_forms
ads
```

The UI must use this matrix rather than hard-coded assumptions.

---

# 34. Usage and Entitlement Model

Current plans:

| Feature | Launch | Growth | Scale |
|---|---:|---:|---:|
| Price | $99 | $149 | $299 |
| Users | 1 | 3 | 10 |
| Assistive AI Chat | Yes | Yes | Yes |
| AI agent | - | Yes | Yes |
| Image Editor | Yes | Yes | Yes |
| Video Editor | Yes | Yes | Yes |
| Canva Integration | Yes | Yes | Yes |
| Creator Marketplace access | Yes | Yes | Yes |
| Connected Social Accounts | 5 | 10 | 25 |
| Connected Ad Accounts | 2 | 5 | 10 |
| CRM Contacts | 1,500 | 7,500 | 25,000 |
| Lead Magnet Landing Pages | Unlimited | Unlimited | Unlimited |
| CRM Automations | Unlimited | Unlimited | Unlimited |
| Email Sends / month | 5,000 | 25,000 | 100,000 |
| U.S. SMS / month | ~300 | ~750 | ~2,000 |
| AI & Media Credits / month | 1,000 | 2,500 | 5,000 |

Tax is included in the advertised subscription price.

---

# 35. AI & Media Credit Model

AI & Media Credits are Showoff-controlled units.

They do not directly expose:

- provider credits
- tokens
- API request counts
- model-specific prices

Customer-facing usage should show simple approximate generation equivalents.

Different actions consume different internal weights based primarily on expected Showoff COGS.

---

# 36. Credit Reservation and Failure Policy

Required flow:

```text
Validate entitlement
-> Check allowance
-> Reserve credits
-> Execute
-> Success: commit
-> Failure before chargeable provider acceptance: release
```

Failed commands must not consume customer credits when Showoff/provider failure prevented a usable chargeable result.

For provider-accepted actions, usage may be committed even if downstream delivery later fails and Showoff has already incurred cost.

---

# 37. Credit Reissuance

Showoff must support restoring wrongfully consumed credits.

Use an append-only ledger adjustment.

```text
CreditAdjustment
- id
- organization_id
- type
- amount
- reason
- related_job_id
- related_usage_event_id
- correlation_id
- requested_by
- approved_by
- requested_at
- approved_at
- created_at
```

Types:

```text
reissue
correction
reversal
goodwill
```

For MVP, manual reissuance requires human/admin approval.

---

# 38. Communication Usage Tracking

## Email

Track:

```text
email_sends_used
email_sends_reserved
email_sends_limit
```

Events:

```text
email.send_requested
email.send_accepted
email.delivered
email.bounced
email.complained
email.failed
```

## SMS

Track:

```text
sms_segments_used
sms_segments_reserved
sms_segments_limit
```

Events:

```text
sms.send_requested
sms.send_accepted
sms.delivered
sms.failed
sms.opted_out
```

Manual and automated sends use the same centralized counters.

---

# 39. Usage Alerts and Hard Stops

For email, SMS, AI/media, and other metered resources:

```text
50%  -> informational
75%  -> warning
90%  -> high warning
100% -> hard limit
```

At 100%:

### Launch
Block and prompt upgrade to Growth.

### Growth
Block and prompt upgrade to Scale.

### Scale
Block until billing-cycle reset.

No automatic overages.

Unused included usage does not roll over.

---

# 40. Subscription Signup Flow

```text
Marketing Website
-> Pricing
-> Choose plan
-> Create account
-> Create organization
-> Stripe Checkout
-> Successful payment
-> Stripe webhook
-> Showoff Billing Service
-> Activate subscription
-> Issue entitlements + allowances
-> Send welcome/billing confirmation
-> Business onboarding
-> App
```

The Stripe webhook is authoritative. The browser success redirect alone must not activate paid access.

---

# 41. Subscription Activation Email

After successful activation, send a Showoff-branded transactional email through SES.

Include:

- welcome message
- organization/business name
- plan
- amount charged
- tax information
- payment status
- activation date/time
- next renewal date
- next renewal amount
- major allowances
- Stripe invoice/receipt link
- Open Showoff CTA

Do not recreate Stripe's official receipt; link to it.

---

# 42. Upgrade Path and Proration

## 42.1 Upgrade Timing

Upgrades are immediate after successful prorated payment.

## 42.2 Stripe Proration Preview

Before confirmation, show Stripe's authoritative preview:

```text
Current plan
New plan
Unused old-plan credit
Prorated new-plan charge
Amount due today
Next renewal date
Next renewal amount
Updated limits/features
```

CTA should state the amount, for example:

> Pay $16.67 & Upgrade to Growth

## 42.3 Entitlement Timing

Do not unlock the higher plan until payment succeeds and the webhook is processed.

If upgrade payment fails, keep the current plan.

## 42.4 Usage After Upgrade

Upgrade the current billing-cycle ceiling; do not grant a fresh second allowance.

Example:

```text
Launch limit: 1,000
Used: 700
Growth limit: 2,500
Remaining after upgrade: 1,800
```

## 42.5 Upgrade Email

Send a confirmation containing:

- old plan
- new plan
- prorated amount
- date/time
- next renewal date
- next renewal amount
- updated allowances
- Stripe invoice/receipt link

---

# 43. Downgrades, Pause, Cancellation, and Failed Payments

## 43.1 Canonical Timing

| Action | Effective timing |
|---|---|
| New subscription | After successful payment |
| Upgrade | Immediately after successful prorated payment |
| Downgrade | Next billing cycle |
| Cancellation | End of current billing period |
| Pause | Next billing cycle |
| Failed renewal | Payment Required immediately |

## 43.2 Pause Before Cancellation

When a customer selects cancel:

```text
Cancel Subscription
-> Offer Pause
-> Pause next cycle OR Continue Cancellation
```

Phase 1 supports one billing-cycle pause.

During pause:

- no subscription charge
- no new monthly allowances
- no AI/media generation
- no rendering
- no publishing
- no ad launches
- no email/SMS
- paid automation steps paused
- data retained
- integrations retained where practical
- customer can log in, view, export, and resume early

## 43.3 Cancellation

If pause is declined:

```text
Cancellation requested
-> renewal disabled
-> access remains through paid period
-> cancellation at period end
```

Collect cancellation reason.

## 43.4 Failed Renewal

A declined renewal does not create a new paid subscription period.

Showoff state becomes:

```text
payment_required
```

Do not:

- issue monthly credits
- reset email/SMS allowances
- renew other paid allowances
- allow new billable actions

Allow read-only/limited access including billing and payment-method update.

Notify the account owner in-app and by transactional email where available.

Restore paid access only after successful payment. Allowance issuance must be idempotent.

---

# 44. Showoff Subscription State Machine

Recommended customer-facing states:

```text
trialing
active
pause_scheduled
paused
cancellation_scheduled
payment_required
cancelled
terminated
```

Store Stripe raw status separately for reconciliation.

---

# 45. Refunds

Support AI may perform intake but may not issue refunds.

Flow:

```text
Refund request
-> AI gathers account/invoice/usage/log context
-> Apply refund SOP
-> SupportCase
-> Human approval
-> Stripe-backed refund action
```

MVP refund policy must address:

- duplicate charge
- billing mistake
- unauthorized charge
- material Showoff service failure
- discretionary exception

Voluntary cancellation does not automatically generate a prorated refund.

Final legal language requires counsel review.

---

# 46. Marketing Website - Canonical Domain and Modes

Use one canonical domain:

```text
showoff.marketing
```

Recommended subdomains:

```text
app.showoff.marketing     -> SaaS product
staging.showoff.marketing -> staging/internal preview
help.showoff.marketing    -> optional help center
status.showoff.marketing  -> optional public status page
```

## 46.1 Site Modes

```text
prelaunch
live
maintenance
```

The same marketing codebase must support both prelaunch and live experiences.

---

# 47. Marketing Route Visibility

Each route supports:

```text
public
hidden
prelaunch_only
live_only
authenticated
```

Visibility controls:

- route access
- navigation
- footer links
- sitemap inclusion
- indexing/robots behavior
- canonical metadata

---

# 48. Marketing Section Visibility

Major homepage sections should be individually configurable:

```text
hero
trust_strip
pain_points
product_demo
workflow
feature_sections
assistant_section
before_after
customer_stories
pricing
support_resources
community
waitlist
faq
final_cta
```

A lightweight internal settings panel is sufficient for Phase 1. Do not build a full CMS.

---

# 49. Marketing CTA Modes

## Prelaunch

- Join the Waitlist
- Join the Community
- Request Early Access
- Follow the Build

## Live

- Start Showing Off
- See Pricing
- Create Account
- Log In

Labels and destinations should be configuration-driven.

---

# 50. Marketing Homepage Requirements

Recommended hierarchy:

```text
1. Navigation
2. Hero
3. Trust / proof strip
4. "For business owners who need to..."
5. How Showoff Works - six-stage workflow
6. Product Demo
7. Feature Deep Dives
8. Before Showoff / After Showoff
9. AI Assistant section
10. Customer Stories / Beta Proof
11. Pricing
12. Support + Resources
13. FAQ
14. Final CTA
15. Footer
```

The go-live experience should be built during Phase 1 even if hidden until launch.

---

# 51. Marketing Messaging Principles

Lead with outcomes, not providers.

Suggested product description:

> Strategize campaigns, create content, run ads, publish across channels, capture leads, nurture customers and optimize what's working - all with AI in one platform.

Outcome-oriented feature positioning:

### Plan
Know what to market.

### Create
Create what your campaign needs.

### Capture
Turn attention into leads.

### Distribute
Reach customers across organic and paid channels.

### Nurture
Follow up without chasing every lead manually.

### Analyze & Optimize
Know what's working and what to do next.

---

# 52. Marketing Product Demo

Near the top of the homepage, show a real or realistic workflow:

```text
Customer Goal
-> AI Strategy
-> Create Content
-> Create Lead Funnel
-> Organic + Paid Distribution
-> Lead Capture
-> Nurture
-> Analytics
-> AI Optimization
```

Use Remotion where useful.

The demo must represent real Showoff product behavior, not a decorative animation.

---

# 53. Before Showoff / After Showoff

## Before

```text
AI tool
Design tool
Social scheduler
Ad managers
Email tool
SMS tool
CRM
Landing page tool
Analytics dashboards
Spreadsheets
```

Message:

> Multiple tools. Multiple dashboards. Still figuring out what to do next.

## After

```text
One strategy
One campaign workflow
One customer journey
One analytics view
One AI-guided growth system
```

---

# 54. Customer Support Architecture

Use Chatwoot + Captain AI.

```text
Customer
-> Chatwoot
-> Captain AI
-> SOP + Knowledge Base + read-only account context + logs
-> Resolve OR escalate
```

Support AI is read-only by default.

It may diagnose, summarize, and propose.

It may not autonomously:

- refund
- reissue credits
- change subscriptions
- change plans
- change ad budgets
- modify campaigns
- override feature flags
- suspend accounts
- retry expensive jobs

---

# 55. Support Escalation and Human Approval

Conversation handoff occurs in Chatwoot.

Consequential action approval occurs in Showoff Admin.

```text
Chatwoot
-> SupportCase
-> ProposedSupportAction
-> Human approve/reject
-> Action Policy Layer
-> Domain service
-> Audit log
-> Customer/Chatwoot updated
```

Support escalation packet should contain:

- organization
- customer
- category
- priority
- affected feature
- summary
- timestamp
- resource/job ID
- correlation ID
- provider/error
- troubleshooting completed
- relevant SOP
- account context
- recommended action

---

# 56. Showoff Admin Portal

A functional internal admin portal is required for Phase 1.

Recommended navigation:

```text
Overview
Tenants
Subscriptions
Usage & Margin
Support
Approvals
Violations
Infrastructure
Alerts
Messaging
Logs
Errors
Feature Flags
Security
Analytics
Marketing Website
Settings
```

The Phase 1 portal may be visually basic.

---

# 57. Admin Tenant Profile

Show:

```text
Organization
Plan
Subscription state
Users
Usage
Remaining allowances
Estimated COGS
Estimated margin
Integrations
Feature flags
Email health
SMS registration/status
Support cases
Pending approvals
Violations
Recent jobs/actions/errors
```

---

# 58. Admin Monitoring

Monitor:

```text
OpenAI
Higgsfield
PostPeer
Zernio
Mautic
Amazon SES
Telnyx
JSON2Video
Stripe
Activepieces
Supabase/Postgres
queues
storage
```

Track where applicable:

- health
- availability
- latency
- error rate
- rate limiting
- failed jobs
- retry volume
- queue depth
- webhook failures

---

# 59. Alert Center

Examples:

```text
Critical provider outage
SES reputation issue
Telnyx registration rejection
Cross-tenant access attempt
Webhook failure spike
Queue backlog
Payment failure
Usage-accounting mismatch
Margin threshold exceeded
Recurring provider error spike
```

Each alert contains:

```text
severity
tenant
provider
created_at
correlation_id
recommended_action
status
resolution
```

---

# 60. Recurring / Popular Error Intelligence

Group repeated errors using a normalized fingerprint based on fields such as:

```text
provider
operation
error_code
http_status
normalized_error_message
application_area
```

Show:

- occurrence count
- affected tenants
- first seen
- last seen
- trend
- severity
- retry success
- customer impact
- financial impact
- related correlation IDs
- resolution status

Views:

```text
Most Frequent
Fastest Growing
Highest Customer Impact
Highest Cost Impact
New Errors
Regressions
Resolved
```

Previously resolved errors that reappear should be flagged as regressions.

Classify issues as:

```text
System Error
Provider Error
Customer Configuration Error
Payment Failure
Compliance Issue
Authorization Error
Usage / Quota Issue
```

---

# 61. Billing Health Admin View

Show:

- failed renewals
- payment-required accounts
- failed revenue amount
- recovery rate
- recovered revenue
- common decline codes
- cancellations following failed renewal

Payment declines should not pollute application-error metrics.

---

# 62. Logging and Audit Standard

Every auditable event must answer:

```text
WHO
WHAT
WHEN
WHERE
WHY
HOW
RESULT
```

Capture appropriate fields including:

```text
actor_type
actor_id
user_id
organization_id
action
resource_type
resource_id
occurred_at
created_at
completed_at
application_area
provider
channel
ip_address
user_agent
trigger_type
reason
execution_method
workflow_id
correlation_id
status
success
error_code
error_message
```

Store timestamps in UTC and display them in the user's local timezone.

---

# 63. API Logging

For significant external calls, record:

```text
provider
operation
request_id
provider_request_id
organization_id
resource_id
correlation_id
request_started_at
response_received_at
completed_at
duration_ms
http_status
provider_status
attempt_number
retry_count
success
error_code
error_message
estimated_cost
```

Never log secrets, auth headers, payment credentials, or unnecessary sensitive payloads.

---

# 64. Webhook and Retry Logging

Webhook log:

```text
provider
event_type
provider_event_id
received_at
processed_at
processing_status
duplicate
error
correlation_id
```

Retries:

```text
attempt_number
retry_reason
failed_at
next_retry_at
final_status
correlation_id
```

Webhook processing must be idempotent.

---

# 65. Background Job Architecture

Long-running operations must use resumable jobs.

Required for:

- AI media generation
- video rendering
- publishing
- ad launches
- analytics sync
- messaging where asynchronous
- imports
- webhooks
- automation runs
- AI agent runs

Canonical statuses:

```text
queued
running
succeeded
failed
cancelled
```

Users must be able to leave the page while work continues.

---

# 66. Autosave and Draft Recovery

Any persistent editable workflow must autosave.

Required:

```text
UI updates immediately
-> local draft
-> debounced server persistence
-> save confirmation
```

States:

```text
Saving...
Saved
Offline - changes stored locally
Couldn't save - retrying
```

Recover after refresh/crash where feasible.

Background refresh must not overwrite active edits.

Do not build collaborative editing in Phase 1.

---

# 67. Navigation / Wizard Persistence

Moving between steps or routes must preserve:

- text
- selections
- uploads
- generated assets
- draft configuration
- last completed step
- scroll position where useful

A remount or route transition must not wipe a draft.

---

# 68. Analytics Dictionary

Before analytics implementation, define canonical meanings for:

```text
lead
customer
conversion
booking
purchase
revenue
campaign
attributed conversion
impression
engagement
CTR
CPL
CAC
ROAS
conversion rate
```

All dashboards must use the central definitions.

---

# 69. Unified Analytics

Normalize data from:

```text
PostPeer
Zernio
Mautic
Amazon SES
Telnyx
Landing pages
Showoff events
```

Metrics may include:

- spend
- impressions
- reach
- engagement
- clicks
- page views
- form submissions
- leads
- email sends/deliveries/opens/clicks
- SMS sends/delivery
- conversions

Derived metrics include where applicable:

- CTR
- CPC
- CPM
- CPL
- conversion rate
- engagement rate
- CAC
- ROAS when reliable revenue data exists

Observed facts must be distinguished from AI recommendations.

---

# 70. AI Optimization

AI may recommend:

- more of a high-performing content format
- channel allocation changes
- CTA changes
- new creative variants
- landing-page copy changes
- budget changes

Budget recommendations require explicit approval before execution.

---

# 71. Dashboard Scope

Phase 1 dashboard is fixed and responsive.

Show:

- active campaigns
- scheduled content
- recent leads
- campaign performance
- top content
- AI recommendations
- integration health
- usage summary

Removable/reorderable widgets are Phase 2.

---

# 72. Legal and Compliance Launch Requirements

Before unrestricted public launch, define and have counsel review:

- Terms of Service
- Privacy Policy
- Acceptable Use Policy
- SMS / Messaging Policy
- Email / Anti-Spam Policy
- AI Use / AI Disclaimer terms
- Billing / Cancellation / Refund terms
- Cookie Policy where needed
- Data Processing Addendum where needed

Marketplace-specific terms remain Phase 2.

---

# 73. Reserved Rights Requirements

Terms should reserve Showoff's right, subject to counsel-approved language, to:

- suspend or terminate accounts
- disable features
- pause email/SMS
- disable automations
- block campaigns
- restrict API usage
- change usage limits
- require verification
- respond to abuse
- comply with provider/carrier requirements
- protect platform reputation
- remove prohibited content
- pass through provider/carrier fees
- discontinue integrations
- act immediately where necessary for compliance/safety

---

# 74. Messaging Violations and Suspension

Prohibit:

- messaging without consent
- purchased/scraped lists
- spam
- misleading sender identity
- ignoring STOP/unsubscribe
- opt-out circumvention
- fraudulent/phishing content
- false registration
- sharing another tenant's registration
- filter evasion
- messaging outside approved use case

Showoff may:

```text
warn
pause sending
suspend number
disable messaging automation
disable messaging feature
suspend account
terminate account
```

---

# 75. Legal Acceptance Logging

At signup:

```text
Terms accepted
Privacy acknowledged
```

At messaging activation:

```text
Messaging Policy accepted
Consent-compliance attestation accepted
```

Store:

```text
document_id
document_version
accepted_by
accepted_at
ip_address
user_agent
```

---

# 76. Insurance Launch Readiness

Before unrestricted public launch, evaluate and obtain appropriate insurance including:

- Technology Errors & Omissions
- Cyber Liability
- General Liability
- Media / Advertising / IP coverage or endorsement

This is an operational launch prerequisite, not a software feature.

---

# 77. Support SOP / Legal Alignment

Support SOPs must align with:

- Terms of Service
- refund policy
- cancellation policy
- credit policy
- Acceptable Use Policy
- SMS policy
- email policy

Support AI must not promise unauthorized exceptions.

---

# 78. Engineering Development Standard

Every feature requires:

```text
Functionality
+ Acceptance criteria
+ Tests
+ Failure handling
+ Logging
+ Correlation IDs
+ Security
+ Tenant isolation
+ Usage accounting where applicable
+ Provider adapter compliance
+ Monitoring
+ Admin visibility
```

---

# 79. TDD Requirement

For testable business behavior:

```text
1. Read requirement
2. Define acceptance criteria
3. Write failing test
4. Implement
5. Make tests pass
6. Add failure-path tests
7. Refactor
8. Run relevant suite
```

Use Vitest for JS/TS unit and integration tests unless another layer requires another tool.

Use browser E2E tests for critical user journeys.

---

# 80. Error Handling

Relevant workflows must account for:

```text
idle
loading
success
pending
queued
running
retrying
failed
blocked
rate limited
timed out
unauthorized
quota exhausted
provider unavailable
```

Never expose raw provider stack traces to customers.

Preserve customer input after errors.

---

# 81. Retry and Idempotency

Retries must:

- be bounded
- use backoff
- avoid duplicate side effects
- preserve correlation ID
- log attempts
- stop on non-retryable errors

Idempotency is mandatory for:

- ad launches
- social publishing
- email/SMS sends where appropriate
- payments
- webhook processing
- usage commits
- automation executions

---

# 82. Environment Separation

Required:

```text
Development
Staging
Production
```

Use separate credentials/config where applicable for:

- Supabase
- Stripe
- OAuth callbacks
- providers
- feature flags
- Cloudflare secrets
- webhook endpoints

Normal testing must not rely on production systems.

---

# 83. CI/CD and Merge Gates

must establish:

- repository conventions
- protected primary branch
- CI
- strict TypeScript
- lint
- formatting
- Vitest
- E2E framework
- staging deployment
- production deployment path
- migration workflow
- seed/test data

Minimum merge gate:

```text
Typecheck
-> Lint
-> Vitest
-> Relevant integration tests
-> Build
-> Merge eligible
```

Do not merge if:

- tenant scoping is missing
- provider adapters are bypassed
- approval checks are bypassed
- usage accounting is bypassed
- required logs are missing
- secrets are exposed
- budget constraints can be violated

***

# 84. Architecture Decision Records

Maintain ADRs for expensive-to-reverse decisions including:

```text
Multi-tenancy / RLS
Provider adapter standard
Feature flags vs entitlements
Background jobs
Action Registry
Action Policy / approvals
Usage / credit accounting
Analytics event model
Mautic adapter architecture
SES tenant architecture
Telnyx ISV architecture
VideoRenderer abstraction
Media provider routing
Subscription state model
Support/admin approval architecture
```

Agents must read applicable ADRs before modifying shared architecture.

***

# 85. Build Strategy

Build complete vertical slices rather than separate frontend/backend phases.

Typical ticket:

```text
UI
-> schema/validation
-> domain service
-> database/RLS
-> permissions/entitlements/feature flags
-> background job if required
-> provider adapter if required
-> tests
-> audit/analytics events
-> admin/support visibility
```

Manual/direct functionality must work before the AI assistant is allowed to orchestrate it.

***

# 86. Phase 1 Six-Week Build Plan

**Build Start:** October 1, 2026\
**Target Launch:** November 12, 2026\
**Contingency:** Week 7 only if required

Phase 1 is executed as **parallel vertical slices**. Each specialist lane contributes to the same weekly working-product milestone rather than operating as a frontend-first/backend-second sequence.

## 86.1 Parallel Agent / Team Lanes

```text
1. Lead Architect / Reviewer
2. Product Frontend / UX
3. Marketing Website
4. AI + Media
5. CRM + Capture / Mautic
6. Distribution + Ads + Messaging
7. Analytics + Billing + Admin Ops
8. QA / Integration / Hardening
```

### Lead Architect / Reviewer

Primarily owns  architecture, then continues as reviewer and unblocker for:

- domain model
- ADRs
- provider boundaries
- RLS / tenancy
- Action Registry / Action Policy
- billing architecture
- usage accounting
- background jobs
- event/logging standards
- cross-agent merge review
- difficult integration failures

### Product Frontend / UX

Owns:

- logged-in SaaS shell
- onboarding UX
- Plan / Create / Capture / Distribute / Nurture / Analyze product UI
- billing/settings UI
- admin-facing UI where assigned
- responsive behavior
- customer-facing loading/error/empty states

### Marketing Website

This is an explicit **parallel Phase 1 workstream beginning** .

Owns:

- `showoff.marketing`
- prelaunch mode
- live mode
- maintenance mode
- page visibility controls
- section visibility controls
- canonical SEO/indexing behavior
- pricing
- product/feature pages
- resources/community/build-in-public routes
- Remotion product demo
- conversion CTAs
- signup handoff to the SaaS
- launch-day prelaunch -> live switch

The prelaunch site must be usable before the SaaS is finished. The live marketing experience must be completed behind configuration before launch.

### AI + Media

Owns:

- OpenAI integration
- AI assistant workflows
- structured strategy/content generation
- Higgsfield integration
- Fabric.js image editing
- VideoProject
- JSON2Video
- AI/media failure handling
- AI recommendations and optimization logic

### CRM + Capture / Mautic

Owns:

- CRMProvider
- MarketingAutomationProvider
- contacts
- forms
- lead capture
- landing page data integration
- segments
- scoring
- customer journeys
- support/account context sourced from CRM where relevant

### Distribution + Ads + Messaging

Owns:

- PostPeer
- Zernio
- Amazon SES
- Telnyx
- provider adapters
- channel capability matrix
- ad budget approval
- ad go-live approval
- publishing
- messaging onboarding
- messaging compliance states
- provider-health handling

### Analytics + Billing + Admin Ops

Owns:

- Stripe billing integration
- subscription states
- usage counters
- credit ledger
- provider COGS
- margin telemetry
- unified analytics
- Admin Portal
- provider health
- alerts
- Billing Health
- recurring/popular error intelligence
- support approval surfaces

### QA / Integration / Hardening

Begins Day 1 and continuously owns:

- Vitest test harness
- Playwright
- golden-path E2E
- negative E2E
- cross-tenant tests
- billing tests
- approval tests
- usage tests
- provider failure tests
- webhook idempotency
- regression testing
- launch-readiness validation

***

## &#x20;- Oct 1-7

### Foundation + Account / Subscription Skeleton

**Working product outcome:** A user can reach the marketing site, create an account, create an organization, reach a working SaaS shell, and access the initial billing/admin scaffolding.

### Lead Architect / Reviewer

Establish:

- repository structure
- canonical domain model
- database schema
- Supabase Auth
- organization/membership/RLS conventions
- provider abstractions
- Mautic adapters
- Action Registry
- Action Policy
- approvals
- feature flags
- entitlement service
- usage reservation model
- credit ledger
- subscription state model
- background-job abstraction
- logging schema
- correlation IDs
- monitoring/alerts architecture
- autosave/draft primitive
- testing/error conventions
- environment separation
- CI/CD
- initial ADRs

For the customer and admin React application surfaces, use TanStack Router for client-side routing and separate static Cloudflare Pages deployments. Verify sessions and permissions through Supabase Auth and server-side Postgres functions/RLS. Keep the customer and admin applications separate; the admin Week 1 shell uses one server-checked `platform_admin` permission until its role matrix is defined.

### Product Frontend / UX

Build:

- app shell
- responsive layout system
- design system foundations
- authentication UI
- organization/workspace setup UI
- initial account/settings shell

### Marketing Website

Build:

- `showoff.marketing` application shell
- shared marketing design system
- responsive nav/footer
- prelaunch/live/maintenance mode architecture
- page visibility controls
- section visibility controls
- SEO metadata framework
- sitemap/robots/canonical strategy
- prelaunch homepage shell
- waitlist integration shell
- analytics instrumentation foundation

### AI + Media

Build:

- provider interfaces
- AI job patterns
- generation configuration conventions
- media asset contracts
- VideoProject foundation

### CRM + Capture / Mautic

Build:

- CRM/automation adapter contracts
- contact/lead schema
- forms/lead domain foundation

### Distribution + Ads + Messaging

Build:

- provider adapter scaffolding
- channel capability matrix structure
- provider configuration conventions
- messaging feature flags

### Analytics + Billing + Admin Ops

Build:

- Stripe sandbox integration foundation
- subscription state skeleton
- usage model
- event dictionary foundation
- logging/telemetry scaffolding
- Admin Portal shell

### QA / Integration

Build:

- Vitest harness
- Playwright harness
- CI quality gates
- seed/test-data strategy
- initial auth/RLS tests

### &#x20;Exit Gate

The repository must be runnable and CI must be green.

Specialist agents should not need to invent shared architecture after .

---

## Week 2 - Oct 8-14
### Plan + Create + Prelaunch Website Live

**Working product outcome:** A customer can onboard their business, generate an AI strategy, create/edit initial content, and the public prelaunch marketing site is live collecting interest.

### Product Frontend / UX
Implement:

- business onboarding
- business profile
- campaign creation UI
- strategy UI
- initial content studio

### Marketing Website
Complete and publish prelaunch mode:

- hero
- pain/resonance content
- product teaser
- founder/build-in-public section
- waitlist
- community CTA
- resources entry points
- early-access CTA
- mobile responsiveness
- analytics events

**Milestone:** Prelaunch website is publicly usable by end of Week 2.

### AI + Media
Implement:

- OpenAI adapter
- strategy generation
- structured outputs
- assistant identity/config
- content generation
- Higgsfield integration foundation
- Fabric.js foundation
- JSON2Video foundation
- asset library

### CRM + Capture / Mautic
Implement:

- contact foundation
- form foundation
- CRM adapter tests

### Distribution + Ads + Messaging
Implement:

- PostPeer foundations
- Zernio foundations
- SES/Telnyx integration groundwork
- channel list and capability mapping

### Analytics + Billing + Admin Ops
Implement:

- initial event instrumentation
- Stripe plan/product mapping
- subscription plan IDs
- usage counter foundation
- admin tenant visibility foundation

### QA / Integration
Add:

- Plan/Create slice tests
- onboarding tests
- auth/account flow E2E
- prelaunch website smoke tests

---

## Week 3 - Oct 15-21
### Capture + Ad Setup + Go-Live Marketing Pages

**Working product outcome:** A customer can build lead capture, create a lead, prepare a paid campaign, and the hidden go-live marketing site has core product/feature pages.

### Product Frontend / UX
Implement:

- capture UI
- landing page editor UI
- forms UI
- lead setup
- ad setup UI
- messaging onboarding UI

### Marketing Website
Build behind `live` mode:

- Product page
- feature deep dives
- six-stage workflow
- Plan
- Create
- Capture
- Distribute
- Nurture
- Analyze & Optimize
- Ziggy / AI assistant section
- initial Remotion product-demo sequence

### AI + Media
Implement:

- ad-planning AI
- lead-magnet recommendations
- campaign creative assistance

### CRM + Capture / Mautic
Implement:

- GrapesJS landing pages
- lead forms
- segments
- scoring
- consent capture
- lead-magnet delivery integration

### Distribution + Ads + Messaging
Implement:

- budget approval
- channel capability enforcement
- SES onboarding UI
- Telnyx/SMS onboarding UI
- compliance preflight

### Analytics + Billing + Admin Ops
Implement:

- analytics dictionary
- campaign/engagement tracking
- provider log ingestion
- support/account context APIs

### QA / Integration
Add:

- Capture/Ads slice tests
- lead-submission E2E
- budget-approval tests
- consent/compliance tests
- cross-tenant tests

---

## Week 4 - Oct 22-28
### Distribute + Nurture + Billing Operations + Marketing Conversion Funnel

**Working product outcome:** A customer can publish, launch approved ads, trigger nurture, and manage core subscription actions; the marketing site connects pricing and signup to the product.

### Product Frontend / UX
Implement:

- distribution UI
- nurture UI
- billing/settings UI
- upgrade/pause/cancel UI

### Marketing Website
Implement:

- pricing page
- plan comparison
- signup CTAs
- pricing -> account creation handoff
- support/trust section
- before/after section
- resources/community pages
- FAQ
- conversion analytics

### AI + Media
Implement:

- campaign agent workflows
- messaging hooks
- automation guardrails

### CRM + Capture / Mautic
Implement:

- journeys
- nurture automation
- wait steps
- branch conditions
- lead-capture flow integration

### Distribution + Ads + Messaging
Implement:

- organic publishing
- paid go-live approval
- Zernio launch
- authorized ad automation basics
- SES behind feature flag
- Telnyx behind feature flag
- SMS segment estimator

### Analytics + Billing + Admin Ops
Implement:

- Stripe subscription upgrades/proration
- pause
- cancellation
- failed-payment state
- usage alerts
- email/SMS centralized metering
- webhook/API logging
- activation/upgrade email triggers

### QA / Integration
Add:

- Distribution/Nurture/Billing slice tests
- Stripe test flows
- upgrade/proration tests
- pause/cancel tests
- messaging metering tests
- webhook dedupe tests

---

## Week 5 - Oct 29-Nov 4
### Analyze + Optimize + Admin Ops + Complete Live Marketing Site

**Working product outcome:** Customers can review analytics and recommendations, Showoff can be operated through Admin Portal, and the complete live marketing experience exists behind the mode switch.

### Product Frontend / UX
Implement:

- analytics dashboards
- recommendation UI
- admin-facing operational UI polish

### Marketing Website
Complete live mode:

- full homepage
- final product demo
- pricing
- resources
- community links
- support
- customer/beta proof where available
- final CTA
- product screenshots
- mobile QA
- conversion-event instrumentation

**Milestone:** `marketingSiteMode = live` experience is functionally complete by end of Week 5.

### AI + Media
Implement:

- optimization recommendations
- performance summaries
- creative next-action suggestions

### CRM + Capture / Mautic
Implement:

- analytics events
- support context
- final nurture integrations

### Distribution + Ads + Messaging
Implement:

- provider health
- messaging compliance status
- sending-state visibility
- retry visibility

### Analytics + Billing + Admin Ops
Implement:

- unified analytics
- recommendations
- Billing Health
- Alert Center
- recurring/popular error intelligence
- credit reissue flow
- support escalation/approval workflow
- margin telemetry

### QA / Integration
Add:

- regression suite
- analytics validation
- admin/support flow tests
- error-intelligence tests
- billing recovery tests

---

## Week 6 - Nov 5-11
### End-to-End Hardening + Launch Readiness

**Working product outcome:** The complete customer journey works reliably from marketing site -> subscription -> campaign -> lead -> nurture -> analytics.

No major new feature scope should be introduced.

### Product Frontend / UX
Focus on:

- polish
- edge states
- responsive QA
- accessibility
- launch defects

### Marketing Website
Validate:

- SEO
- sitemap
- canonical URLs
- robots/indexing
- hidden/prelaunch/live page behavior
- pricing
- signup handoff
- login
- CTAs
- forms
- waitlist
- performance
- accessibility
- analytics

### AI + Media
Focus on:

- tuning
- failure handling
- guardrails
- model/provider fallback behavior where defined

### CRM + Capture / Mautic
Focus on:

- journey reliability
- lead integrity
- consent integrity
- hardening

### Distribution + Ads + Messaging
Focus on:

- retries
- idempotency
- provider failures
- feature-flag behavior
- launch readiness

### Analytics + Billing + Admin Ops
Focus on:

- monitoring dashboards
- operational playbooks
- billing recovery
- usage integrity
- alert validation
- margin/COGS checks

### QA / Integration
Run:

- golden-path E2E
- all required negative E2E
- RLS/security validation
- payment/upgrade/pause/cancel flows
- provider outage scenarios
- webhook dedupe
- performance checks
- release checklist

---

## November 12, 2026 - Phase 1 Launch

Launch action:

```text
marketingSiteMode = prelaunch
        ↓
Final launch validation
        ↓
marketingSiteMode = live
        ↓
Public pricing + signup active
        ↓
Phase 1 accepting customers
```

Launch criteria include:

- working product
- Stripe billing live
- core AI workflow live
- customer signup/onboarding functional
- Admin Portal operational
- support escalation operational
- marketing site live
- monitoring/alerts operational

---

## Week 7 - Contingency / Post-Launch Stabilization Only

Week 7 is not planned feature-development capacity.

Use only for:

- launch defects
- provider integration delays
- operational hardening
- performance fixes
- scope overflow that is truly required for MVP safety/usability

No new discretionary Phase 1 features should be introduced.

# 87. Phase 1 Golden Path E2E

```text
Visit marketing site
-> choose plan
-> create account
-> pay
-> Stripe webhook activates subscription
-> welcome email sent
-> onboard business
-> create campaign
-> AI strategy
-> create content/media
-> build landing page
-> submit lead
-> prepare ads
-> approve budget
-> approve go-live
-> publish organic
-> launch ads
-> trigger nurture
-> send email if enabled
-> send SMS if enabled
-> view analytics
-> receive AI recommendation
```

---

# 88. Mandatory Negative E2E Tests

## Cross-Tenant Access

```text
Org A requests Org B data
-> denied
-> logged
```

## Failed AI/Media Job

```text
Provider fails before usable output
-> credits released
-> customer error shown
-> logs written
```

## Budget Violation

```text
AI/automation attempts unapproved budget change
-> blocked
-> logged
```

## No Go-Live Approval

```text
ad launch requested
-> blocked
```

## No SMS Consent

```text
SMS requested
-> blocked
```

## Usage Exhausted

```text
limit reached
-> provider not called
-> upgrade/reset behavior shown
```

## Duplicate Webhook

```text
same event twice
-> processed once
```

## Messaging Provider Not Ready

```text
email or SMS feature flag disabled
-> core MVP remains usable
```

## Failed Renewal

```text
renewal charge declined
-> no new allowances
-> payment_required
-> limited access
-> in-app notification
```

## Failed Upgrade Payment

```text
upgrade charge fails
-> current plan unchanged
-> no higher entitlements
```

## Credit Reissue

```text
wrongful charge proven
-> admin approves
-> append-only adjustment
-> balance restored
-> logged
```

---

# 89. Definition of Done

A ticket is complete only when applicable requirements are satisfied:

- UX matches the approved workflow
- desktop/tablet/mobile behavior defined
- loading/empty/error states exist
- autosave/draft persistence works where required
- client/server validation exists
- tenant/RLS behavior tested
- permissions enforced
- entitlements enforced
- feature flags enforced
- provider availability respected
- Action Registry/Policy used where applicable
- audit/event logging added
- correlation ID present where applicable
- usage accounting correct
- metered actions reserve/commit/release correctly
- background jobs used for long-running work
- retry/idempotency handled
- unit/integration tests pass
- critical E2E updated
- secrets do not reach the browser/logs
- provider errors are normalized
- admin/support visibility exists where operationally required
- documentation/ADR updated for architectural changes

---

# 90. Phase 1 Explicit Non-Goals

Do not delay launch for:

- full creator marketplace transaction workflow
- OpenShot migration
- professional multi-track video editor
- editable/reorderable dashboard widgets
- multiple SMS use cases
- multiple SMS phone numbers
- international SMS
- MMS
- WhatsApp
- ecommerce integrations
- booking integrations
- advanced sales CRM
- full attribution/LTV
- social inbox
- social listening
- advanced RBAC
- advanced developer API
- automatic budget changes
- sophisticated support analytics
- polished admin UI
- full CMS for marketing site

---

# 91. Phase 2 Overview

## Phase 2A - Creation + Conversion

Estimated 4-6 weeks:

- advanced Brand Kit
- advanced content studio
- bulk generation
- richer image editing
- richer video editing
- more templates
- advanced forms
- dynamic personalization
- A/B testing

## Phase 2B - Automation + Intelligence

Estimated 4-6 weeks:

- modular AI assistant skills
- richer workflow builder
- recurring campaign automation
- advanced lead scoring
- experimentation
- controlled autonomous optimizations
- advanced budget recommendations with approval

## Phase 2C - Revenue + Sales

Estimated 4-6 weeks:

- Shopify/WooCommerce
- Stripe revenue events
- booking integrations
- purchase/booking attribution
- CAC
- ROAS
- LTV
- post-purchase journeys
- expanded CRM

## Phase 2D - Marketplace + Platform

Estimated 6-8 weeks:

- Creator Marketplace transaction workflow
- creator profiles/listings
- briefs
- delivery/revisions
- creator payments
- team collaboration
- advanced RBAC
- integration marketplace
- Showoff API
- enterprise controls
- advanced audit/admin tools

---

# 92. Launch Readiness Checklist

Before unrestricted public launch:

## Product
- golden path passes
- negative E2E tests pass
- subscription/billing paths pass
- core workflows operate without developer intervention

## Security
- RLS verified
- secrets protected
- webhooks verified
- tenant-boundary tests pass

## Reliability
- retries/idempotency verified
- background jobs monitored
- alerts configured
- provider kill switches work

## Billing
- activation
- upgrade proration
- downgrade scheduling
- pause
- cancellation
- failed-renewal recovery
- credit correction
- usage limits

## Messaging
- email/SMS enabled only if provider approvals complete
- messaging may remain disabled without delaying launch

## Support
- Chatwoot available
- support SOPs
- knowledge base
- escalation
- human approval
- Admin Portal support visibility

## Legal
- Terms
- Privacy
- AUP
- refund/cancellation policy
- messaging/email policy
- legal acceptance logging
- counsel review

## Operations
- Admin Portal
- provider health
- Alert Center
- error intelligence
- Billing Health
- margin telemetry

## Insurance
- Technology E&O evaluated/bound
- Cyber Liability evaluated/bound
- General Liability evaluated/bound
- Media/Advertising/IP coverage reviewed

## Marketing
- prelaunch/live modes work
- hidden pages are not accidentally indexed
- pricing/signup flow works
- live homepage ready

---

# 93. Final Phase 1 Launch Standard

Phase 1 is ready when:

> A paying customer can discover Showoff, subscribe, complete onboarding, run the core marketing workflow, receive support, manage their subscription, and use the platform without developer intervention while Showoff correctly enforces tenant isolation, approvals, AI autonomy boundaries, usage limits, billing rules, provider abstraction, credit integrity, logging, monitoring, alerting, compliance, and operational visibility.

Email and SMS may remain disabled through feature flags if external provider onboarding has not completed.

The core product must still be launchable and sellable without them.
