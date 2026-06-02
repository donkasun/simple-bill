import type { DocumentEntity } from "../types/document";

export type DocumentStatusPillModifier = "paid" | "sent" | "ready" | "draft";

export type DocumentStatusPill = {
  label: string;
  modifier: DocumentStatusPillModifier;
};

export function getDocumentStatusPill(
  status: DocumentEntity["status"],
): DocumentStatusPill {
  if (status === "paid") {
    return { label: "Paid", modifier: "paid" };
  }
  if (status === "sent") {
    return { label: "Sent", modifier: "sent" };
  }
  if (status === "ready") {
    return { label: "Ready", modifier: "ready" };
  }
  return { label: "Draft", modifier: "draft" };
}

export function getDocumentTypeIconName(type: DocumentEntity["type"]): string {
  return type === "quotation" ? "request_quote" : "receipt_long";
}

export function getDocumentListTitle(document: {
  typeLabel: string;
  docNumber?: string | null;
}): string {
  const number = document.docNumber?.trim() || "—";
  return `${document.typeLabel} ${number}`;
}
