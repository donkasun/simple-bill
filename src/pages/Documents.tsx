import React, { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@auth/useAuth";
import { useFirestore } from "@hooks/useFirestore";
import { usePageTitle } from "@components/layout/PageTitleContext";
import PageHeader from "@components/layout/PageHeader";
import Button from "@components/core/Button";
import ErrorBanner from "@components/core/ErrorBanner";
import ConfirmDialog from "@components/core/ConfirmDialog";
import SegmentedToggle from "@components/core/SegmentedToggle";
import type { DocumentEntity } from "../types/document";
import { downloadBlob } from "@utils/download";
import { buildDuplicatePayload, getDocumentFilename } from "@utils/documents";
import { allocateNextDocumentNumber } from "@utils/docNumber";
import { todayIso } from "@utils/date";
import DocumentCard from "@components/documents/DocumentCard";

type DocumentRow = DocumentEntity & {
  typeLabel: string;
  customerName: string;
};

type TypeFilter = "all" | "invoice" | "quotation";
type StatusFilter = "all" | "draft" | "finalized" | "paid";

const Documents: React.FC = () => {
  usePageTitle("Documents");
  const navigate = useNavigate();
  const { user } = useAuth();

  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

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
        statusFilter === "all" ||
        d.status === statusFilter ||
        (!d.status && statusFilter === "draft");
      return typeMatch && statusMatch;
    });
  }, [documents, statusFilter, typeFilter]);

  const documentSummary = useMemo(() => {
    const drafts = documents.filter(
      (doc) => !doc.status || doc.status === "draft",
    ).length;
    const sent = documents.filter((doc) => doc.status === "finalized").length;
    const paid = documents.filter((doc) => doc.status === "paid").length;
    const countLabel = documents.length === 1 ? "document" : "documents";
    return `${documents.length} ${countLabel} · ${drafts} drafts · ${sent} sent · ${paid} paid`;
  }, [documents]);

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

  return (
    <div className="app-page">
      <PageHeader
        title="Documents"
        subtitle={documentSummary}
        actions={
          <div className="new-document-menu">
            <Button type="button" onClick={() => navigate("/documents/new")}>
              <span className="material-symbols-outlined filled page-header-cta-icon">
                add
              </span>
              New document
            </Button>
            <details className="new-document-menu__more">
              <summary aria-label="Choose document type" title="Choose type">
                <span className="material-symbols-outlined" aria-hidden>
                  expand_more
                </span>
              </summary>
              <div className="new-document-menu__content">
                <button
                  type="button"
                  onClick={() => navigate("/documents/new")}
                >
                  New invoice
                </button>
                <button
                  type="button"
                  onClick={() =>
                    navigate("/documents/new", {
                      state: { documentType: "quotation" },
                    })
                  }
                >
                  New quotation
                </button>
              </div>
            </details>
          </div>
        }
      />

      <div className="docs-filter-bar">
        <SegmentedToggle
          id="doc-type-filter"
          ariaLabel="Filter by document type"
          value={typeFilter}
          options={[
            { value: "all", label: "All types" },
            { value: "invoice", label: "Invoices" },
            { value: "quotation", label: "Quotations" },
          ]}
          onChange={setTypeFilter}
        />
        <SegmentedToggle
          id="doc-status-filter"
          ariaLabel="Filter by status"
          value={statusFilter}
          options={[
            { value: "all", label: "All" },
            { value: "draft", label: "Draft" },
            { value: "finalized", label: "Sent" },
            { value: "paid", label: "Paid" },
          ]}
          onChange={setStatusFilter}
        />
      </div>

      <section className="dashboard-section">
        {loading && <div className="dashboard-loading">Loading documents…</div>}
        {error && <ErrorBanner>{error}</ErrorBanner>}
        {mutationError && <ErrorBanner>{mutationError}</ErrorBanner>}

        {!loading && !error && filtered.length > 0 && (
          <div className="doc-card-list">
            {filtered.map((d) => (
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
