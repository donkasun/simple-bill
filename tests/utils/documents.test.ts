import { describe, it, expect } from "vitest";
import {
  getDocNumberPlaceholder,
  getDocumentFilename,
  selectCustomerDetails,
  buildDocumentPayload,
} from "../../src/utils/documents";

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
});
