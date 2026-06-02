import React, { useEffect, useId, useRef } from "react";
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
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    closeButtonRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open || !data) return null;

  const title =
    data.type === "invoice" ? "Invoice Preview" : "Quotation Preview";

  return (
    <div
      className="pdf-preview-modal-backdrop"
      role="presentation"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(1rem, 4vw, 2rem)",
        backgroundColor: "rgba(0, 0, 0, 0.55)",
        backdropFilter: "blur(3px)",
      }}
      onClick={onClose}
    >
      <div
        className="pdf-preview-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 860,
          maxHeight: "100%",
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          backgroundColor: "var(--md-surface-container-low, #f0f0ec)",
          borderRadius: "var(--dashboard-radius-xl, 16px)",
          overflow: "hidden",
          boxShadow: "0 24px 64px rgba(0, 0, 0, 0.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="pdf-preview-modal-toolbar"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            padding: "0.75rem 1.5rem",
            backgroundColor: "var(--md-surface)",
            borderBottom: "1px solid var(--md-outline-variant)",
            flexShrink: 0,
            gap: "0.75rem 1rem",
          }}
        >
          <h2
            id={titleId}
            style={{
              margin: 0,
              fontSize: "1rem",
              fontWeight: 600,
              color: "var(--md-on-surface)",
            }}
          >
            {title}
          </h2>
          <div
            style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}
          >
            <Button variant="secondary" ref={closeButtonRef} onClick={onClose}>
              Back
            </Button>
            <Button onClick={() => window.print()}>Download PDF</Button>
          </div>
        </div>

        <div
          className="pdf-preview-modal-scroll"
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            padding: "clamp(1.25rem, 3vw, 2rem) clamp(1rem, 2vw, 1.5rem)",
          }}
        >
          <div
            style={{
              maxWidth: 760,
              margin: "0 auto",
              boxShadow:
                "0 4px 24px rgba(0, 0, 0, 0.12), 0 1px 4px rgba(0, 0, 0, 0.08)",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            <DocumentPreviewContent ref={contentRef} data={data} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfPreviewModal;
