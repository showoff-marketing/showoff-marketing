---
name: Showoff
description: A clear, restrained visual foundation for Showoff's marketing and product surfaces.
colors:
  action-blue: "#2563eb"
  admin-blue: "#2459d3"
  ink: "#111827"
  admin-ink: "#171a1d"
  body: "#3f4858"
  muted: "#68707c"
  paper: "#ffffff"
  customer-divider: "#d9dee7"
  marketing-divider: "#dfe5ed"
  admin-divider: "#d9dee5"
  control-outline: "#8b95a4"
typography:
  display:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "clamp(70px, 7.15vw, 110px)"
    fontWeight: 790
    lineHeight: 0.98
  headline:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "clamp(38px, 5vw, 58px)"
    fontWeight: 760
    lineHeight: 1
  title:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "clamp(26px, 3vw, 32px)"
    fontWeight: 760
    lineHeight: 1.14
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "14px"
    fontWeight: 630
rounded:
  marketing-action: "2px"
  marketing-field: "4px"
  admin-panel: "6px"
  customer-control: "7px"
  customer-panel: "14px"
  status-pill: "999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  customer-primary-button:
    backgroundColor: "{colors.action-blue}"
    textColor: "{colors.paper}"
    rounded: "{rounded.customer-control}"
    height: "54px"
    padding: "0 20px"
  customer-input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    borderColor: "{colors.control-outline}"
    rounded: "{rounded.customer-control}"
    height: "52px"
    padding: "0 14px"
  marketing-primary-action:
    backgroundColor: "{colors.action-blue}"
    textColor: "{colors.paper}"
    rounded: "{rounded.marketing-action}"
    height: "78px"
    padding: "0 50px"
  admin-navigation:
    color: "{colors.admin-blue}"
    height: "54px"
    activeIndicator: "3px underline"
  customer-panel:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.customer-panel}"
    padding: "40px 44px 34px"
  admin-index-panel:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.admin-panel}"
    padding: "35px 26px"
---

# Design System: Showoff

## Overview

**Creative North Star: “A clear line from idea to action” (inferred from the selected comps).**

Across the supplied first-screen references, Showoff uses a white field, dark sans-serif type, blue action cues, and precise borders to keep the work easy to scan. The shared foundation is quiet and functional. The exact page composition follows the job of each surface: account entry centers a compact form and setup progress, marketing lays out a seven-stage process, and admin presents three balanced operational areas.

Treat this as a shared visual vocabulary, not a shared page template. Preserve the boundary between the public marketing site, the customer workspace, and the separate admin portal. The values below describe the implemented code and reviewed captures; surface-specific strategy stays in the app briefs.

**Key Characteristics:**

- White backgrounds with near-black headings and readable gray body text.
- Blue is reserved for active progress, links, and primary actions.
- Inter-led typography and thin rules make information hierarchy explicit.
- Each surface keeps its own layout and interaction purpose.

## Colors

The palette is neutral-first, with a single saturated blue family for actions; admin uses its own slightly deeper blue.

### Primary

- **Showoff Action Blue** (`{colors.action-blue}`): Customer and marketing links, active indicators, and primary actions.
- **Admin Utility Blue** (`{colors.admin-blue}`): Active admin navigation and admin actions.

### Neutral

- **Paper White** (`{colors.paper}`): Main page and control backgrounds.
- **Showoff Ink** (`{colors.ink}`): Customer and marketing headings and primary text.
- **Admin Ink** (`{colors.admin-ink}`): Admin headings and primary text.
- **Body Slate** (`{colors.body}`): Marketing explanatory copy.
- **Muted Slate** (`{colors.muted}`): Supporting copy and secondary labels.
- **Customer Divider** (`{colors.customer-divider}`): Customer form separators and progress rules.
- **Marketing Divider** (`{colors.marketing-divider}`): Marketing section and masthead rules.
- **Admin Divider** (`{colors.admin-divider}`): Admin navigation and panel rules.
- **Control Outline** (`{colors.control-outline}`): Customer input and provider-button boundaries.

**The Blue Action Rule.** Use each surface's established blue for actionable or active elements; keep decorative diagrams and status meaning legible without color alone.

## Typography

**Display Font:** Inter (with the observed system sans-serif fallbacks)<br>
**Body Font:** Inter (with the observed system sans-serif fallbacks)

**Character:** The same sans-serif family supports both the compact utility labels and the large marketing headline. Heavy display weights create hierarchy; body copy remains open and readable.

### Hierarchy

- **Display** (weight 790, `clamp(70px, 7.15vw, 110px)`, line-height 0.98): Marketing homepage headline.
- **Headline** (weight 760, `clamp(38px, 5vw, 58px)`, line-height 1): Admin overview title.
- **Title** (weight 760, `clamp(26px, 3vw, 32px)`, line-height 1.14): Customer sign-in heading.
- **Body** (weight 400, 16px, line-height 1.5): Explanatory copy and unavailable-state descriptions.
- **Label** (weight 630, 14px): Form labels, navigation, and step names; smaller uppercase labels use additional tracking where the surface defines it.

## Layout

Use the structure that matches the task. The customer surface keeps its progress row above a centered panel whose maximum width is 544px. The marketing surface uses a wide container capped at 1400px and lets its seven workflow stages read as one horizontal line on desktop, then reflow into two columns on narrow screens. The admin overview uses three equal columns on desktop and stacks them on mobile; its navigation wraps so every destination stays visible.

Responsive rules are app-specific: customer switches at 600px, admin at 760px, and marketing at 980px and 620px. Keep mobile controls readable and avoid horizontal overflow; do not force the marketing, customer, and admin surfaces onto one grid.

**The Separate Surface Rule.** Reuse color, type, and control language while keeping the three distinct application layouts intact.

## Elevation & Depth

Depth comes mainly from open white space, hairline dividers, and panel outlines. The customer authentication panel is the exception: it has one restrained ambient shadow (`0 16px 42px rgb(16 24 40 / 5%)`). Marketing and admin panels remain flat.

## Shapes

Controls use small, functional corner radii. Marketing actions are nearly square (2px); marketing fields use 4px; admin index panels use 6px; customer controls use 7px and the customer sign-in panel uses 14px (12px on small screens). Admin connection states use a pill shape (999px). Borders stay thin and identify interactive or grouped regions.

## Components

### Buttons

- **Customer primary:** Filled blue, white label, 54px minimum height, 7px radius, and 20px horizontal padding. Hover darkens the blue; keyboard focus is visible.
- **Marketing primary action:** Filled blue with white uppercase lettering, 78px height and 2px radius on desktop. The single primary action leads into the waitlist section.
- **Admin navigation:** Text tabs with a blue active label and underline. On mobile, labels wrap across two rows rather than clipping.

### Cards / Containers

- **Customer sign-in panel:** White, 14px radius, thin border, restrained ambient shadow, and generous internal spacing.
- **Admin index panels:** White, 6px radius, thin outline, equal desktop columns, and an explicit text empty state when operational data is unavailable.

### Inputs / Fields

- **Customer fields:** White fill, readable outlined boundary, 7px radius; focus changes the border and shows a visible outline.
- **Marketing waitlist field:** White fill, 4px radius; its submit control remains visibly disabled while no endpoint is configured.

### Navigation

- **Marketing:** A compact “How it works” link and prelaunch state beside the wordmark.
- **Customer:** A quiet wordmark header with the three-step account/workspace/team progress below it.
- **Admin:** A compact horizontal set of five destinations with a visible active underline; wraps on small screens.

### Workflow

- **Marketing stages:** Seven ordered steps use thin blue outline icons, uppercase labels, and small connecting arrows. Desktop keeps the sequence horizontal; mobile preserves order in a two-column grid.

## Do's and Don'ts

### Do:

- **Do** keep text and controls at the contrast levels reviewed in the finished surfaces; recheck contrast when changing colors.
- **Do** distinguish unavailable admin data with a text label and explanation, not color alone.
- **Do** keep the marketing waitlist's unconfigured state explicit and its submit action disabled.
- **Do** preserve each application's distinct layout and responsive behavior.

### Don't:

- **Don't** invent admin counts, incidents, customers, or provider health values for an empty system.
- **Don't** show an enabled waitlist submission when no endpoint is configured.
- **Don't** merge the public marketing site, customer workspace, and admin portal into one navigation or page shell.
