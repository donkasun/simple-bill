import React from "react";
import Button from "@components/core/Button";
import ConfirmDialog from "@components/core/ConfirmDialog";
import ErrorBanner from "@components/core/ErrorBanner";
import { useParams } from "react-router-dom";
import { usePageTitle } from "@components/layout/PageTitleContext";
import PageHeader from "@components/layout/PageHeader";
import DocumentEditorForm from "@components/documents/DocumentEditorForm";
import CustomerModal from "@components/customers/CustomerModal";
import ItemModal from "@components/items/ItemModal";
import { useDocumentPage } from "@hooks/pages/useDocumentPage";
import PdfPreviewModal from "@components/documents/PdfPreviewModal";

const DocumentEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const vm = useDocumentPage({ mode: "edit", documentId: id ?? "" });
  const { flags, banners, catalogModals, actions } = vm;

  const pageTitle = flags.canEdit ? "Edit Document" : "View Document";
  usePageTitle(pageTitle);

  const headerTitle = flags.canEdit ? "Edit document" : "View document";
  const headerSubtitle = flags.canEdit
    ? "Update details, then save or download a PDF."
    : flags.documentStatus === "draft" || flags.documentStatus === "ready"
      ? "Click Edit to make changes."
      : "This document has been sent and cannot be edited.";

  return (
    <>
      <div className="app-page">
        <PageHeader
          toolbar
          title={headerTitle}
          subtitle={headerSubtitle}
          secondaryActions={
            <Button variant="secondary" onClick={actions.navigateCancel}>
              Back
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
                    onClick={actions.downloadPdf}
                    disabled={
                      flags.saving ||
                      flags.finalizing ||
                      flags.initializing ||
                      vm.finalizeDisabled
                    }
                  >
                    {flags.finalizing ? "Preparing…" : "View PDF"}
                  </Button>
                </>
              ) : (
                <>
                  {(flags.documentStatus === "draft" ||
                    flags.documentStatus === "ready") && (
                    <Button
                      variant="secondary"
                      onClick={actions.enterEditMode}
                      disabled={flags.initializing}
                    >
                      Edit document
                    </Button>
                  )}
                  {flags.documentStatus === "ready" && (
                    <Button
                      onClick={actions.markAsSent}
                      disabled={flags.initializing}
                    >
                      Mark as sent
                    </Button>
                  )}
                  {(flags.documentStatus === "ready" ||
                    flags.documentStatus === "sent" ||
                    flags.documentStatus === "paid") && (
                    <Button
                      variant="secondary"
                      onClick={actions.downloadDocument}
                      disabled={flags.initializing}
                    >
                      View PDF
                    </Button>
                  )}
                  {vm.state.documentType === "quotation" &&
                    flags.documentStatus === "sent" && (
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
          flags.documentStatus === "sent" &&
          !flags.initializing &&
          !banners.loadError && (
            <ErrorBanner variant="warning">
              This document has been sent and cannot be edited.
              {vm.state.documentType === "quotation" && (
                <div style={{ marginTop: 8 }}>
                  You can generate invoices from this sent quotation.
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
      <PdfPreviewModal
        open={!!vm.previewData}
        data={vm.previewData}
        onClose={vm.actions.closePreview}
      />
      <ConfirmDialog
        isOpen={vm.discardDialog.isOpen}
        title="Unsaved changes"
        message="You have unsaved changes that will be lost. Go back anyway?"
        confirmLabel="Leave"
        cancelLabel="Stay"
        danger={false}
        onConfirm={vm.discardDialog.onConfirm}
        onCancel={vm.discardDialog.onCancel}
      />
    </>
  );
};

export default DocumentEdit;
