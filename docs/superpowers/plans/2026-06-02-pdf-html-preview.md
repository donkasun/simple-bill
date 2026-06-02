# PDF HTML Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the direct pdf-lib download with an HTML preview modal — clicking "View PDF" opens a styled HTML render of the document in a full-screen overlay, where a "Download PDF" button triggers `window.print()` so the browser saves the page as a PDF.

**Architecture:** A pure `DocumentPreviewContent` component renders the invoice/quotation as styled HTML. `PdfPreviewModal` wraps it in a full-screen overlay with a close button and print-trigger download button. State for opening the preview lives in `useDocumentPage` (for creation/edit flows) and `useDocumentMutations` (for the documents-list flow), both of which expose `previewData`/`previewDoc` and a `closePreview` action. The pages render `<PdfPreviewModal>` wherever the "View PDF" button was.

**Tech Stack:** React, CSS custom properties (existing design tokens), `window.print()`, `@media print` CSS — no new dependencies. Removes `pdf-lib`.

---

## File Map

| Status | Path | Role |
|--------|------|------|
| **Create** | `src/components/documents/DocumentPreviewContent.tsx` | Pure HTML invoice/quotation render; also exports `PdfPreviewData` type |
| **Create** | `src/components/documents/PdfPreviewModal.tsx` | Full-screen modal wrapping preview + print trigger |
| **Modify** | `src/hooks/pages/useDocumentPage.ts` | Replace pdf-lib-based `downloadPdf`/`downloadDocument` with preview-open logic; add `previewData`/`closePreview` to VM |
| **Modify** | `src/hooks/pages/useDocumentMutations.ts` | Replace async `download` with synchronous `openPreview`; add `previewDoc`/`closePreview` |
| **Modify** | `src/hooks/pages/useDocumentsPage.ts` | Thread `previewDoc`/`closePreview` through VM type |
| **Modify** | `src/pages/DocumentEdit.tsx` | "View PDF" label, add `<PdfPreviewModal>` |
| **Modify** | `src/pages/DocumentCreation.tsx` | "View PDF" label, add `<PdfPreviewModal>` |
| **Modify** | `src/components/documents/DocumentCard.tsx` | Remove `downloadingId`, rename `onDownload→onPreview`, "View PDF" label |
| **Modify** | `src/pages/Documents.tsx` | Remove `downloadingId`, rename `onDownload→onPreview`, add `<PdfPreviewModal>` |
| **Delete** | `src/utils/pdf.ts` | No longer needed once all callers are replaced |
| **Delete** | `src/utils/download.ts` | No longer needed |

---

## Task 1: Create `DocumentPreviewContent`

**Files:**
- Create: `src/components/documents/DocumentPreviewContent.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/documents/DocumentPreviewContent.tsx
import React from "react";
import { formatCurrency } from "@utils/currency";

export type PdfPreviewData = {
  type: "invoice" | "quotation";
  docNumber: string;
  date: string;
  customerDetails?: { name?: string; email?: string; address?: string };
  items: Array<{
    name: string;
    description?: string;
    unitPrice: number;
    quantity: number;
    amount: number;
  }>;
  subtotal: number;
  total: number;
  currency: string;
  businessName?: string;
  businessEmail?: string;
  businessAddress?: string;
};

const DocumentPreviewContent = React.forwardRef<
  HTMLDivElement,
  { data: PdfPreviewData }
>(({ data }, ref) => {
  const title =
    data.type === "invoice" ? "Invoice" : "Quotation";

  return (
    <div ref={ref} className="doc-preview-printable">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .doc-preview-printable,
          .doc-preview-printable * { visibility: visible; }
          .doc-preview-printable {
            position: fixed;
            top: 0; left: 0;
            width: 100%;
            background: #fff;
            color: #000;
          }
        }
      `}</style>

      <div className="doc-preview__inner">
        {/* Header row */}
        <div className="doc-preview__header">
          <div>
            <h1 className="doc-preview__title">{title}</h1>
            {data.docNumber && (
              <p className="doc-preview__number">#{data.docNumber}</p>
            )}
            <p className="doc-preview__date">Date: {data.date}</p>
          </div>
          {(data.businessName || data.businessEmail || data.businessAddress) && (
            <div className="doc-preview__from">
              {data.businessName && <strong>{data.businessName}</strong>}
              {data.businessEmail && <p>{data.businessEmail}</p>}
              {data.businessAddress &&
                data.businessAddress.split(/\r?\n/).map((line, i) =>
                  line.trim() ? <p key={i}>{line}</p> : null,
                )}
            </div>
          )}
        </div>

        {/* Bill To */}
        {data.customerDetails && (
          <div className="doc-preview__bill-to">
            <p className="doc-preview__section-label">Bill To</p>
            {data.customerDetails.name && (
              <p className="doc-preview__customer-name">
                {data.customerDetails.name}
              </p>
            )}
            {data.customerDetails.email && (
              <p>{data.customerDetails.email}</p>
            )}
            {data.customerDetails.address &&
              data.customerDetails.address.split(/\r?\n/).map((line, i) =>
                line.trim() ? <p key={i}>{line}</p> : null,
              )}
          </div>
        )}

        {/* Line items */}
        <table className="doc-preview__table">
          <thead>
            <tr>
              <th className="doc-preview__col-item">Item</th>
              <th className="doc-preview__col-num">Unit Price</th>
              <th className="doc-preview__col-num">Qty</th>
              <th className="doc-preview__col-num">Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, i) => (
              <tr key={i}>
                <td>
                  <span className="doc-preview__item-name">{item.name || "—"}</span>
                  {item.description && (
                    <span className="doc-preview__item-desc">
                      {item.description}
                    </span>
                  )}
                </td>
                <td className="doc-preview__col-num">
                  {formatCurrency(item.unitPrice, data.currency)}
                </td>
                <td className="doc-preview__col-num">{item.quantity}</td>
                <td className="doc-preview__col-num">
                  {formatCurrency(item.amount, data.currency)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="doc-preview__subtotal-row">
              <td colSpan={3}>Subtotal</td>
              <td className="doc-preview__col-num">
                {formatCurrency(data.subtotal, data.currency)}
              </td>
            </tr>
            <tr className="doc-preview__total-row">
              <td colSpan={3}>
                <strong>Total</strong>
              </td>
              <td className="doc-preview__col-num">
                <strong>{formatCurrency(data.total, data.currency)}</strong>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
});

DocumentPreviewContent.displayName = "DocumentPreviewContent";
export default DocumentPreviewContent;
```

- [ ] **Step 2: Add styles to `src/index.css`**

Append the following block at the end of `src/index.css`:

```css
/* ── Document preview (HTML invoice render) ───────────────────────── */
.doc-preview-printable {
  background: #fff;
  color: #111;
  font-family: "Inter", "Helvetica Neue", Arial, sans-serif;
  font-size: 14px;
  line-height: 1.5;
}

.doc-preview__inner {
  max-width: 720px;
  margin: 0 auto;
  padding: 2.5rem 2rem;
}

.doc-preview__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 1.5rem;
}

.doc-preview__title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.25rem;
  color: #111;
}

.doc-preview__number {
  font-size: 1rem;
  color: #555;
  margin: 0 0 0.25rem;
}

.doc-preview__date {
  font-size: 0.875rem;
  color: #555;
  margin: 0;
}

.doc-preview__from {
  text-align: right;
  font-size: 0.875rem;
  color: #333;
}

.doc-preview__from strong {
  display: block;
  margin-bottom: 0.25rem;
  color: #111;
}

.doc-preview__from p {
  margin: 0;
  color: #555;
}

.doc-preview__bill-to {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 1rem 1.25rem;
  margin-bottom: 2rem;
}

.doc-preview__section-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #888;
  margin: 0 0 0.5rem;
}

.doc-preview__customer-name {
  font-weight: 600;
  font-size: 1rem;
  color: #111;
  margin: 0 0 0.25rem;
}

.doc-preview__bill-to p {
  margin: 0;
  color: #555;
  font-size: 0.875rem;
}

.doc-preview__table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1.5rem;
}

.doc-preview__table thead tr {
  border-bottom: 2px solid #222;
}

.doc-preview__table thead th {
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #888;
  text-align: left;
}

.doc-preview__col-num {
  text-align: right !important;
  white-space: nowrap;
}

.doc-preview__table tbody td {
  padding: 0.75rem 0.75rem;
  vertical-align: top;
  border-bottom: 1px solid #e5e5e5;
  color: #222;
}

.doc-preview__item-name {
  display: block;
  font-weight: 500;
}

.doc-preview__item-desc {
  display: block;
  font-size: 0.8125rem;
  color: #777;
  margin-top: 0.25rem;
}

.doc-preview__table tfoot td {
  padding: 0.5rem 0.75rem;
  color: #333;
}

.doc-preview__subtotal-row td {
  border-top: 1px solid #ddd;
  font-size: 0.875rem;
}

.doc-preview__total-row td {
  border-top: 2px solid #222;
  font-size: 1rem;
  padding-top: 0.75rem;
}
```

- [ ] **Step 3: Verify it compiles**

```bash
cd /Users/donkasungallage/Documents/projects/simple-bill && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors related to `DocumentPreviewContent`.

- [ ] **Step 4: Commit**

```bash
git add src/components/documents/DocumentPreviewContent.tsx src/index.css
git commit -m "feat(preview): add DocumentPreviewContent HTML invoice render"
```

---

## Task 2: Create `PdfPreviewModal`

**Files:**
- Create: `src/components/documents/PdfPreviewModal.tsx`

- [ ] **Step 1: Create the modal component**

```tsx
// src/components/documents/PdfPreviewModal.tsx
import React, { useEffect, useRef } from "react";
import Button from "@components/core/Button";
import DocumentPreviewContent from "./DocumentPreviewContent";
import type { PdfPreviewData } from "./DocumentPreviewContent";

export type { PdfPreviewData };

type PdfPreviewModalProps = {
  open: boolean;
  data: PdfPreviewData | null;
  onClose: () => void;
};

const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  open,
  data,
  onClose,
}) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      closeButtonRef.current?.focus();
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, onClose]);

  if (!open || !data) return null;

  const title = data.type === "invoice" ? "Invoice Preview" : "Quotation Preview";

  const handleDownload = () => {
    window.print();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1100,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--md-surface-container-low, #f5f5f5)",
        overflow: "hidden",
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.75rem 1.25rem",
          backgroundColor: "var(--md-surface)",
          borderBottom: "1px solid var(--md-outline-variant)",
          flexShrink: 0,
          gap: "1rem",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "1rem",
            fontWeight: 600,
            color: "var(--md-on-surface)",
          }}
        >
          {title}
        </h2>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <Button variant="secondary" ref={closeButtonRef} onClick={onClose}>
            Back
          </Button>
          <Button onClick={handleDownload}>Download PDF</Button>
        </div>
      </div>

      {/* Preview scroll area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "2rem 1rem",
        }}
      >
        {/* Shadow card around the preview page */}
        <div
          style={{
            maxWidth: 800,
            margin: "0 auto",
            boxShadow:
              "0 4px 24px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)",
            borderRadius: "4px",
            overflow: "hidden",
          }}
        >
          <DocumentPreviewContent ref={contentRef} data={data} />
        </div>
      </div>
    </div>
  );
};

export default PdfPreviewModal;
```

- [ ] **Step 2: Verify it compiles**

```bash
cd /Users/donkasungallage/Documents/projects/simple-bill && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/documents/PdfPreviewModal.tsx
git commit -m "feat(preview): add PdfPreviewModal full-screen overlay"
```

---

## Task 3: Update `useDocumentPage` — add preview state

**Files:**
- Modify: `src/hooks/pages/useDocumentPage.ts`

Context: This hook has two PDF actions. `downloadPdf` validates + finalizes + persists, then generates PDF and downloads. `downloadDocument` generates + downloads a PDF from the already-loaded state. Both need to set `previewData` instead.

- [ ] **Step 1: Add `PdfPreviewData` import and `previewData` state**

At the top of `useDocumentPage.ts`, add the import:

```ts
import type { PdfPreviewData } from "@components/documents/DocumentPreviewContent";
```

Remove these two imports (they will no longer be needed once all tasks are done):
```ts
import { downloadBlob } from "@utils/download";
```
(The pdf import is already dynamic inside the function body — remove those dynamic imports in the next steps.)

Add state inside `useDocumentPage` function body, after the existing state declarations:

```ts
const [previewData, setPreviewData] = useState<PdfPreviewData | null>(null);
const finalizedDocIdRef = useRef<string | null>(null);
```

- [ ] **Step 2: Replace `downloadPdf` callback body**

Find the `downloadPdf` useCallback (line ~556). Replace its body with:

```ts
const downloadPdf = useCallback(async () => {
  setFinalizeError(null);
  if (!user?.uid) return;
  setFinalizing(true);
  try {
    const validation = validateFinalize(state);
    if (applyValidationErrors(validation)) {
      setFinalizeError("Please resolve the errors before viewing.");
      focusFirstValidationError(state, validation);
      return;
    }
    const docNumber =
      finalizeDocNumberRef.current ?? (await resolveDocNumber());
    finalizeDocNumberRef.current = docNumber;
    const base = buildDocumentPayload(
      user.uid,
      state,
      "ready",
      docNumber,
      selectCustomerDetails(customers, state.customerId),
      { subtotal, total },
    );

    const payload: Partial<DocumentEntity> = {
      ...base,
      currency,
      sentAt:
        serverTimestamp() as unknown as import("firebase/firestore").Timestamp,
    };

    let savedId: string;
    if (isCreate) {
      if (finalizeCreatedIdRef.current) {
        await setDocument(finalizeCreatedIdRef.current, payload);
        savedId = finalizeCreatedIdRef.current;
      } else {
        savedId = await addDocument(
          payload as Omit<
            DocumentEntity,
            "id" | "createdAt" | "updatedAt"
          > & {
            sentAt: import("firebase/firestore").Timestamp;
          },
        );
        finalizeCreatedIdRef.current = savedId;
      }
    } else {
      savedId = documentId!;
      await setDocument(documentId!, payload);
      setDocumentStatus("ready");
      setIsEditMode(false);
    }

    if (state.customerId) {
      recordCustomerBilled(user.uid, state.customerId);
    }

    finalizedDocIdRef.current = savedId;
    finalizeCreatedIdRef.current = null;
    finalizeDocNumberRef.current = null;
    setPreviewData({
      type: base.type as DocumentEntity["type"],
      docNumber: base.docNumber || "",
      date: base.date as string,
      customerDetails: base.customerDetails,
      items: (base.items ?? []).map((it) => ({
        name: it.name ?? "",
        description: it.description,
        unitPrice: it.unitPrice,
        quantity: it.quantity,
        amount: it.amount,
      })),
      subtotal: base.subtotal as number,
      total: base.total as number,
      currency,
      businessName: profile?.business?.name,
      businessEmail: profile?.business?.email,
      businessAddress: profile?.business?.address,
    });
  } catch (e: unknown) {
    if (applyDocNumberError(e)) {
      setFinalizeError("That document number is already in use. Pick another.");
    } else {
      setFinalizeError(
        e instanceof Error ? e.message : "Failed to finalize document",
      );
    }
  } finally {
    setFinalizing(false);
  }
}, [
  addDocument,
  applyValidationErrors,
  applyDocNumberError,
  currency,
  customers,
  documentId,
  isCreate,
  profile?.business,
  resolveDocNumber,
  setDocument,
  state,
  subtotal,
  total,
  user?.uid,
]);
```

- [ ] **Step 3: Replace `downloadDocument` callback body**

Find `downloadDocument` (line ~753). Replace its body:

```ts
const downloadDocument = useCallback(() => {
  setPreviewData({
    type: state.documentType,
    docNumber: state.documentNumber || "",
    date: state.date,
    customerDetails: selectCustomerDetails(customers, state.customerId),
    items: state.lineItems.map((li) => ({
      name: li.name,
      description: li.description,
      unitPrice: li.unitPrice,
      quantity: li.quantity,
      amount: li.amount,
    })),
    subtotal,
    total,
    currency,
    businessName: profile?.business?.name,
    businessEmail: profile?.business?.email,
    businessAddress: profile?.business?.address,
  });
}, [currency, customers, profile?.business, state, subtotal, total]);
```

Note: this is now synchronous (no `async`). Update the type in `DocumentPageViewModel` accordingly.

- [ ] **Step 4: Add `closePreview` action and update `downloading` flag**

Add a `closePreview` callback after `downloadDocument`:

```ts
const closePreview = useCallback(() => {
  setPreviewData(null);
  if (finalizedDocIdRef.current) {
    const id = finalizedDocIdRef.current;
    finalizedDocIdRef.current = null;
    navigate(`/documents/${id}/edit`, { state: { autoEdit: true } });
  }
}, [navigate]);
```

The `downloading` state is now unused (the new `downloadDocument` is synchronous). Remove the `const [downloading, setDownloading] = useState(false)` declaration and the `downloading` field from the `flags` object in the return.

- [ ] **Step 5: Update `DocumentPageViewModel` type and return value**

In the `DocumentPageViewModel` type definition, update `actions`:

```ts
actions: {
  saveDraft: () => Promise<void>;
  saveChanges: () => Promise<void>;
  downloadPdf: () => Promise<void>;
  markAsSent: () => Promise<void>;
  downloadDocument: () => void;       // ← was Promise<void>
  copyFromPrevious: () => Promise<void>;
  dismissCreateGuide: () => void;
  generateInvoice: () => Promise<void>;
  enterEditMode: () => void;
  navigateCancel: () => void;
  closePreview: () => void;           // ← new
};
```

Remove `downloading` from `flags`:

```ts
flags: {
  saving: boolean;
  finalizing: boolean;
  prefilling: boolean;
  initializing: boolean;
  generatingInvoice: boolean;
  canEdit: boolean;
  isDirty: boolean;
  documentStatus: DocumentStatus;
  showCreateGuide: boolean;
  showForm: boolean;
};
```

Add `previewData` to the top-level VM fields:

```ts
previewData: PdfPreviewData | null;
```

In the `return` statement, add to the return object:
```ts
previewData,
```

And add to `actions`:
```ts
downloadDocument,
closePreview,
```

Remove `downloading` from the `flags` return.

- [ ] **Step 6: Verify compile**

```bash
cd /Users/donkasungallage/Documents/projects/simple-bill && npx tsc --noEmit 2>&1 | head -40
```

Fix any type errors, then commit.

- [ ] **Step 7: Commit**

```bash
git add src/hooks/pages/useDocumentPage.ts
git commit -m "feat(preview): replace downloadPdf/downloadDocument with HTML preview open"
```

---

## Task 4: Update `DocumentEdit.tsx`

**Files:**
- Modify: `src/pages/DocumentEdit.tsx`

- [ ] **Step 1: Add PdfPreviewModal import**

```tsx
import PdfPreviewModal from "@components/documents/PdfPreviewModal";
```

- [ ] **Step 2: Update button labels and add modal**

Change `"Download PDF"` → `"View PDF"` in both button instances (edit mode and view mode).

Change the disabled condition for `downloadDocument` button — remove `flags.downloading ||` since that flag is gone.

In the return statement, before the closing `</>`, add:

```tsx
<PdfPreviewModal
  open={!!vm.previewData}
  data={vm.previewData}
  onClose={vm.actions.closePreview}
/>
```

Full diff summary:
- `{flags.finalizing ? "Preparing…" : "Download PDF"}` → `{flags.finalizing ? "Preparing…" : "View PDF"}`
- `{flags.downloading ? "Downloading…" : "Download PDF"}` → `"View PDF"`
- `disabled={flags.downloading || flags.initializing}` → `disabled={flags.initializing}`
- Add `<PdfPreviewModal>` render at bottom of fragment

- [ ] **Step 3: Verify compile**

```bash
cd /Users/donkasungallage/Documents/projects/simple-bill && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/DocumentEdit.tsx
git commit -m "feat(preview): DocumentEdit uses View PDF + PdfPreviewModal"
```

---

## Task 5: Update `DocumentCreation.tsx`

**Files:**
- Modify: `src/pages/DocumentCreation.tsx`

- [ ] **Step 1: Add PdfPreviewModal import**

```tsx
import PdfPreviewModal from "@components/documents/PdfPreviewModal";
```

- [ ] **Step 2: Update subtitle and button label**

Change subtitle from `"Fill in the details below, then save a draft or download a PDF."` to `"Fill in the details below, then save a draft or view a PDF preview."`.

Change `{flags.finalizing ? "Preparing…" : "Download PDF"}` → `{flags.finalizing ? "Preparing…" : "View PDF"}`.

Add modal before the closing `</>`:

```tsx
<PdfPreviewModal
  open={!!vm.previewData}
  data={vm.previewData}
  onClose={vm.actions.closePreview}
/>
```

- [ ] **Step 3: Verify compile**

```bash
cd /Users/donkasungallage/Documents/projects/simple-bill && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/DocumentCreation.tsx
git commit -m "feat(preview): DocumentCreation uses View PDF + PdfPreviewModal"
```

---

## Task 6: Update `useDocumentMutations` — replace download with openPreview

**Files:**
- Modify: `src/hooks/pages/useDocumentMutations.ts`

- [ ] **Step 1: Add `PdfPreviewData` import and `previewDoc` state**

Add import:
```ts
import type { PdfPreviewData } from "@components/documents/DocumentPreviewContent";
```

Remove these imports (no longer needed):
```ts
import { downloadBlob } from "@utils/download";
```

Add state inside the hook:
```ts
const [previewData, setPreviewData] = useState<PdfPreviewData | null>(null);
```

- [ ] **Step 2: Replace `download` callback with `openPreview`**

Remove the entire `download` useCallback. Replace with:

```ts
const openPreview = useCallback((doc: DocumentEntity) => {
  setPreviewData({
    type: doc.type,
    docNumber: doc.docNumber ?? "",
    date: doc.date ?? "",
    customerDetails: doc.customerDetails,
    items: (doc.items ?? []).map((it) => ({
      name: it.name ?? "",
      description: it.description,
      unitPrice: it.unitPrice,
      quantity: it.quantity,
      amount: it.amount,
    })),
    subtotal: doc.subtotal ?? 0,
    total: doc.total ?? 0,
    currency: doc.currency ?? "USD",
  });
}, []);

const closePreview = useCallback(() => {
  setPreviewData(null);
}, []);
```

- [ ] **Step 3: Update the type definitions**

Update `DocumentMutationsPending` — remove `downloadingId`:

```ts
export type DocumentMutationsPending = {
  duplicatingId: string | null;
  deletingId: string | null;
  markingPaidId: string | null;
  markingUnpaidId: string | null;
};
```

Update `DocumentMutationsActions` — replace `download` with `openPreview` and `closePreview`:

```ts
export type DocumentMutationsActions = {
  requestDelete: (id: string) => void;
  confirmDelete: () => Promise<void>;
  cancelDelete: () => void;
  requestMarkPaid: (id: string) => void;
  confirmMarkPaid: () => Promise<void>;
  cancelMarkPaid: () => void;
  requestMarkUnpaid: (id: string) => void;
  confirmMarkUnpaid: () => Promise<void>;
  cancelMarkUnpaid: () => void;
  duplicate: (source: DocumentEntity) => Promise<void>;
  openPreview: (doc: DocumentEntity) => void;
  closePreview: () => void;
};
```

Add `previewData` to `DocumentMutationsViewModel`:

```ts
export type DocumentMutationsViewModel = {
  pending: DocumentMutationsPending;
  confirms: DocumentMutationsConfirms;
  previewData: PdfPreviewData | null;
  actions: DocumentMutationsActions;
};
```

- [ ] **Step 4: Update the `return` statement**

Remove `downloadingId` from `pending`, add `previewData`, replace `download` with `openPreview` and `closePreview`:

```ts
return {
  pending: {
    duplicatingId,
    deletingId,
    markingPaidId,
    markingUnpaidId,
  },
  confirms: {
    deleteId: deleteConfirmId,
    markPaidId: markPaidConfirmId,
    markUnpaidId: markUnpaidConfirmId,
  },
  previewData,
  actions: {
    requestDelete: (id: string) => setDeleteConfirmId(id),
    confirmDelete: handleConfirmDelete,
    cancelDelete: () => setDeleteConfirmId(null),
    requestMarkPaid: (id: string) => setMarkPaidConfirmId(id),
    confirmMarkPaid: handleConfirmMarkPaid,
    cancelMarkPaid: () => setMarkPaidConfirmId(null),
    requestMarkUnpaid: (id: string) => setMarkUnpaidConfirmId(id),
    confirmMarkUnpaid: handleConfirmMarkUnpaid,
    cancelMarkUnpaid: () => setMarkUnpaidConfirmId(null),
    duplicate,
    openPreview,
    closePreview,
  },
};
```

Also remove `const [downloadingId, setDownloadingId] = useState<string | null>(null)` from the hook body.

- [ ] **Step 5: Verify compile**

```bash
cd /Users/donkasungallage/Documents/projects/simple-bill && npx tsc --noEmit 2>&1 | head -40
```

- [ ] **Step 6: Commit**

```bash
git add src/hooks/pages/useDocumentMutations.ts
git commit -m "feat(preview): useDocumentMutations replaces download with openPreview"
```

---

## Task 7: Update `useDocumentsPage` VM type

**Files:**
- Modify: `src/hooks/pages/useDocumentsPage.ts`

- [ ] **Step 1: Add `PdfPreviewData` import**

```ts
import type { PdfPreviewData } from "@components/documents/DocumentPreviewContent";
```

- [ ] **Step 2: Update `DocumentsPageViewModel`**

Remove `downloadingId` from `pending`. Add `previewData` at the top level. Replace `download` with `openPreview` and add `closePreview` in `actions`:

```ts
export type DocumentsPageViewModel = {
  loading: boolean;
  firestoreError: string | null;
  showDocumentList: boolean;
  typeFilter: TypeFilter;
  statusFilter: StatusFilter;
  filteredDocuments: DocumentRow[];
  hasDocuments: boolean;
  hasFilteredResults: boolean;
  previewData: PdfPreviewData | null;
  pending: {
    duplicatingId: string | null;
    deletingId: string | null;
    markingPaidId: string | null;
    markingUnpaidId: string | null;
  };
  confirms: {
    deleteId: string | null;
    markPaidId: string | null;
    markUnpaidId: string | null;
  };
  actions: {
    setTypeFilter: (value: TypeFilter) => void;
    setStatusFilter: (value: StatusFilter) => void;
    requestDelete: (id: string) => void;
    confirmDelete: () => Promise<void>;
    cancelDelete: () => void;
    requestMarkPaid: (id: string) => void;
    confirmMarkPaid: () => Promise<void>;
    cancelMarkPaid: () => void;
    requestMarkUnpaid: (id: string) => void;
    confirmMarkUnpaid: () => Promise<void>;
    cancelMarkUnpaid: () => void;
    duplicate: (source: DocumentEntity) => Promise<void>;
    openPreview: (doc: DocumentEntity) => void;
    closePreview: () => void;
    navigateNewDocument: () => void;
    navigateNewInvoice: () => void;
    navigateNewQuotation: () => void;
  };
};
```

- [ ] **Step 3: Update the return statement in `useDocumentsPage`**

Find the `return` at the bottom of `useDocumentsPage`. Update to thread through the new fields:

```ts
return {
  loading,
  firestoreError,
  showDocumentList,
  typeFilter,
  statusFilter,
  filteredDocuments,
  hasDocuments,
  hasFilteredResults,
  previewData: mutations.previewData,
  pending: mutations.pending,
  confirms: mutations.confirms,
  actions: {
    setTypeFilter,
    setStatusFilter,
    requestDelete: mutations.actions.requestDelete,
    confirmDelete: mutations.actions.confirmDelete,
    cancelDelete: mutations.actions.cancelDelete,
    requestMarkPaid: mutations.actions.requestMarkPaid,
    confirmMarkPaid: mutations.actions.confirmMarkPaid,
    cancelMarkPaid: mutations.actions.cancelMarkPaid,
    requestMarkUnpaid: mutations.actions.requestMarkUnpaid,
    confirmMarkUnpaid: mutations.actions.confirmMarkUnpaid,
    cancelMarkUnpaid: mutations.actions.cancelMarkUnpaid,
    duplicate: mutations.actions.duplicate,
    openPreview: mutations.actions.openPreview,
    closePreview: mutations.actions.closePreview,
    navigateNewDocument: () => navigate("/documents/new"),
    navigateNewInvoice: () =>
      navigate("/documents/new", { state: { documentType: "invoice" } }),
    navigateNewQuotation: () =>
      navigate("/documents/new", { state: { documentType: "quotation" } }),
  },
};
```

- [ ] **Step 4: Verify compile**

```bash
cd /Users/donkasungallage/Documents/projects/simple-bill && npx tsc --noEmit 2>&1 | head -40
```

- [ ] **Step 5: Commit**

```bash
git add src/hooks/pages/useDocumentsPage.ts
git commit -m "feat(preview): thread previewData/openPreview through useDocumentsPage"
```

---

## Task 8: Update `DocumentCard`

**Files:**
- Modify: `src/components/documents/DocumentCard.tsx`

- [ ] **Step 1: Remove `downloadingId` prop, rename `onDownload` → `onPreview`**

Update `DocumentCardProps`:

```ts
type DocumentCardProps = {
  document: DocumentRow;
  duplicatingId: string | null;
  deletingId: string | null;
  markingPaidId: string | null;
  markingUnpaidId: string | null;
  onDuplicate: (document: DocumentEntity) => void;
  onPreview: (document: DocumentEntity) => void;
  onDelete: (id: string) => void;
  onMarkPaid: (id: string) => void;
  onMarkUnpaid: (id: string) => void;
};
```

- [ ] **Step 2: Update `getPrimaryAction` — remove isDownloading**

```ts
const getPrimaryAction = (
  document: DocumentEntity,
  isMarkingPaid: boolean,
) => {
  const isDraft = !document.status || document.status === "draft";
  if (isDraft) return { label: "Continue editing", kind: "edit" as const };
  if (document.status === "paid") {
    return { label: "View PDF", kind: "preview" as const };
  }
  return {
    label: isMarkingPaid ? "Saving..." : "Mark as paid",
    kind: "mark-paid" as const,
  };
};
```

- [ ] **Step 3: Update component body**

Remove all `isDownloading` and `downloadingId` references. Update the destructuring to remove `downloadingId`. Update `getPrimaryAction` call:

```ts
const primaryAction = getPrimaryAction(document, isMarkingPaid);
```

Update `isBusy`:
```ts
const isBusy = Boolean(isDeleting || isMarkingPaid || isMarkingUnpaid || duplicatingId);
```

Update `handlePrimaryAction`:
```ts
if (primaryAction.kind === "preview") {
  onPreview(document);
  return;
}
```

Update the `⋯` menu — change `"Download PDF"` → `"View PDF"` and `onDownload` → `onPreview`:
```tsx
{!isPaid && (
  <button
    type="button"
    onClick={() => onPreview(document)}
    disabled={Boolean(duplicatingId)}
  >
    View PDF
  </button>
)}
```

- [ ] **Step 4: Verify compile**

```bash
cd /Users/donkasungallage/Documents/projects/simple-bill && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 5: Commit**

```bash
git add src/components/documents/DocumentCard.tsx
git commit -m "feat(preview): DocumentCard uses View PDF / onPreview"
```

---

## Task 9: Update `Documents.tsx`

**Files:**
- Modify: `src/pages/Documents.tsx`

- [ ] **Step 1: Add PdfPreviewModal import**

```tsx
import PdfPreviewModal from "@components/documents/PdfPreviewModal";
```

- [ ] **Step 2: Remove `downloadingId` from DocumentCard and wire `onPreview`**

Find the `<DocumentCard>` usage and update props:
- Remove `downloadingId={vm.pending.downloadingId}`
- Change `onDownload={vm.actions.download}` → `onPreview={vm.actions.openPreview}`

- [ ] **Step 3: Add PdfPreviewModal at the bottom of the page return**

Before the final closing tag, add:

```tsx
<PdfPreviewModal
  open={!!vm.previewData}
  data={vm.previewData}
  onClose={vm.actions.closePreview}
/>
```

- [ ] **Step 4: Verify compile**

```bash
cd /Users/donkasungallage/Documents/projects/simple-bill && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/Documents.tsx
git commit -m "feat(preview): Documents.tsx wires openPreview + PdfPreviewModal"
```

---

## Task 10: Remove pdf.ts, download.ts, and uninstall pdf-lib

**Files:**
- Delete: `src/utils/pdf.ts`
- Delete: `src/utils/download.ts`

- [ ] **Step 1: Confirm no remaining imports**

```bash
grep -r "from.*utils/pdf\|utils/download\|pdf-lib\|downloadBlob\|generateDocumentPdf" \
  /Users/donkasungallage/Documents/projects/simple-bill/src --include="*.ts" --include="*.tsx"
```

Expected: zero matches. If any remain, fix them before proceeding.

- [ ] **Step 2: Delete the files**

```bash
rm /Users/donkasungallage/Documents/projects/simple-bill/src/utils/pdf.ts
rm /Users/donkasungallage/Documents/projects/simple-bill/src/utils/download.ts
```

- [ ] **Step 3: Uninstall pdf-lib**

```bash
cd /Users/donkasungallage/Documents/projects/simple-bill && npm uninstall pdf-lib
```

- [ ] **Step 4: Full compile check**

```bash
cd /Users/donkasungallage/Documents/projects/simple-bill && npx tsc --noEmit 2>&1
```

Expected: zero errors.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove pdf-lib, pdf.ts, download.ts — preview replaces direct download"
```

---

## Task 11: Run app and verify in browser

- [ ] **Step 1: Start dev server**

```bash
cd /Users/donkasungallage/Documents/projects/simple-bill && npm run dev &
```

Wait a few seconds for the server to start (typically on `http://localhost:5173`).

- [ ] **Step 2: Open browser and navigate to the documents list**

Use Playwright to navigate and take a screenshot of the documents list showing "View PDF" buttons, then click one to open the preview modal and screenshot that too.

- [ ] **Step 3: Also verify creation flow**

Navigate to `/documents/new`, fill in minimal data (pick a customer, add a line item), click "View PDF" — verify it finalizes and opens the preview modal.

- [ ] **Step 4: Verify print**

In the preview modal, click "Download PDF" and confirm the browser's print dialog opens.
