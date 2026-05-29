import React from "react";
import type { Customer } from "../../types/customer";
import type { CustomerUsageMap } from "@utils/customerUsage";
import { formatLastBilled } from "@utils/customerUsage";

type DashboardQuickActionsProps = {
  quickActionCustomers: Customer[];
  customerUsage: CustomerUsageMap;
  onNewInvoice: () => void;
  onNewQuotation: () => void;
  onCustomerClick: (customerId: string) => void;
};

const DashboardQuickActions: React.FC<DashboardQuickActionsProps> = ({
  quickActionCustomers,
  customerUsage,
  onNewInvoice,
  onNewQuotation,
  onCustomerClick,
}) => {
  return (
    <section className="dashboard-section">
      <div className="dashboard-section__head">
        <h2 className="page-section-label">Quick actions</h2>
      </div>
      <div className="dashboard-quick-actions">
        {quickActionCustomers.length > 0 && (
          <div className="quick-action-customers">
            {quickActionCustomers.map((customer) => (
              <button
                key={customer.id}
                type="button"
                className="quick-action-card quick-action-card--customer"
                onClick={() => onCustomerClick(customer.id!)}
              >
                <div className="quick-action-card__avatar">
                  {(customer.name?.[0] ?? "?").toUpperCase()}
                </div>
                <div className="quick-action-card__body">
                  <span className="quick-action-card__name">
                    {customer.name}
                  </span>
                  <span className="quick-action-card__hint">
                    {formatLastBilled(customerUsage[customer.id!] ?? 0)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="quick-action-secondary">
          <button
            type="button"
            className="quick-action-card quick-action-card--generic"
            onClick={onNewInvoice}
          >
            <span className="material-symbols-outlined quick-action-card__icon">
              receipt_long
            </span>
            <div className="quick-action-card__body">
              <span className="quick-action-card__name">New invoice</span>
              <span className="quick-action-card__hint">
                Choose any customer
              </span>
            </div>
          </button>

          <button
            type="button"
            className="quick-action-card quick-action-card--generic"
            onClick={onNewQuotation}
          >
            <span className="material-symbols-outlined quick-action-card__icon">
              request_quote
            </span>
            <div className="quick-action-card__body">
              <span className="quick-action-card__name">New quotation</span>
              <span className="quick-action-card__hint">
                Choose any customer
              </span>
            </div>
          </button>
        </div>
      </div>
    </section>
  );
};

export default DashboardQuickActions;
