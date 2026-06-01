import type { DocumentRow } from "@hooks/pages/useDocumentsPage";
import { formatCurrency } from "@utils/currency";
import { formatDashboardDocumentRowDate } from "@utils/dashboardDocumentRowDate";
import {
  getDocumentListTitle,
  getDocumentStatusPill,
  getDocumentTypeIconName,
} from "@utils/documentDisplay";

type DocumentRowBodyProps = {
  document: DocumentRow;
};

/** Shared compact row content for dashboard and documents list. */
const DocumentRowBody = ({ document }: DocumentRowBodyProps) => {
  const statusPill = getDocumentStatusPill(document.status);
  const amount = formatCurrency(document.total, document.currency ?? "USD");
  const dateLabel = formatDashboardDocumentRowDate(document);
  const isPendingDate = dateLabel === "Pending";
  const title = getDocumentListTitle(document);
  const iconName = getDocumentTypeIconName(document.type);

  return (
    <>
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
    </>
  );
};

export default DocumentRowBody;
