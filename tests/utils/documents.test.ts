import { describe, it, expect } from "vitest";
import {
  getDocNumberPlaceholder,
  getDocumentFilename,
  selectCustomerDetails,
  buildDocumentPayload,
  buildDuplicatePayload,
} from "../../src/utils/documents";
import type { DocumentEntity } from "../../src/types/document";

describe("documents utils", () => {
  it("getDocNumberPlaceholder", () => {
    expect(getDocNumberPlaceholder("invoice")).toBe("INV-YYYY-XXX");
    expect(getDocNumberPlaceholder("quotation")).toBe("QUO-YYYY-XXX");
  });

  it("getDocumentFilename", () => {
    expect(getDocumentFilename("invoice", "INV-2024-001", "2024-01-02")).toBe(
      "INV-2024-001",
    );
    expect(getDocumentFilename("invoice", "", "2024-01-02")).toBe(
      "INV-2024-01-02",
    );
  });

  it("selectCustomerDetails returns details or undefined", () => {
    const customers = [
      { id: "1", name: "Acme", email: "a@b.c", address: "x" },
      { id: "2", name: "Beta" },
    ];
    expect(selectCustomerDetails(customers, "1")).toEqual({
      name: "Acme",
      email: "a@b.c",
      address: "x",
    });
    expect(selectCustomerDetails(customers, "3")).toBeUndefined();
  });

  it("buildDocumentPayload basic mapping", () => {
    const state: {
      documentType: "invoice" | "quotation";
      documentNumber: string;
      date: string;
      customerId: string;
      notes: string;
      lineItems: Array<{
        id: string;
        name: string;
        unitPrice: number;
        quantity: number;
        amount: number;
      }>;
    } = {
      documentType: "invoice",
      documentNumber: "INV-2024-001",
      date: "2024-01-02",
      customerId: "1",
      notes: "n",
      lineItems: [
        { id: "x", name: "Item", unitPrice: 2, quantity: 3, amount: 6 },
      ],
    };
    const payload = buildDocumentPayload(
      "uid",
      state,
      "draft",
      "INV-2024-001",
      { name: "Acme" },
      { subtotal: 6, total: 6 },
    );
    expect(payload.userId).toBe("uid");
    expect(payload.items[0].amount).toBe(6);
    expect(payload.status).toBe("draft");
  });

  it("buildDuplicatePayload omits relationships and resets draft fields", () => {
    const source: DocumentEntity = {
      id: "source-id",
      userId: "old-uid",
      type: "invoice",
      docNumber: "INV-2024-001",
      date: "2024-01-01",
      customerId: "cust-123",
      customerDetails: { name: "Acme Corp" },
      items: [{ name: "Item 1", unitPrice: 10, quantity: 2, amount: 20 }],
      subtotal: 20,
      total: 20,
      notes: "Some notes",
      status: "finalized",
      currency: "EUR",
      // @ts-expect-error test-only timestamp shape
      finalizedAt: { seconds: 123, nanoseconds: 0 },
      sourceDocumentId: "quotation-123",
      sourceDocumentType: "quotation",
      relatedInvoices: ["inv-1"],
      originalQuantity: 10,
      invoicedQuantity: 5,
      remainingQuantity: 5,
    };

    const payload = buildDuplicatePayload(
      "new-uid",
      source,
      "INV-2024-002",
      "2024-02-02",
    );

    expect(payload.userId).toBe("new-uid");
    expect(payload.docNumber).toBe("INV-2024-002");
    expect(payload.date).toBe("2024-02-02");
    expect(payload.status).toBe("draft");
    expect(payload.items).toEqual(source.items);
    expect(payload.currency).toBe("EUR");

    expect("finalizedAt" in payload).toBe(false);
    expect("sourceDocumentId" in payload).toBe(false);
    expect("sourceDocumentType" in payload).toBe(false);
    expect("relatedInvoices" in payload).toBe(false);
    expect("originalQuantity" in payload).toBe(false);
    expect("invoicedQuantity" in payload).toBe(false);
    expect("remainingQuantity" in payload).toBe(false);
  });
});
