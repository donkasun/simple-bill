# Dashboard & Documents Redesign

**Date:** 2026-05-28  
**Status:** Approved  
**Scope:** Redesign Dashboard page + add new `/documents` page + update sidebar nav

---

## Problem

The current Dashboard serves double duty: it is both the home screen and the only document list. This does not scale — once there are 50+ documents the page becomes unwieldy. It also buries the most common action (start a new invoice for a repeat customer) behind too many steps.

---

## Goals

1. Make starting a new invoice/quotation for a recent customer a single tap from the home screen.
2. Give users a dedicated page to find and manage all their documents.
3. Keep the dashboard light and focused on action, not history.

---

## Architecture

Two page changes + one nav change. No new data sources — both pages use the existing `useFirestore` hook on the `documents` and `customers` collections, and the existing `itemUsage`-style recency pattern applied to customers.

### New file: `src/utils/customerUsage.ts`

Tracks which customers were most recently billed. Mirrors the shape of `src/utils/itemUsage.ts`:

- `loadCustomerUsage(userId)` — reads from `localStorage` key `simplebill:customerUsage:<uid>`, returns `Record<customerId, unixTimestampMs>`
- `recordCustomerBilled(userId, customerId)` — writes `Date.now()` for that customer ID, returns the updated map
- `recentCustomerIds(usage, max)` — returns the top `max` customer IDs sorted by timestamp desc (most recently billed first)

Called from `DocumentCreation.tsx` and `DocumentEdit.tsx` when a document is saved or finalized, passing the `customerId` that was used.

### Modified: `src/pages/dashboard/Dashboard.tsx`

Replaces the current full document list with:

1. **Quick actions grid (2×2)**
   - Slots 1–2: the 2 most-recently-billed customers (derived from `customerUsage`). Each card shows the customer's avatar initial, name, "Last billed X ago" subtitle, and an "⚡ New invoice" CTA. Tapping navigates to `/documents/new` with `location.state: { customerId }` so the form pre-selects that customer.
   - Slot 3: "New invoice" — navigates to `/documents/new` with no pre-selection (existing sidebar CTA behaviour).
   - Slot 4: "New quotation" — navigates to `/documents/new` with `location.state: { documentType: 'quotation' }`.
   - If fewer than 2 customers have been billed, the remaining slots are filled with the generic New invoice / New quotation cards.

2. **Recent documents (last 5)**
   - Same card + actions UI as today's dashboard.
   - `useFirestore` loads all documents (sorted `createdAt` desc); Dashboard slices the first 5 in the component — no hook changes needed.
   - "View all →" link navigates to `/documents`.

3. **Removed:** the bento tips section (`dashboard-bento`).

### New file: `src/pages/Documents.tsx`

Full document list page at `/documents`.

- **Page header:** title "Documents", doc count subtitle, "+ New invoice" action button.
- **Filter chips:** two groups separated visually.
  - Left: All · Invoices · Quotations (type filter)
  - Right: Draft · Sent · Paid (status filter)
  - Filters combine: selecting "Invoices" + "Draft" shows only draft invoices. "All" clears the type filter. No status chip selected = show all statuses.
- **Document list:** same `doc-card` + `doc-card-actions` markup and behaviour as today's Dashboard. All per-card actions (Continue editing, Duplicate, Delete, Mark as paid, Download PDF, Mark as unpaid) are identical.
- **Data:** `useFirestore` on `documents`, `orderByField: 'createdAt'`, no limit — loads all documents. Client-side filtering by the active chips.
- **Empty state:** shown when filters produce zero results ("No documents match your filters").

### Modified: `src/components/layout/AppShell.tsx`

Add a "Documents" nav link between Home and Customers:

```
Home          (icon: home)
Documents     (icon: receipt_long)   ← new
Customers     (icon: group)
Products & services  (icon: inventory_2)
Settings      (icon: settings)
```

### Modified: `src/App.tsx`

Add route:

```tsx
<Route path="documents">
  <Route index element={<Documents />} /> // ← new
  <Route path="new" element={<DocumentCreation />} />
  <Route path=":id/edit" element={<DocumentEdit />} />
</Route>
```

### Modified: `src/pages/DocumentCreation.tsx`

Read `location.state` on mount:

- If `state.customerId` is present, pre-select that customer in the form.
- If `state.documentType` is present (`'quotation'`), default the document type toggle to Quotation.
- After a document is saved/finalized, call `recordCustomerBilled(userId, customerId)`.

### Modified: `src/pages/DocumentEdit.tsx`

After a document is saved or finalized, call `recordCustomerBilled(userId, customerId)` so the dashboard quick actions stay fresh.

---

## Data Flow

```
customerUsage (localStorage)
    ↑ written by DocumentCreation + DocumentEdit on save/finalize
    ↓ read by Dashboard to pick quick-action customer slots

Firestore documents collection
    ↓ read by Dashboard (limit 5, createdAt desc)
    ↓ read by Documents page (all, createdAt desc, client-filtered)
```

---

## Error Handling

- If `customerUsage` is empty or has fewer than 2 entries, the quick-action grid fills remaining slots with the generic New Invoice / New Quotation cards. The grid always shows exactly 4 slots.
- Filter chips that would produce zero results are not disabled — the empty state message explains there are no matches.
- Loading and error states on the Documents page mirror the Dashboard pattern (spinner, `ErrorBanner`).

---

## What Is Not Changing

- Document card markup and per-card actions are unchanged.
- `useFirestore` hook is unchanged.
- All existing routes remain valid — `/documents/new` and `/documents/:id/edit` are unaffected.
- No Firestore schema changes.

---

## Out of Scope

- Search / text filtering on the Documents page.
- Sorting options (date, amount, customer name).
- Pagination or infinite scroll.
- KPI / stats numbers on the Dashboard.
- Bulk actions on the Documents page.
