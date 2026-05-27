import React, { useCallback, useState } from "react";
import ErrorBanner from "@components/core/ErrorBanner";
import ConfirmDialog from "@components/core/ConfirmDialog";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@auth/useAuth";
import { useFirestore } from "@hooks/useFirestore";
import { usePageTitle } from "@components/layout/PageTitleContext";
import type { DocumentEntity } from "../../types/document";
import { formatCurrency } from "@utils/currency";
import { downloadBlob } from "@utils/download";
import { buildDuplicatePayload, getDocumentFilename } from "@utils/documents";
import { allocateNextDocumentNumber } from "@utils/docNumber";
import { todayIso } from "@utils/date";

type DocumentRow = DocumentEntity & {
  typeLabel: string;
  customerName: string;
};

const Dashboard: React.FC = () => {
  usePageTitle("Overview");
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
      const { generateDocumentPdf } = await import("../../utils/pdf");
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
    <div
      className="dashboard-page"
      style={{
        maxWidth: 1024,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 48,
      }}
    >
      {/* Welcome + CTA */}
      <section
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          {firstName && (
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 16,
                fontWeight: 600,
                letterSpacing: "0.01em",
                color: "var(--md-secondary)",
                margin: "0 0 4px",
              }}
            >
              {greeting}, {firstName}
            </p>
          )}
          <h3
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
              color: "var(--md-on-surface)",
              margin: 0,
            }}
          >
            Your business at a glance
          </h3>
        </div>
        <button
          onClick={() => navigate("/documents/new")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            background: "var(--md-primary)",
            color: "#fff",
            fontFamily: "var(--font-body)",
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: "0.01em",
            padding: "16px 32px",
            borderRadius: 12,
            border: "none",
            boxShadow: "0 2px 0 #063b28",
            cursor: "pointer",
            transition: "all 0.15s",
            minHeight: 48,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(1px)";
            e.currentTarget.style.boxShadow = "none";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "";
            e.currentTarget.style.boxShadow = "0 2px 0 #063b28";
          }}
        >
          <span
            className="material-symbols-outlined filled"
            style={{ fontSize: 20 }}
          >
            add
          </span>
          New invoice
        </button>
      </section>

      {/* Document list */}
      <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h4
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--md-on-surface-variant)",
              margin: 0,
            }}
          >
            Recent Documents
          </h4>
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 14,
              fontWeight: 600,
              color: "var(--md-primary)",
              cursor: "pointer",
            }}
          >
            View all
          </span>
        </div>

        {loading && (
          <div
            style={{
              textAlign: "center",
              padding: "3rem",
              color: "var(--md-on-surface-variant)",
            }}
          >
            Loading documents…
          </div>
        )}
        {error && <ErrorBanner>{error}</ErrorBanner>}
        {mutationError && <ErrorBanner>{mutationError}</ErrorBanner>}

        {/* Cards */}
        {!loading && !error && documents.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {documents.map((d) => {
              const isDraft = !d.status || d.status === "draft";
              const isFinalized = d.status === "finalized";
              const isPaid = d.status === "paid";
              const isDeleting = deletingId === d.id;
              const isDownloading = downloadingId === d.id;
              const isMarkingPaid = markingPaidId === d.id;
              const isMarkingUnpaid = markingUnpaidId === d.id;

              // Icon + colors per status
              const iconName = isDraft ? "edit_document" : "receipt_long";
              const iconBg = isDraft
                ? "var(--md-surface-container-highest)"
                : "var(--md-secondary-container)";
              const iconColor = isDraft
                ? "var(--md-on-surface-variant)"
                : "var(--md-on-secondary-container)";

              // Status badge — handle legacy/unknown statuses gracefully
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
                <div
                  key={d.id}
                  style={{
                    background: "var(--md-surface-container-lowest)",
                    border: "1px solid var(--md-outline-variant)",
                    borderRadius: 12,
                    padding: "24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 24,
                    flexWrap: "wrap",
                    transition: "box-shadow 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow =
                      "0 4px 12px rgba(0,0,0,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  }}
                >
                  {/* Left: icon + info */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 20,
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        background: iconBg,
                        color: iconColor,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 22 }}
                      >
                        {iconName}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                      }}
                    >
                      <h5
                        style={{
                          fontFamily: "var(--font-heading)",
                          fontSize: 24,
                          fontWeight: 600,
                          lineHeight: 1.3,
                          color: "var(--md-on-surface)",
                          margin: 0,
                        }}
                      >
                        {d.customerName}
                      </h5>
                      <p
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: 18,
                          color: "var(--md-on-surface-variant)",
                          margin: 0,
                        }}
                      >
                        {d.typeLabel} #{d.docNumber || "—"}
                      </p>
                      <p
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: 14,
                          fontWeight: 700,
                          letterSpacing: "0.03em",
                          color: "var(--md-outline)",
                          margin: 0,
                        }}
                      >
                        {d.date}
                      </p>
                    </div>
                  </div>

                  {/* Center: amount + badge */}
                  <div
                    className="doc-card-amount"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: 8,
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: 24,
                        fontWeight: 600,
                        color: isDraft
                          ? "var(--md-on-surface-variant)"
                          : "var(--md-primary)",
                      }}
                    >
                      {formatCurrency(d.total, d.currency || "USD")}
                    </span>
                    <span
                      style={{
                        padding: "4px 12px",
                        borderRadius: 9999,
                        background: badge.bg,
                        color: badge.color,
                        fontFamily: "var(--font-body)",
                        fontSize: 14,
                        fontWeight: 700,
                        letterSpacing: "0.03em",
                        textTransform: "uppercase",
                      }}
                    >
                      {badge.label}
                    </span>
                  </div>

                  {/* Right: actions */}
                  <div
                    className="doc-card-actions"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: isDraft ? 24 : 12,
                      paddingLeft: 16,
                      borderLeft: "1px solid var(--md-outline-variant)",
                      flexShrink: 0,
                    }}
                  >
                    {isDraft && (
                      <>
                        <button
                          onClick={() => navigate(`/documents/${d.id}/edit`)}
                          disabled={!!duplicatingId}
                          style={{
                            background: "var(--md-primary-container)",
                            color: "var(--md-on-primary-container)",
                            fontFamily: "var(--font-body)",
                            fontSize: 16,
                            fontWeight: 600,
                            padding: "12px 24px",
                            minHeight: 48,
                            borderRadius: 8,
                            border: "none",
                            cursor: "pointer",
                            transition: "opacity 0.15s",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Continue editing
                        </button>
                        <button
                          onClick={() => handleDuplicate(d)}
                          disabled={!!duplicatingId}
                          style={{
                            background: "transparent",
                            color: "var(--md-on-surface-variant)",
                            fontFamily: "var(--font-body)",
                            fontSize: 16,
                            fontWeight: 600,
                            padding: "12px 24px",
                            minHeight: 48,
                            borderRadius: 8,
                            border: "1px solid var(--md-outline)",
                            cursor: duplicatingId ? "not-allowed" : "pointer",
                            whiteSpace: "nowrap",
                            opacity: duplicatingId ? 0.6 : 1,
                          }}
                        >
                          {duplicatingId === d.id
                            ? "Duplicating…"
                            : "Duplicate"}
                        </button>
                        <button
                          onClick={() => d.id && setConfirmDelete(d.id)}
                          disabled={isDeleting}
                          style={{
                            background: "transparent",
                            color: isDeleting
                              ? "var(--md-outline)"
                              : "var(--md-outline)",
                            fontFamily: "var(--font-body)",
                            fontSize: 14,
                            fontWeight: 700,
                            letterSpacing: "0.03em",
                            padding: "0 8px",
                            border: "none",
                            cursor: "pointer",
                            textDecoration: "underline",
                            transition: "color 0.15s",
                          }}
                          onMouseEnter={(e) => {
                            if (!isDeleting)
                              (e.currentTarget as HTMLElement).style.color =
                                "var(--brand-danger)";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.color =
                              "var(--md-outline)";
                          }}
                        >
                          {isDeleting ? "Deleting…" : "Delete"}
                        </button>
                      </>
                    )}
                    {isFinalized && (
                      <>
                        <button
                          onClick={() => d.id && setConfirmMarkPaid(d.id)}
                          disabled={isMarkingPaid || !!duplicatingId}
                          style={{
                            background: "var(--md-primary)",
                            color: "#fff",
                            fontFamily: "var(--font-body)",
                            fontSize: 16,
                            fontWeight: 600,
                            padding: "12px 24px",
                            minHeight: 48,
                            borderRadius: 8,
                            border: "none",
                            cursor: isMarkingPaid ? "not-allowed" : "pointer",
                            whiteSpace: "nowrap",
                            opacity: isMarkingPaid ? 0.6 : 1,
                            transition: "opacity 0.15s",
                          }}
                        >
                          {isMarkingPaid ? "Saving…" : "Mark as paid"}
                        </button>
                        <button
                          onClick={() => handleDuplicate(d)}
                          disabled={!!duplicatingId}
                          style={{
                            background: "transparent",
                            color: "var(--md-on-surface-variant)",
                            fontFamily: "var(--font-body)",
                            fontSize: 16,
                            fontWeight: 600,
                            padding: "12px 24px",
                            minHeight: 48,
                            borderRadius: 8,
                            border: "1px solid var(--md-outline)",
                            cursor: duplicatingId ? "not-allowed" : "pointer",
                            whiteSpace: "nowrap",
                            opacity: duplicatingId ? 0.6 : 1,
                          }}
                        >
                          {duplicatingId === d.id
                            ? "Duplicating…"
                            : "Duplicate"}
                        </button>
                        <button
                          onClick={() => handleDownload(d)}
                          disabled={isDownloading || !!duplicatingId}
                          style={{
                            background: "transparent",
                            color: "var(--md-on-surface-variant)",
                            fontFamily: "var(--font-body)",
                            fontSize: 16,
                            fontWeight: 600,
                            padding: "12px 24px",
                            minHeight: 48,
                            borderRadius: 8,
                            border: "1px solid var(--md-outline)",
                            cursor: isDownloading ? "not-allowed" : "pointer",
                            whiteSpace: "nowrap",
                            opacity: isDownloading ? 0.6 : 1,
                          }}
                        >
                          {isDownloading ? "Downloading…" : "Download PDF"}
                        </button>
                      </>
                    )}
                    {isPaid && (
                      <>
                        <button
                          onClick={() => handleDownload(d)}
                          disabled={isDownloading || !!duplicatingId}
                          style={{
                            background: "transparent",
                            color: "var(--md-on-surface-variant)",
                            fontFamily: "var(--font-body)",
                            fontSize: 16,
                            fontWeight: 600,
                            padding: "12px 24px",
                            minHeight: 48,
                            borderRadius: 8,
                            border: "1px solid var(--md-outline)",
                            cursor: isDownloading ? "not-allowed" : "pointer",
                            whiteSpace: "nowrap",
                            opacity: isDownloading ? 0.6 : 1,
                          }}
                        >
                          {isDownloading ? "Downloading…" : "Download PDF"}
                        </button>
                        <button
                          onClick={() => handleDuplicate(d)}
                          disabled={!!duplicatingId}
                          style={{
                            background: "transparent",
                            color: "var(--md-on-surface-variant)",
                            fontFamily: "var(--font-body)",
                            fontSize: 16,
                            fontWeight: 600,
                            padding: "12px 24px",
                            minHeight: 48,
                            borderRadius: 8,
                            border: "1px solid var(--md-outline)",
                            cursor: duplicatingId ? "not-allowed" : "pointer",
                            whiteSpace: "nowrap",
                            opacity: duplicatingId ? 0.6 : 1,
                          }}
                        >
                          {duplicatingId === d.id
                            ? "Duplicating…"
                            : "Duplicate"}
                        </button>
                        <button
                          onClick={() => d.id && setConfirmMarkUnpaid(d.id)}
                          disabled={isMarkingUnpaid || !!duplicatingId}
                          style={{
                            background: "transparent",
                            color: isMarkingUnpaid
                              ? "var(--md-outline)"
                              : "var(--md-outline)",
                            fontFamily: "var(--font-body)",
                            fontSize: 14,
                            fontWeight: 700,
                            letterSpacing: "0.03em",
                            padding: "0 8px",
                            border: "none",
                            cursor: isMarkingUnpaid ? "not-allowed" : "pointer",
                            textDecoration: "underline",
                            transition: "color 0.15s",
                            opacity: isMarkingUnpaid ? 0.6 : 1,
                            whiteSpace: "nowrap",
                          }}
                          onMouseEnter={(e) => {
                            if (!isMarkingUnpaid)
                              (e.currentTarget as HTMLElement).style.color =
                                "var(--md-on-surface-variant)";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.color =
                              "var(--md-outline)";
                          }}
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
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              padding: "6rem 2rem",
              gap: 24,
            }}
          >
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: "50%",
                background: "var(--md-surface-container)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 64,
                  color: "var(--md-outline-variant)",
                  fontVariationSettings: "'wght' 200",
                }}
              >
                drafts
              </span>
            </div>
            <div style={{ maxWidth: 400 }}>
              <h4
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: 24,
                  fontWeight: 600,
                  color: "var(--md-on-surface)",
                  margin: "0 0 8px",
                }}
              >
                You haven't created any invoices yet
              </h4>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 20,
                  color: "var(--md-on-surface-variant)",
                  margin: 0,
                }}
              >
                Let's create your first one! It only takes a minute to get
                started.
              </p>
            </div>
            <button
              onClick={() => navigate("/documents/new")}
              style={{
                background: "var(--md-primary)",
                color: "#fff",
                fontFamily: "var(--font-body)",
                fontSize: 16,
                fontWeight: 600,
                padding: "20px 40px",
                borderRadius: 12,
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(15,82,56,0.3)",
              }}
            >
              Create First Invoice
            </button>
          </div>
        )}
      </section>

      {/* Helpful tips bento */}
      <section
        className="dashboard-bento"
        style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}
      >
        <div
          style={{
            background: "var(--md-secondary-container)",
            borderRadius: 12,
            padding: 32,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minHeight: 200,
          }}
        >
          <div>
            <h4
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: 24,
                fontWeight: 600,
                color: "var(--md-on-secondary-container)",
                margin: "0 0 12px",
              }}
            >
              Setting up your brand
            </h4>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 18,
                color: "var(--md-on-secondary-container)",
                opacity: 0.8,
                margin: 0,
              }}
            >
              Add your logo and business details to make your documents look
              professional from day one.
            </p>
          </div>
          <a
            href="/settings"
            style={{
              marginTop: 16,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              color: "var(--md-on-secondary-container)",
              fontWeight: 700,
              textDecoration: "none",
              fontSize: 16,
              transition: "gap 0.15s",
            }}
          >
            Personalize my bill
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 20 }}
            >
              arrow_forward
            </span>
          </a>
        </div>
        <div
          style={{
            background: "var(--md-surface-container-highest)",
            borderRadius: 12,
            padding: 32,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: 40,
              color: "var(--md-primary)",
              marginBottom: 8,
            }}
          >
            security
          </span>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: "0.01em",
              color: "var(--md-on-surface)",
              margin: "0 0 4px",
            }}
          >
            Secure Cloud Storage
          </p>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.03em",
              color: "var(--md-on-surface-variant)",
              margin: 0,
            }}
          >
            All your documents are automatically backed up.
          </p>
        </div>
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
