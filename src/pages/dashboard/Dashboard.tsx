import React from "react";
import ErrorBanner from "@components/core/ErrorBanner";
import ConfirmDialog from "@components/core/ConfirmDialog";
import { usePageTitle } from "@components/layout/PageTitleContext";
import PageHeader from "@components/layout/PageHeader";
import DocumentCard from "@components/documents/DocumentCard";
import DashboardSummaryStrip from "@components/dashboard/DashboardSummaryStrip";
import DashboardQuickActions from "@components/dashboard/DashboardQuickActions";
import DashboardEmptyState from "@components/dashboard/DashboardEmptyState";
import { useDashboardPage } from "@hooks/pages/useDashboardPage";

const Dashboard: React.FC = () => {
  usePageTitle("Home");
  const vm = useDashboardPage();

  const headline = vm.firstName
    ? `Welcome back, ${vm.firstName}`
    : "Welcome back";

  return (
    <div className="app-page dashboard-page">
      <PageHeader
        className="page-header--flush page-header--dashboard"
        size="large"
        title={headline}
        subtitle="Here is your clean status summary for this month."
        actions={
          <button
            type="button"
            className="dashboard-header-cta btn-primary"
            onClick={vm.actions.navigateToNewInvoice}
          >
            <span className="material-symbols-outlined filled" aria-hidden>
              add_circle
            </span>
            New Invoice
          </button>
        }
      />

      <DashboardSummaryStrip
        statusCounts={vm.statusCounts}
        onPaidClick={vm.actions.navigateToPaid}
        onSentClick={vm.actions.navigateToSent}
        onDraftClick={vm.actions.navigateToDrafts}
      />

      <DashboardQuickActions
        quickActionCustomers={vm.quickActionCustomers}
        customerUsage={vm.customerUsage}
        onNewInvoice={vm.actions.navigateToNewInvoice}
        onNewQuotation={vm.actions.navigateToNewQuotation}
        onCustomerClick={vm.actions.navigateToCustomerInvoice}
      />

      <section className="dashboard-section">
        <div className="dashboard-section__head">
          <h2 className="page-section-label">Latest documents</h2>
          {vm.hasDocuments && (
            <button
              type="button"
              className="dashboard-view-all"
              onClick={vm.actions.navigateToDocuments}
            >
              View all →
            </button>
          )}
        </div>

        {vm.loading && (
          <div className="dashboard-loading">Loading documents…</div>
        )}
        {vm.firestoreError && <ErrorBanner>{vm.firestoreError}</ErrorBanner>}
        {vm.mutationError && <ErrorBanner>{vm.mutationError}</ErrorBanner>}

        {vm.showRecentList && vm.hasDocuments && (
          <div className="doc-card-list">
            {vm.recentDocuments.map((d) => (
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

        {vm.showRecentList && !vm.hasDocuments && (
          <DashboardEmptyState
            onCreateInvoice={vm.actions.navigateToCreateFirstInvoice}
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
        message="Mark this document as paid? You can always undo this from the dashboard."
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

export default Dashboard;
