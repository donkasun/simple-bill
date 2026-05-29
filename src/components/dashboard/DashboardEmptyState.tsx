import React from "react";
import Button from "@components/core/Button";

type DashboardEmptyStateProps = {
  onCreateInvoice: () => void;
};

const DashboardEmptyState: React.FC<DashboardEmptyStateProps> = ({
  onCreateInvoice,
}) => {
  return (
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
          Let's create your first one! It only takes a minute to get started.
        </p>
      </div>
      <Button
        type="button"
        onClick={onCreateInvoice}
        style={{ borderRadius: 12, padding: "20px 40px" }}
      >
        Create first invoice
      </Button>
    </div>
  );
};

export default DashboardEmptyState;
