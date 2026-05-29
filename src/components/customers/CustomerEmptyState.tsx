import React from "react";
import Button from "@components/core/Button";

type CustomerEmptyStateProps = {
  onAddClick: () => void;
};

const CustomerEmptyState: React.FC<CustomerEmptyStateProps> = ({
  onAddClick,
}) => {
  return (
    <div
      style={{
        padding: "3rem 2rem",
        textAlign: "center",
        border: "2px dashed var(--brand-border)",
        borderRadius: "12px",
      }}
    >
      <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>👥</div>
      <div
        style={{
          fontWeight: 700,
          fontSize: "1.1rem",
          color: "var(--brand-text-primary)",
          marginBottom: "0.5rem",
        }}
      >
        Grow your list
      </div>
      <div
        style={{
          color: "var(--brand-text-secondary)",
          fontSize: "0.9rem",
          marginBottom: "1.25rem",
        }}
      >
        Every great business starts with a customer. Add your first one to begin
        invoicing.
      </div>
      <Button onClick={onAddClick}>Add your first customer</Button>
    </div>
  );
};

export default CustomerEmptyState;
