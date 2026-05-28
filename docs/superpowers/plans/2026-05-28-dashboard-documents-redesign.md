# Dashboard & Documents Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dashboard's full document list with a quick-action grid + recent-5 view, and add a new `/documents` page with filter chips for the complete list.

**Architecture:** A new `customerUsage.ts` localStorage utility (mirroring `itemUsage.ts`) tracks recently-billed customers for the dashboard quick actions. A new `Documents.tsx` page reuses the existing `useFirestore` hook and doc-card UI pattern. `DocumentCreation` and `DocumentEdit` call `recordCustomerBilled` on save/finalize to keep the quick actions fresh.

**Tech Stack:** React 18, TypeScript, Firebase Firestore, React Router v6, Vitest + Testing Library

---

## File Map

| Action | File                                 |
| ------ | ------------------------------------ |
| Create | `src/utils/customerUsage.ts`         |
| Create | `tests/utils/customerUsage.test.ts`  |
| Create | `src/pages/Documents.tsx`            |
| Create | `tests/pages/Documents.test.tsx`     |
| Modify | `src/App.tsx`                        |
| Modify | `src/components/layout/AppShell.tsx` |
| Modify | `src/pages/DocumentCreation.tsx`     |
| Modify | `src/pages/DocumentEdit.tsx`         |
| Modify | `src/pages/dashboard/Dashboard.tsx`  |
| Modify | `tests/pages/Dashboard.test.tsx`     |

---

### Task 1: `customerUsage` utility

**Files:**

- Create: `src/utils/customerUsage.ts`
- Create: `tests/utils/customerUsage.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/utils/customerUsage.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import {
  loadCustomerUsage,
  recordCustomerBilled,
  recentCustomerIds,
  formatLastBilled,
} from "../../src/utils/customerUsage";

beforeEach(() => {
  localStorage.clear();
});

describe("loadCustomerUsage", () => {
  it("returns empty object when nothing stored", () => {
    expect(loadCustomerUsage("user1")).toEqual({});
  });

  it("returns stored map", () => {
    localStorage.setItem(
      "simplebill:customerUsage:user1",
      JSON.stringify({ cust1: 1000, cust2: 2000 }),
    );
    expect(loadCustomerUsage("user1")).toEqual({ cust1: 1000, cust2: 2000 });
  });

  it("ignores non-numeric values", () => {
    localStorage.setItem(
      "simplebill:customerUsage:user1",
      JSON.stringify({ cust1: "bad", cust2: 2000 }),
    );
    expect(loadCustomerUsage("user1")).toEqual({ cust2: 2000 });
  });

  it("returns empty object on corrupt JSON", () => {
    localStorage.setItem("simplebill:customerUsage:user1", "not-json");
    expect(loadCustomerUsage("user1")).toEqual({});
  });
});

describe("recordCustomerBilled", () => {
  it("stores a timestamp for the customer", () => {
    const before = Date.now();
    const result = recordCustomerBilled("user1", "cust1");
    const after = Date.now();
    expect(result.cust1).toBeGreaterThanOrEqual(before);
    expect(result.cust1).toBeLessThanOrEqual(after);
  });

  it("overwrites existing timestamp", () => {
    localStorage.setItem(
      "simplebill:customerUsage:user1",
      JSON.stringify({ cust1: 1000 }),
    );
    const result = recordCustomerBilled("user1", "cust1");
    expect(result.cust1).toBeGreaterThan(1000);
  });

  it("persists to localStorage", () => {
    recordCustomerBilled("user1", "cust1");
    const stored = JSON.parse(
      localStorage.getItem("simplebill:customerUsage:user1") ?? "{}",
    ) as Record<string, number>;
    expect(typeof stored.cust1).toBe("number");
  });

  it("preserves other customers", () => {
    localStorage.setItem(
      "simplebill:customerUsage:user1",
      JSON.stringify({ cust2: 9999 }),
    );
    const result = recordCustomerBilled("user1", "cust1");
    expect(result.cust2).toBe(9999);
  });
});

describe("recentCustomerIds", () => {
  it("returns IDs sorted by timestamp desc", () => {
    const usage = { a: 1000, b: 3000, c: 2000 };
    expect(recentCustomerIds(usage, 3)).toEqual(["b", "c", "a"]);
  });

  it("respects max", () => {
    const usage = { a: 1000, b: 3000, c: 2000 };
    expect(recentCustomerIds(usage, 2)).toEqual(["b", "c"]);
  });

  it("returns empty array for empty usage", () => {
    expect(recentCustomerIds({}, 3)).toEqual([]);
  });
});

describe("formatLastBilled", () => {
  it("returns 'Last billed today' for same-day timestamp", () => {
    expect(formatLastBilled(Date.now())).toBe("Last billed today");
  });

  it("returns 'Last billed yesterday' for ~24h ago", () => {
    expect(formatLastBilled(Date.now() - 25 * 60 * 60 * 1000)).toBe(
      "Last billed yesterday",
    );
  });

  it("returns 'Last billed N days ago' for older timestamps", () => {
    expect(formatLastBilled(Date.now() - 3 * 24 * 60 * 60 * 1000)).toBe(
      "Last billed 3 days ago",
    );
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run tests/utils/customerUsage.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `customerUsage.ts`**

```typescript
// src/utils/customerUsage.ts
export type CustomerUsageMap = Record<string, number>; // customerId -> unix timestamp ms

function storageKey(userId: string) {
  return `simplebill:customerUsage:${userId}`;
}

export function loadCustomerUsage(userId: string): CustomerUsageMap {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const out: CustomerUsageMap = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === "number" && Number.isFinite(v) && v > 0) out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

export function recordCustomerBilled(
  userId: string,
  customerId: string,
): CustomerUsageMap {
  const current = loadCustomerUsage(userId);
  const next: CustomerUsageMap = { ...current, [customerId]: Date.now() };
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(next));
  } catch {
    // ignore storage failures (private mode, quota exceeded, etc.)
  }
  return next;
}

export function recentCustomerIds(
  usage: CustomerUsageMap,
  max: number,
): string[] {
  return Object.entries(usage)
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([id]) => id);
}

export function formatLastBilled(timestamp: number): string {
  const diffDays = Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Last billed today";
  if (diffDays === 1) return "Last billed yesterday";
  return `Last billed ${diffDays} days ago`;
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run tests/utils/customerUsage.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/customerUsage.ts tests/utils/customerUsage.test.ts
git commit -m "feat: add customerUsage utility for dashboard quick actions"
```

---

### Task 2: Documents page

**Files:**

- Create: `src/pages/Documents.tsx`
- Create: `tests/pages/Documents.test.tsx`

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/pages/Documents.test.tsx
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Documents from "../../src/pages/Documents";
import { useAuth } from "@auth/useAuth";
import { useFirestore } from "@hooks/useFirestore";
import { usePageTitle } from "@components/layout/PageTitleContext";

global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

vi.mock("@firebase/config", () => ({ db: {}, auth: {} }));
vi.mock("firebase/app", () => ({ initializeApp: vi.fn() }));
vi.mock("firebase/auth", () => ({
  initializeAuth: vi.fn(),
  browserPopupRedirectResolver: {},
  indexedDBLocalPersistence: {},
  browserLocalPersistence: {},
  inMemoryPersistence: {},
}));
vi.mock("firebase/firestore", () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn(),
  serverTimestamp: vi.fn(() => ({ seconds: 0, nanoseconds: 0 })),
  Timestamp: { now: vi.fn() },
}));
vi.mock("@auth/useAuth");
vi.mock("@hooks/useFirestore");
vi.mock("@components/layout/PageTitleContext");

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockDocuments = [
  {
    id: "doc1",
    type: "invoice",
    typeLabel: "Invoice",
    docNumber: "INV-2026-001",
    date: "2026-05-28",
    status: "draft",
    total: 1500,
    currency: "LKR",
    customerName: "Don Kasun",
    customerId: "cust1",
    items: [],
    subtotal: 1500,
    userId: "user1",
    notes: "",
    customerDetails: { name: "Don Kasun" },
  },
  {
    id: "doc2",
    type: "quotation",
    typeLabel: "Quotation",
    docNumber: "QUO-2026-001",
    date: "2026-05-27",
    status: "finalized",
    total: 6000,
    currency: "LKR",
    customerName: "Finlays",
    customerId: "cust2",
    items: [],
    subtotal: 6000,
    userId: "user1",
    notes: "",
    customerDetails: { name: "Finlays" },
  },
];

beforeEach(() => {
  vi.mocked(useAuth).mockReturnValue({
    user: { uid: "user1", displayName: "Don", email: "d@test.com" } as never,
    signOut: vi.fn(),
    loading: false,
  });
  vi.mocked(useFirestore).mockReturnValue({
    items: mockDocuments as never,
    loading: false,
    error: null,
    add: vi.fn(),
    set: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    getById: vi.fn(),
  } as never);
  vi.mocked(usePageTitle).mockImplementation(() => {});
  mockNavigate.mockReset();
});

describe("Documents page", () => {
  it("renders page title", () => {
    render(
      <BrowserRouter>
        <Documents />
      </BrowserRouter>,
    );
    expect(screen.getByText("Documents")).toBeInTheDocument();
  });

  it("renders all documents by default", () => {
    render(
      <BrowserRouter>
        <Documents />
      </BrowserRouter>,
    );
    expect(screen.getByText("Don Kasun")).toBeInTheDocument();
    expect(screen.getByText("Finlays")).toBeInTheDocument();
  });

  it("filters to invoices only when Invoices chip clicked", () => {
    render(
      <BrowserRouter>
        <Documents />
      </BrowserRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Invoices" }));
    expect(screen.getByText("Don Kasun")).toBeInTheDocument();
    expect(screen.queryByText("Finlays")).not.toBeInTheDocument();
  });

  it("filters to quotations only when Quotations chip clicked", () => {
    render(
      <BrowserRouter>
        <Documents />
      </BrowserRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Quotations" }));
    expect(screen.queryByText("Don Kasun")).not.toBeInTheDocument();
    expect(screen.getByText("Finlays")).toBeInTheDocument();
  });

  it("shows empty state when filters produce no results", () => {
    render(
      <BrowserRouter>
        <Documents />
      </BrowserRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Paid" }));
    expect(
      screen.getByText("No documents match your filters"),
    ).toBeInTheDocument();
  });

  it("New invoice button navigates to /documents/new", () => {
    render(
      <BrowserRouter>
        <Documents />
      </BrowserRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: /new invoice/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/documents/new");
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run tests/pages/Documents.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `Documents.tsx`**

```tsx
// src/pages/Documents.tsx
import React, { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@auth/useAuth";
import { useFirestore } from "@hooks/useFirestore";
import { usePageTitle } from "@components/layout/PageTitleContext";
import PageHeader from "@components/layout/PageHeader";
import Button from "@components/core/Button";
import ErrorBanner from "@components/core/ErrorBanner";
import ConfirmDialog from "@components/core/ConfirmDialog";
import type { DocumentEntity } from "../types/document";
import { formatCurrency } from "@utils/currency";
import { downloadBlob } from "@utils/download";
import { buildDuplicatePayload, getDocumentFilename } from "@utils/documents";
import { allocateNextDocumentNumber } from "@utils/docNumber";
import { todayIso } from "@utils/date";

type DocumentRow = DocumentEntity & {
  typeLabel: string;
  customerName: string;
};

type TypeFilter = "all" | "invoice" | "quotation";
type StatusFilter = "draft" | "finalized" | "paid" | null;

const Documents: React.FC = () => {
  usePageTitle("Documents");
  const navigate = useNavigate();
  const { user } = useAuth();

  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(null);

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [confirmMarkPaid, setConfirmMarkPaid] = useState<string | null>(null);
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);
  const [confirmMarkUnpaid, setConfirmMarkUnpaid] = useState<string | null>(
    null,
  );
  const [markingUnpaidId, setMarkingUnpaidId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const {
    items: documents,
    loading,
    error,
    add,
    remove,
    update,
  } = useFirestore<DocumentEntity, DocumentRow>({
    collectionName: "documents",
    userId: user?.uid,
    orderByField: "createdAt",
    select: (doc) => ({
      ...doc,
      typeLabel: doc.type === "invoice" ? "Invoice" : "Quotation",
      customerName: doc.customerDetails?.name ?? "—",
    }),
  });

  const filtered = useMemo(() => {
    return documents.filter((d) => {
      const typeMatch = typeFilter === "all" || d.type === typeFilter;
      const statusMatch =
        statusFilter === null ||
        d.status === statusFilter ||
        (!d.status && statusFilter === "draft");
      return typeMatch && statusMatch;
    });
  }, [documents, typeFilter, statusFilter]);

  const handleDuplicate = useCallback(
    async (source: DocumentEntity) => {
      if (!user?.uid) return;
      setDuplicatingId(source.id ?? null);
      setMutationError(null);
      try {
        const today = todayIso();
        const nextNumber = await allocateNextDocumentNumber(
          user.uid,
          source.type,
          today,
        );
        const payload = buildDuplicatePayload(
          user.uid,
          source,
          nextNumber,
          today,
        );
        const newId = await add(payload);
        navigate(`/documents/${newId}/edit`, { state: { autoEdit: true } });
      } catch (e: unknown) {
        setMutationError(
          e instanceof Error ? e.message : "Failed to duplicate document",
        );
      } finally {
        setDuplicatingId(null);
      }
    },
    [add, navigate, user?.uid],
  );

  const handleDownload = useCallback(async (doc: DocumentEntity) => {
    setDownloadingId(doc.id ?? null);
    try {
      const { generateDocumentPdf } = await import("../utils/pdf");
      const pdfBytes = await generateDocumentPdf({
        type: doc.type,
        docNumber: doc.docNumber,
        date: doc.date,
        customerDetails: doc.customerDetails,
        items: doc.items,
        subtotal: doc.subtotal,
        total: doc.total,
        currency: doc.currency || "USD",
      });
      const filename = `${getDocumentFilename(doc.type, doc.docNumber, doc.date)}.pdf`;
      downloadBlob(filename, pdfBytes, "application/pdf");
    } finally {
      setDownloadingId(null);
    }
  }, []);

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    setDeletingId(confirmDelete);
    setConfirmDelete(null);
    try {
      await remove(confirmDelete);
    } finally {
      setDeletingId(null);
    }
  };

  const handleConfirmMarkPaid = useCallback(async () => {
    if (!confirmMarkPaid) return;
    setMarkingPaidId(confirmMarkPaid);
    setConfirmMarkPaid(null);
    try {
      await update(confirmMarkPaid, { status: "paid" });
    } finally {
      setMarkingPaidId(null);
    }
  }, [confirmMarkPaid, update]);

  const handleConfirmMarkUnpaid = useCallback(async () => {
    if (!confirmMarkUnpaid) return;
    setMarkingUnpaidId(confirmMarkUnpaid);
    setConfirmMarkUnpaid(null);
    try {
      await update(confirmMarkUnpaid, { status: "finalized" });
    } finally {
      setMarkingUnpaidId(null);
    }
  }, [confirmMarkUnpaid, update]);

  const chipClass = (active: boolean) =>
    `filter-chip${active ? " filter-chip--active" : ""}`;

  const badgeStyles: Record<
    string,
    { bg: string; color: string; label: string }
  > = {
    draft: {
      bg: "var(--md-surface-container-highest)",
      color: "var(--md-on-surface-variant)",
      label: "Draft",
    },
    finalized: {
      bg: "var(--md-secondary-container)",
      color: "var(--md-on-secondary-container)",
      label: "Sent",
    },
    paid: {
      bg: "var(--md-primary-container)",
      color: "var(--md-on-primary-container)",
      label: "Paid",
    },
  };

  return (
    <div className="app-page">
      <PageHeader
        className="page-header--flush"
        size="large"
        title="Documents"
        subtitle={!loading && !error ? `${documents.length} total` : undefined}
        actions={
          <Button type="button" onClick={() => navigate("/documents/new")}>
            <span className="material-symbols-outlined filled page-header-cta-icon">
              add
            </span>
            New invoice
          </Button>
        }
      />

      {/* Filter chips */}
      <div className="filter-chips">
        <div className="filter-chips__group">
          <button
            type="button"
            className={chipClass(typeFilter === "all")}
            onClick={() => setTypeFilter("all")}
          >
            All
          </button>
          <button
            type="button"
            className={chipClass(typeFilter === "invoice")}
            onClick={() => setTypeFilter("invoice")}
          >
            Invoices
          </button>
          <button
            type="button"
            className={chipClass(typeFilter === "quotation")}
            onClick={() => setTypeFilter("quotation")}
          >
            Quotations
          </button>
        </div>
        <div className="filter-chips__group">
          <button
            type="button"
            className={chipClass(statusFilter === "draft")}
            onClick={() =>
              setStatusFilter((s) => (s === "draft" ? null : "draft"))
            }
          >
            Draft
          </button>
          <button
            type="button"
            className={chipClass(statusFilter === "finalized")}
            onClick={() =>
              setStatusFilter((s) => (s === "finalized" ? null : "finalized"))
            }
          >
            Sent
          </button>
          <button
            type="button"
            className={chipClass(statusFilter === "paid")}
            onClick={() =>
              setStatusFilter((s) => (s === "paid" ? null : "paid"))
            }
          >
            Paid
          </button>
        </div>
      </div>

      <section className="dashboard-section">
        {loading && <div className="dashboard-loading">Loading documents…</div>}
        {error && <ErrorBanner>{error}</ErrorBanner>}
        {mutationError && <ErrorBanner>{mutationError}</ErrorBanner>}

        {!loading && !error && filtered.length > 0 && (
          <div className="doc-card-list">
            {filtered.map((d) => {
              const isDraft = !d.status || d.status === "draft";
              const isFinalized = d.status === "finalized";
              const isPaid = d.status === "paid";
              const isDeleting = deletingId === d.id;
              const isDownloading = downloadingId === d.id;
              const isMarkingPaid = markingPaidId === d.id;
              const isMarkingUnpaid = markingUnpaidId === d.id;
              const isQuotation = d.type === "quotation";
              const iconName = isQuotation ? "request_quote" : "receipt_long";
              const iconBg = isQuotation
                ? isDraft
                  ? "var(--orange-light)"
                  : "var(--green-light)"
                : isDraft
                  ? "var(--md-surface-container-highest)"
                  : "var(--md-secondary-container)";
              const iconColor = isQuotation
                ? isDraft
                  ? "var(--brand-warning)"
                  : "var(--brand-success)"
                : isDraft
                  ? "var(--md-on-surface-variant)"
                  : "var(--md-on-secondary-container)";
              const badge =
                badgeStyles[d.status ?? "draft"] ?? badgeStyles.draft;

              return (
                <div key={d.id} className="doc-card">
                  <div className="doc-card__main">
                    <div
                      className="doc-card__icon"
                      style={{ background: iconBg, color: iconColor }}
                    >
                      <span className="material-symbols-outlined icon-md">
                        {iconName}
                      </span>
                    </div>
                    <div className="doc-card__info">
                      <h5 className="doc-card__title">{d.customerName}</h5>
                      <p className="doc-card__subtitle">
                        {d.typeLabel} #{d.docNumber || "—"}
                      </p>
                      <p className="doc-card__date">{d.date}</p>
                    </div>
                  </div>

                  <div className="doc-card-amount">
                    <span
                      className={`doc-card__amount ${isDraft ? "doc-card__amount--draft" : "doc-card__amount--active"}`}
                    >
                      {formatCurrency(d.total, d.currency || "USD")}
                    </span>
                    <span
                      className="doc-card__status"
                      style={{ background: badge.bg, color: badge.color }}
                    >
                      {badge.label}
                    </span>
                  </div>

                  <div
                    className={`doc-card-actions${isDraft ? " doc-card-actions--draft" : ""}`}
                  >
                    {isDraft && (
                      <>
                        <button
                          type="button"
                          className="doc-card-btn doc-card-btn--primary"
                          onClick={() => navigate(`/documents/${d.id}/edit`)}
                          disabled={!!duplicatingId}
                        >
                          Continue editing
                        </button>
                        <button
                          type="button"
                          className="doc-card-btn doc-card-btn--outline"
                          onClick={() => handleDuplicate(d)}
                          disabled={!!duplicatingId}
                        >
                          {duplicatingId === d.id
                            ? "Duplicating…"
                            : "Duplicate"}
                        </button>
                        <button
                          type="button"
                          className="icon-btn icon-btn-danger"
                          aria-label={
                            isDeleting ? "Deleting document" : "Delete document"
                          }
                          title="Delete document"
                          onClick={() => d.id && setConfirmDelete(d.id)}
                          disabled={isDeleting}
                        >
                          <span
                            className="material-symbols-outlined"
                            aria-hidden
                          >
                            delete
                          </span>
                        </button>
                      </>
                    )}
                    {isFinalized && (
                      <>
                        <button
                          type="button"
                          className="doc-card-btn doc-card-btn--accent"
                          onClick={() => d.id && setConfirmMarkPaid(d.id)}
                          disabled={isMarkingPaid || !!duplicatingId}
                        >
                          {isMarkingPaid ? "Saving…" : "Mark as paid"}
                        </button>
                        <button
                          type="button"
                          className="doc-card-btn doc-card-btn--outline"
                          onClick={() => handleDuplicate(d)}
                          disabled={!!duplicatingId}
                        >
                          {duplicatingId === d.id
                            ? "Duplicating…"
                            : "Duplicate"}
                        </button>
                        <button
                          type="button"
                          className="doc-card-btn doc-card-btn--outline"
                          onClick={() => handleDownload(d)}
                          disabled={isDownloading || !!duplicatingId}
                        >
                          {isDownloading ? "Downloading…" : "Download PDF"}
                        </button>
                      </>
                    )}
                    {isPaid && (
                      <>
                        <button
                          type="button"
                          className="doc-card-btn doc-card-btn--outline"
                          onClick={() => handleDownload(d)}
                          disabled={isDownloading || !!duplicatingId}
                        >
                          {isDownloading ? "Downloading…" : "Download PDF"}
                        </button>
                        <button
                          type="button"
                          className="doc-card-btn doc-card-btn--outline"
                          onClick={() => handleDuplicate(d)}
                          disabled={!!duplicatingId}
                        >
                          {duplicatingId === d.id
                            ? "Duplicating…"
                            : "Duplicate"}
                        </button>
                        <button
                          type="button"
                          className="doc-card-link doc-card-link--muted"
                          onClick={() => d.id && setConfirmMarkUnpaid(d.id)}
                          disabled={isMarkingUnpaid || !!duplicatingId}
                        >
                          {isMarkingUnpaid ? "Saving…" : "Mark as unpaid"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading &&
          !error &&
          documents.length > 0 &&
          filtered.length === 0 && (
            <div className="dashboard-empty">
              <div className="dashboard-empty__copy">
                <h4 className="dashboard-empty__title">
                  No documents match your filters
                </h4>
                <p className="dashboard-empty__body">
                  Try adjusting the filters above.
                </p>
              </div>
            </div>
          )}

        {!loading && !error && documents.length === 0 && (
          <div className="dashboard-empty">
            <div className="dashboard-empty__icon-wrap">
              <span className="material-symbols-outlined icon-xl dashboard-empty__icon">
                drafts
              </span>
            </div>
            <div className="dashboard-empty__copy">
              <h4 className="dashboard-empty__title">No documents yet</h4>
              <p className="dashboard-empty__body">
                Create your first invoice or quotation to get started.
              </p>
            </div>
            <Button type="button" onClick={() => navigate("/documents/new")}>
              Create first invoice
            </Button>
          </div>
        )}
      </section>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Delete document"
        message="Are you sure you want to delete this document? This cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete(null)}
        danger
      />
      <ConfirmDialog
        isOpen={!!confirmMarkPaid}
        title="Mark as paid"
        message="Mark this document as paid? You can always undo this from the documents list."
        confirmLabel="Mark as paid"
        onConfirm={handleConfirmMarkPaid}
        onCancel={() => setConfirmMarkPaid(null)}
        danger={false}
      />
      <ConfirmDialog
        isOpen={!!confirmMarkUnpaid}
        title="Mark as unpaid"
        message="Revert this document back to finalized (unpaid)?"
        confirmLabel="Mark as unpaid"
        onConfirm={handleConfirmMarkUnpaid}
        onCancel={() => setConfirmMarkUnpaid(null)}
        danger={false}
      />
    </div>
  );
};

export default Documents;
```

- [ ] **Step 4: Add filter chip CSS to `src/index.css`**

Find the `.dashboard-section` block and add after it:

```css
/* ── Filter chips ── */
.filter-chips {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.filter-chips__group {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.filter-chip {
  background: var(--md-surface-container);
  border: 1px solid var(--md-outline-variant);
  border-radius: 20px;
  padding: 5px 14px;
  font-size: var(--text-sm);
  color: var(--md-on-surface-variant);
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
}

.filter-chip:hover {
  background: var(--md-surface-container-high);
}

.filter-chip--active {
  background: var(--md-secondary-container);
  color: var(--md-on-secondary-container);
  border-color: transparent;
  font-weight: 600;
}
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
npx vitest run tests/pages/Documents.test.tsx
```

Expected: all 6 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/pages/Documents.tsx tests/pages/Documents.test.tsx src/index.css
git commit -m "feat: add Documents page with filter chips"
```

---

### Task 3: Route and nav wiring

**Files:**

- Modify: `src/App.tsx`
- Modify: `src/components/layout/AppShell.tsx`

- [ ] **Step 1: Add route to `src/App.tsx`**

Add lazy import after the existing `DocumentEdit` import:

```tsx
const Documents = lazy(() => import("./pages/Documents"));
```

Then inside the `<Route path="documents">` block, add the index route before `new`:

```tsx
<Route path="documents">
  <Route index element={<Documents />} />
  <Route path="new" element={<DocumentCreation />} />
  <Route path=":id/edit" element={<DocumentEdit />} />
</Route>
```

- [ ] **Step 2: Add nav link to `src/components/layout/AppShell.tsx`**

In the `<nav className="sidebar-nav">` block, add the Documents link between Home and Customers:

```tsx
<nav className="sidebar-nav">
  {navLink("/dashboard", "home", "Home", true)}
  {navLink("/documents", "receipt_long", "Documents")}
  {navLink("/customers", "group", "Customers")}
  {navLink("/items", "inventory_2", "Products & services")}
  {navLink("/settings", "settings", "Settings")}
</nav>
```

- [ ] **Step 3: Verify the app compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/components/layout/AppShell.tsx
git commit -m "feat: add /documents route and sidebar nav link"
```

---

### Task 4: Pre-select customer/type in DocumentCreation

**Files:**

- Modify: `src/pages/DocumentCreation.tsx`

- [ ] **Step 1: Import `useLocation`, `recordCustomerBilled`**

At the top of `DocumentCreation.tsx`, add to the existing imports:

```tsx
import { useNavigate, useLocation } from "react-router-dom";
```

Replace the existing `useNavigate` import (it's already there — add `useLocation` alongside it).

Also add:

```tsx
import { recordCustomerBilled } from "@utils/customerUsage";
```

- [ ] **Step 2: Read `location.state` on mount**

After the existing `const navigate = useNavigate();` line, add:

```tsx
const location = useLocation();
const locationState = location.state as {
  customerId?: string;
  documentType?: "invoice" | "quotation";
} | null;
```

- [ ] **Step 3: Apply pre-selected customer when customers load**

The existing `useEffect` that auto-selects the first customer is:

```tsx
useEffect(() => {
  if (!state.customerId && customers.length > 0) {
    dispatch({
      type: "SET_FIELD",
      field: "customerId",
      value: customers[0].id,
    });
  }
}, [customers, state.customerId, dispatch]);
```

Replace it with:

```tsx
useEffect(() => {
  if (customers.length === 0) return;
  if (state.customerId) return; // already set

  // Prefer pre-selected customer from location state (quick action)
  const preselected = locationState?.customerId;
  const target =
    preselected && customers.some((c) => c.id === preselected)
      ? preselected
      : customers[0].id;

  dispatch({ type: "SET_FIELD", field: "customerId", value: target });
}, [customers, state.customerId, dispatch, locationState?.customerId]);
```

- [ ] **Step 4: Apply pre-selected document type**

After the `useEffect` for customers, add:

```tsx
// Pre-select document type from quick action (e.g. "New quotation")
useEffect(() => {
  if (locationState?.documentType) {
    dispatch({
      type: "SET_FIELD",
      field: "documentType",
      value: locationState.documentType,
    });
  }
  // Only run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

- [ ] **Step 5: Record customer on save draft**

In `handleSaveDraft`, after `const id = await addDocument(payload);`, add:

```tsx
if (id && user?.uid && state.customerId) {
  recordCustomerBilled(user.uid, state.customerId);
}
if (id) navigate("/dashboard");
```

Remove the old bare `if (id) navigate("/dashboard");` line (it's now inside the block above).

- [ ] **Step 6: Record customer on finalize**

In `handleFinalizeAndDownload`, after `const id = await addDocument(payload);`, add before the PDF generation:

```tsx
if (user?.uid && state.customerId) {
  recordCustomerBilled(user.uid, state.customerId);
}
```

- [ ] **Step 7: Verify no TypeScript errors**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add src/pages/DocumentCreation.tsx
git commit -m "feat: pre-select customer/type from location state in DocumentCreation"
```

---

### Task 5: Record customer in DocumentEdit

**Files:**

- Modify: `src/pages/DocumentEdit.tsx`

- [ ] **Step 1: Import `recordCustomerBilled`**

Add to the existing imports in `DocumentEdit.tsx`:

```tsx
import { recordCustomerBilled } from "@utils/customerUsage";
```

- [ ] **Step 2: Record customer on save changes**

In `handleSaveChanges`, after `await setDocument(id, { ...payload, currency });`, add:

```tsx
if (user?.uid && state.customerId) {
  recordCustomerBilled(user.uid, state.customerId);
}
```

- [ ] **Step 3: Record customer on finalize**

In `handleFinalizeAndDownload`, after `await setDocument(id, payload);`, add:

```tsx
if (user?.uid && state.customerId) {
  recordCustomerBilled(user.uid, state.customerId);
}
```

- [ ] **Step 4: Verify no TypeScript errors**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/pages/DocumentEdit.tsx
git commit -m "feat: record customer usage in DocumentEdit on save/finalize"
```

---

### Task 6: Dashboard redesign

**Files:**

- Modify: `src/pages/dashboard/Dashboard.tsx`
- Modify: `tests/pages/Dashboard.test.tsx`

- [ ] **Step 1: Update Dashboard imports**

Add to the existing imports at the top of `src/pages/dashboard/Dashboard.tsx`:

```tsx
import {
  loadCustomerUsage,
  recentCustomerIds,
  formatLastBilled,
  type CustomerUsageMap,
} from "@utils/customerUsage";
import type { Customer } from "../../types/customer";
```

- [ ] **Step 2: Add customers Firestore hook and customerUsage state**

After the existing `useFirestore` call for documents, add:

```tsx
const { items: customers } = useFirestore<Customer>({
  collectionName: "customers",
  userId: user?.uid,
  orderByField: "createdAt",
});

const [customerUsage, setCustomerUsage] = useState<CustomerUsageMap>({});

useEffect(() => {
  if (!user?.uid) return;
  setCustomerUsage(loadCustomerUsage(user.uid));
}, [user?.uid]);
```

- [ ] **Step 3: Derive quick-action customer slots**

After the `customerUsage` state, add:

```tsx
const quickActionCustomers = useMemo(() => {
  const recentIds = recentCustomerIds(customerUsage, 2);
  return recentIds
    .map((id) => customers.find((c) => c.id === id))
    .filter((c): c is Customer => c !== undefined);
}, [customerUsage, customers]);
```

- [ ] **Step 4: Replace the Dashboard JSX**

Replace the entire `return (...)` block with:

```tsx
return (
  <div className="app-page dashboard-page">
    <PageHeader
      className="page-header--flush"
      size="large"
      eyebrow={firstName ? `${greeting}, ${firstName}` : undefined}
      title="Your business at a glance"
    />

    {/* Quick actions */}
    <section className="dashboard-section">
      <div className="dashboard-section__head">
        <h2 className="page-section-label">Quick actions</h2>
      </div>
      <div className="dashboard-quick-actions">
        {/* Recent customer slots */}
        {quickActionCustomers.map((customer) => (
          <button
            key={customer.id}
            type="button"
            className="quick-action-card quick-action-card--customer"
            onClick={() =>
              navigate("/documents/new", {
                state: { customerId: customer.id },
              })
            }
          >
            <div className="quick-action-card__avatar">
              {(customer.name?.[0] ?? "?").toUpperCase()}
            </div>
            <div className="quick-action-card__body">
              <span className="quick-action-card__name">{customer.name}</span>
              <span className="quick-action-card__hint">
                {formatLastBilled(customerUsage[customer.id!] ?? 0)}
              </span>
            </div>
            <span className="quick-action-card__cta">⚡ New invoice</span>
          </button>
        ))}

        {/* Generic: New invoice */}
        <button
          type="button"
          className="quick-action-card quick-action-card--generic"
          onClick={() => navigate("/documents/new")}
        >
          <span className="material-symbols-outlined quick-action-card__icon">
            receipt_long
          </span>
          <div className="quick-action-card__body">
            <span className="quick-action-card__name">New invoice</span>
            <span className="quick-action-card__hint">Choose any customer</span>
          </div>
        </button>

        {/* Generic: New quotation */}
        <button
          type="button"
          className="quick-action-card quick-action-card--generic"
          onClick={() =>
            navigate("/documents/new", {
              state: { documentType: "quotation" },
            })
          }
        >
          <span className="material-symbols-outlined quick-action-card__icon">
            request_quote
          </span>
          <div className="quick-action-card__body">
            <span className="quick-action-card__name">New quotation</span>
            <span className="quick-action-card__hint">Choose any customer</span>
          </div>
        </button>
      </div>
    </section>

    {/* Recent documents */}
    <section className="dashboard-section">
      <div className="dashboard-section__head">
        <h2 className="page-section-label">Recent documents</h2>
        <button
          type="button"
          className="dashboard-view-all"
          onClick={() => navigate("/documents")}
        >
          View all
        </button>
      </div>

      {loading && <div className="dashboard-loading">Loading documents…</div>}
      {error && <ErrorBanner>{error}</ErrorBanner>}
      {mutationError && <ErrorBanner>{mutationError}</ErrorBanner>}

      {!loading && !error && documents.length > 0 && (
        <div className="doc-card-list">
          {documents.slice(0, 5).map((d) => {
            const isDraft = !d.status || d.status === "draft";
            const isFinalized = d.status === "finalized";
            const isPaid = d.status === "paid";
            const isDeleting = deletingId === d.id;
            const isDownloading = downloadingId === d.id;
            const isMarkingPaid = markingPaidId === d.id;
            const isMarkingUnpaid = markingUnpaidId === d.id;
            const isQuotation = d.type === "quotation";
            const iconName = isQuotation ? "request_quote" : "receipt_long";
            const iconBg = isQuotation
              ? isDraft
                ? "var(--orange-light)"
                : "var(--green-light)"
              : isDraft
                ? "var(--md-surface-container-highest)"
                : "var(--md-secondary-container)";
            const iconColor = isQuotation
              ? isDraft
                ? "var(--brand-warning)"
                : "var(--brand-success)"
              : isDraft
                ? "var(--md-on-surface-variant)"
                : "var(--md-on-secondary-container)";

            const badgeStyles: Record<
              string,
              { bg: string; color: string; label: string }
            > = {
              draft: {
                bg: "var(--md-surface-container-highest)",
                color: "var(--md-on-surface-variant)",
                label: "Draft",
              },
              finalized: {
                bg: "var(--md-secondary-container)",
                color: "var(--md-on-secondary-container)",
                label: "Sent",
              },
              paid: {
                bg: "var(--md-primary-container)",
                color: "var(--md-on-primary-container)",
                label: "Paid",
              },
            };
            const badge = badgeStyles[d.status ?? "draft"] ?? badgeStyles.draft;

            return (
              <div key={d.id} className="doc-card">
                <div className="doc-card__main">
                  <div
                    className="doc-card__icon"
                    style={{ background: iconBg, color: iconColor }}
                  >
                    <span className="material-symbols-outlined icon-md">
                      {iconName}
                    </span>
                  </div>
                  <div className="doc-card__info">
                    <h5 className="doc-card__title">{d.customerName}</h5>
                    <p className="doc-card__subtitle">
                      {d.typeLabel} #{d.docNumber || "—"}
                    </p>
                    <p className="doc-card__date">{d.date}</p>
                  </div>
                </div>

                <div className="doc-card-amount">
                  <span
                    className={`doc-card__amount ${isDraft ? "doc-card__amount--draft" : "doc-card__amount--active"}`}
                  >
                    {formatCurrency(d.total, d.currency || "USD")}
                  </span>
                  <span
                    className="doc-card__status"
                    style={{ background: badge.bg, color: badge.color }}
                  >
                    {badge.label}
                  </span>
                </div>

                <div
                  className={`doc-card-actions${isDraft ? " doc-card-actions--draft" : ""}`}
                >
                  {isDraft && (
                    <>
                      <button
                        type="button"
                        className="doc-card-btn doc-card-btn--primary"
                        onClick={() => navigate(`/documents/${d.id}/edit`)}
                        disabled={!!duplicatingId}
                      >
                        Continue editing
                      </button>
                      <button
                        type="button"
                        className="doc-card-btn doc-card-btn--outline"
                        onClick={() => handleDuplicate(d)}
                        disabled={!!duplicatingId}
                      >
                        {duplicatingId === d.id ? "Duplicating…" : "Duplicate"}
                      </button>
                      <button
                        type="button"
                        className="icon-btn icon-btn-danger"
                        aria-label={
                          isDeleting ? "Deleting document" : "Delete document"
                        }
                        title="Delete document"
                        onClick={() => d.id && setConfirmDelete(d.id)}
                        disabled={isDeleting}
                      >
                        <span className="material-symbols-outlined" aria-hidden>
                          delete
                        </span>
                      </button>
                    </>
                  )}
                  {isFinalized && (
                    <>
                      <button
                        type="button"
                        className="doc-card-btn doc-card-btn--accent"
                        onClick={() => d.id && setConfirmMarkPaid(d.id)}
                        disabled={isMarkingPaid || !!duplicatingId}
                      >
                        {isMarkingPaid ? "Saving…" : "Mark as paid"}
                      </button>
                      <button
                        type="button"
                        className="doc-card-btn doc-card-btn--outline"
                        onClick={() => handleDuplicate(d)}
                        disabled={!!duplicatingId}
                      >
                        {duplicatingId === d.id ? "Duplicating…" : "Duplicate"}
                      </button>
                      <button
                        type="button"
                        className="doc-card-btn doc-card-btn--outline"
                        onClick={() => handleDownload(d)}
                        disabled={isDownloading || !!duplicatingId}
                      >
                        {isDownloading ? "Downloading…" : "Download PDF"}
                      </button>
                    </>
                  )}
                  {isPaid && (
                    <>
                      <button
                        type="button"
                        className="doc-card-btn doc-card-btn--outline"
                        onClick={() => handleDownload(d)}
                        disabled={isDownloading || !!duplicatingId}
                      >
                        {isDownloading ? "Downloading…" : "Download PDF"}
                      </button>
                      <button
                        type="button"
                        className="doc-card-btn doc-card-btn--outline"
                        onClick={() => handleDuplicate(d)}
                        disabled={!!duplicatingId}
                      >
                        {duplicatingId === d.id ? "Duplicating…" : "Duplicate"}
                      </button>
                      <button
                        type="button"
                        className="doc-card-link doc-card-link--muted"
                        onClick={() => d.id && setConfirmMarkUnpaid(d.id)}
                        disabled={isMarkingUnpaid || !!duplicatingId}
                      >
                        {isMarkingUnpaid ? "Saving…" : "Mark as unpaid"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && !error && documents.length === 0 && (
        <div className="dashboard-empty">
          <div className="dashboard-empty__icon-wrap">
            <span className="material-symbols-outlined icon-xl dashboard-empty__icon">
              drafts
            </span>
          </div>
          <div className="dashboard-empty__copy">
            <h4 className="dashboard-empty__title">
              You haven't created any invoices yet
            </h4>
            <p className="dashboard-empty__body">
              Let's create your first one! It only takes a minute to get
              started.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => navigate("/documents/new")}
            style={{ borderRadius: 12, padding: "20px 40px" }}
          >
            Create first invoice
          </Button>
        </div>
      )}
    </section>

    <ConfirmDialog
      isOpen={!!confirmDelete}
      title="Delete document"
      message="Are you sure you want to delete this document? This cannot be undone."
      confirmLabel="Delete"
      onConfirm={handleConfirmDelete}
      onCancel={() => setConfirmDelete(null)}
      danger
    />
    <ConfirmDialog
      isOpen={!!confirmMarkPaid}
      title="Mark as paid"
      message="Mark this document as paid? You can always undo this from the dashboard."
      confirmLabel="Mark as paid"
      onConfirm={handleConfirmMarkPaid}
      onCancel={() => setConfirmMarkPaid(null)}
      danger={false}
    />
    <ConfirmDialog
      isOpen={!!confirmMarkUnpaid}
      title="Mark as unpaid"
      message="Revert this document back to finalized (unpaid)?"
      confirmLabel="Mark as unpaid"
      onConfirm={handleConfirmMarkUnpaid}
      onCancel={() => setConfirmMarkUnpaid(null)}
      danger={false}
    />
  </div>
);
```

- [ ] **Step 5: Add quick-action card CSS to `src/index.css`**

After the `.filter-chips` block added in Task 2, add:

```css
/* ── Dashboard quick actions ── */
.dashboard-quick-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.quick-action-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--md-surface-container);
  border: 1px solid var(--md-outline-variant);
  border-radius: 12px;
  padding: 14px;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
}

.quick-action-card:hover {
  background: var(--md-surface-container-high);
}

.quick-action-card--customer {
  border-color: var(--md-primary);
}

.quick-action-card__avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--md-primary);
  color: var(--md-on-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 15px;
  flex-shrink: 0;
}

.quick-action-card__icon {
  font-size: 24px;
  color: var(--md-on-surface-variant);
}

.quick-action-card__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.quick-action-card__name {
  font-weight: 600;
  font-size: var(--text-sm);
  color: var(--md-on-surface);
}

.quick-action-card__hint {
  font-size: var(--text-xs);
  color: var(--md-on-surface-variant);
}

.quick-action-card__cta {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--md-primary);
  background: var(--md-primary-container);
  border-radius: 6px;
  padding: 4px 10px;
  text-align: center;
}
```

- [ ] **Step 6: Update Dashboard tests**

The existing `tests/pages/Dashboard.test.tsx` tests the old "New invoice" button in the page header. The new Dashboard removes that button from the header. Update the tests to reflect the new structure:

Open `tests/pages/Dashboard.test.tsx`. Find any test that asserts the "New invoice" button in the page header and update it to check for the quick-action cards. Also add a mock for `useFirestore` that handles the second call (customers):

```typescript
// In the beforeEach mock setup, the existing useFirestore mock returns the same value
// for all calls. Add a customers call return:
let firestoreCallCount = 0;
vi.mocked(useFirestore).mockImplementation(() => {
  firestoreCallCount++;
  if (firestoreCallCount === 2) {
    // customers call
    return {
      items: [] as never,
      loading: false,
      error: null,
      add: vi.fn(),
      set: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      getById: vi.fn(),
    } as never;
  }
  // documents call
  return {
    items: mockDocuments as never,
    loading: false,
    error: null,
    add: vi.fn(),
    set: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    getById: vi.fn(),
  } as never;
});
```

Reset `firestoreCallCount = 0` in `beforeEach`.

Add a test for the "View all" link:

```typescript
it("View all navigates to /documents", () => {
  render(
    <BrowserRouter>
      <Dashboard />
    </BrowserRouter>,
  );
  fireEvent.click(screen.getByText("View all"));
  expect(mockNavigate).toHaveBeenCalledWith("/documents");
});
```

- [ ] **Step 7: Run all tests**

```bash
npx vitest run
```

Expected: all tests PASS. Fix any failures before committing.

- [ ] **Step 8: Commit**

```bash
git add src/pages/dashboard/Dashboard.tsx src/index.css tests/pages/Dashboard.test.tsx
git commit -m "feat: redesign dashboard with quick actions and recent docs"
```

---

### Task 7: Smoke test end-to-end

- [ ] **Step 1: Start dev server**

```bash
VITE_MOCK_USER=true npm run dev
```

- [ ] **Step 2: Verify Dashboard**
  - Open `http://localhost:5173/dashboard`
  - Quick action grid shows 2 generic cards (New invoice, New quotation) if no customerUsage data
  - Recent documents section shows last 5 docs
  - "View all" link navigates to `/documents`

- [ ] **Step 3: Verify Documents page**
  - Open `http://localhost:5173/documents`
  - All 17 documents listed
  - Click "Invoices" chip — only invoices shown
  - Click "Quotations" chip — only quotations shown
  - Click "Paid" chip (while Quotations active) — empty state with "No documents match your filters"
  - Click "All" — resets to all
  - "New invoice" button navigates to `/documents/new`

- [ ] **Step 4: Verify quick action pre-selection**
  - Create a draft for Don Kasun, save it
  - Return to dashboard — Don Kasun appears as a quick-action card
  - Click the card — `/documents/new` opens with Don Kasun pre-selected in Bill To

- [ ] **Step 5: Verify sidebar nav**
  - "Documents" link appears between Home and Customers
  - Clicking it highlights the active state correctly
  - Works in collapsed sidebar mode (icon only)

- [ ] **Step 6: Final commit if any tweaks were needed**

```bash
git add -A
git commit -m "fix: smoke test tweaks for dashboard/documents redesign"
```
