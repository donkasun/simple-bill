# Jules handoff — Duplicate document

**Repository:** SimpleBill — React + TypeScript + Vite + Firebase (Firestore).  
**Scope:** Implement **only** this feature. Do not touch M4 items “Copy from previous”, customer autocomplete, or line-item suggestions.

---

## Goal

From the **dashboard** document table, add a **Duplicate** action that creates a **new** document (new Firestore id), then navigates to its edit page.

---

## Behavior

1. User clicks **Duplicate** on a row (any document status).
2. Build payload from the **source** `DocumentEntity` (`src/types/document.ts`):
   - **Set** `docNumber` → `await allocateNextDocumentNumber(userId, source.type, today)` from `src/utils/docNumber.ts`
   - **Set** `date` → `todayIso()` from `src/utils/date.ts` (same as `useDocumentForm` / `DocumentEdit`)
   - **Set** `status` → `"draft"`
   - **Omit** (do not copy onto the new doc): `finalizedAt`, `sourceDocumentId`, `sourceDocumentType`, `relatedInvoices`, `originalQuantity`, `invoicedQuantity`, `remainingQuantity`
   - **Copy** as-is: `type`, `customerId`, `customerDetails`, `items`, `subtotal`, `total`, `notes`, `currency`
   - **Set** `userId` to the signed-in user (same as other writes)
3. Persist with **`add`** from `useFirestore` on collection `"documents"` (same hook as dashboard list). Do **not** `update` the source row.
4. On success: `navigate(\`/documents/${newId}/edit\`)`(same pattern as existing “View” / edit navigation in`src/pages/dashboard/Dashboard.tsx`).
5. On failure: surface error like other dashboard mutations (e.g. mark paid / delete) — reuse `ErrorBanner` or the same local error state pattern already on that page.

---

## Primary file

| File                                | Work                                                                                                                            |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `src/pages/dashboard/Dashboard.tsx` | Wire `add` from `useFirestore`, add Duplicate control per row, implement `handleDuplicate` with loading/disable state if needed |

Optional: small helper in `src/utils/documents.ts` to build the duplicate payload (keeps the dashboard component readable).

---

## Imports Jules will need (examples)

- `allocateNextDocumentNumber` from `@utils/docNumber`
- `todayIso` from `@utils/date`
- `DocumentEntity` from `../../types/document` (or match existing relative imports in `Dashboard.tsx`)

Path aliases: `@utils/*`, `@hooks/*`, `@components/*` — see `tsconfig.app.json`.

---

## Constraints (do not)

- No new npm packages.
- Do not change `LineItemsTable`, `DocumentCreation`, `DocumentEdit`, customer `<select>`, or auth.
- Do not add a new modal for this task — match existing row actions (buttons / links style already in the dashboard table).
- Do not implement “Copy from previous” or any picker UI.

---

## Verification

- [ ] `npm run build` succeeds
- [ ] Duplicate finalized invoice → new draft, new number, today’s date, edit page opens; **original** doc unchanged
- [ ] Duplicate quotation → same
- [ ] New doc has no `finalizedAt` and no relationship fields listed above

---

## Reference (read-only)

- `docs/m4-jules-assessment.md` — broader M4 risk notes; this file is the **authoritative** spec for Duplicate.

When opening a Jules task, paste this file’s body (from “## Goal” through “## Verification”) or attach this file and point Jules at branch `main` (or your agreed integration branch) and `src/pages/dashboard/Dashboard.tsx`.
