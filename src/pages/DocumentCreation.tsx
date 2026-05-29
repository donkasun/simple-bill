import React from "react";
import Button from "@components/core/Button";
import ErrorBanner from "@components/core/ErrorBanner";
import OnboardingStepper from "@components/core/OnboardingStepper";
import { usePageTitle } from "@components/layout/PageTitleContext";
import PageHeader from "@components/layout/PageHeader";
import DocumentEditorForm from "@components/documents/DocumentEditorForm";
import CustomerModal from "@components/customers/CustomerModal";
import ItemModal from "@components/items/ItemModal";
import { useDocumentPage } from "@hooks/pages/useDocumentPage";

const DocumentCreation: React.FC = () => {
  usePageTitle("Create Document");
  const vm = useDocumentPage({ mode: "create" });
  const { flags, banners, catalogModals, actions } = vm;

  return (
    <>
      <div className="app-page">
        <PageHeader
          toolbar
          title="New invoice or quote"
          subtitle="Fill in the details below, then save a draft or download a PDF."
          secondaryActions={
            <>
              <Button variant="secondary" onClick={actions.navigateCancel}>
                Cancel
              </Button>
              <Button
                variant="secondary"
                onClick={actions.copyFromPrevious}
                disabled={flags.prefilling || flags.saving || flags.finalizing}
                aria-disabled={
                  flags.prefilling || flags.saving || flags.finalizing
                }
              >
                {flags.prefilling ? "Copying…" : "Copy from previous"}
              </Button>
            </>
          }
          actions={
            <>
              <Button
                onClick={actions.saveDraft}
                disabled={flags.saving || flags.finalizing}
                aria-disabled={flags.saving || flags.finalizing}
              >
                {flags.saving ? "Saving…" : "Save draft"}
              </Button>
              <Button
                onClick={actions.finalizeAndDownload}
                disabled={
                  flags.saving || flags.finalizing || vm.finalizeDisabled
                }
                aria-disabled={
                  flags.saving || flags.finalizing || vm.finalizeDisabled
                }
              >
                {flags.finalizing ? "Finalizing…" : "Finalize & download PDF"}
              </Button>
            </>
          }
        />

        {banners.saveError && <ErrorBanner>{banners.saveError}</ErrorBanner>}
        {banners.finalizeError && (
          <ErrorBanner>{banners.finalizeError}</ErrorBanner>
        )}

        {flags.showCreateGuide && (
          <OnboardingStepper
            title="First invoice guide"
            onDismissForever={actions.dismissCreateGuide}
            steps={[
              {
                id: "billto",
                title: "Who are you billing?",
                body: (
                  <div>
                    Pick the customer you’re billing in <strong>Bill To</strong>
                    . If you don’t see them yet, add them from the Customers
                    page first.
                  </div>
                ),
              },
              {
                id: "items",
                title: "What are you charging for?",
                body: (
                  <div>
                    Add line items for products or services. You can choose from
                    saved items or type a custom name.
                  </div>
                ),
              },
              {
                id: "totals",
                title: "Double-check currency and totals",
                body: (
                  <div>
                    Choose a currency for this document and quickly review the
                    subtotal and total before saving.
                  </div>
                ),
              },
              {
                id: "save",
                title: "Save draft vs finalize",
                body: (
                  <div>
                    <strong>Save Draft</strong> keeps it editable.{" "}
                    <strong>Finalize</strong> generates a PDF for sharing.
                  </div>
                ),
              },
            ]}
          />
        )}

        {flags.showForm && (
          <DocumentEditorForm
            {...vm.formProps}
            showDocumentTypeHint
            showDraftFinalizeHint
          />
        )}
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

export default DocumentCreation;
