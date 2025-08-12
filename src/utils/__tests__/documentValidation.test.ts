import { describe, it, expect } from "vitest";
import { validateDraft, validateFinalize } from "../documentValidation";

const baseState = {
  documentType: "invoice" as const,
  documentNumber: "",
  date: "2024-01-02",
  customerId: undefined as string | undefined,
  notes: "",
  lineItems: [
    { id: "x", name: "", unitPrice: 0, quantity: 0, amount: 0 },
  ],
};

describe("documentValidation", () => {
  it("validateDraft flags negative and NaN amounts", () => {
    const s = { ...baseState, lineItems: [{ id: "a", name: "", unitPrice: -1, quantity: NaN as any, amount: 0 }] };
    const res = validateDraft(s as any);
    expect(Object.keys(res.items)).toHaveLength(1);
    const e = res.items["a"]; 
    expect(e.unitPrice).toBeTruthy();
    expect(e.quantity).toBeTruthy();
  });

  it("validateFinalize requires name and positive quantity", () => {
    const s = { ...baseState, customerId: undefined, lineItems: [{ id: "a", name: "", unitPrice: 1, quantity: 0, amount: 0 }] };
    const res = validateFinalize(s as any);
    expect(res.header.customerId).toBeTruthy();
    const e = res.items["a"]; 
    expect(e.name).toBeTruthy();
    expect(e.quantity).toBeTruthy();
  });
});


