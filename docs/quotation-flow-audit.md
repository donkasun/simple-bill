# Quotation creation flow — audit & remediation plan

_Audited: 2026-06-01_

## Scope

`New quotation` → `DocumentCreation` → `useDocumentPage({ mode: "create" })` →
`DocumentEditorForm`, plus document-number allocation, validation, payload build,
and the quotation→invoice generation path.

Quotations and invoices share one code path, differentiated only by
`state.documentType` and the `INV`/`QUO` prefix. Fixes below therefore affect
invoices too.

## Findings

| #   | Severity | Summary                                                                                        | Primary location(s)                                           |
| --- | -------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| 1   | High     | Manual doc numbers bypass the counter and have no uniqueness check                             | `useDocumentPage.ts:387` (`resolveDocNumber`), `docNumber.ts` |
| 2   | High     | Finalize persists the document _before_ PDF generation; PDF failure + retry duplicates the doc | `useDocumentPage.ts:486–546` (`finalizeAndDownload`)          |
| 3   | Medium   | Profile currency clobbers a user's manual currency on late async load                          | `useDocumentPage.ts:245`                                      |
| 4   | Medium   | `generateInvoice` writes stale `id`/`createdAt` back into the quotation                        | `useDocumentPage.ts:678`                                      |
| 5   | Medium   | `getInvoiceGenerationStatus` reports a misleading remaining amount                             | `documents.ts:139–179`                                        |
| 6   | Low      | `validateFinalize` does not reject an empty line-items array                                   | `documentValidation.ts:34`                                    |
| 7   | Low      | `locationState.documentType` effect runs once with eslint-disabled empty deps                  | `useDocumentPage.ts:230–238`                                  |
| 8   | Low      | No test coverage for the riskiest paths (allocation, collisions, PDF failure)                  | `tests/utils/docNumber.test.ts`                               |

### What's already solid (do not regress)

- Counter allocation is correctly transactional (`docNumber.ts:21`) — concurrent _auto_ allocations won't collide.
- Firestore rules enforce per-user ownership on `documents` and `docCounters`.
- Customer details are snapshotted into the document at save (`selectCustomerDetails`), so later customer edits don't mutate historical quotations.
- Save/finalize buttons are disabled during in-flight operations, preventing simple double-clicks.

---

## Remediation plan

Each fix ships with the test that pins it (write the failing test first). Phases
are ordered by customer-facing risk. Within a phase, tasks marked **‖ parallel**
are independent and can be split across people/agents; tasks marked **→ serialize**
touch the same function and should land in sequence to avoid conflicts.

### Phase 1 — Customer-facing data correctness (do first)

Both findings produce wrong customer-facing identity/data. Both touch
`useDocumentPage.ts`, but **different functions**, so they can be developed in
parallel branches; merge #2 then rebase #1 (or vice versa) since they share the file.

- **[#2] Generate the PDF before persisting on the create→finalize path. ‖ parallel**
  - The PDF is pure given form state, so produce the bytes first, then `addDocument` once.
  - Capture the created id so a retry uses `setDocument` instead of a second `addDocument` (idempotent retry).
  - Test: finalize where `generateDocumentPdf` rejects → assert exactly one `addDocument` call across an initial attempt + retry.

- **[#1] Enforce document-number uniqueness. ‖ parallel**
  - On save/finalize, query `documents` for `userId + docNumber`; reject duplicates with a field-level error on Document #.
  - For manually entered numbers matching `^(INV|QUO)-\d{4}-\d{3}$`, seed/advance the `docCounters` seq so a later auto-allocation can't re-emit the same number.
  - Consider whether a Firestore rule / composite constraint is warranted (server-side guard), tracked as a follow-up.
  - Tests: manual duplicate rejected; manual number advances counter; auto-allocation after a manual number does not collide.

**Phase 1 exit criteria:** no path produces two documents with the same number;
a failed finalize never leaves an orphaned duplicate.

### Phase 2 — Data hygiene & correctness (fully parallel)

All three touch distinct functions/files — no ordering constraints.

- **[#3] Stop profile currency from overwriting a user's selection. ‖ parallel**
  - Apply profile currency only on first initialization (ref guard) or only while the user hasn't touched the field.
  - Test: user sets EUR, profile resolves late with USD → currency stays EUR.

- **[#4] `generateInvoice` should write only changed fields. ‖ parallel**
  - Replace `setDocument(id, { ...currentDoc, relatedInvoices })` with `setDocument(id, { relatedInvoices: updated })`.
  - Test: after generating an invoice, the quotation doc body has no `id` field and keeps its original `createdAt`.

- **[#5] Fix or remove `getInvoiceGenerationStatus` remaining-amount math. ‖ parallel**
  - Wire in `calculateRemainingQuantities` (the correct logic) or compute remaining from related-invoice amounts; `totalInvoiced` must be an amount, not a count.
  - If the function is unused in the UI, delete it rather than ship misleading numbers.
  - Test: partial-invoice scenario reports correct remaining amount.

### Phase 3 — Validation hardening & coverage backfill (parallel)

- **[#6] Reject empty line-items in `validateFinalize`. ‖ parallel**
  - Add an explicit "at least one line item" guard at the validation layer (UI already mitigates, but validation is the contract).
  - Test: finalize with zero items returns an error.

- **[#7] Make the `documentType` preselect robust. ‖ parallel**
  - Drive it from the same effect/deps as `customerId` preselect rather than an eslint-disabled `[]` effect, so async navigation state still applies.
  - Test: navigation state with `documentType: "quotation"` applied even when state arrives after first render.

- **[#8] Backfill tests for `allocateNextDocumentNumber`. ‖ parallel**
  - Transaction increments seq; first-time (non-existent counter) initialization; concurrent allocations don't duplicate.
  - Note: Phase 1/2/3 each carry their own tests; this task covers the allocator unit specifically.

---

## Suggested execution

- **Round 1 (parallel):** #2 and #1 on separate branches (coordinate the shared file at merge).
- **Round 2 (parallel):** #3, #4, #5 — independent, can be three concurrent branches.
- **Round 3 (parallel):** #6, #7, #8 — independent.

Phases are gated: don't start Round 2 until Phase 1 exit criteria are met, since
#1/#2 are the only findings that corrupt customer-facing data.
