import React, { useState } from "react";
import StyledTable from "@components/core/StyledTable";
import PrimaryButton from "@components/core/PrimaryButton";
import { useAuth } from "@auth/useAuth";
import { useFirestore } from "@hooks/useFirestore";
import CustomerModal, {
  type CustomerFormData,
} from "@components/customers/CustomerModal";
import ConfirmDialog from "@components/core/ConfirmDialog";
import type { Customer } from "../types/customer";
import { usePageTitle } from "@components/layout/PageTitleContext";

const Customers: React.FC = () => {
  usePageTitle("Customers");
  const { user } = useAuth();
  type CustomerRow = Customer & { addressDisplay: string };
  const { items, loading, error, add, update, remove } = useFirestore<
    Customer,
    CustomerRow
  >({
    collectionName: "customers",
    userId: user?.uid,
    orderByField: "createdAt",
    select: (c) => ({ ...c, addressDisplay: c.address || "-" }),
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAddClick = () => {
    setEditingCustomer(null);
    setModalOpen(true);
  };

  const handleEditClick = (c: Customer) => {
    setEditingCustomer(c);
    setModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setCustomerToDelete(id);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (customerToDelete) {
      setDeletingId(customerToDelete);
      setConfirmOpen(false);
      try {
        await remove(customerToDelete);
      } catch (err) {
        setPageError(
          err instanceof Error ? err.message : "Failed to delete customer",
        );
      } finally {
        setDeletingId(null);
        setCustomerToDelete(null);
      }
    }
  };

  const handleSubmit = async (data: CustomerFormData) => {
    setPageError(null);
    setModalSubmitting(true);
    try {
      if (editingCustomer?.id) {
        await update(editingCustomer.id, {
          name: data.name,
          email: data.email,
          address: data.address,
          showEmail: data.showEmail ?? true,
        });
      } else {
        await add({
          name: data.name,
          email: data.email,
          address: data.address,
          userId: user?.uid || "",
          showEmail: data.showEmail ?? true,
        });
      }
      setModalOpen(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to save customer";
      setPageError(message);
    } finally {
      setModalSubmitting(false);
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <div className="container-xl">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "1rem",
          }}
        >
          <h2 className="page-title" style={{ margin: 0 }}>
            Customers
          </h2>
          <div style={{ display: "flex", gap: 8 }}>
            <PrimaryButton onClick={handleAddClick}>
              Add New Customer
            </PrimaryButton>
          </div>
        </div>

        {loading && <div>Loading customers…</div>}
        {(error || pageError) && (
          <div role="alert" style={{ color: "crimson" }}>
            {error || pageError}
          </div>
        )}

        {!loading && !error && (
          <>
            {items.length > 0 ? (
              <StyledTable>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Address</th>
                    <th className="td-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((c) => (
                    <tr key={c.id}>
                      <td>{c.name}</td>
                      <td>{c.email || "-"}</td>
                      <td>
                        <div style={{ whiteSpace: "pre-wrap" }}>
                          {c.addressDisplay}
                        </div>
                      </td>
                      <td className="td-right">
                        <div className="actions">
                          <button
                            className="link-btn"
                            style={{ minHeight: "44px" }}
                            onClick={() => handleEditClick(c)}
                          >
                            Edit
                          </button>
                          <button
                            className="link-btn link-danger"
                            style={{ minHeight: "44px" }}
                            disabled={deletingId === c.id}
                            onClick={() => c.id && handleDeleteClick(c.id)}
                          >
                            {deletingId === c.id ? "Deleting…" : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </StyledTable>
            ) : (
              <div
                style={{
                  padding: "3rem 1rem",
                  textAlign: "center",
                  background: "var(--white)",
                  borderRadius: "12px",
                  border: "1px solid var(--brand-border)",
                }}
              >
                <div
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: "600",
                    color: "var(--brand-text-primary)",
                    marginBottom: "0.5rem",
                  }}
                >
                  No customers saved yet.
                </div>
                <div style={{ color: "var(--brand-text-secondary)" }}>
                  Add your first customer to start creating invoices.
                </div>
              </div>
            )}
          </>
        )}
        <ConfirmDialog
          isOpen={confirmOpen}
          title="Delete Customer"
          message="Are you sure you want to delete this customer? This action cannot be undone."
          confirmLabel="Delete"
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmOpen(false)}
          danger
        />

        <CustomerModal
          open={modalOpen}
          title={editingCustomer ? "Edit Customer" : "Add Customer"}
          initial={
            editingCustomer
              ? {
                  name: editingCustomer.name,
                  email: editingCustomer.email,
                  address: editingCustomer.address,
                  showEmail: editingCustomer.showEmail,
                }
              : undefined
          }
          submitting={modalSubmitting}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
        />
      </div>
    </div>
  );
};

export default Customers;
