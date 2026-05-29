import React from "react";
import type { DashboardFinancialSummary } from "@hooks/pages/useDashboardPage";

type DashboardSummaryStripProps = {
  financialSummary: DashboardFinancialSummary;
  formatSummaryCurrency: (value: number) => string;
  onDraftsClick: () => void;
};

const DashboardSummaryStrip: React.FC<DashboardSummaryStripProps> = ({
  financialSummary,
  formatSummaryCurrency,
  onDraftsClick,
}) => {
  return (
    <section className="dashboard-summary-strip" aria-label="Financial summary">
      <div className="dashboard-summary-strip__item dashboard-summary-strip__item--primary">
        <span>Awaiting payment</span>
        <strong>{formatSummaryCurrency(financialSummary.outstanding)}</strong>
      </div>
      <div className="dashboard-summary-strip__item">
        <span>Paid this month</span>
        <strong>{formatSummaryCurrency(financialSummary.paidThisMonth)}</strong>
      </div>
      <button
        type="button"
        className="dashboard-summary-strip__item dashboard-summary-strip__item--link"
        onClick={onDraftsClick}
      >
        <span>Drafts</span>
        <strong>{financialSummary.drafts}</strong>
      </button>
    </section>
  );
};

export default DashboardSummaryStrip;
