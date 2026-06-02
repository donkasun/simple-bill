import React from "react";
import Button from "@components/core/Button";
import ErrorBanner from "@components/core/ErrorBanner";
import { useParams } from "react-router-dom";
import { usePageTitle } from "@components/layout/PageTitleContext";
import PageHeader from "@components/layout/PageHeader";
import DocumentEditorForm from "@components/documents/DocumentEditorForm";
import CustomerModal from "@components/customers/CustomerModal";
import ItemModal from "@components/items/ItemModal";
import { useDocumentPage } from "@hooks/pages/useDocumentPage";

const DocumentEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const vm = useDocumentPage({ mode: "edit", documentId: id ?? "" });
  const { flags, banners, catalogModals, actions } = vm;

  const pageTitle = flags.canEdit ? "Edit Document" : "View Document";
  usePageTitle(pageTitle);

  const headerTitle = flags.canEdit ? "Edit document" : "View document";
  const headerSubtitle = flags.canEdit
    ? "Update details, then save or download a PDF."
    : flags.documentStatus === "draft"
      ? "Draft — click Edit to start making changes."
      : "This document is finalized and cannot be edited.";

  return (
    <>
      <div className="app-page">
        <PageHeader
          toolbar
          title={headerTitle}
          subtitle={headerSubtitle}
          secondaryActions={
            <Button variant="secondary" onClick={actions.navigateCancel}>
              Cancel
            </Button>
          }
          actions={
            <>
              {flags.canEdit ? (
                <>
                  <Button
                    onClick={actions.saveChanges}
                    disabled={
                      flags.saving || flags.finalizing || flags.initializing
                    }
                  >
                    {flags.saving ? "Saving…" : "Save changes"}
                  </Button>
                  <Button
                    onClick={actions.finalizeAndDownload}
                    disabled={
                      flags.saving ||
                      flags.finalizing ||
                      flags.initializing ||
                      vm.finalizeDisabled
                    }
                  >
                    {flags.finalizing ? "Finishing…" : "Finish & download PDF"}
                  </Button>
                </>
              ) : (
                <>
                  {flags.documentStatus === "draft" && (
                    <Button
                      variant="secondary"
                      onClick={actions.enterEditMode}
                      disabled={flags.initializing}
                    >
                      Edit document
                    </Button>
                  )}
                  {flags.documentStatus !== "draft" && (
                    <Button
                      variant="secondary"
                      onClick={actions.downloadDocument}
                      disabled={flags.downloading || flags.initializing}
                    >
                      {flags.downloading ? "Downloading…" : "Download PDF"}
                    </Button>
                  )}
                  {vm.state.documentType === "quotation" && (
                    <Button
                      onClick={actions.generateInvoice}
                      disabled={flags.generatingInvoice || flags.initializing}
                    >
                      {flags.generatingInvoice
                        ? "Generating…"
                        : "Generate invoice"}
                    </Button>
                  )}
                </>
              )}
            </>
          }
        />

        {flags.initializing && <div>Loading document…</div>}
        {banners.loadError && <ErrorBanner>{banners.loadError}</ErrorBanner>}
        {!flags.canEdit &&
          flags.documentStatus !== "draft" &&
          !flags.initializing &&
          !banners.loadError && (
            <ErrorBanner variant="warning">
              This document has been finalized and cannot be edited.
              {vm.state.documentType === "quotation" && (
                <div style={{ marginTop: 8 }}>
                  You can generate invoices from this finalized quotation.
                </div>
              )}
            </ErrorBanner>
          )}
        {banners.saveError && <ErrorBanner>{banners.saveError}</ErrorBanner>}
        {banners.finalizeError && (
          <ErrorBanner>{banners.finalizeError}</ErrorBanner>
        )}
        {banners.generateError && (
          <ErrorBanner>{banners.generateError}</ErrorBanner>
        )}

        {flags.showForm && <DocumentEditorForm {...vm.formProps} />}
      </div>

      <CustomerModal
        open={catalogModals.customerModalOpen}
        title="Add customer"
        submitting={catalogModals.customerSubmitting}
        onSubmit={catalogModals.handleCustomerSubmit}
        onCancel={catalogModals.closeCustomerModal}
      />
      <ItemModal
        open={catalogModals.itemModalOpen}
        title="Add product or service"
        submitting={catalogModals.itemSubmitting}
        onSubmit={catalogModals.handleItemSubmit}
        onCancel={catalogModals.closeItemModal}
      />
    </>
  );
};

export default DocumentEdit;
