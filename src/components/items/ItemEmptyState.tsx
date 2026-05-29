import React from "react";
import Button from "@components/core/Button";

type ItemEmptyStateProps = {
  onAddClick: () => void;
};

const ItemEmptyState: React.FC<ItemEmptyStateProps> = ({ onAddClick }) => {
  return (
    <div
      style={{
        padding: "3rem 1rem",
        textAlign: "center",
        background: "var(--white)",
        borderRadius: "12px",
        border: "1px solid var(--brand-border)",
      }}
    >
      <div
        style={{
          fontSize: "1.25rem",
          fontWeight: "600",
          color: "var(--brand-text-primary)",
          marginBottom: "0.5rem",
        }}
      >
        No items saved yet.
      </div>
      <div style={{ color: "var(--brand-text-secondary)" }}>
        Add your first product or service to start invoicing.
      </div>
      <div style={{ marginTop: "1.25rem" }}>
        <Button onClick={onAddClick}>Add your first item</Button>
      </div>
    </div>
  );
};

export default ItemEmptyState;
