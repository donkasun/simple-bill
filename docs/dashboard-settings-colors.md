# Dashboard & Settings — color usage (light / dark)

How SimpleBill applies color on the **Home dashboard** (`/dashboard`) and **Settings** (`/settings`) in light and dark mode.

**Source of truth:** `src/index.css` (`:root` and `[data-theme="dark"]`).  
**Rules:** `CLAUDE.md` (token pairs, hover contrast, status mapping).  
**Last reviewed:** June 2026.

**Live view (local dev only):** With `pnpm dev` on `localhost`, open [/dev/colors](http://localhost:5173/dev/colors) for swatch tables and mini previews (sidebar: **Color guide (dev)**). Not included in production builds.

---

## How theme switching works

1. `ThemeProvider` sets `data-theme="light"` or `data-theme="dark"` on `<html>` from the user’s Appearance choice (or system preference).
2. Light values live on `:root`. Dark values override the same CSS variables inside `[data-theme="dark"]`.
3. Components should use **semantic tokens** (`--md-surface`, `--md-on-surface`, etc.), not hardcoded hex, except where noted (theme preview mocks, document-type icon tints).
4. On theme change, `html.theme-switching` briefly disables CSS transitions so controls repaint immediately (see `ThemeContext`).

---

## Global token reference

### Primary & brand greens

| Token                       | Light (`:root`) | Dark (`[data-theme="dark"]`) | Typical use                                                                |
| --------------------------- | --------------- | ---------------------------- | -------------------------------------------------------------------------- |
| `--md-primary`              | `#0e5138`       | `#5acea4`                    | Primary buttons, segmented toggle selected state, dark sidebar wordmark    |
| `--md-primary-hover`        | `#002114`       | `#4ab88f`                    | Primary hover                                                              |
| `--md-on-primary`           | `#ffffff`       | `#002114`                    | Text on `--md-primary`                                                     |
| `--md-primary-container`    | `#309860`       | `#1e5d3b`                    | Paid bento card, customer quick-action default, **light sidebar wordmark** |
| `--md-on-primary-container` | `#002114`       | `#95d4b3`                    | Text on `--md-primary-container`                                           |
| `--brand-success`           | `#309860`       | (unchanged)                  | Paid status accents elsewhere in app                                       |
| `--brand-warning`           | `#f39c12`       | (unchanged)                  | Draft status (documents list), **Sent bento / row pills on dashboard**     |
| `--brand-danger`            | `#ba1a1a`       | (unchanged)                  | Outstanding balance in customer spotlight                                  |

### Surfaces & text

| Token                            | Light     | Dark      | Typical use                               |
| -------------------------------- | --------- | --------- | ----------------------------------------- |
| `--md-surface`                   | `#f8f9fa` | `#191c1d` | App / sidebar background                  |
| `--md-surface-container-lowest`  | `#ffffff` | `#141718` | Cards, document rows, settings sections   |
| `--md-surface-container`         | `#edeeef` | `#232627` | Unselected settings choices, row hover    |
| `--md-surface-container-high`    | `#e7e8e9` | `#2c2f30` | Hover on neutral chips / settings options |
| `--md-surface-container-highest` | `#e1e3e4` | `#333638` | Draft status bento card                   |
| `--md-on-surface`                | `#191c1d` | `#e1e3e4` | Headings, primary body on surfaces        |
| `--md-on-surface-variant`        | `#404943` | `#bfc9c1` | Subtitles, helper copy, dates             |
| `--md-outline-variant`           | `#bfc9c1` | `#3f4945` | Card borders, dividers                    |

### Secondary (blue)

| Token                         | Light     | Dark      | Typical use                                                               |
| ----------------------------- | --------- | --------- | ------------------------------------------------------------------------- |
| `--md-secondary`              | `#2b6485` | `#7bbcdc` | Ambient blob (secondary), sent status on **documents list** (left border) |
| `--md-secondary-container`    | `#a3d8fe` | `#1b3d52` | Tax season tip card                                                       |
| `--md-on-secondary-container` | `#255f80` | `#9ecff0` | Tax season tip text                                                       |

### Dashboard-specific variables

| Token                         | Light                                     | Dark                                       | Role                                                                   |
| ----------------------------- | ----------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------- |
| `--dashboard-headline-accent` | `var(--md-primary-container)` → `#309860` | `var(--sidebar-nav-active-fg)` → `#5acea4` | Welcome headline, document row amount/number, spotlight outline button |
| `--dashboard-status-sent-fg`  | `#191c1d`                                 | (inherits)                                 | Text on amber Sent bento / pills                                       |
| `--sidebar-nav-active-fg`     | `var(--md-primary-container)`             | `var(--md-primary)`                        | Sidebar **SimpleBill** wordmark + icon; active nav label               |
| `--brand-green-sidebar-dark`  | `#5acea4` (fixed)                         | `var(--sidebar-nav-active-fg)`             | Settings **selected** choice cards (see below)                         |

---

## Status colours (documents)

Across the product, document status uses a consistent language. On the **dashboard**, Sent counts map to `finalized` in data.

| Status    | Meaning     | Dashboard bento card                                 | Dashboard row pill                            | Documents list card (left border)        |
| --------- | ----------- | ---------------------------------------------------- | --------------------------------------------- | ---------------------------------------- |
| **Draft** | Unsent      | `--md-surface-container-highest` + `--md-on-surface` | Same bg/fg as bento (`--status-draft-pill-*`) | `--status-draft-border` (`--md-outline`) |
| **Sent**  | `finalized` | `--brand-warning` + `--dashboard-status-sent-fg`     | `--status-sent-accent`                        | `--status-sent-accent`                   |
| **Paid**  | Paid        | `--md-primary-container` + paired on-token\*         | `--status-paid-accent` + paired on-token\*    | `--status-paid-accent`                   |

\*Paid bento/pill: light mode uses `--md-on-primary` on the container; dark mode uses `--md-on-primary-container` (see `[data-theme="dark"]` overrides in CSS).

---

## Dashboard (`/dashboard`)

### Page shell

| Element                             | Colors                                                                                                                                            |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Page background                     | Inherited from layout (`--md-surface` / body)                                                                                                     |
| Ambient blobs (decorative)          | Primary: `color-mix(--md-primary-container 8%, transparent)`; secondary: `color-mix(--md-secondary 8%, transparent)` — blurs only, no interaction |
| Section labels (“Recent Documents”) | `--md-on-surface` via `.page-section-label`                                                                                                       |
| “View all →”                        | Theme link / button tokens                                                                                                                        |

### Header

| Element                                                   | Light                                                                                          | Dark                                                                        |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Title (“Welcome back, …”)                                 | `--dashboard-headline-accent` → forest `#309860`                                               | Mint `#5acea4`                                                              |
| Subtitle                                                  | `--md-on-surface-variant`                                                                      | Same token (lighter grey-green)                                             |
| **New Invoice** CTA (`.dashboard-header-cta.btn-primary`) | `--md-primary-container` background, white text; floating shadow `--dashboard-shadow-floating` | Primary container / on-primary-container pairing from global `.btn-primary` |

### Status bento (Paid / Sent / Draft)

Three clickable summary cards (`.dashboard-status-card--*`):

| Card      | Background                       | Text / icons                                                    |
| --------- | -------------------------------- | --------------------------------------------------------------- |
| **Paid**  | `--md-primary-container`         | `--md-on-primary` (light) or `--md-on-primary-container` (dark) |
| **Sent**  | `--brand-warning`                | `--dashboard-status-sent-fg`                                    |
| **Draft** | `--md-surface-container-highest` | `--md-on-surface`; label uses `--md-on-surface-variant`         |

Icon chips use `color-mix` of the current text color for a subtle fill.

### Recent document rows

Shared markup: `DocumentRowBody` (`.dashboard-doc-row*`).

| Part                     | Colors                                                                                             |
| ------------------------ | -------------------------------------------------------------------------------------------------- |
| Row surface              | `--md-surface-container-lowest`, border `--md-outline-variant`; hover `--md-surface-container-low` |
| Invoice icon tile        | Teal mix on `--md-surface-container` (`#14b8a6` / `#0f766e`) — **fixed hex**, not theme tokens     |
| Quotation icon tile      | Amber mix (`#f59e0b` / `#d97706`) — **fixed hex**                                                  |
| Document number & amount | `--dashboard-headline-accent`                                                                      |
| Customer & date          | `--md-on-surface-variant`; pending date italic                                                     |
| Status pill              | Same mapping as bento pills (paid / sent / draft)                                                  |

### Aside: customer spotlight

| Element                   | Colors                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------ |
| Card                      | `--md-surface-container-lowest`, border `--md-outline-variant`, soft shadow                |
| Name                      | `--md-on-surface`                                                                          |
| Email                     | `--md-on-surface-variant`                                                                  |
| Outstanding balance block | Background `--md-surface-container`; left border `--brand-danger`; amount `--brand-danger` |
| Send reminder (outline)   | Border & text `--dashboard-headline-accent`; hover light tint via `color-mix`              |

### Aside: tax season tip

| Element | Colors                        |
| ------- | ----------------------------- |
| Card    | `--md-secondary-container`    |
| Text    | `--md-on-secondary-container` |

### Customer quick actions (if shown)

| State                                    | Background                                                     | Text                                                   |
| ---------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------ |
| Default (`.quick-action-card--customer`) | `--md-primary-container`                                       | `--md-on-primary-container`                            |
| Hover                                    | `--quick-action-customer-hover-bg`                             | `--quick-action-customer-hover-text` (+ muted variant) |
| Generic card                             | `--md-surface-container` → hover `--md-surface-container-high` | `--md-on-surface`                                      |

Hover tokens are **defined separately per theme** in `:root` and `[data-theme="dark"]` so text stays readable when the background lightens (see `CLAUDE.md`).

---

## Settings (`/settings`)

Settings uses the standard app page column (`.app-page`, max-width 1024px), not the wider dashboard canvas.

### Page chrome

| Element      | Colors                                                                                                                        |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| Title        | `--md-on-surface` (`.page-title`)                                                                                             |
| Subtitle     | `--md-on-surface-variant`                                                                                                     |
| Loading line | `--md-on-surface-variant`                                                                                                     |
| Error banner | Warning-tinted background via `color-mix(--brand-warning 12%, transparent)`, border `--brand-warning`, text `--md-on-surface` |

### Section cards (`.settings-card`)

| Element       | Colors                                 |
| ------------- | -------------------------------------- |
| Background    | `--md-surface-container-lowest`        |
| Border        | `--md-outline-variant`                 |
| Section title | `--md-on-surface` (`.page-card-title`) |
| Helper / hint | `--md-on-surface-variant`              |

### Default currency grid (unselected)

| Element            | Colors                                                                          |
| ------------------ | ------------------------------------------------------------------------------- |
| Card               | `--md-surface-container`, border `--md-outline-variant`, text `--md-on-surface` |
| Hover              | `--md-surface-container-high`, border `--md-outline`                            |
| Sample amount line | `--md-on-surface-variant`                                                       |

### Default currency grid (selected)

Uses dedicated tokens so light-mode Settings can show the **same mint green as the dark-sidebar wordmark**:

| Token                                   | Light (`:root`)                          | Dark (`[data-theme="dark"]`)                       |
| --------------------------------------- | ---------------------------------------- | -------------------------------------------------- |
| `--settings-choice-selected-bg`         | `#5acea4` (`--brand-green-sidebar-dark`) | `var(--brand-green-sidebar-dark)` → `--md-primary` |
| `--settings-choice-selected-border`     | Same as bg (light)                       | `--md-primary-hover`                               |
| `--settings-choice-selected-text`       | `#002114`                                | `--md-on-primary`                                  |
| `--settings-choice-selected-text-muted` | `#0e5138`                                | `--md-on-primary`                                  |

Selected hover only lifts shadow/transform; **background and text colors stay the same** (no colour transition on purpose).

### Appearance theme picker (unselected)

Same pattern as currency: `--md-surface-container`, `--md-outline-variant`, `--md-on-surface`.

### Appearance theme picker (selected)

Same `--settings-choice-selected-*` tokens as currency.

### Theme preview mocks (illustrative only)

Mini previews inside each tile use **fixed hex** so users can see light vs dark UI, independent of the current theme:

| Preview      | Bar colour          | Notes                                       |
| ------------ | ------------------- | ------------------------------------------- |
| Light mock   | `#0e5138`           | Matches light `--md-primary`                |
| Dark mock    | `#5acea4`           | Matches dark `--md-primary` / sidebar brand |
| Match device | Gradient of the two |                                             |

Preview surfaces (`#f8f9fa`, `#191c1d`, etc.) are not tied to live theme tokens.

---

## Sidebar relationship (context)

Settings selected green is intentionally aligned with **sidebar branding in dark mode**:

| Theme | Sidebar “SimpleBill” colour | Token                                                |
| ----- | --------------------------- | ---------------------------------------------------- |
| Light | Forest green `#309860`      | `--sidebar-nav-active-fg` → `--md-primary-container` |
| Dark  | Mint `#5acea4`              | `--sidebar-nav-active-fg` → `--md-primary`           |

On a **light** Settings page, selected cards use mint (`--brand-green-sidebar-dark`) so the choice reads as the accent users see when the app is in dark mode, not the forest green of the light sidebar.

---

## Do / don’t (dashboard & settings)

**Do**

- Pair every coloured background with its `on-*` foreground token.
- Use `--md-surface-*` and `--md-on-surface*` for neutral cards and copy.
- Use `--dashboard-headline-accent` for dashboard emphasis (headline, amounts, row titles).
- Re-check **Paid** and **customer quick-action** hovers in both themes.
- Add per-theme tokens when hover changes lightness but text should stay dark (or light) in both themes.

**Don’t**

- Use `color: white` / `color: black` for UI chrome.
- Use `--md-on-surface` for text on a hover state that lightens a coloured card (it inverts between themes).
- Assume Stitch mock colours (e.g. Sent = amber on dashboard, blue on documents list) are interchangeable without checking this doc.
- Rely on global `* { transition: color }` for theme toggles; use `theme-switching` or avoid transitioning `color` on choice cards.

---

## Related files

| Area         | Files                                                                          |
| ------------ | ------------------------------------------------------------------------------ |
| Tokens & CSS | `src/index.css`                                                                |
| Theme state  | `src/contexts/ThemeContext.tsx`, `src/hooks/useTheme.ts`                       |
| Dashboard UI | `src/pages/dashboard/Dashboard.tsx`, `src/components/dashboard/*`              |
| Shared row   | `src/components/documents/DocumentRowBody.tsx`, `src/utils/documentDisplay.ts` |
| Settings UI  | `src/pages/Settings.tsx`, `src/components/settings/*`                          |
| Design rules | `CLAUDE.md`, `docs/landing-page-stitch-brief.md` (marketing tokens)            |
