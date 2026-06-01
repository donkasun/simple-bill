import React from "react";
import { usePageTitle } from "@components/layout/PageTitleContext";
import PageHeader from "@components/layout/PageHeader";
import ErrorBanner from "@components/core/ErrorBanner";
import ConfirmDialog from "@components/core/ConfirmDialog";
import DocumentCard from "@components/documents/DocumentCard";
import DocumentsFilterBar from "@components/documents/DocumentsFilterBar";
import DocumentsEmptyState from "@components/documents/DocumentsEmptyState";
import NewDocumentMenu from "@components/documents/NewDocumentMenu";
import { useDocumentsPage } from "@hooks/pages/useDocumentsPage";

const Documents: React.FC = () => {
  usePageTitle("Documents");
  const vm = useDocumentsPage();

  return (
    <div className="app-page">
      <PageHeader
        title={vm.title}
        subtitle={vm.subtitle}
        actions={
          <NewDocumentMenu
            onNewDocument={vm.actions.navigateNewDocument}
            onNewInvoice={vm.actions.navigateNewInvoice}
            onNewQuotation={vm.actions.navigateNewQuotation}
          />
        }
      />

      <DocumentsFilterBar
        typeFilter={vm.typeFilter}
        statusFilter={vm.statusFilter}
        onTypeChange={vm.actions.setTypeFilter}
        onStatusChange={vm.actions.setStatusFilter}
      />

      <section className="dashboard-section">
        {vm.loading && (
          <div className="dashboard-loading">Loading documents…</div>
        )}
        {vm.firestoreError && <ErrorBanner>{vm.firestoreError}</ErrorBanner>}

        {vm.showDocumentList && vm.hasFilteredResults && (
          <div className="doc-card-list">
            {vm.filteredDocuments.map((d) => (
              <DocumentCard
                key={d.id}
                document={d}
                duplicatingId={vm.pending.duplicatingId}
                deletingId={vm.pending.deletingId}
                downloadingId={vm.pending.downloadingId}
                markingPaidId={vm.pending.markingPaidId}
                markingUnpaidId={vm.pending.markingUnpaidId}
                onDuplicate={vm.actions.duplicate}
                onDownload={vm.actions.download}
                onDelete={vm.actions.requestDelete}
                onMarkPaid={vm.actions.requestMarkPaid}
                onMarkUnpaid={vm.actions.requestMarkUnpaid}
              />
            ))}
          </div>
        )}

        {vm.showDocumentList && vm.hasDocuments && !vm.hasFilteredResults && (
          <DocumentsEmptyState variant="filtered" />
        )}

        {vm.showDocumentList && !vm.hasDocuments && (
          <DocumentsEmptyState
            variant="none"
            onCreate={vm.actions.navigateNewDocument}
          />
        )}
      </section>

      <ConfirmDialog
        isOpen={!!vm.confirms.deleteId}
        title="Delete document"
        message="Are you sure you want to delete this document? This cannot be undone."
        confirmLabel="Delete"
        onConfirm={vm.actions.confirmDelete}
        onCancel={vm.actions.cancelDelete}
        danger
      />
      <ConfirmDialog
        isOpen={!!vm.confirms.markPaidId}
        title="Mark as paid"
        message="Mark this document as paid? You can always undo this from the documents list."
        confirmLabel="Mark as paid"
        onConfirm={vm.actions.confirmMarkPaid}
        onCancel={vm.actions.cancelMarkPaid}
        danger={false}
      />
      <ConfirmDialog
        isOpen={!!vm.confirms.markUnpaidId}
        title="Mark as unpaid"
        message="Revert this document back to finalized (unpaid)?"
        confirmLabel="Mark as unpaid"
        onConfirm={vm.actions.confirmMarkUnpaid}
        onCancel={vm.actions.cancelMarkUnpaid}
        danger={false}
      />
    </div>
  );
};

export default Documents;
