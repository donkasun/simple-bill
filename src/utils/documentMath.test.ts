import { describe, expect, it } from "vitest";
import { computeAmount, computeSubtotal } from "./documentMath";

describe("documentMath", () => {
  describe("computeAmount", () => {
    it("multiplies unitPrice by quantity", () => {
      expect(computeAmount(12.5, 4)).toBe(50);
    });

    it("treats non-finite inputs as 0", () => {
      expect(computeAmount(Number.NaN, 3)).toBe(0);
      expect(computeAmount(10, Number.POSITIVE_INFINITY)).toBe(0);
    });

    it("never returns negative amounts", () => {
      expect(computeAmount(-10, 2)).toBe(0);
      expect(computeAmount(10, -2)).toBe(0);
      expect(computeAmount(-10, -2)).toBe(0);
    });
  });

  describe("computeSubtotal", () => {
    it("sums finite line item amounts", () => {
      expect(
        computeSubtotal([
          // minimal shape for FormLineItem
          { id: "a", name: "A", unitPrice: 1, quantity: 1, amount: 10 },
          { id: "b", name: "B", unitPrice: 1, quantity: 1, amount: 2.5 },
        ]),
      ).toBe(12.5);
    });

    it("ignores non-finite amounts", () => {
      expect(
        computeSubtotal([
          { id: "a", name: "A", unitPrice: 1, quantity: 1, amount: 10 },
          { id: "b", name: "B", unitPrice: 1, quantity: 1, amount: Number.NaN },
        ]),
      ).toBe(10);
    });
  });
});
