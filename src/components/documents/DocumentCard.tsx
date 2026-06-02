import { useNavigate } from "react-router-dom";
import type { DocumentEntity } from "../../types/document";
import DocumentRowBody from "@components/documents/DocumentRowBody";
import type { DocumentRow } from "@hooks/pages/useDocumentsPage";

type DocumentCardProps = {
  document: DocumentRow;
  duplicatingId: string | null;
  deletingId: string | null;
  downloadingId: string | null;
  markingPaidId: string | null;
  markingUnpaidId: string | null;
  onDuplicate: (document: DocumentEntity) => void;
  onDownload: (document: DocumentEntity) => void;
  onDelete: (id: string) => void;
  onMarkPaid: (id: string) => void;
  onMarkUnpaid: (id: string) => void;
};

const getPrimaryAction = (
  document: DocumentEntity,
  isMarkingPaid: boolean,
  isDownloading: boolean,
) => {
  const isDraft = !document.status || document.status === "draft";
  if (isDraft) return { label: "Continue editing", kind: "edit" as const };
  if (document.status === "paid") {
    return {
      label: isDownloading ? "Downloading..." : "Download PDF",
      kind: "download" as const,
    };
  }
  return {
    label: isMarkingPaid ? "Saving..." : "Mark as paid",
    kind: "mark-paid" as const,
  };
};

const DocumentCard = ({
  document,
  duplicatingId,
  deletingId,
  downloadingId,
  markingPaidId,
  markingUnpaidId,
  onDuplicate,
  onDownload,
  onDelete,
  onMarkPaid,
  onMarkUnpaid,
}: DocumentCardProps) => {
  const navigate = useNavigate();
  const isDraft = !document.status || document.status === "draft";
  const isFinalized = document.status === "sent" || document.status === "ready";
  const isPaid = document.status === "paid";
  const isDeleting = deletingId === document.id;
  const isDownloading = downloadingId === document.id;
  const isMarkingPaid = markingPaidId === document.id;
  const isMarkingUnpaid = markingUnpaidId === document.id;
  const isDuplicating = duplicatingId === document.id;
  const isBusy = Boolean(
    isDeleting ||
    isDownloading ||
    isMarkingPaid ||
    isMarkingUnpaid ||
    duplicatingId,
  );
  const primaryAction = getPrimaryAction(
    document,
    isMarkingPaid,
    isDownloading,
  );

  const handlePrimaryAction = () => {
    if (!document.id) return;
    if (primaryAction.kind === "edit") {
      navigate(`/documents/${document.id}/edit`);
      return;
    }
    if (primaryAction.kind === "download") {
      onDownload(document);
      return;
    }
    onMarkPaid(document.id);
  };

  return (
    <article
      className={`doc-card doc-card--${document.status ?? "draft"} doc-card--${document.type}`}
    >
      <div className={`doc-card__summary dashboard-doc-row--${document.type}`}>
        <DocumentRowBody document={document} />
      </div>

      <div className="doc-card-actions">
        <button
          type="button"
          className={`doc-card-btn ${
            isFinalized ? "doc-card-btn--accent" : "doc-card-btn--primary"
          }`}
          onClick={handlePrimaryAction}
          disabled={isBusy}
        >
          {primaryAction.label}
        </button>

        <details className="doc-card-menu">
          <summary
            className="icon-btn doc-card-menu__trigger"
            aria-label="More document actions"
            title="More actions"
          >
            <span className="material-symbols-outlined" aria-hidden>
              more_horiz
            </span>
          </summary>
          <div className="doc-card-menu__content">
            {!isDraft && (
              <button
                type="button"
                onClick={() =>
                  document.id && navigate(`/documents/${document.id}/edit`)
                }
              >
                View or edit
              </button>
            )}
            {!isPaid && (
              <button
                type="button"
                onClick={() => onDownload(document)}
                disabled={isDownloading || Boolean(duplicatingId)}
              >
                {isDownloading ? "Downloading..." : "Download PDF"}
              </button>
            )}
            {isPaid && (
              <button
                type="button"
                onClick={() => document.id && onMarkUnpaid(document.id)}
                disabled={isMarkingUnpaid || Boolean(duplicatingId)}
              >
                {isMarkingUnpaid ? "Saving..." : "Mark as unpaid"}
              </button>
            )}
            {isFinalized && (
              <button
                type="button"
                onClick={() => document.id && onMarkPaid(document.id)}
                disabled={isMarkingPaid || Boolean(duplicatingId)}
              >
                {isMarkingPaid ? "Saving..." : "Mark as paid"}
              </button>
            )}
            <button
              type="button"
              onClick={() => onDuplicate(document)}
              disabled={Boolean(duplicatingId)}
            >
              {isDuplicating ? "Duplicating..." : "Duplicate"}
            </button>
            <button
              type="button"
              className="danger"
              onClick={() => document.id && onDelete(document.id)}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </details>
      </div>
    </article>
  );
};

export default DocumentCard;
