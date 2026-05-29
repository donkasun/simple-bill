import React from "react";
import type { CustomerRow } from "@hooks/pages/useCustomersPage";

type CustomerListRowProps = {
  customer: CustomerRow;
  deleting: boolean;
  onEdit: (customer: CustomerRow) => void;
  onDelete: (id: string) => void;
};

const CustomerListRow: React.FC<CustomerListRowProps> = ({
  customer,
  deleting,
  onEdit,
  onDelete,
}) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        background: "var(--white)",
        border: "1px solid var(--brand-border)",
        borderRadius: "12px",
        padding: "0.875rem 1.25rem",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: "var(--brand-background)",
          color: "var(--brand-primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: "1rem",
          flexShrink: 0,
        }}
      >
        {customer.name[0]?.toUpperCase() ?? "?"}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 600,
            color: "var(--brand-text-primary)",
            fontSize: "0.95rem",
          }}
        >
          {customer.name}
        </div>
        {customer.addressDisplay && customer.addressDisplay !== "-" && (
          <div
            style={{
              fontSize: "0.8rem",
              color: "var(--brand-text-muted)",
              marginTop: 2,
            }}
          >
            {customer.addressDisplay}
          </div>
        )}
      </div>

      <div className="list-row-actions">
        <button
          type="button"
          className="link-btn"
          style={{ minHeight: "44px" }}
          onClick={() => onEdit(customer)}
        >
          Edit
        </button>
        <button
          type="button"
          className="icon-btn icon-btn-danger"
          aria-label={deleting ? "Deleting customer" : "Delete customer"}
          title="Delete customer"
          disabled={deleting}
          onClick={() => customer.id && onDelete(customer.id)}
        >
          <span className="material-symbols-outlined" aria-hidden>
            delete
          </span>
        </button>
      </div>
    </div>
  );
};

export default CustomerListRow;
