# Quotation flow fixes — what changed & where to test

_Branch: `fix/quotation-flow-audit` · PR: #39 · Date: 2026-06-02_

---

## What changed

### 1. Finalize saves the document only after PDF succeeds

**File:** `src/hooks/pages/useDocumentPage.ts` — `finalizeAndDownload`

Previously the document was written to Firestore first and the PDF was generated afterwards. If the PDF step threw, a finalized document was left behind with no PDF, and retrying created a second document with a new number.

Now the PDF bytes are produced first (pure, no side-effects), then the document is persisted once. If you retry after a failure the hook reuses the same document id and the same allocated number.

---

### 2. Duplicate document numbers are now rejected

**Files:**

- `src/utils/docNumber.ts` — new `isDocNumberTaken`, `reconcileDocCounter`, `DuplicateDocNumberError`
- `src/hooks/pages/useDocumentPage.ts` — `resolveDocNumber`, all three save/finalize catch blocks
- `src/components/documents/DocumentEditorForm.tsx` — Document # field now shows the error inline

If you type a document number that already exists, saving or finalizing now surfaces a field error on **Document #** and a banner instead of silently creating a duplicate.

If the number you type matches the `QUO-YYYY-NNN` / `INV-YYYY-NNN` format, the auto-number counter is also advanced so a later auto-allocation can't re-emit it.

---

### 3. Selecting a currency no longer gets overwritten by the profile

**File:** `src/hooks/pages/useDocumentPage.ts` — currency effect + `setCurrencyExplicit`

If you change the currency dropdown and the user profile resolves afterwards with a different default, your choice now sticks. The profile default only applies if you haven't touched the field yet.

---

### 4. Generating an invoice from a quotation no longer pollutes Firestore

**File:** `src/hooks/pages/useDocumentPage.ts` — `generateInvoice`

When an invoice is generated from a finalized quotation, the hook used to spread the entire fetched quotation document back into the update — writing a stale `id` and `createdAt` into the document body. Now only the `relatedInvoices` array is written.

---

### 5. Misleading invoice-generation status functions removed

**File:** `src/utils/documents.ts`

`getInvoiceGenerationStatus` and `calculateRemainingQuantities` were dead code (never called from the UI) and `getInvoiceGenerationStatus` reported a count of invoices as the "remaining amount" instead of an actual monetary value. Both are deleted.

---

### 6. Finalizing with no line items is now blocked at the validation layer

**File:** `src/utils/documentValidation.ts` — `validateFinalize`

Previously the UI blocked this via the remove-button guard, but the validation function itself would pass an empty items array. An explicit check is now in place.

---

## Where to test manually

### Critical paths (test these first)

| Scenario                              | Steps                                                                                                                                                            | Expected                                                                                                          |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Duplicate number rejected**         | Create a quotation, note its number. Create a second and manually type the same number → Save draft or Finalize.                                                 | Field error on **Document #**: "This number is already used…". No document created.                               |
| **PDF failure does not duplicate**    | Hard to trigger in prod — covered by automated tests. On a slow connection you can simulate by throttling DevTools network to "Offline" after clicking Finalize. | Error banner shown. No document in the list. Retry produces exactly one document.                                 |
| **Currency stays after profile load** | Open a new document. Change currency to **LKR**. Wait a few seconds for profile to finish loading.                                                               | Currency stays **LKR**, not reset to your profile default.                                                        |
| **Generate invoice from quotation**   | Open a finalized quotation → Generate invoice. Open Firestore → find the quotation document.                                                                     | `relatedInvoices` array contains the new invoice id. No `id` field present at the top level of the document body. |

### Secondary paths

| Scenario                           | Steps                                                                                                                | Expected                                                                               |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Auto-number after manual entry** | Type `QUO-2026-050` as the document number and save. Create another quotation and leave Document # blank → Finalize. | New document gets `QUO-2026-051` (not `QUO-2026-001` or any number ≤ 050).             |
| **Normal create → save draft**     | Create a quotation, leave Document # blank, save draft.                                                              | Navigates to dashboard. Document appears with an auto-allocated `QUO-YYYY-NNN` number. |
| **Normal create → finalize**       | Create a quotation with a customer and at least one named line item, click Finalize & download PDF.                  | PDF downloads. Document appears in list as Finalized.                                  |
| **Edit mode saves changes**        | Open a draft quotation, change the notes, click Save changes.                                                        | Changes persist. No new document created.                                              |
