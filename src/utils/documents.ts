import type {
  DocumentEntity,
  DocumentFormState,
  DocumentLineItem,
} from "../types/document";

export function selectCustomerDetails(
  customers: Array<{
    id?: string;
    name: string;
    email?: string;
    address?: string;
  }>,
  customerId?: string,
): DocumentEntity["customerDetails"] {
  const selected = customers.find((c) => c.id === customerId);
  return selected
    ? { name: selected.name, email: selected.email, address: selected.address }
    : undefined;
}

export function buildDocumentPayload(
  userId: string,
  state: DocumentFormState,
  status: "draft" | "finalized",
  docNumber: string,
  customerDetails: DocumentEntity["customerDetails"],
  totals: { subtotal: number; total: number },
): Omit<DocumentEntity, "id" | "createdAt" | "updatedAt"> {
  return {
    userId,
    type: state.documentType,
    docNumber,
    date: state.date,
    customerId: state.customerId,
    customerDetails,
    items: state.lineItems.map((li) => ({
      itemId: li.itemId,
      name: li.name,
      description: li.description,
      unitPrice: Number.isFinite(li.unitPrice) ? li.unitPrice : 0,
      quantity: Number.isFinite(li.quantity) ? li.quantity : 0,
      amount: Number.isFinite(li.amount) ? li.amount : 0,
    })),
    subtotal: totals.subtotal,
    total: totals.total,
    notes: state.notes,
    status,
  };
}

export function getDocNumberPlaceholder(
  documentType: "invoice" | "quotation",
): string {
  return documentType === "invoice" ? "INV-YYYY-XXX" : "QUO-YYYY-XXX";
}

export function getDocumentFilename(
  type: "invoice" | "quotation",
  docNumber: string | undefined,
  date: string,
): string {
  const prefix = type === "invoice" ? "INV" : "QUO";
  return docNumber && docNumber.trim().length > 0
    ? docNumber
    : `${prefix}-${date}`;
}

export function calculateRemainingQuantities(
  sourceItems: DocumentLineItem[],
  existingInvoices: DocumentEntity[],
): { itemId: string; remainingQuantity: number }[] {
  const remainingMap = new Map<string, number>();

  // Initialize with original quantities
  sourceItems.forEach((item) => {
    if (item.itemId) {
      remainingMap.set(item.itemId, item.quantity);
    }
  });

  // Subtract quantities from existing invoices
  existingInvoices.forEach((invoice) => {
    invoice.items.forEach((invoiceItem) => {
      if (invoiceItem.itemId && remainingMap.has(invoiceItem.itemId)) {
        const current = remainingMap.get(invoiceItem.itemId) || 0;
        remainingMap.set(
          invoiceItem.itemId,
          Math.max(0, current - invoiceItem.quantity),
        );
      }
    });
  });

  return Array.from(remainingMap.entries()).map(([itemId, quantity]) => ({
    itemId,
    remainingQuantity: quantity,
  }));
}

export function canGenerateInvoice(quotation: DocumentEntity): boolean {
  if (quotation.type !== "quotation" || quotation.status !== "finalized") {
    return false;
  }

  // Check if there are any remaining quantities to invoice
  const remainingQuantities = calculateRemainingQuantities(quotation.items, []);

  return remainingQuantities.some((item) => item.remainingQuantity > 0);
}

export function getInvoiceGenerationStatus(quotation: DocumentEntity): {
  canGenerate: boolean;
  totalInvoiced: number;
  totalRemaining: number;
  message: string;
} {
  if (quotation.type !== "quotation") {
    return {
      canGenerate: false,
      totalInvoiced: 0,
      totalRemaining: 0,
      message: "Not a quotation",
    };
  }

  const totalOriginal = quotation.items.reduce(
    (sum, item) => sum + item.amount,
    0,
  );
  const totalInvoiced = quotation.relatedInvoices?.length || 0;

  // This is a simplified calculation - in a real implementation,
  // you'd sum up the actual amounts from related invoices
  const totalRemaining = totalOriginal;

  if (totalInvoiced === 0) {
    return {
      canGenerate: true,
      totalInvoiced: 0,
      totalRemaining,
      message: "No invoices generated yet",
    };
  }

  return {
    canGenerate: true,
    totalInvoiced,
    totalRemaining,
    message: `${totalInvoiced} invoice${totalInvoiced !== 1 ? "s" : ""} generated`,
  };
}
