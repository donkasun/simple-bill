import { useNavigate } from "react-router-dom";
import type { DocumentRow } from "@hooks/pages/useDocumentsPage";
import { formatCurrency } from "@utils/currency";
import { formatDashboardDocumentRowDate } from "@utils/dashboardDocumentRowDate";

type DashboardDocumentRowProps = {
  document: DocumentRow;
  animationDelayClass?: string;
};

type StatusPill = {
  label: string;
  modifier: "paid" | "sent" | "draft";
};

function getStatusPill(status: DocumentRow["status"]): StatusPill {
  if (status === "paid") {
    return { label: "Paid", modifier: "paid" };
  }
  if (status === "finalized") {
    return { label: "Sent", modifier: "sent" };
  }
  return { label: "Draft", modifier: "draft" };
}

const DashboardDocumentRow = ({
  document,
  animationDelayClass,
}: DashboardDocumentRowProps) => {
  const navigate = useNavigate();
  const statusPill = getStatusPill(document.status);
  const amount = formatCurrency(document.total, document.currency ?? "USD");
  const dateLabel = formatDashboardDocumentRowDate(document);
  const isPendingDate = dateLabel === "Pending";
  const title = `${document.typeLabel} ${document.docNumber}`;
  const iconName =
    document.type === "quotation" ? "request_quote" : "receipt_long";

  return (
    <button
      type="button"
      className={`dashboard-doc-row dashboard-doc-row--${document.type} dashboard-animate-fade-up ${animationDelayClass ?? ""}`.trim()}
      onClick={() => navigate(`/documents/${document.id}/edit`)}
    >
      <div className="dashboard-doc-row__start">
        <div className="dashboard-doc-row__icon" aria-hidden>
          <span className="material-symbols-outlined">{iconName}</span>
        </div>
        <div className="dashboard-doc-row__details">
          <div className="dashboard-doc-row__title-row">
            <span className="dashboard-doc-row__number">{title}</span>
            <span
              className={`dashboard-doc-row__pill dashboard-doc-row__pill--${statusPill.modifier}`}
            >
              {statusPill.label}
            </span>
          </div>
          <span className="dashboard-doc-row__customer">
            {document.customerName}
          </span>
        </div>
      </div>
      <div className="dashboard-doc-row__end">
        <span className="dashboard-doc-row__amount">{amount}</span>
        <span
          className={`dashboard-doc-row__date${isPendingDate ? " dashboard-doc-row__date--pending" : ""}`}
        >
          {dateLabel}
        </span>
      </div>
    </button>
  );
};

export default DashboardDocumentRow;
