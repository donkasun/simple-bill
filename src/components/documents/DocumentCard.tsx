import { useNavigate } from "react-router-dom";
import type { DocumentEntity } from "../../types/document";
import { formatCurrency } from "@utils/currency";
import { formatIsoDate } from "@utils/date";

type DocumentCardProps = {
  document: DocumentEntity & {
    typeLabel: string;
    customerName: string;
  };
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
  const isFinalized = document.status === "finalized";
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
  const badge = badgeStyles[document.status ?? "draft"] ?? badgeStyles.draft;
  const primaryAction = getPrimaryAction(
    document,
    isMarkingPaid,
    isDownloading,
  );
  const iconName =
    document.type === "quotation" ? "request_quote" : "receipt_long";
  const docNumber = document.docNumber || "-";
  const displayDate = document.date ? formatIsoDate(document.date) : "—";

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
    <div
      className={`doc-card doc-card--${document.status ?? "draft"} doc-card--${document.type}`}
    >
      <div className="doc-card__main">
        <div className="doc-card__icon" aria-hidden>
          <span className="material-symbols-outlined icon-md">{iconName}</span>
        </div>
        <div className="doc-card__info">
          <h5 className="doc-card__title">{document.customerName}</h5>
          <p className="doc-card__meta">
            <span>{document.typeLabel}</span>
            <span>#{docNumber}</span>
            <span>{displayDate}</span>
          </p>
        </div>
      </div>

      <div className="doc-card-amount">
        <span
          className={`doc-card__amount ${
            isDraft
              ? "doc-card__amount--draft"
              : isFinalized
                ? "doc-card__amount--finalized"
                : "doc-card__amount--paid"
          }`}
        >
          {formatCurrency(document.total, document.currency || "USD")}
        </span>
        <span
          className="doc-card__status"
          style={{ background: badge.bg, color: badge.color }}
        >
          {badge.label}
        </span>
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
    </div>
  );
};

export default DocumentCard;
