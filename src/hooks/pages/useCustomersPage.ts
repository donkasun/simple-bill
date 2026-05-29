import { useState } from "react";
import { useAuth } from "@auth/useAuth";
import { useFirestore } from "@hooks/useFirestore";
import type { CustomerFormData } from "@components/customers/CustomerModal";
import type { Customer } from "../../types/customer";

export type CustomerRow = Customer & { addressDisplay: string };

export type CustomersPageViewModel = {
  title: string;
  loading: boolean;
  error: string | null;
  showCustomerList: boolean;
  customers: CustomerRow[];
  empty: boolean;
  modal: {
    open: boolean;
    title: string;
    initial?: CustomerFormData;
    submitting: boolean;
  };
  deleteConfirm: { open: boolean; deletingId: string | null };
  actions: {
    openAdd: () => void;
    openEdit: (c: Customer) => void;
    requestDelete: (id: string) => void;
    confirmDelete: () => Promise<void>;
    cancelDelete: () => void;
    submitCustomer: (data: CustomerFormData) => Promise<void>;
    closeModal: () => void;
  };
};

export function useCustomersPage(): CustomersPageViewModel {
  const { user } = useAuth();
  const {
    items,
    loading,
    error: firestoreError,
    add,
    update,
    remove,
  } = useFirestore<Customer, CustomerRow>({
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

  const error = firestoreError || pageError;
  const showCustomerList = !loading && !firestoreError;
  const empty = items.length === 0;

  const openAdd = () => {
    setEditingCustomer(null);
    setModalOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditingCustomer(c);
    setModalOpen(true);
  };

  const requestDelete = (id: string) => {
    setCustomerToDelete(id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!customerToDelete) return;
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
  };

  const cancelDelete = () => {
    setConfirmOpen(false);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const submitCustomer = async (data: CustomerFormData) => {
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

  return {
    title: "Customers",
    loading,
    error,
    showCustomerList,
    customers: items,
    empty,
    modal: {
      open: modalOpen,
      title: editingCustomer ? "Edit Customer" : "Add Customer",
      initial: editingCustomer
        ? {
            name: editingCustomer.name,
            email: editingCustomer.email,
            address: editingCustomer.address,
            showEmail: editingCustomer.showEmail,
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
      submitCustomer,
      closeModal,
    },
  };
}
