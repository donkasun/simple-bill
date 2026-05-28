import React, { useCallback, useEffect, useMemo, useState } from "react";
import ErrorBanner from "@components/core/ErrorBanner";
import ConfirmDialog from "@components/core/ConfirmDialog";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@auth/useAuth";
import { useFirestore } from "@hooks/useFirestore";
import { usePageTitle } from "@components/layout/PageTitleContext";
import PageHeader from "@components/layout/PageHeader";
import PrimaryButton from "@components/core/PrimaryButton";
import type { DocumentEntity } from "../../types/document";
import { formatCurrency } from "@utils/currency";
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
        navigate(`/documents/${newId}/edit`);
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

      <section className="dashboard-section">
        <div className="dashboard-section__head">
          <h2 className="page-section-label">Quick actions</h2>
        </div>
        <div className="dashboard-quick-actions">
          {(quickActionCustomers[0] ? [quickActionCustomers[0]] : []).map(
            (customer) => (
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
                <span className="quick-action-card__cta">⚡ New invoice</span>
              </button>
            ),
          )}

          {(quickActionCustomers[1] ? [quickActionCustomers[1]] : []).map(
            (customer) => (
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
                <span className="quick-action-card__cta">⚡ New invoice</span>
              </button>
            ),
          )}

          {!quickActionCustomers[0] ? (
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
          ) : null}

          {!quickActionCustomers[1] ? (
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
          ) : null}

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
      </section>

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

        {/* Cards */}
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
            <PrimaryButton
              type="button"
              onClick={() => navigate("/documents/new")}
              style={{ borderRadius: 12, padding: "20px 40px" }}
            >
              Create first invoice
            </PrimaryButton>
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
