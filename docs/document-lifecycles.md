# Document lifecycles

_simple-bill — reference for developers and testers_

---

## Statuses

Every document has one of four statuses.

```
draft ──► ready ──► sent ──► paid
  ▲         ▲                  │
  │         │                  │
  └─────────┘  (Edit reverts   │
  (Edit from   view → edit)    │
   view mode)                  │
                               │
               sent ◄──────────┘  (mark unpaid reverses paid → sent)
```

| Status  | Editable | PDF downloaded | Can mark paid |
| ------- | -------- | -------------- | ------------- |
| `draft` | Yes      | No             | No            |
| `ready` | Yes      | Yes            | No            |
| `sent`  | No       | Yes            | Yes           |
| `paid`  | No       | Yes            | —             |

**Transition rules:**

- `draft` → `ready`: user clicks **Download PDF** (PDF is generated and saved locally; document is locked for delivery but still editable).
- `ready` → `sent`: user clicks **Mark as sent** (confirms the document reached the customer; document becomes read-only).
- `sent` → `paid`: user clicks **Mark as paid** from the document list.
- `paid` → `sent`: user clicks **Mark as unpaid** (reversal; PDF unchanged).
- `ready` → `draft`: implicit — user clicks **Edit document** on a ready document (no explicit revert needed; editing is already allowed).

---

## 1. New invoice

**Entry point:** Dashboard → _New invoice_ quick action, or Documents → _New document_ → type toggle stays on Invoice.

**Route:** `/documents/new` (no location state, or `state: { documentType: "invoice" }` — default anyway).

**Flow:**

1. Form opens with `documentType = "invoice"`, today's date, and currency from user profile. No customer is pre-selected (unless one was passed in location state via a quick-action card).
2. User fills in line items and optionally types a document number (left blank = auto-allocate on save).
3. **Save draft** → validates required fields, allocates `INV-YYYY-NNN` if blank, writes `status: "draft"` to Firestore, navigates to `/documents/{id}/edit` (stays in edit mode).
4. **Download PDF** → validates all fields (customer + line items required), generates PDF bytes first, writes `status: "ready"` + `sentAt` to Firestore, downloads the PDF, navigates to `/documents/{id}/edit` with `autoEdit: true`.

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

**Entry point:** Open a **sent** quotation (`/documents/:id/edit`) → _Generate invoice_ button (visible only when `documentType === "quotation"` and `documentStatus === "sent"`).

**Precondition:** The quotation must be `sent`. Draft and ready quotations only show the _Edit document_ button, not _Generate invoice_.

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

**What happens next:** The generated invoice is a normal draft invoice. The user edits it, then saves or downloads it independently. The quotation is not modified further.

---

## 5. Edit an existing draft or ready invoice / quotation

**Entry point:** Documents list or Dashboard → click a draft or ready card → opens `/documents/:id/edit`.

**Conditions for `canEdit`:**

- `documentStatus === "draft"` or `documentStatus === "ready"`, **and** `isEditMode === true`.
- `isEditMode` starts `true` for drafts opened normally, or when navigated with `state: { autoEdit: true }` (e.g. after _Download PDF_ or _Generate invoice_).
- For a draft or ready document viewed in read-only mode, the _Edit document_ button sets `isEditMode = true`.

**Available actions (edit mode):**

| Button           | What it does                                                                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Save changes** | Validates, writes updated payload with the existing status (`draft` or `ready`) to Firestore via `setDocument`. Does not navigate away.          |
| **Download PDF** | Validates, generates PDF first, then updates the doc to `status: "ready"` + `sentAt`. Downloads PDF. Navigates to `/documents/{id}/edit` (view). |

**What you cannot change after saving changes:**

- Document type (Invoice ↔ Quotation) — toggle is disabled once a doc exists, enforced by `canEdit` on the form.

---

## 6. View a ready document

**Entry point:** Any card for a `ready` document, or after clicking **Download PDF** from edit mode.

**`canEdit` is `false`** (unless the user clicks _Edit document_). The form renders in read-only mode.

**Available actions:**

| Button            | What it does                                                                |
| ----------------- | --------------------------------------------------------------------------- |
| **Edit document** | Sets `isEditMode = true` — returns to edit mode (status stays `ready`).     |
| **Mark as sent**  | Calls `update(id, { status: "sent" })`. Document becomes read-only.         |
| **Download PDF**  | Re-generates PDF from stored document data and triggers a browser download. |

No warning banner is shown — the document is still editable.

---

## 7. View a sent invoice or quotation (read-only)

**Entry point:** Any card for a `sent` or `paid` document.

**`canEdit` is `false`.** The form renders in read-only mode (all inputs disabled).

**Available actions:**

| Document type    | Available buttons                      |
| ---------------- | -------------------------------------- |
| Invoice (sent)   | **Download PDF**                       |
| Invoice (paid)   | **Download PDF**                       |
| Quotation (sent) | **Download PDF**, **Generate invoice** |

A warning banner reads: _"This document has been sent and cannot be edited."_ For quotations it adds: _"You can generate invoices from this sent quotation."_

---

## 8. Mark invoice as paid

**Entry point:** Documents list or Dashboard → overflow menu (`⋯`) on a `sent` invoice → _Mark as paid_.

**Flow:** Confirmation dialog → `update(id, { status: "paid", paidAt: new Date() })`. Toast: _"Marked as paid"_.

**Firestore writes:** Partial update on `documents/{id}`: `status`, `paidAt`, `updatedAt`.

---

## 9. Mark invoice as unpaid (reverse)

**Entry point:** Overflow menu on a `paid` invoice → _Mark as unpaid_.

**Flow:** Confirmation dialog → `update(id, { status: "sent", paidAt: null })`. Toast: _"Marked as unpaid"_.

**Result:** Document returns to `sent` status. The PDF is unchanged.

---

## 10. Duplicate a document

**Entry point:** Overflow menu on any document (any status) → _Duplicate_.

**Flow:**

1. Allocates a new `INV-YYYY-NNN` or `QUO-YYYY-NNN` number for today's date.
2. Copies all fields from the source via `buildDuplicatePayload`:
   - Resets `status` to `"draft"`.
   - Sets `date` to today.
   - Clears all relationship fields: `sourceDocumentId`, `sourceDocumentType`, `relatedInvoices`, `originalQuantity`, `invoicedQuantity`, `remainingQuantity`.
   - Clears `sentAt` and `paidAt`.
3. Writes the new document to Firestore.
4. Navigates to `/documents/{newId}/edit` with `autoEdit: true`.

**The duplicate is always a fresh draft with no link to its source.**

---

## 11. Delete a document

**Entry point:** Overflow menu on any document → _Delete_.

**Flow:** Confirmation dialog → `deleteDoc`. Toast: _"Document deleted"_. Any status can be deleted.

**Firestore writes:** Hard delete of `documents/{id}`. No other documents are updated (e.g. a quotation's `relatedInvoices` is not cleaned up).

---

## 12. Copy from previous (create screen only)

**Entry point:** `/documents/new` → _Copy from previous_ button.

**Flow:** Queries the user's most recent document (by `createdAt desc`), copies `documentType`, `customerId`, `notes`, and all line items into the current form. Resets `documentNumber` to blank and `date` to today. Does not save anything — it is a form prefill only.

---

## Relationship summary

```
Quotation (sent)
    │
    │  Generate invoice (flow 4)
    ▼
Invoice (draft)  ──►  Invoice (ready)  ──►  Invoice (sent)  ──►  Invoice (paid)
    │                                              │
    │  relatedInvoices[]                           │  paidAt / status
    └──────────────────────────────────────────────►  Stored on the quotation only
```

A quotation can generate multiple invoices (one per _Generate invoice_ click). Each generated invoice stores `sourceDocumentId` pointing back to the quotation. The quotation stores `relatedInvoices[]` as the forward reference. Neither document is otherwise aware of the other's status.
