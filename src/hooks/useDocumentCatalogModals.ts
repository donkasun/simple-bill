import { useCallback, useState } from "react";
import type { CustomerFormData } from "@components/customers/CustomerModal";
import type { ItemFormData } from "@components/items/ItemModal";
import type { Item } from "../types/item";

type UseDocumentCatalogModalsOptions = {
  userId?: string;
  addCustomer: (data: {
    name: string;
    email?: string | null;
    address?: string | null;
    userId: string;
    showEmail?: boolean;
  }) => Promise<string>;
  addItem: (data: {
    name: string;
    unitPrice: number;
    description?: string;
    userId: string;
  }) => Promise<string>;
  onCustomerCreated: (customerId: string) => void;
  onItemCreated: (item: Item, lineId: string | null) => void;
};

export function useDocumentCatalogModals({
  userId,
  addCustomer,
  addItem,
  onCustomerCreated,
  onItemCreated,
}: UseDocumentCatalogModalsOptions) {
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [customerSubmitting, setCustomerSubmitting] = useState(false);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [itemSubmitting, setItemSubmitting] = useState(false);
  const [itemLineId, setItemLineId] = useState<string | null>(null);

  const openCustomerModal = useCallback(() => setCustomerModalOpen(true), []);

  const openItemModal = useCallback((lineId?: string) => {
    setItemLineId(lineId ?? null);
    setItemModalOpen(true);
  }, []);

  const closeCustomerModal = useCallback(() => setCustomerModalOpen(false), []);

  const closeItemModal = useCallback(() => {
    setItemModalOpen(false);
    setItemLineId(null);
  }, []);

  const handleCustomerSubmit = useCallback(
    async (data: CustomerFormData) => {
      if (!userId) return;
      setCustomerSubmitting(true);
      try {
        const id = await addCustomer({
          name: data.name,
          email: data.email,
          address: data.address,
          userId,
          showEmail: data.showEmail ?? true,
        });
        onCustomerCreated(id);
        setCustomerModalOpen(false);
      } finally {
        setCustomerSubmitting(false);
      }
    },
    [userId, addCustomer, onCustomerCreated],
  );

  const handleItemSubmit = useCallback(
    async (data: ItemFormData) => {
      if (!userId) return;
      setItemSubmitting(true);
      try {
        const id = await addItem({
          name: data.name,
          unitPrice: data.unitPrice,
          description: data.description ?? "",
          userId,
        });
        const item: Item = {
          id,
          userId,
          name: data.name,
          unitPrice: data.unitPrice,
          description: data.description ?? "",
        };
        onItemCreated(item, itemLineId);
        setItemModalOpen(false);
        setItemLineId(null);
      } finally {
        setItemSubmitting(false);
      }
    },
    [userId, addItem, onItemCreated, itemLineId],
  );

  return {
    customerModalOpen,
    customerSubmitting,
    openCustomerModal,
    closeCustomerModal,
    handleCustomerSubmit,
    itemModalOpen,
    itemSubmitting,
    openItemModal,
    closeItemModal,
    handleItemSubmit,
  };
}
