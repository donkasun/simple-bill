import type { DocumentRow } from "@hooks/pages/useDocumentsPage";
import { formatIsoDate, isValidIsoDateString } from "./date";

function toDate(
  value: DocumentRow["createdAt"] | DocumentRow["paidAt"],
): Date | null {
  if (value instanceof Date) return value;
  const fromTimestamp = value?.toDate?.();
  return fromTimestamp instanceof Date ? fromTimestamp : null;
}

function toIsoDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function resolveDocumentRowDateIso(document: DocumentRow): string | null {
  if (document.date && isValidIsoDateString(document.date)) {
    return document.date;
  }

  const created = toDate(document.createdAt);
  if (created) return toIsoDateString(created);

  return null;
}

/** Date line on dashboard document rows — "Pending" for drafts, formatted date otherwise. */
export function formatDashboardDocumentRowDate(document: DocumentRow): string {
  if (!document.status || document.status === "draft") {
    return "Pending";
  }

  const iso = resolveDocumentRowDateIso(document);
  return iso ? formatIsoDate(iso) : "—";
}
