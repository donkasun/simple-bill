# Task: Re-skin the SimpleBill Dashboard to match the Stitch design

You are an external LLM taking over implementation. **Read this whole file first**, then
the layout spec, then the existing code. Your job is to make the app's dashboard match the
Stitch reference design — adapting it to this project's real stack and conventions, **not**
copying the raw HTML verbatim.

## Inputs in this folder (`design-reference/`)

| File                                | What it is                                                                                        |
| ----------------------------------- | ------------------------------------------------------------------------------------------------- |
| `INSTRUCTIONS-FOR-LLM.md`           | This file. Start here.                                                                            |
| `stitch-dashboard.layout.md`        | **The spec.** Human-readable layout, components, tokens, motion.                                  |
| `stitch-dashboard.screenshot.png`   | Rendered screenshot of the target — your visual ground truth.                                     |
| `stitch-dashboard.reference.html`   | Raw Stitch export (Tailwind CDN + inline styles). **Reference only** — do not paste into the app. |
| `dashboard-stitch-reskin-phases.md` | Phased implementation checklist (single-branch rollout).                                          |

## The project's real stack (do NOT introduce Tailwind)

- **React 19 + TypeScript + Vite**, routing via `react-router-dom`, data via Firebase.
- Styling is **CSS custom-property design tokens**, not Tailwind. The reference HTML uses
  Tailwind utility classes — treat those as a description of intent and translate them into
  this project's token-based CSS.
- Component style objects live next to components (e.g. `*.styles.ts`).

### Files you will most likely touch

- `src/pages/dashboard/Dashboard.tsx` — the dashboard page (rendered via a controller hook).
- `src/pages/dashboard/Dashboard.styles.ts` — its styles.
- `src/hooks/pages/useDashboardPage.ts` — controller hook (data/handlers; keep logic here).
- `src/components/dashboard/` — `DashboardSummaryStrip.tsx`, `DashboardQuickActions.tsx`,
  `DashboardEmptyState.tsx`. The Stitch "bento status cards" map to the summary strip; the
  "recent documents" + "customer spotlight" are new/extended sections.
- `src/index.css` / `src/App.css` — design tokens (`--md-*`, brand tokens). Add per-theme
  tokens here if a hover state needs them.
- `src/components/layout/` — the app shell / sidebar nav (the Stitch left sidebar).

### Project rules you MUST follow (see root `CLAUDE.md` for full detail)

1. **Colour token pairs** — every background token has a matching `on-*` foreground token.
   Never mix pairs; never use literal `color: white`/`black`. The Stitch export hardcodes hex
   values and `rgb(30,93,59)`; map these onto existing tokens (`--md-primary`,
   `--md-on-primary`, `--md-primary-container`, etc.) rather than hardcoding.
2. **Hover contrast rule** — if a hover changes the background, the text colour must change with
   it, using explicit per-theme tokens (because `--md-on-surface` inverts between themes).
3. **Status colour mapping** — Draft = amber (`--brand-warning`), Sent/Finalized = blue
   (`--md-secondary`), Paid = green (`--md-primary`/`--brand-success`). **Important:** the Stitch
   mock uses amber for _Sent_ and grey for _Draft_; **follow this project's existing status
   mapping above, not the mock's**, unless the user explicitly says to adopt the mock's colours.
4. Verify every coloured element in **both light and dark themes**.
5. One primary CTA per card; secondary actions go in a `⋯` overflow.

## What to build (target state — see `stitch-dashboard.layout.md` for the detail)

1. **Shell:** fixed left sidebar (logo + Dashboard/Invoices/Customers/Items/Settings + Sign out),
   content canvas offset by the sidebar, centred at ~1200px max width. Active nav item gets a
   left accent bar. _(If a shell/sidebar already exists, extend it — don't duplicate it.)_
2. **Header:** "Welcome back, {name}" headline + status-summary subtitle, and a primary
   **New Invoice** CTA on the right.
3. **Status summary (bento):** three cards — Paid / Sent / Draft — each with a label, a round
   icon chip, and a large count. Hover lift + staggered entrance.
4. **Recent Documents:** vertical list of document rows — status pill + invoice no. + customer on
   the left, amount + date on the right. Use real data from the dashboard hook; the table in the
   layout spec is sample data for layout only.
5. **Customer Spotlight (right column, sticky):** avatar + name + email, an Outstanding Balance
   callout (error-bordered), a full-width outlined **Send Reminder** button, and a secondary
   "Tax Season Tip" info card below.
6. **Motion & a11y:** fade-up/slide-in entrances, gentle pulse on the primary CTA, shimmer on the
   outstanding-balance box. **Preserve `prefers-reduced-motion`** — disable all animation there.

## Constraints & guardrails

- **Wire real data.** Do not hardcode "Julian", "Sarah Jones", "Rs 450.00", etc. Pull from the
  existing dashboard hook / Firebase models. Placeholder copy from the mock is illustrative only.
- Keep business logic in the controller hook; keep `Dashboard.tsx` a thin view.
- Reuse existing components (status pills, cards, summary strip) before creating new ones.
- Match spacing/radius/type to the project tokens (radius xl = 16px for cards, pills = full).
- Don't pull in the Tailwind CDN, Material Symbols CDN, or Google Fonts `<script>`/`<link>` tags
  from the export; use the project's existing font + icon setup.
- After changes: run `pnpm lint` and `pnpm test`, and verify both themes render correctly.

## Suggested order of work

1. Read `stitch-dashboard.layout.md` + open the screenshot side-by-side.
2. Read `CLAUDE.md`, `Dashboard.tsx`, `Dashboard.styles.ts`, `useDashboardPage.ts`, and the
   `src/components/dashboard/` components to learn the current structure and token names.
3. Implement shell/header → bento summary → recent documents → customer spotlight → motion.
4. Verify lint, tests, and both light/dark themes. Show before/after screenshots if possible.
