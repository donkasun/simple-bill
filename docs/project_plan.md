## SimpleBill — Delivery Plan (Re-anchored)

### 🎯 Who this is for

SimpleBill has **two audiences**, and the plan is anchored to both:

1. **Primary user — the owner's father.** Non-technical, makes invoices occasionally
   (roughly every 1–2 weeks). He **quotes regularly** and then invoices, **bills the same
   customers and services repeatedly**, and wants a simple **"mark as paid"** toggle. He
   uses **LKR**. The product's job is to make a recurring, low-frequency task fast,
   calm, and impossible to get wrong.
2. **Secondary goal — public showcase.** The repo doubles as a portfolio piece, so it
   must support **other users in other currencies (e.g. USD)** and present a polished,
   accessible, well-engineered codebase.

Every milestone below is justified by one of these two audiences. Features that serve a
"freelancer/agency SaaS power user" persona (which this is **not**) have been cut or
deferred — see the bottom of this doc.

### Design direction

The UI is being rebuilt on the **"Simple Humanist" design system** (designed in Google
Stitch): sage-green calm palette, Atkinson Hyperlegible + Epilogue typography, large tap
targets, plain-English copy, light/dark themes. This **supersedes** the old Rough.js /
hand-drawn aesthetic and the planned line-art-icon work, both now obsolete.

### Key product decisions (locked)

- **Quotations stay** — the user quotes regularly. Keep quote→invoice conversion; make the
  Invoice vs Quotation distinction gentle and obvious.
- **Status model simplified** to **Draft → Finalized → Paid**. The old six-state system
  (Sent / Cancelled / Pending) is removed from both data model and UI.
- **Saved Customers + Items stay** — the user repeats them; lean into reuse and duplication.
- **Multi-currency is in scope** (LKR + USD + others) as a first-class, per-document
  setting with a user default. No live FX conversion — each document is single-currency.

### Partial invoicing — resolved

Instead of quantity-accounting (the most complex, least-intuitive piece), we use a simpler
model: **a quotation can be converted to an invoice multiple times**, and **each conversion
produces a fresh editable invoice draft** (line items copied in). The user simply deletes or
adjusts the lines they don't need for that particular invoice. This preserves the
split-billing capability while removing all remaining/invoiced/original-quantity tracking.

- **Keep:** multiple conversions per quotation + quotation↔invoice relationship tracking.
- **Cut:** `originalQuantity` / `invoicedQuantity` / `remainingQuantity` fields and their logic in `src/types/document.ts` and related code.

### Status Legend

- ✅ **[DONE]** · 🔄 **[WIP]** · ⏳ **[PENDING]** · ✂️ **[CUT/DEFERRED]**

---

## Completed foundation (done, keep)

- ✅ Google Sign-In, protected routes, auth provider
- ✅ AppShell + left sidebar navigation, responsive layout
- ✅ Customers CRUD, Items CRUD, generic `useFirestore` hook
- ✅ Document creation/edit, draft/finalize, auto document numbering (transactional)
- ✅ PDF export (pdf-lib), auto-calculated totals
- ✅ Quotation → invoice conversion, relationship tracking
- ✅ Per-invoice currency switching + `formatCurrency` util (baseline for M5)
- ✅ Light/dark theme support
- ✅ Test suite (utils, hooks, Dashboard) + Vercel deploy

---

## Milestone 1 — Design overhaul (Simple Humanist) — 🔄 [WIP]

Apply the Stitch design system across the whole app.

**Target files:** `src/index.css`, `src/App.css`, `src/components/core/*`,
`src/components/layout/*`, all `src/pages/*`.

**Tasks**

- [ ] Port the design tokens (colors, typography scale, spacing, radii) into CSS variables.
- [ ] Rebuild core components (buttons, inputs, dropdown, table, cards) to the new system.
- [ ] Apply to every page: Login, Dashboard, Create/Edit, Customers, Items, Settings, Profile, Terms.
- [ ] Verify light/dark parity and WCAG AA contrast (especially secondary gray text).

**Acceptance**

- All screens match the Simple Humanist system; no Rough.js remnants; contrast passes.

---

## Milestone 2 — Usability & safety pass — ⏳ [PENDING]

Direct output of the design audit. Highest trust impact for a non-technical user.

**Tasks**

- [ ] Add confirmation dialogs to **all destructive actions** (delete document, delete
      customer/item, account deactivate). No one-click irreversible deletes.
- [ ] Separate/de-emphasize destructive actions from primary actions (Dashboard "Delete"
      currently sits beside "Continue editing").
- [ ] Replace **icon-only** Edit/Delete (Items page) with labeled controls.
- [ ] Make Customers row actions always visible (not hover-only).
- [ ] Unify the create-action wording to **"invoice"** everywhere (today it's "Make a new
      invoice" / "New Invoice" / "New Document").
- [ ] Flip Dashboard card hierarchy to lead with **customer name**, not the doc number.

**Acceptance**

- No destructive action is one click from the primary action; all confirm first.
- Every action control has a visible text label; create wording is consistent.

---

## Milestone 3 — Simplify the status model — ⏳ [PENDING]

**Target files:** `src/types/document.ts`, `src/utils/documents.ts`,
`src/pages/dashboard/Dashboard.tsx`, `src/pages/DocumentEdit.tsx`.

**Tasks**

- [ ] Reduce status to `draft | finalized | paid`; remove `sent | cancelled | pending`.
- [ ] Add a one-click **"Mark as paid"** action (with confirmation) on finalized invoices.
- [ ] Update status badges to the three states with clear, plain-language labels
      (e.g. "Draft" → "Not finished", "Paid").
- [ ] Migrate/than handle any legacy status values gracefully.

**Acceptance**

- Only three statuses exist end-to-end; "Mark as paid" works and is obvious.

---

## Milestone 4 — Repetition speed pack — ⏳ [PENDING]

The single highest-value cluster for a repeat-business user.

**Target files:** `src/pages/dashboard/*`, `src/pages/DocumentCreation.tsx`,
`src/hooks/useDocumentForm.ts`, `src/components/documents/LineItemsTable.tsx`,
`src/components/customers/CustomerModal.tsx`.

**Tasks**

- [ ] **Duplicate** any document → exact copy, new doc number, opens in edit mode.
- [ ] **Copy from previous** on new-document → pre-fill from the most recent document.
- [ ] **Auto-suggest customer names** as you type (search existing customers).
- [ ] **Remember frequently used items** — sort item pickers by usage; "Recently used" group.
- [ ] Verify **auto-calculate totals** is correct (already implemented; confirm + test).

**Acceptance**

- A repeat invoice can be produced in a few clicks via Duplicate/Copy-from-previous.
- Customer/item entry surfaces prior data without manual searching.

---

## Milestone 5 — Multi-currency (showcase-critical) — 🔄 [WIP]

Baseline exists (per-invoice currency + `formatCurrency`). Make it first-class for LKR,
USD, and others.

**Target files:** `src/utils/currency.ts`, `src/types/document.ts`,
`src/pages/Settings.tsx`, `src/hooks/useUserProfile.ts`, `src/utils/pdf.ts`,
`src/pages/DocumentCreation.tsx`.

**Tasks**

- [ ] Define a supported-currency list with correct symbols/locale formatting (LKR, USD, + common others).
- [ ] User **default currency** in Settings (persisted), applied to new documents.
- [ ] Per-document currency **override** at creation; locked once finalized.
- [ ] Ensure **PDF** renders the document's currency and formatting correctly.
- [ ] Tests for formatting across LKR/USD (symbol placement, decimals, thousands).
- [ ] Explicitly **out of scope:** live exchange-rate conversion between currencies.

**Acceptance**

- A user can default to LKR while another uses USD; each document formats correctly in UI and PDF.

---

## Milestone 6 — First-run & re-entry guidance — ⏳ [PENDING]

A fortnightly user forgets the flow between sessions; gentle guidance prevents relearning.

**Tasks**

- [ ] Friendly empty states with one clear CTA on Dashboard, Customers, Items.
- [ ] Light onboarding for the first invoice (the design system's plain-English stepper:
      "1. Who are you billing?" etc.) on the Create screen.
- [ ] Plain-language helper text for Invoice vs Quotation and Draft vs Finalized.

**Acceptance**

- A returning user can complete an invoice without external help; empty states guide first use.

---

## Milestone 7 — Showcase readiness — ⏳ [PENDING]

Make the repo present well as a portfolio piece.

**Tasks**

- [ ] Add **CI** (GitHub Actions: lint + typecheck + test + build on PR) — currently missing.
- [ ] Refresh **README** (remove stale Rough.js design-language section; reflect Simple Humanist + multi-currency).
- [ ] Rename package `simple-bill-temp` → `simple-bill`; ensure `dist/` is git-ignored.
- [ ] Add a top-level React **error boundary** for lazy routes.
- [ ] Real **Terms of Service** content (Login link currently a placeholder).

**Acceptance**

- Green CI on PRs; README accurate; clean repo hygiene; no blank-screen on route errors.

---

## Cut / deferred (do not build for this persona)

- ✂️ **Quantity-accounting partial invoicing** — replaced by repeated convert-and-edit (see "Partial invoicing — resolved"). Remove `originalQuantity`/`invoicedQuantity`/`remainingQuantity`.
- ✂️ Document versioning & "revert to previous version"
- ✂️ Customer/Item categories
- ✂️ Data retention / auto-archiving
- ✂️ Recurring invoices
- ✂️ Offline support
- ✂️ Multi-language / i18n
- ✂️ Quotation age notifications, modification tracking
- ✂️ Full custom branding/theming (a single logo on the PDF is acceptable; full theming is not)
- ✂️ Line-art SVG icon system (obsoleted by the new design system)

**Kept but treated as backend/non-UI concern:**

- 🔄 **Data encryption at rest** — keep as a security task; not a user-facing milestone.
- ⏳ **GDPR/privacy tooling** — only the minimum (export/delete) if pursued; low priority.

---

### Risks & dependencies

- Firestore composite indexes for any new sorted/filtered queries (e.g. item usage frequency).
- PDF currency formatting must match UI exactly (single source of truth: `formatCurrency`).
- Status-model migration must not break existing documents with legacy statuses.
- Design overhaul touches every page — sequence after tokens are locked to avoid rework.
