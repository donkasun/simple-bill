import type { DocumentFormState } from '../types/document';

export type HeaderErrors = {
  documentType?: string;
  date?: string;
  customerId?: string;
};

export type LineItemFieldErrors = {
  name?: string;
  unitPrice?: string;
  quantity?: string;
};

export type ValidationResult = {
  header: HeaderErrors;
  items: Record<string, LineItemFieldErrors>;
};

export function validateDraft(s: DocumentFormState): ValidationResult {
  const header: HeaderErrors = {};
  const items: Record<string, LineItemFieldErrors> = {};
  if (!s.documentType) header.documentType = 'Document type is required';
  if (!s.date?.trim()) header.date = 'Date is required';
  for (const li of s.lineItems) {
    const err: LineItemFieldErrors = {};
    if (!Number.isFinite(li.unitPrice) || li.unitPrice < 0) err.unitPrice = 'Unit price must be ≥ 0';
    if (!Number.isFinite(li.quantity) || li.quantity < 0) err.quantity = 'Quantity must be ≥ 0';
    if (Object.keys(err).length > 0) items[li.id] = err;
  }
  return { header, items };
}

export function validateFinalize(s: DocumentFormState): ValidationResult {
  const header: HeaderErrors = {};
  const items: Record<string, LineItemFieldErrors> = {};
  if (!s.documentType) header.documentType = 'Document type is required';
  if (!s.date?.trim()) header.date = 'Date is required';
  if (!s.customerId) header.customerId = 'Customer is required to finalize';
  for (const li of s.lineItems) {
    const err: LineItemFieldErrors = {};
    if (!li.name?.trim()) err.name = 'Item name is required';
    if (!Number.isFinite(li.unitPrice) || li.unitPrice < 0) err.unitPrice = 'Unit price must be ≥ 0';
    if (!Number.isFinite(li.quantity) || li.quantity < 1) err.quantity = 'Quantity must be ≥ 1';
    if (Object.keys(err).length > 0) items[li.id] = err;
  }
  return { header, items };
}


