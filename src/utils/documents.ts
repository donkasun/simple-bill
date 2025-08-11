import type { DocumentEntity, DocumentFormState } from '../types/document';

export function selectCustomerDetails(
  customers: Array<{ id?: string; name: string; email?: string; address?: string }>,
  customerId?: string
): DocumentEntity['customerDetails'] {
  const selected = customers.find((c) => c.id === customerId);
  return selected ? { name: selected.name, email: selected.email, address: selected.address } : undefined;
}

export function buildDocumentPayload(
  userId: string,
  state: DocumentFormState,
  status: 'draft' | 'finalized',
  docNumber: string,
  customerDetails: DocumentEntity['customerDetails'],
  totals: { subtotal: number; total: number }
): Omit<DocumentEntity, 'id' | 'createdAt' | 'updatedAt'> {
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

export function getDocNumberPlaceholder(documentType: 'invoice' | 'quotation'): string {
  return documentType === 'invoice' ? 'INV-YYYY-XXX' : 'QUO-YYYY-XXX';
}

export function getDocumentFilename(type: 'invoice' | 'quotation', docNumber: string | undefined, date: string): string {
  const prefix = type === 'invoice' ? 'INV' : 'QUO';
  return docNumber && docNumber.trim().length > 0 ? docNumber : `${prefix}-${date}`;
}


