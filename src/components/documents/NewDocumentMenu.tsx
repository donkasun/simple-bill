import React from "react";
import Button from "@components/core/Button";

type NewDocumentMenuProps = {
  onNewDocument: () => void;
  onNewInvoice: () => void;
  onNewQuotation: () => void;
};

const NewDocumentMenu: React.FC<NewDocumentMenuProps> = ({
  onNewDocument,
  onNewInvoice,
  onNewQuotation,
}) => {
  return (
    <div className="new-document-menu">
      <Button type="button" onClick={onNewDocument}>
        <span className="material-symbols-outlined filled page-header-cta-icon">
          add
        </span>
        New document
      </Button>
      <details className="new-document-menu__more">
        <summary aria-label="Choose document type" title="Choose type">
          <span className="material-symbols-outlined" aria-hidden>
            expand_more
          </span>
        </summary>
        <div className="new-document-menu__content">
          <button type="button" onClick={onNewInvoice}>
            New invoice
          </button>
          <button type="button" onClick={onNewQuotation}>
            New quotation
          </button>
        </div>
      </details>
    </div>
  );
};

export default NewDocumentMenu;
