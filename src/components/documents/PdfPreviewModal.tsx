import React, { useEffect, useRef } from "react";
import Button from "@components/core/Button";
import DocumentPreviewContent from "./DocumentPreviewContent";
import type { PdfPreviewData } from "./DocumentPreviewContent";

export type { PdfPreviewData };

type PdfPreviewModalProps = {
  open: boolean;
  data: PdfPreviewData | null;
  onClose: () => void;
};

const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  open,
  data,
  onClose,
}) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      closeButtonRef.current?.focus();
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, onClose]);

  if (!open || !data) return null;

  const title =
    data.type === "invoice" ? "Invoice Preview" : "Quotation Preview";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1100,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--md-surface-container-low, #f0f0ec)",
        overflow: "hidden",
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.75rem 1.5rem",
          backgroundColor: "var(--md-surface)",
          borderBottom: "1px solid var(--md-outline-variant)",
          flexShrink: 0,
          gap: "1rem",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "1rem",
            fontWeight: 600,
            color: "var(--md-on-surface)",
          }}
        >
          {title}
        </h2>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <Button variant="secondary" ref={closeButtonRef} onClick={onClose}>
            Back
          </Button>
          <Button onClick={() => window.print()}>Download PDF</Button>
        </div>
      </div>

      {/* Scroll area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "2.5rem 1rem",
        }}
      >
        <div
          style={{
            maxWidth: 800,
            margin: "0 auto",
            boxShadow:
              "0 4px 24px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)",
            borderRadius: "4px",
            overflow: "hidden",
          }}
        >
          <DocumentPreviewContent ref={contentRef} data={data} />
        </div>
      </div>
    </div>
  );
};

export default PdfPreviewModal;
