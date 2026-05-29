import React from "react";
import Button from "@components/core/Button";

type DocumentsEmptyStateProps = {
  variant: "none" | "filtered";
  onCreate?: () => void;
};

const DocumentsEmptyState: React.FC<DocumentsEmptyStateProps> = ({
  variant,
  onCreate,
}) => {
  if (variant === "filtered") {
    return (
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
    );
  }

  return (
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
      {onCreate ? (
        <Button type="button" onClick={onCreate}>
          Create first invoice
        </Button>
      ) : null}
    </div>
  );
};

export default DocumentsEmptyState;
