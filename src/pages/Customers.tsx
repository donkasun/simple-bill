import React, { useState } from "react";
import Button from "@components/core/Button";
import { useAuth } from "@auth/useAuth";
import { useFirestore } from "@hooks/useFirestore";
import CustomerModal, {
  type CustomerFormData,
} from "@components/customers/CustomerModal";
import ConfirmDialog from "@components/core/ConfirmDialog";
import type { Customer } from "../types/customer";
import { usePageTitle } from "@components/layout/PageTitleContext";
import PageHeader from "@components/layout/PageHeader";

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
    <div className="app-page">
      <PageHeader
        title="Customers"
        subtitle="The people and businesses you bill."
        actions={<Button onClick={handleAddClick}>Add customer</Button>}
      />

      {loading && (
        <div
          style={{ color: "var(--brand-text-secondary)", padding: "2rem 0" }}
        >
          Loading customers…
        </div>
      )}
      {(error || pageError) && (
        <div
          role="alert"
          style={{ color: "var(--brand-danger)", marginBottom: "1rem" }}
        >
          {error || pageError}
        </div>
      )}

      {!loading && !error && (
        <>
          {items.length > 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              {items.map((c) => (
                <div
                  key={c.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    background: "var(--white)",
                    border: "1px solid var(--brand-border)",
                    borderRadius: "12px",
                    padding: "0.875rem 1.25rem",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: "var(--brand-background)",
                      color: "var(--brand-primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "1rem",
                      flexShrink: 0,
                    }}
                  >
                    {c.name[0]?.toUpperCase() ?? "?"}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        color: "var(--brand-text-primary)",
                        fontSize: "0.95rem",
                      }}
                    >
                      {c.name}
                    </div>
                    {c.addressDisplay && c.addressDisplay !== "-" && (
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--brand-text-muted)",
                          marginTop: 2,
                        }}
                      >
                        {c.addressDisplay}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="list-row-actions">
                    <button
                      type="button"
                      className="link-btn"
                      style={{ minHeight: "44px" }}
                      onClick={() => handleEditClick(c)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="icon-btn icon-btn-danger"
                      aria-label={
                        deletingId === c.id
                          ? "Deleting customer"
                          : "Delete customer"
                      }
                      title="Delete customer"
                      disabled={deletingId === c.id}
                      onClick={() => c.id && handleDeleteClick(c.id)}
                    >
                      <span className="material-symbols-outlined" aria-hidden>
                        delete
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: "3rem 2rem",
                textAlign: "center",
                border: "2px dashed var(--brand-border)",
                borderRadius: "12px",
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>
                👥
              </div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "1.1rem",
                  color: "var(--brand-text-primary)",
                  marginBottom: "0.5rem",
                }}
              >
                Grow your list
              </div>
              <div
                style={{
                  color: "var(--brand-text-secondary)",
                  fontSize: "0.9rem",
                  marginBottom: "1.25rem",
                }}
              >
                Every great business starts with a customer. Add your first one
                to begin invoicing.
              </div>
              <Button onClick={handleAddClick}>Add your first customer</Button>
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
  );
};

export default Customers;
