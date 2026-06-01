# Stitch Design — Dashboard Layout Spec

> Source: Stitch project `SimpleBill Invoicing App` (project `11345703519578517199`),
> screen `abb8589fc2a94174b8ddea063f5e0be8` — **"Dashboard - Animated & Interactive - SimpleBill"**.
> Device: Desktop. Raw export is in `stitch-dashboard.reference.html`; rendered
> screenshot is `stitch-dashboard.screenshot.png`. This file is the human-readable
> distillation of that export.

## 1. Page shell

Two-part shell: a **fixed left sidebar** (`w-64` / 256px) + a **main content canvas**
offset by the sidebar (`ml-64`) and centred with `max-width: 1200px`, padding `48px`
(`p-stack-lg`).

```
┌──────────┬───────────────────────────────────────────────┐
│ SIDEBAR  │  HEADER (title + New Invoice button)           │
│ (fixed,  │                                                │
│  256px)  │  ┌──────────┬──────────┬──────────┐           │
│          │  │  PAID    │  SENT    │  DRAFT   │  (bento)   │
│ logo     │  └──────────┴──────────┴──────────┘           │
│ nav x5   │                                                │
│          │  ┌─────────────────────────┬───────────────┐  │
│          │  │ Recent Documents        │ Customer       │  │
│          │  │ (col-span-8)            │ Spotlight      │  │
│          │  │  row, row, row, row     │ (col-span-4,   │  │
│          │  │                         │  sticky)       │  │
│ sign out │  └─────────────────────────┴───────────────┘  │
└──────────┴───────────────────────────────────────────────┘
```

Two fixed, blurred ambient background "blobs" sit behind everything (`-z-10`):
top-right primary tint (500px, blur 120px), bottom-left secondary tint (400px, blur 100px).

## 2. Sidebar (`w-64`, fixed, full height)

- Background `--surface` (light) / `--inverse-surface` (dark); right border `--outline-variant`.
- **Logo area** (`p-container-margin`, flex gap 12px): a 40×40 `--primary` rounded-lg tile
  with a filled `description` Material icon (white), next to wordmark **"SimpleBill"**
  in Epilogue headline-md bold, colour `rgb(30,93,59)` (deep green).
- **Nav** (`flex-1`, vertical, `space-y-1`), each item = icon + label, `px-4 py-3`, rounded:
  1. **Dashboard** — _active_: deep-green text, bold, faint `primary-container/20` bg,
     plus a 4px vertical primary accent bar on the left edge.
  2. Invoices · 3. Customers · 4. Items · 5. Settings — inactive, `on-surface-variant` text.
  - Icons (Material Symbols): `dashboard`, `description`, `group`, `inventory_2`, `settings`.
  - Hover: `surface-container-highest` bg + `scale-[1.02]`.
- **Footer** (top-bordered): **Sign out** link with `logout` icon.

## 3. Header

- Left: H1 **"Welcome back, Julian"** (headline-xl, 40px, deep green `rgb(30,93,59)`),
  subtitle **"Here is your clean status summary for this month."** (body-lg, on-surface-variant).
- Right: primary CTA **"New Invoice"** — `add_circle` icon + label, `bg-primary text-on-primary`,
  `px-8 py-4`, `rounded-xl`, green floating shadow, **gentle breathing pulse** animation,
  hover brightens + `scale-105`, active `scale-95`.

## 4. Status summary — Bento cards (3-col grid, `gap-8`)

Each card: `rounded-xl`, soft shadow, `h-120px`, `p-stack-sm`; header row = uppercase
label (label-sm, tracked) + a 40×40 round icon chip; large number below (headline-xl).
Hover: lift (`-translate-y-2`) + larger shadow. Staggered fade-up entrance (100/200/300ms).

| Card  | Background                       | Text/Icon          | Icon chip               | Icon            | Value |
| ----- | -------------------------------- | ------------------ | ----------------------- | --------------- | ----- |
| Paid  | `--primary` green                | `on-primary` white | `white/20`              | `check_circle`  | 15    |
| Sent  | `#f39c12` amber                  | `on-surface` dark  | `black/10`              | `arrow_forward` | 7     |
| Draft | `surface-container-highest` grey | `on-surface`       | `on-surface-variant/10` | `edit`          | 3     |

## 5. Lower split — `lg:grid-cols-12`, `gap-8`

### 5a. Recent Documents (`col-span-8`)

- Section title **"Recent Documents"** (headline-md).
- A vertical stack (`space-y-4`) of **document rows**, each: white card, `rounded-xl`,
  1px `outline-variant` border, `p-3`, flex space-between, hover `surface-container-low`,
  staggered fade-up (400–700ms). Each row:
  - **Left:** status pill (uppercase, `rounded-full`, `px-4 py-1.5`, white text) +
    invoice no. (bold deep-green) over customer name (`on-surface-variant`, small).
  - **Right:** amount (bold deep-green, `Rs` currency) over date (small, muted).
- Sample data (keep ordering/statuses to match colours):

  | Pill  | Pill colour | Invoice | Customer  | Amount       | Date / note        |
  | ----- | ----------- | ------- | --------- | ------------ | ------------------ |
  | PAID  | `#309860`   | #1024   | Acme Corp | Rs 12,500.00 | 12 Oct 2023        |
  | SENT  | `#f39c12`   | #1023   | Beta Ltd  | Rs 4,800.00  | 14 Oct 2023        |
  | PAID  | `#309860`   | #1022   | Gamma Inc | Rs 2,350.00  | 15 Oct 2023        |
  | DRAFT | `#94a3b8`   | #1021   | Zeta Soft | Rs 8,900.00  | _Pending_ (italic) |

### 5b. Customer Spotlight (`col-span-4`, sticky, slides in from right)

- **Spotlight card:** white, `p-8`, `rounded-xl`, bordered, shadow-lg, hover lift.
  - Header: 48×48 round `secondary-container` avatar with `person` icon + name
    **"Sarah Jones"** (headline-md) over email **sarah.jones@example.com** (label-sm, muted).
  - **Outstanding Balance** box: `surface-container` bg, **4px left border `--error`**,
    shimmer pulse; uppercase label + **Rs 450.00** in error red (headline-md).
  - **"Send Reminder"** button: full-width, outlined in deep green, green text, hover
    `primary/10` tint + `scale-105`.
- **Tax Season Tip card** (below, `mt-stack-lg`): `secondary-container` bg,
  `on-secondary-container` text, `rounded-xl`, `p-6`. Heading "Tax Season Tip" + body:
  "Keep your receipts organized! Julian, you've saved 12 documents this month. Great progress."

## 6. Design tokens (from Stitch theme "Simple Humanist")

- **Fonts:** Headlines = **Epilogue** (600/700/800); body & labels =
  **Atkinson Hyperlegible Next** (400/600/700). Body never < 16px; 18px default; line-height 1.6.
- **Type scale:** headline-xl 40px/1.2/-0.02em 700 · headline-md 24px/1.3 600 ·
  body-lg 20px/1.6 · body-md 18px/1.6 · label-md 16px/1.4 600 · label-sm 14px/1.2/0.03em 700.
- **Radius:** base 0.25rem · lg 0.5rem · **xl 16px** (cards) · full 9999px (pills).
- **Spacing scale:** unit 8px · stack-sm 16px · gutter 20px · container-margin 24px ·
  stack-md 32px · stack-lg 48px.
- **Key colours** (light theme): surface `#f8f9fa` · surface-container-lowest/white `#ffffff` ·
  on-surface `#191c1d` · on-surface-variant `#404943` · outline-variant `#bfc9c1` ·
  **primary `#309860`** (note: export's primary differs from theme `#0f5238`; deep-green text
  literal used in markup is `rgb(30,93,59)` = `#1e5d3b`) · on-primary `#ffffff` ·
  primary-container `#309860` · on-primary-container `#dff5ea` · secondary `#2b6485` ·
  secondary-container `#a3d8fe` · on-secondary-container `#255f80` · error `#ba1a1a`.
  Status accents used literally in the design: Paid/green `#309860`, Sent/amber `#f39c12`,
  Draft/grey `#94a3b8`.
- **Elevation:** `.soft-shadow` = `0 10px 30px -5px rgba(0,0,0,0.05)`;
  `.floating-button-shadow` = `0 20px 40px -10px rgba(48,152,96,0.25)`.

## 7. Motion

- Entrance: `fadeInUp` (cards/rows, staggered delays) and `slideInRight` (spotlight).
- Ambient: `pulse-breathing` on the New Invoice button; `pulse-shimmer` on the
  outstanding-balance box.
- All interactive elements: hover scale up ~1.02–1.05, active press `scale-95/0.96`.
- **`prefers-reduced-motion`** disables every animation/transition/transform — must be preserved.

```

```
