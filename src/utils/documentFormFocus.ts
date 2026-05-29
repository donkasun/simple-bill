import type { DocumentFormState } from "../types/document";
import type { ValidationResult } from "./documentValidation";

export function focusFirstValidationError(
  state: DocumentFormState,
  res: ValidationResult,
): void {
  const orderHeaderIds = [
    res.header.documentType ? "doc-documentType" : null,
    res.header.date ? "doc-date" : null,
    res.header.customerId ? "doc-customerId" : null,
  ].filter(Boolean) as string[];

  if (orderHeaderIds.length > 0) {
    document.getElementById(orderHeaderIds[0])?.focus();
    return;
  }

  for (const li of state.lineItems) {
    const e = res.items[li.id];
    if (!e) continue;
    const id = e.name
      ? `li-${li.id}-name`
      : e.unitPrice
        ? `li-${li.id}-unitPrice`
        : e.quantity
          ? `li-${li.id}-quantity`
          : null;
    if (id) {
      document.getElementById(id)?.focus();
      return;
    }
  }
}
