import type { DocumentEntity, DocumentFormState } from "../types/document";

export function selectCustomerDetails(
  customers: Array<{
    id?: string;
    name: string;
    email?: string | null;
    address?: string | null;
  }>,
  customerId?: string,
): DocumentEntity["customerDetails"] {
  const selected = customers.find((c) => c.id === customerId);
  if (!selected) return undefined;
  const details: NonNullable<DocumentEntity["customerDetails"]> = {
    name: selected.name,
  };
  if (selected.email) details.email = selected.email;
  if (selected.address) details.address = selected.address;
  return details;
}

export function buildDuplicatePayload(
  userId: string,
  source: DocumentEntity,
  docNumber: string,
  today: string,
): Omit<DocumentEntity, "id" | "createdAt" | "updatedAt"> {
  return {
    userId,
    type: source.type,
    docNumber,
    date: today,
    customerId: source.customerId ?? undefined,
    customerDetails: source.customerDetails ?? undefined,
    items: source.items.map((it) => ({ ...it })),
    subtotal: source.subtotal,
    total: source.total,
    notes: source.notes ?? "",
    currency: source.currency ?? undefined,
    // Always create duplicates as editable drafts — never carry over finalized state
    status: "draft",
  };
}

export function buildDocumentPayload(
  userId: string,
  state: DocumentFormState,
  status: "draft" | "ready" | "sent",
  docNumber: string,
  customerDetails: DocumentEntity["customerDetails"],
  totals: { subtotal: number; total: number },
): Omit<DocumentEntity, "id" | "createdAt" | "updatedAt"> {
  return {
    userId,
    type: state.documentType,
    docNumber,
    date: state.date,
    customerId: state.customerId ?? undefined,
    customerDetails: customerDetails ?? undefined,
    items: state.lineItems.map((li) => ({
      itemId: li.itemId ?? undefined,
      name: li.name ?? "",
      description: li.description ?? "",
      unitPrice: Number.isFinite(li.unitPrice) ? li.unitPrice : 0,
      quantity: Number.isFinite(li.quantity) ? li.quantity : 0,
      amount: Number.isFinite(li.amount) ? li.amount : 0,
    })),
    subtotal: totals.subtotal,
    total: totals.total,
    notes: state.notes ?? "",
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
