import React, { useState } from "react";
import StyledTable from "../components/core/StyledTable";
import PrimaryButton from "../components/core/PrimaryButton";
import { useAuth } from "../hooks/useAuth";
import { useFirestore, type BaseEntity } from "../hooks/useFirestore";
import CustomerModal, { type CustomerFormData } from "../components/customers/CustomerModal";

type Customer = BaseEntity & {
  userId: string;
  name: string;
  email?: string;
  address?: string;
  showEmail?: boolean;
};

const Customers: React.FC = () => {
  const { user } = useAuth();
  const { items, loading, error, add, update, remove } = useFirestore<Customer>({
    collectionName: "customers",
    userId: user?.uid,
    orderByField: "createdAt",
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const handleAddClick = () => {
    setEditingCustomer(null);
    setModalOpen(true);
  };

  const handleEditClick = (c: Customer) => {
    setEditingCustomer(c);
    setModalOpen(true);
  };

  const handleSubmit = async (data: CustomerFormData) => {
    setPageError(null);
    setModalSubmitting(true);
    try {
      if (editingCustomer?.id) {
        await update(editingCustomer.id, {
          name: data.name,
          email: data.email,
          address: data.address ?? "",
          showEmail: data.showEmail ?? true,
        });
      } else {
        await add({
          name: data.name,
          email: data.email,
          address: data.address ?? "",
          userId: user?.uid || "",
          showEmail: data.showEmail ?? true,
        });
      }
      setModalOpen(false);
    } catch (e: any) {
      setPageError(e?.message ?? "Failed to save customer");
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
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>
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
          <StyledTable>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Address</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.email}</td>
                  <td>
                    <div style={{ whiteSpace: "pre-wrap" }}>{c.address ?? "-"}</div>
                  </td>
                  <td>
                    <div className="actions">
                      <button className="link-btn" onClick={() => handleEditClick(c)}>Edit</button>
                      <button
                        className="link-btn link-danger"
                        onClick={async () => {
                          if (c.id && window.confirm("Delete this customer?"))
                            await remove(c.id);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </StyledTable>
        )}
        <CustomerModal
          open={modalOpen}
          title={editingCustomer ? "Edit Customer" : "Add Customer"}
          initial={editingCustomer ? { name: editingCustomer.name, email: editingCustomer.email, address: editingCustomer.address, showEmail: editingCustomer.showEmail } : undefined}
          submitting={modalSubmitting}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
        />
      </div>
    </div>
  );
};

export default Customers;
