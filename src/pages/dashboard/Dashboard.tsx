import React from "react";
import ErrorBanner from "@components/core/ErrorBanner";
import { usePageTitle } from "@components/layout/PageTitleContext";
import PageHeader from "@components/layout/PageHeader";
import DashboardCustomerSpotlight from "@components/dashboard/DashboardCustomerSpotlight";
import DashboardTaxSeasonTip from "@components/dashboard/DashboardTaxSeasonTip";
import DashboardDocumentRow from "@components/dashboard/DashboardDocumentRow";
import DashboardSummaryStrip from "@components/dashboard/DashboardSummaryStrip";
import DashboardEmptyState from "@components/dashboard/DashboardEmptyState";
import { useDashboardPage } from "@hooks/pages/useDashboardPage";

const ROW_ANIMATION_DELAYS = [
  "dashboard-animate-fade-up--delay-4",
  "dashboard-animate-fade-up--delay-5",
  "dashboard-animate-fade-up--delay-6",
  "dashboard-animate-fade-up--delay-7",
  "dashboard-animate-fade-up--delay-7",
] as const;

const Dashboard: React.FC = () => {
  usePageTitle("Home");
  const vm = useDashboardPage();

  const headline = vm.firstName
    ? `Welcome back, ${vm.firstName}`
    : "Welcome back";

  return (
    <div className="app-page dashboard-page">
      <div className="dashboard-ambient" aria-hidden>
        <div className="dashboard-ambient__blob dashboard-ambient__blob--primary" />
        <div className="dashboard-ambient__blob dashboard-ambient__blob--secondary" />
      </div>

      <PageHeader
        className="page-header--flush page-header--dashboard"
        size="large"
        title={headline}
        subtitle="Here is your clean status summary for this month."
        actions={
          <button
            type="button"
            className="dashboard-header-cta btn-primary dashboard-pulse-breathing"
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

      <div className="dashboard-split">
        <section className="dashboard-section dashboard-split__main">
          <div className="dashboard-section__head">
            <h2 className="page-section-label">Recent Documents</h2>
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

          {vm.showRecentList && vm.hasDocuments && (
            <div className="dashboard-doc-row-list">
              {vm.recentDocuments.map((document, index) => (
                <DashboardDocumentRow
                  key={document.id}
                  document={document}
                  animationDelayClass={
                    ROW_ANIMATION_DELAYS[
                      Math.min(index, ROW_ANIMATION_DELAYS.length - 1)
                    ]
                  }
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

        <aside
          className="dashboard-split__aside"
          aria-label="Dashboard highlights"
        >
          <div className="dashboard-aside-stack dashboard-animate-slide-right dashboard-animate-fade-up--delay-3">
            {vm.spotlightCustomer && (
              <DashboardCustomerSpotlight
                customer={vm.spotlightCustomer}
                formatCurrency={vm.formatSummaryCurrency}
              />
            )}
            <DashboardTaxSeasonTip message={vm.taxSeasonTip} />
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;
