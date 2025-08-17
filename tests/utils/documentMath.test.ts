import { describe, it, expect } from "vitest";
import { computeAmount, computeSubtotal } from "../../src/utils/documentMath";

describe("documentMath", () => {
  it("computeAmount clamps negatives and handles NaN", () => {
    expect(computeAmount(10, 2)).toBe(20);
    expect(computeAmount(-5, 3)).toBe(0);
    // @ts-expect-error - Testing runtime behavior with invalid input
    expect(computeAmount(undefined, 3)).toBe(0);
  });

  it("computeSubtotal sums amounts safely", () => {
    const items = [
      { id: "a", name: "x", unitPrice: 1, quantity: 1, amount: 1 },
      { id: "b", name: "y", unitPrice: 2, quantity: 3, amount: 6 },
      {
        id: "c",
        name: "z",
        unitPrice: 5,
        quantity: 1,
        amount: NaN as unknown as number,
      },
    ];
    expect(
      computeSubtotal(
        items as Array<{
          id: string;
          name: string;
          unitPrice: number;
          quantity: number;
          amount: number;
        }>,
      ),
    ).toBe(7);
  });
});
