import React, { useCallback, useEffect, useMemo, useState } from "react";
import ErrorBanner from "@components/core/ErrorBanner";
import ConfirmDialog from "@components/core/ConfirmDialog";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@auth/useAuth";
import { useFirestore } from "@hooks/useFirestore";
import { usePageTitle } from "@components/layout/PageTitleContext";
import PageHeader from "@components/layout/PageHeader";
import Button from "@components/core/Button";
import DocumentCard from "@components/documents/DocumentCard";
import type { DocumentEntity } from "../../types/document";
import { downloadBlob } from "@utils/download";
import { buildDuplicatePayload, getDocumentFilename } from "@utils/documents";
import { allocateNextDocumentNumber } from "@utils/docNumber";
import { todayIso } from "@utils/date";
import {
  loadCustomerUsage,
  recentCustomerIds,
  formatLastBilled,
  type CustomerUsageMap,
} from "@utils/customerUsage";
import type { Customer } from "../../types/customer";

type DocumentRow = DocumentEntity & {
  typeLabel: string;
  customerName: string;
};

const Dashboard: React.FC = () => {
  usePageTitle("Home");
  const navigate = useNavigate();
  const { user } = useAuth();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [confirmMarkPaid, setConfirmMarkPaid] = useState<string | null>(null);
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);
  const [confirmMarkUnpaid, setConfirmMarkUnpaid] = useState<string | null>(
    null,
  );
  const [markingUnpaidId, setMarkingUnpaidId] = useState<string | null>(null);

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

  const quickActionCustomers = useMemo(() => {
    const recentIds = recentCustomerIds(customerUsage, 2);
    return recentIds
      .map((id) => customers.find((c) => c.id === id))
      .filter((c): c is Customer => c !== undefined);
  }, [customerUsage, customers]);

  const summaryCurrency = documents[0]?.currency || "LKR";
  const formatSummaryCurrency = useCallback(
    (value: number) => {
      const safe = Number.isFinite(value) ? value : 0;
      const fractionDigits = Number.isInteger(safe) ? 0 : 2;
      try {
        return new Intl.NumberFormat(
          typeof navigator !== "undefined" ? navigator.language : "en-US",
          {
            style: "currency",
            currency: summaryCurrency,
            minimumFractionDigits: fractionDigits,
            maximumFractionDigits: fractionDigits,
          },
        ).format(safe);
      } catch {
        const fixed = safe.toFixed(fractionDigits);
        return `${summaryCurrency} ${fixed}`;
      }
    },
    [summaryCurrency],
  );
  const financialSummary = useMemo(() => {
    const now = new Date();
    const outstanding = documents
      .filter((doc) => doc.status === "finalized")
      .reduce((sum, doc) => sum + doc.total, 0);
    const paidThisMonth = documents
      .filter((doc) => {
        if (doc.status !== "paid") return false;
        const paidDate =
          doc.paidAt instanceof Date
            ? doc.paidAt
            : (doc.paidAt?.toDate?.() ?? doc.updatedAt?.toDate?.());
        return (
          paidDate &&
          paidDate.getFullYear() === now.getFullYear() &&
          paidDate.getMonth() === now.getMonth()
        );
      })
      .reduce((sum, doc) => sum + doc.total, 0);
    const drafts = documents.filter(
      (doc) => !doc.status || doc.status === "draft",
    ).length;

    return { outstanding, paidThisMonth, drafts };
  }, [documents]);

  useEffect(() => {
    // If there is no usage history yet, derive a best-effort recency map from
    // existing documents so quick actions can still be personalized.
    if (!user?.uid) return;
    if (Object.keys(customerUsage).length > 0) return;
    if (documents.length === 0) return;

    const next: CustomerUsageMap = {};
    for (const d of documents) {
      if (!d.customerId) continue;
      if (next[d.customerId]) continue;
      const ts = d.date ? new Date(d.date).getTime() : 0;
      next[d.customerId] = Number.isFinite(ts) && ts > 0 ? ts : Date.now();
      if (Object.keys(next).length >= 6) break;
    }
    if (Object.keys(next).length > 0) setCustomerUsage(next);
  }, [customerUsage, documents, user?.uid]);

  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

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
        console.error("Failed to duplicate document:", e);
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
      const { generateDocumentPdf } = await import("@utils/pdf");
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
      await update(confirmMarkPaid, {
        status: "paid",
        paidAt: new Date(),
      });
    } finally {
      setMarkingPaidId(null);
    }
  }, [confirmMarkPaid, update]);

  const handleConfirmMarkUnpaid = useCallback(async () => {
    if (!confirmMarkUnpaid) return;
    setMarkingUnpaidId(confirmMarkUnpaid);
    setConfirmMarkUnpaid(null);
    try {
      await update(confirmMarkUnpaid, {
        status: "finalized",
        paidAt: null,
      });
    } finally {
      setMarkingUnpaidId(null);
    }
  }, [confirmMarkUnpaid, update]);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user?.displayName?.split(" ")[0] ?? "";

  return (
    <div className="app-page dashboard-page">
      <PageHeader
        className="page-header--flush"
        size="large"
        eyebrow={firstName ? `${greeting}, ${firstName}` : undefined}
        title="Your business at a glance"
      />

      <section
        className="dashboard-summary-strip"
        aria-label="Financial summary"
      >
        <div className="dashboard-summary-strip__item dashboard-summary-strip__item--primary">
          <span>Awaiting payment</span>
          <strong>{formatSummaryCurrency(financialSummary.outstanding)}</strong>
        </div>
        <div className="dashboard-summary-strip__item">
          <span>Paid this month</span>
          <strong>
            {formatSummaryCurrency(financialSummary.paidThisMonth)}
          </strong>
        </div>
        <button
          type="button"
          className="dashboard-summary-strip__item dashboard-summary-strip__item--link"
          onClick={() => navigate("/documents?status=draft")}
        >
          <span>Drafts</span>
          <strong>{financialSummary.drafts}</strong>
        </button>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section__head">
          <h2 className="page-section-label">Quick actions</h2>
        </div>
        <div className="dashboard-quick-actions">
          {quickActionCustomers.length > 0 && (
            <div className="quick-action-customers">
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
                    <span className="quick-action-card__name">
                      {customer.name}
                    </span>
                    <span className="quick-action-card__hint">
                      {formatLastBilled(customerUsage[customer.id!] ?? 0)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="quick-action-secondary">
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
                <span className="quick-action-card__hint">
                  Choose any customer
                </span>
              </div>
            </button>

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
                <span className="quick-action-card__hint">
                  Choose any customer
                </span>
              </div>
            </button>
          </div>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section__head">
          <h2 className="page-section-label">Latest documents</h2>
          {documents.length > 0 && (
            <button
              type="button"
              className="dashboard-view-all"
              onClick={() => navigate("/documents")}
            >
              View all →
            </button>
          )}
        </div>

        {loading && <div className="dashboard-loading">Loading documents…</div>}
        {error && <ErrorBanner>{error}</ErrorBanner>}
        {mutationError && <ErrorBanner>{mutationError}</ErrorBanner>}

        {!loading && !error && documents.length > 0 && (
          <div className="doc-card-list">
            {documents.slice(0, 5).map((d) => (
              <DocumentCard
                key={d.id}
                document={d}
                duplicatingId={duplicatingId}
                deletingId={deletingId}
                downloadingId={downloadingId}
                markingPaidId={markingPaidId}
                markingUnpaidId={markingUnpaidId}
                onDuplicate={handleDuplicate}
                onDownload={handleDownload}
                onDelete={setConfirmDelete}
                onMarkPaid={setConfirmMarkPaid}
                onMarkUnpaid={setConfirmMarkUnpaid}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
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
};

export default Dashboard;
