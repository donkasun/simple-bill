# Milestone 4 — Jules (Gemini Flash 3) assessment

Source: Claude Code session review of **M4 — Repetition speed pack** (`docs/project_plan.md`).

M4 has four sub-features with very different complexity profiles.

---

## Safe to Jules — Duplicate document

Clone an existing doc, reset `docNumber` to next available, reset `date` to today, set `status: "draft"`, save to Firestore, navigate to the edit page.

- Follows a clear, established pattern (`useFirestore.add` + `allocateNextDocumentNumber`)
- Touches ~2 files: `src/pages/dashboard/Dashboard.tsx` (add "Duplicate" action), existing `useFirestore` hook (already has `add`)
- Deterministic — no UX ambiguity, no new components needed
- Jules can handle this reliably if given a tight spec (see below)

---

## Risky to Jules — Copy from previous

"New invoice, prefill from a previous doc" — needs a picker UI (which doc?) before creation.

- Needs a design decision: modal picker? dropdown on "New invoice"?
- Jules tends to invent its own UX pattern here, often inconsistent with existing style
- Medium risk without a detailed mockup spec

**Recommendation:** Implement here (Cursor) with an agreed UX spec.

---

## Don't Jules — Auto-suggest customers

Typed search on the customer field in `DocumentEdit`.

- Current customer picker is a plain `<select>` — autocomplete needs a custom combobox (not a native control)
- Building a new accessible combobox from scratch is where Gemini Flash 3 often goes off-rails (ignores design system or breaks a11y)
- Architecture-level work

**Recommendation:** Implement here; do not delegate to Jules.

---

## Don't Jules — Remember frequent items

Suggest line items from the catalog when adding rows in `LineItemsTable.tsx`.

- `LineItemsTable.tsx` has a complex prop interface and is tightly coupled to `DocumentEdit.tsx` state
- Item suggestions require understanding `itemCatalog` prop flow, `FormLineItem` type, and `computeAmount` — high risk of breaking existing table logic

**Recommendation:** Implement here; do not delegate to Jules.

---

## Overall recommendation

Give Jules **only** the "Duplicate document" sub-feature as an isolated task. Do the rest in Cursor to keep consistency with the design system and `useFirestore` patterns.

---

## Jules task spec — Duplicate document

**Authoritative handoff for Jules:** copy or attach [`docs/jules/HANDOFF-duplicate-document.md`](./jules/HANDOFF-duplicate-document.md) (kept in sync with the checklist below).

**Goal:** One-click duplicate from the dashboard document list.

### Behavior

1. User clicks **Duplicate** on a document row (any status).
2. App creates a **new** Firestore document that is a copy of the source **except**:
   - **New** `id` (via `add`, not `update`)
   - **`docNumber`**: next number for that `type` and today's year — `allocateNextDocumentNumber(userId, doc.type, todayIsoDate)`
   - **`date`**: today (`yyyy-mm-dd`, local or same convention as `DocumentCreation`)
   - **`status`**: `"draft"`
   - **Omit / clear**: `finalizedAt`, relationship fields if duplicating should not inherit links (`sourceDocumentId`, `sourceDocumentType`, `relatedInvoices`, `originalQuantity`, `invoicedQuantity`, `remainingQuantity`) — duplicate is a fresh doc, not a linked copy
   - **Keep**: `type`, `customerId`, `customerDetails`, `items`, `subtotal`, `total`, `notes`, `currency`
3. On success, `navigate(\`/documents/${newId}/edit\`)`.
4. On failure, show error via existing `ErrorBanner` / pattern used on Dashboard (e.g. mark paid).

### Files

| File                                | Change                                               |
| ----------------------------------- | ---------------------------------------------------- |
| `src/pages/dashboard/Dashboard.tsx` | Add Duplicate button per row; `handleDuplicate(doc)` |
| `src/utils/docNumber.ts`            | Use as-is — `allocateNextDocumentNumber`             |
| `src/hooks/useFirestore.ts`         | Use as-is — `add`                                    |

Optional: extract `buildDuplicatePayload(source, userId, newDocNumber, today)` to `src/utils/documents.ts` if it keeps Dashboard thin.

### Do not

- Add new npm dependencies
- Change `LineItemsTable`, customer picker, or `DocumentCreation` flow
- Invent a new modal or design system — match existing dashboard action buttons (e.g. View, Download, Delete)
- Use `signInWithPopup` or auth changes

### Acceptance

- [ ] Duplicate appears on each document row in the dashboard table
- [ ] New doc has new `docNumber`, today's `date`, `status: "draft"`
- [ ] User lands on edit page for the new doc
- [ ] Source document unchanged
- [ ] `npm run build` passes

### Test manually

1. Duplicate a finalized invoice → opens edit as draft with new number
2. Duplicate a quotation → same
3. Edit and save duplicate — source doc unaffected
