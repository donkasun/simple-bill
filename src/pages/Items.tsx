import React, { useState } from "react";
import StyledTable from "@components/core/StyledTable";
import Button from "@components/core/Button";
import { useAuth } from "@auth/useAuth";
import { useFirestore } from "@hooks/useFirestore";
import ItemModal, { type ItemFormData } from "@components/items/ItemModal";
import ConfirmDialog from "@components/core/ConfirmDialog";
import type { Item } from "../types/item";
import { usePageTitle } from "@components/layout/PageTitleContext";
import PageHeader from "@components/layout/PageHeader";
import { formatCurrency } from "@utils/currency";
import useUserProfile from "@hooks/useUserProfile";

const Items: React.FC = () => {
  usePageTitle("Products & services");
  const { user } = useAuth();
  const { profile } = useUserProfile();
  type ItemRow = Item & { unitPriceLabel: string };
  const { items, loading, error, add, update, remove } = useFirestore<
    Item,
    ItemRow
  >({
    collectionName: "items",
    userId: user?.uid,
    orderByField: "createdAt",
    select: (it) => ({
      ...it,
      unitPriceLabel: formatCurrency(it.unitPrice, profile?.currency || "USD"),
    }),
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAddClick = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleEditClick = (it: Item) => {
    setEditingItem(it);
    setModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setItemToDelete(id);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (itemToDelete) {
      setDeletingId(itemToDelete);
      setConfirmOpen(false);
      try {
        await remove(itemToDelete);
      } catch (err) {
        setPageError(
          err instanceof Error ? err.message : "Failed to delete item",
        );
      } finally {
        setDeletingId(null);
        setItemToDelete(null);
      }
    }
  };

  const handleSubmit = async (data: ItemFormData) => {
    setPageError(null);
    setModalSubmitting(true);
    try {
      if (editingItem?.id) {
        await update(editingItem.id, {
          name: data.name,
          unitPrice: data.unitPrice,
          description: data.description ?? "",
        });
      } else {
        await add({
          name: data.name,
          unitPrice: data.unitPrice,
          description: data.description ?? "",
          userId: user?.uid || "",
        });
      }
      setModalOpen(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to save item";
      setPageError(message);
    } finally {
      setModalSubmitting(false);
    }
  };

  return (
    <div className="app-page">
      <PageHeader
        title="Products & services"
        subtitle="What you sell and the rates you charge."
        actions={<Button onClick={handleAddClick}>Add item</Button>}
      />

      {loading && <div>Loading items…</div>}
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
                  <th className="td-right">Unit Price</th>
                  <th>Description</th>
                  <th className="td-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id}>
                    <td>{it.name}</td>
                    <td className="td-right">{it.unitPriceLabel}</td>
                    <td>
                      <div style={{ whiteSpace: "pre-wrap" }}>
                        {it.description ?? "-"}
                      </div>
                    </td>
                    <td className="td-right">
                      <div className="actions">
                        <button
                          type="button"
                          className="link-btn"
                          style={{ minHeight: "44px" }}
                          onClick={() => handleEditClick(it)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="icon-btn icon-btn-danger"
                          aria-label={
                            deletingId === it.id
                              ? "Deleting item"
                              : "Delete item"
                          }
                          title="Delete item"
                          disabled={deletingId === it.id}
                          onClick={() => it.id && handleDeleteClick(it.id)}
                        >
                          <span
                            className="material-symbols-outlined"
                            aria-hidden
                          >
                            delete
                          </span>
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
                No items saved yet.
              </div>
              <div style={{ color: "var(--brand-text-secondary)" }}>
                Add your first product or service to start invoicing.
              </div>
              <div style={{ marginTop: "1.25rem" }}>
                <Button onClick={handleAddClick}>Add your first item</Button>
              </div>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        isOpen={confirmOpen}
        title="Delete Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmOpen(false)}
        danger
      />

      <ItemModal
        open={modalOpen}
        title={editingItem ? "Edit Item" : "Add Item"}
        initial={
          editingItem
            ? {
                name: editingItem.name,
                unitPrice: editingItem.unitPrice,
                description: editingItem.description,
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

export default Items;
