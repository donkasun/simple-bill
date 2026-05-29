import { useState } from "react";
import { useAuth } from "@auth/useAuth";
import { useFirestore } from "@hooks/useFirestore";
import useUserProfile from "@hooks/useUserProfile";
import type { ItemFormData } from "@components/items/ItemModal";
import { formatCurrency } from "@utils/currency";
import type { Item } from "../../types/item";

export type ItemRow = Item & { unitPriceLabel: string };

export type ItemsPageViewModel = {
  title: string;
  loading: boolean;
  error: string | null;
  showItemsTable: boolean;
  items: ItemRow[];
  empty: boolean;
  modal: {
    open: boolean;
    title: string;
    initial?: ItemFormData;
    submitting: boolean;
  };
  deleteConfirm: { open: boolean; deletingId: string | null };
  actions: {
    openAdd: () => void;
    openEdit: (it: Item) => void;
    requestDelete: (id: string) => void;
    confirmDelete: () => Promise<void>;
    cancelDelete: () => void;
    submitItem: (data: ItemFormData) => Promise<void>;
    closeModal: () => void;
  };
};

export function useItemsPage(): ItemsPageViewModel {
  const { user } = useAuth();
  const { profile } = useUserProfile();

  const {
    items,
    loading,
    error: firestoreError,
    add,
    update,
    remove,
  } = useFirestore<Item, ItemRow>({
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

  const error = firestoreError || pageError;
  const showItemsTable = !loading && !firestoreError;
  const empty = items.length === 0;

  const openAdd = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const openEdit = (it: Item) => {
    setEditingItem(it);
    setModalOpen(true);
  };

  const requestDelete = (id: string) => {
    setItemToDelete(id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
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
  };

  const cancelDelete = () => {
    setConfirmOpen(false);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const submitItem = async (data: ItemFormData) => {
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

  return {
    title: "Products & services",
    loading,
    error,
    showItemsTable,
    items,
    empty,
    modal: {
      open: modalOpen,
      title: editingItem ? "Edit Item" : "Add Item",
      initial: editingItem
        ? {
            name: editingItem.name,
            unitPrice: editingItem.unitPrice,
            description: editingItem.description,
          }
        : undefined,
      submitting: modalSubmitting,
    },
    deleteConfirm: {
      open: confirmOpen,
      deletingId,
    },
    actions: {
      openAdd,
      openEdit,
      requestDelete,
      confirmDelete,
      cancelDelete,
      submitItem,
      closeModal,
    },
  };
}
