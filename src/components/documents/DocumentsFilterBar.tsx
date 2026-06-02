import React from "react";
import ChoiceTileGroup from "@components/core/ChoiceTileGroup";
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
      <ChoiceTileGroup
        id="doc-type-filter"
        ariaLabel="Filter by document type"
        value={typeFilter}
        columns={3}
        options={[
          { value: "all", label: "All" },
          { value: "invoice", label: "Invoices" },
          { value: "quotation", label: "Quotations" },
        ]}
        onChange={onTypeChange}
      />
      <ChoiceTileGroup
        id="doc-status-filter"
        ariaLabel="Filter by status"
        value={statusFilter}
        columns={5}
        options={[
          { value: "all", label: "All" },
          { value: "draft", label: "Draft" },
          { value: "ready", label: "Ready" },
          { value: "sent", label: "Sent" },
          { value: "paid", label: "Paid" },
        ]}
        onChange={onStatusChange}
      />
    </div>
  );
};

export default DocumentsFilterBar;
