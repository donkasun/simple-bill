import React from "react";
import Button from "@components/core/Button";
import CustomerModal from "@components/customers/CustomerModal";
import CustomerListRow from "@components/customers/CustomerListRow";
import CustomerEmptyState from "@components/customers/CustomerEmptyState";
import ConfirmDialog from "@components/core/ConfirmDialog";
import { usePageTitle } from "@components/layout/PageTitleContext";
import PageHeader from "@components/layout/PageHeader";
import { useCustomersPage } from "@hooks/pages/useCustomersPage";

const Customers: React.FC = () => {
  usePageTitle("Customers");
  const vm = useCustomersPage();

  return (
    <div className="app-page">
      <PageHeader
        title={vm.title}
        subtitle="The people and businesses you bill."
        actions={<Button onClick={vm.actions.openAdd}>Add customer</Button>}
      />

      {vm.loading && (
        <div
          style={{ color: "var(--brand-text-secondary)", padding: "2rem 0" }}
        >
          Loading customers…
        </div>
      )}

      {vm.error && (
        <div
          role="alert"
          style={{ color: "var(--brand-danger)", marginBottom: "1rem" }}
        >
          {vm.error}
        </div>
      )}

      {vm.showCustomerList && (
        <>
          {!vm.empty ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              {vm.customers.map((c) => (
                <CustomerListRow
                  key={c.id}
                  customer={c}
                  deleting={vm.deleteConfirm.deletingId === c.id}
                  onEdit={vm.actions.openEdit}
                  onDelete={vm.actions.requestDelete}
                />
              ))}
            </div>
          ) : (
            <CustomerEmptyState onAddClick={vm.actions.openAdd} />
          )}
        </>
      )}

      <ConfirmDialog
        isOpen={vm.deleteConfirm.open}
        title="Delete Customer"
        message="Are you sure you want to delete this customer? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={vm.actions.confirmDelete}
        onCancel={vm.actions.cancelDelete}
        danger
      />

      <CustomerModal
        open={vm.modal.open}
        title={vm.modal.title}
        initial={vm.modal.initial}
        submitting={vm.modal.submitting}
        onSubmit={vm.actions.submitCustomer}
        onCancel={vm.actions.closeModal}
      />
    </div>
  );
};

export default Customers;
