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
import { getDocumentFilename } from "@utils/documents";

type DocumentRow = DocumentEntity & {
  typeLabel: string;
  customerName: string;
  customerInitial: string;
};

const statusConfig = {
  draft: { label: "Draft", bg: "#fff4e5", color: "#b45309" },
  finalized: { label: "Finalized", bg: "#e6f7f1", color: "#0f5238" },
  paid: { label: "Paid", bg: "#e8f5e9", color: "#1b5e20" },
};

const getStatusStyle = (status: string) => {
  const cfg =
    statusConfig[status as keyof typeof statusConfig] ?? statusConfig.draft;
  return {
    display: "inline-flex" as const,
    alignItems: "center" as const,
    padding: "3px 10px",
    borderRadius: "999px",
    fontSize: "0.75rem",
    fontWeight: 600,
    backgroundColor: cfg.bg,
    color: cfg.color,
  };
};

const Dashboard: React.FC = () => {
  usePageTitle("Dashboard");
  const navigate = useNavigate();
  const { user } = useAuth();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const {
    items: documents,
    loading,
    error,
    remove,
  } = useFirestore<DocumentEntity, DocumentRow>({
    collectionName: "documents",
    userId: user?.uid,
    orderByField: "createdAt",
    select: (doc) => ({
      ...doc,
      typeLabel: doc.type === "invoice" ? "Invoice" : "Quotation",
      customerName: doc.customerDetails?.name ?? "—",
      customerInitial: (doc.customerDetails?.name ?? "?")[0].toUpperCase(),
    }),
  });

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

  // Greeting
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user?.displayName?.split(" ")[0] ?? "";

  return (
    <div style={{ padding: "1.5rem" }}>
      <div className="container-xl">
        {/* Header */}
        <div style={{ marginBottom: "1.5rem" }}>
          {firstName && (
            <p
              style={{
                color: "var(--brand-primary)",
                fontWeight: 600,
                fontSize: "0.9rem",
                margin: "0 0 4px",
              }}
            >
              {greeting}, {firstName}
            </p>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h1
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "1.75rem",
                fontWeight: 700,
                color: "var(--brand-text-primary)",
                margin: 0,
              }}
            >
              Your business at a glance
            </h1>
            <button
              onClick={() => navigate("/documents/new")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 20px",
                background: "var(--brand-primary)",
                color: "white",
                border: "none",
                borderRadius: "9999px",
                fontWeight: 700,
                fontSize: "0.95rem",
                cursor: "pointer",
                minHeight: "44px",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background =
                  "var(--brand-primary-hover)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "var(--brand-primary)")
              }
            >
              + New Invoice
            </button>
          </div>
        </div>

        {/* States */}
        {loading && (
          <div
            style={{
              textAlign: "center",
              padding: "3rem",
              color: "var(--brand-text-secondary)",
            }}
          >
            Loading documents…
          </div>
        )}
        {error && <ErrorBanner>{error}</ErrorBanner>}

        {/* Document cards */}
        {!loading && !error && documents.length > 0 && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
          >
            {documents.map((d) => {
              const isDraft = !d.status || d.status === "draft";
              const isFinalized = d.status === "finalized";
              const isPaid = d.status === "paid";
              const isDeleting = deletingId === d.id;
              const isDownloading = downloadingId === d.id;
              const statusLabel = isPaid
                ? "paid"
                : isFinalized
                  ? "finalized"
                  : "draft";

              return (
                <div
                  key={d.id}
                  style={{
                    background: "var(--white)",
                    border: "1px solid var(--brand-border)",
                    borderRadius: "12px",
                    padding: "1rem 1.25rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: "var(--brand-background)",
                      color: "var(--brand-primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "1rem",
                      flexShrink: 0,
                    }}
                  >
                    {d.customerInitial}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: "1rem",
                        color: "var(--brand-text-primary)",
                        marginBottom: 2,
                      }}
                    >
                      {d.customerName}
                    </div>
                    <div
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--brand-text-muted)",
                      }}
                    >
                      {d.typeLabel} · {d.docNumber || "—"} · {d.date}
                    </div>
                  </div>

                  {/* Amount + status */}
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: "1rem",
                        color: "var(--brand-text-primary)",
                        marginBottom: 4,
                      }}
                    >
                      {formatCurrency(d.total, d.currency || "USD")}
                    </div>
                    <span style={getStatusStyle(statusLabel)}>
                      {statusConfig[statusLabel as keyof typeof statusConfig]
                        ?.label ?? "Draft"}
                    </span>
                  </div>

                  {/* Actions */}
                  <div
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                      flexShrink: 0,
                      alignItems: "center",
                    }}
                  >
                    {isDraft && (
                      <>
                        <button
                          onClick={() => navigate(`/documents/${d.id}/edit`)}
                          style={{
                            padding: "8px 14px",
                            background: "var(--brand-primary)",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            fontWeight: 600,
                            fontSize: "0.85rem",
                            cursor: "pointer",
                            minHeight: "36px",
                          }}
                        >
                          Continue editing
                        </button>
                        <button
                          onClick={() => d.id && setConfirmDelete(d.id)}
                          disabled={isDeleting}
                          style={{
                            padding: "8px 14px",
                            background: "transparent",
                            color: "var(--brand-danger)",
                            border: "1px solid var(--brand-danger)",
                            borderRadius: "8px",
                            fontWeight: 600,
                            fontSize: "0.85rem",
                            cursor: "pointer",
                            minHeight: "36px",
                            opacity: isDeleting ? 0.6 : 1,
                          }}
                        >
                          {isDeleting ? "Deleting…" : "Delete"}
                        </button>
                      </>
                    )}
                    {isFinalized && (
                      <>
                        <button
                          onClick={() => navigate(`/documents/${d.id}/edit`)}
                          style={{
                            padding: "8px 14px",
                            background: "transparent",
                            color: "var(--brand-text-secondary)",
                            border: "1px solid var(--brand-border)",
                            borderRadius: "8px",
                            fontWeight: 600,
                            fontSize: "0.85rem",
                            cursor: "pointer",
                            minHeight: "36px",
                          }}
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDownload(d)}
                          disabled={isDownloading}
                          style={{
                            padding: "8px 14px",
                            background: "transparent",
                            color: "var(--brand-primary)",
                            border: "1px solid var(--brand-primary)",
                            borderRadius: "8px",
                            fontWeight: 600,
                            fontSize: "0.85rem",
                            cursor: "pointer",
                            minHeight: "36px",
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
                          onClick={() => navigate(`/documents/${d.id}/edit`)}
                          style={{
                            padding: "8px 14px",
                            background: "transparent",
                            color: "var(--brand-text-secondary)",
                            border: "1px solid var(--brand-border)",
                            borderRadius: "8px",
                            fontWeight: 600,
                            fontSize: "0.85rem",
                            cursor: "pointer",
                            minHeight: "36px",
                          }}
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDownload(d)}
                          disabled={isDownloading}
                          style={{
                            padding: "8px 14px",
                            background: "transparent",
                            color: "var(--brand-primary)",
                            border: "1px solid var(--brand-primary)",
                            borderRadius: "8px",
                            fontWeight: 600,
                            fontSize: "0.85rem",
                            cursor: "pointer",
                            minHeight: "36px",
                            opacity: isDownloading ? 0.6 : 1,
                          }}
                        >
                          {isDownloading ? "Downloading…" : "Download PDF"}
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
              textAlign: "center",
              padding: "4rem 2rem",
              background: "var(--white)",
              borderRadius: "12px",
              border: "1px solid var(--brand-border)",
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>📄</div>
            <div
              style={{
                fontSize: "1.1rem",
                fontWeight: 700,
                color: "var(--brand-text-primary)",
                marginBottom: "0.5rem",
              }}
            >
              No documents yet.
            </div>
            <p
              style={{
                color: "var(--brand-text-secondary)",
                marginBottom: "1.5rem",
                margin: "0 0 1.5rem",
              }}
            >
              Create your first invoice or quotation to get started.
            </p>
            <button
              onClick={() => navigate("/documents/new")}
              style={{
                padding: "12px 24px",
                background: "var(--brand-primary)",
                color: "white",
                border: "none",
                borderRadius: "9999px",
                fontWeight: 700,
                fontSize: "1rem",
                cursor: "pointer",
                minHeight: "48px",
              }}
            >
              Create Your First Document
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Delete document"
        message="Are you sure you want to delete this document? This cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete(null)}
        danger
      />
    </div>
  );
};

export default Dashboard;
