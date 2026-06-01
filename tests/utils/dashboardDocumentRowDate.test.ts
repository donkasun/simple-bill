import { describe, it, expect } from "vitest";
import { formatDashboardDocumentRowDate } from "../../src/utils/dashboardDocumentRowDate";
import type { DocumentRow } from "../../src/hooks/pages/useDocumentsPage";

const baseDoc = {
  id: "doc1",
  userId: "u1",
  type: "invoice" as const,
  typeLabel: "Invoice",
  docNumber: "INV-001",
  customerName: "Acme",
  total: 100,
  subtotal: 100,
  items: [],
  currency: "USD",
};

describe("formatDashboardDocumentRowDate", () => {
  it("returns Pending for draft documents", () => {
    const doc = { ...baseDoc, status: "draft" as const, date: "2024-06-01" };
    expect(formatDashboardDocumentRowDate(doc as DocumentRow)).toBe("Pending");
  });

  it("returns formatted date for finalized documents", () => {
    const doc = {
      ...baseDoc,
      status: "finalized" as const,
      date: "2024-01-16",
    };
    expect(formatDashboardDocumentRowDate(doc as DocumentRow)).toMatch(/2024/);
  });

  it("does not echo status strings when date is invalid", () => {
    const doc = {
      ...baseDoc,
      status: "finalized" as const,
      date: "finalized",
    };
    expect(formatDashboardDocumentRowDate(doc as DocumentRow)).not.toBe(
      "finalized",
    );
  });
});
