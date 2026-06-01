import type { DashboardSpotlightCustomer } from "@hooks/pages/useDashboardPage";

type DashboardCustomerSpotlightProps = {
  customer: DashboardSpotlightCustomer;
  formatCurrency: (value: number) => string;
};

function buildReminderMailto(
  email: string,
  customerName: string,
  balanceLabel: string,
): string {
  const subject = `Payment reminder – ${customerName}`;
  const body = `Hi ${customerName},

This is a friendly reminder about your outstanding balance of ${balanceLabel}.

Thank you.`;

  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

const DashboardCustomerSpotlight = ({
  customer,
  formatCurrency,
}: DashboardCustomerSpotlightProps) => {
  const balanceLabel = formatCurrency(customer.outstandingBalance);
  const mailtoHref =
    customer.email !== null
      ? buildReminderMailto(customer.email, customer.name, balanceLabel)
      : null;

  return (
    <section className="dashboard-spotlight" aria-label="Customer spotlight">
      <div className="dashboard-spotlight__header">
        <h3 className="dashboard-spotlight__name">{customer.name}</h3>
        {customer.email ? (
          <p className="dashboard-spotlight__email">{customer.email}</p>
        ) : (
          <p className="dashboard-spotlight__email dashboard-spotlight__email--missing">
            No email on file
          </p>
        )}
      </div>

      <div className="dashboard-spotlight__balance dashboard-pulse-shimmer">
        <p className="dashboard-spotlight__balance-label">
          Outstanding Balance
        </p>
        <p className="dashboard-spotlight__balance-amount">{balanceLabel}</p>
      </div>

      {mailtoHref ? (
        <a className="dashboard-spotlight__reminder" href={mailtoHref}>
          Send Reminder
        </a>
      ) : (
        <button
          type="button"
          className="dashboard-spotlight__reminder"
          disabled
          title="Add an email address for this customer to send a reminder"
        >
          Send Reminder
        </button>
      )}
    </section>
  );
};

export default DashboardCustomerSpotlight;
