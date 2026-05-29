import React from "react";
import SegmentedToggle from "@components/core/SegmentedToggle";
import type { StatusFilter, TypeFilter } from "@hooks/pages/useDocumentsPage";

type DocumentsFilterBarProps = {
  typeFilter: TypeFilter;
  statusFilter: StatusFilter;
  onTypeChange: (value: TypeFilter) => void;
  onStatusChange: (value: StatusFilter) => void;
};

const DocumentsFilterBar: React.FC<DocumentsFilterBarProps> = ({
  typeFilter,
  statusFilter,
  onTypeChange,
  onStatusChange,
}) => {
  return (
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
        onChange={onTypeChange}
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
        onChange={onStatusChange}
      />
    </div>
  );
};

export default DocumentsFilterBar;
