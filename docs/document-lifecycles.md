# Document lifecycles

_simple-bill — reference for developers and testers_

---

## Statuses

Every document has one of three statuses. Only forward transitions are
permitted (except unpaid, which reverses finalized→paid).

```
draft ──► finalized ──► paid
                 ▲        │
                 └────────┘  (mark unpaid reverses paid → finalized)
```

| Status      | Editable | PDF exists | Can mark paid |
| ----------- | -------- | ---------- | ------------- |
| `draft`     | Yes      | No         | No            |
| `finalized` | No       | Yes        | Yes           |
| `paid`      | No       | Yes        | —             |

---

## 1. New invoice

**Entry point:** Dashboard → _New invoice_ quick action, or Documents → _New document_ → type toggle stays on Invoice.

**Route:** `/documents/new` (no location state, or `state: { documentType: "invoice" }` — default anyway).

**Flow:**

1. Form opens with `documentType = "invoice"`, today's date, currency from user profile, and the first customer pre-selected (or the customer passed in location state).
2. User fills in line items and optionally types a document number (left blank = auto-allocate on save).
3. **Save draft** → validates required fields, allocates `INV-YYYY-NNN` if blank, writes `status: "draft"` to Firestore, navigates to `/dashboard`.
4. **Finalize & download PDF** → validates all fields, generates PDF bytes first, writes `status: "finalized"` + `finalizedAt` to Firestore, downloads the PDF, navigates to `/dashboard`.

**Firestore writes:**

- `documents/{newId}` — full payload including snapshotted `customerDetails`.
- `docCounters/{userId}_invoice_{year}` — seq incremented (auto) or reconciled (manual number matching pattern).

---

## 2. New quotation

**Entry point:** Dashboard → _New quotation_ quick action, or Documents → _New document_ → click the `▾` dropdown → _New quotation_.

**Route:** `/documents/new` with `state: { documentType: "quotation" }`.

**Flow:** Identical to a new invoice except:

- `documentType` is pre-set to `"quotation"` from location state.
- Auto-allocated numbers use the `QUO-YYYY-NNN` prefix.
- The first-invoice onboarding guide does not show (it's gated to `hasDocs === false`).

**Firestore writes:** Same pattern as invoice but counter key is `{userId}_quotation_{year}`.

---

## 3. New quotation → invoice (new document, separate flow)

**Entry point:** Documents → _New document_ or Dashboard → _New invoice_ — user manually sets the type to Invoice (or leaves it) and builds the invoice from scratch. No link to any quotation.

This is the same as flow 1. The `sourceDocumentId` field is never set. There is no relationship between the two documents.

---

## 4. Existing quotation → generate invoice (linked flow)

**Entry point:** Open a **finalized** quotation (`/documents/:id/edit`) → _Generate invoice_ button (visible only when `documentType === "quotation"` and `canEdit === false`).

**Precondition:** The quotation must be `finalized`. Draft quotations only show the _Edit document_ button, not _Generate invoice_.

**Flow:**

1. `generateInvoice` allocates the next `INV-YYYY-NNN` number for today's date.
2. A new invoice document is written to Firestore with:
   - `status: "draft"`
   - `type: "invoice"`
   - All line items, customer, and currency copied from the quotation.
   - `sourceDocumentId` → the quotation's id.
   - `sourceDocumentType: "quotation"`.
3. The quotation is updated: `relatedInvoices` array gains the new invoice id (only this field is written — no other fields are touched).
4. Browser navigates to `/documents/{newInvoiceId}/edit` with `autoEdit: true`, opening the new invoice in edit mode immediately.

**Firestore writes:**

- `documents/{newInvoiceId}` — new invoice, status `draft`.
- `documents/{quotationId}` — partial update: `{ relatedInvoices: [..., newInvoiceId] }`.
- `docCounters/{userId}_invoice_{year}` — seq incremented.

**What happens next:** The generated invoice is a normal draft invoice. The user edits it, then saves or finalizes it independently. The quotation is not modified further.

---

## 5. Edit an existing draft invoice or quotation

**Entry point:** Documents list or Dashboard → click a draft card → opens `/documents/:id/edit`.

**Conditions for `canEdit`:**

- `documentStatus === "draft"` **and** `isEditMode === true`.
- `isEditMode` starts `true` for drafts opened normally, or when navigated with `state: { autoEdit: true }` (e.g. after _Generate invoice_).
- For a draft viewed in read-only mode, the _Edit document_ button sets `isEditMode = true`.

**Available actions (edit mode):**

| Button                    | What it does                                                                                                                                                   |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Save changes**          | Validates, writes updated payload with `status: "draft"` to the existing doc via `setDocument`. Does not navigate away.                                        |
| **Finish & download PDF** | Validates, generates PDF first, then updates the existing doc to `status: "finalized"` + `finalizedAt`. Downloads PDF. Does not navigate away (stays on view). |

**What you cannot change after saving changes:**

- Document type (Invoice ↔ Quotation) — toggle is disabled once a doc exists, enforced by `canEdit` on the form.

---

## 6. View a finalized invoice or quotation (read-only)

**Entry point:** Any card for a `finalized` or `paid` document.

**`canEdit` is `false`.** The form renders in read-only mode (all inputs disabled).

**Available actions:**

| Document type               | Available buttons                                         |
| --------------------------- | --------------------------------------------------------- |
| Invoice (finalized or paid) | — (no actions except Cancel / Download PDF from the list) |
| Quotation (finalized)       | **Generate invoice** (see flow 4)                         |

A warning banner reads: _"This document has been finalized and cannot be edited."_ For quotations it adds: _"You can generate invoices from this finalized quotation."_

---

## 7. Mark invoice as paid

**Entry point:** Documents list or Dashboard → overflow menu (`⋯`) on a `finalized` invoice → _Mark as paid_.

**Flow:** Confirmation dialog → `update(id, { status: "paid", paidAt: new Date() })`. Toast: _"Marked as paid"_.

**Firestore writes:** Partial update on `documents/{id}`: `status`, `paidAt`, `updatedAt`.

---

## 8. Mark invoice as unpaid (reverse)

**Entry point:** Overflow menu on a `paid` invoice → _Mark as unpaid_.

**Flow:** Confirmation dialog → `update(id, { status: "finalized", paidAt: null })`. Toast: _"Marked as unpaid"_.

**Result:** Document returns to `finalized` status. The PDF is unchanged.

---

## 9. Duplicate a document

**Entry point:** Overflow menu on any document (any status) → _Duplicate_.

**Flow:**

1. Allocates a new `INV-YYYY-NNN` or `QUO-YYYY-NNN` number for today's date.
2. Copies all fields from the source via `buildDuplicatePayload`:
   - Resets `status` to `"draft"`.
   - Sets `date` to today.
   - Clears all relationship fields: `sourceDocumentId`, `sourceDocumentType`, `relatedInvoices`, `originalQuantity`, `invoicedQuantity`, `remainingQuantity`.
   - Clears `finalizedAt` and `paidAt`.
3. Writes the new document to Firestore.
4. Navigates to `/documents/{newId}/edit` with `autoEdit: true`.

**The duplicate is always a fresh draft with no link to its source.**

---

## 10. Delete a document

**Entry point:** Overflow menu on any document → _Delete_.

**Flow:** Confirmation dialog → `deleteDoc`. Toast: _"Document deleted"_. Any status can be deleted.

**Firestore writes:** Hard delete of `documents/{id}`. No other documents are updated (e.g. a quotation's `relatedInvoices` is not cleaned up).

---

## 11. Copy from previous (create screen only)

**Entry point:** `/documents/new` → _Copy from previous_ button.

**Flow:** Queries the user's most recent document (by `createdAt desc`), copies `documentType`, `customerId`, `notes`, and all line items into the current form. Resets `documentNumber` to blank and `date` to today. Does not save anything — it is a form prefill only.

---

## Relationship summary

```
Quotation (finalized)
    │
    │  Generate invoice (flow 4)
    ▼
Invoice (draft)  ──►  Invoice (finalized)  ──►  Invoice (paid)
    │                        │
    │  relatedInvoices[]      │  paidAt / status
    └────────────────────────►  Stored on the quotation only
```

A quotation can generate multiple invoices (one per _Generate invoice_ click). Each generated invoice stores `sourceDocumentId` pointing back to the quotation. The quotation stores `relatedInvoices[]` as the forward reference. Neither document is otherwise aware of the other's status.
