import type { FormLineItem } from '../types/document';

export function computeAmount(unitPrice: number, quantity: number): number {
  const safeUnitPrice = Number.isFinite(unitPrice) ? unitPrice : 0;
  const safeQuantity = Number.isFinite(quantity) ? quantity : 0;
  return Math.max(0, safeUnitPrice * safeQuantity);
}

export function computeSubtotal(items: FormLineItem[]): number {
  return items.reduce((sum, li) => sum + (Number.isFinite(li.amount) ? li.amount : 0), 0);
}


