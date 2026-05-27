import { describe, expect, it } from "vitest";
import {
  SUPPORTED_CURRENCIES,
  formatCurrency,
  isSupportedCurrency,
} from "../../src/utils/currency";

describe("currency utils", () => {
  it("exports the supported currency list (milestone 5)", () => {
    expect(SUPPORTED_CURRENCIES).toEqual([
      "USD",
      "LKR",
      "EUR",
      "GBP",
      "AUD",
      "CAD",
    ]);
  });

  it("isSupportedCurrency identifies supported codes", () => {
    expect(isSupportedCurrency("USD")).toBe(true);
    expect(isSupportedCurrency("LKR")).toBe(true);
    expect(isSupportedCurrency("JPY")).toBe(false);
  });

  it("formatCurrency returns a non-empty string for supported currencies", () => {
    for (const c of SUPPORTED_CURRENCIES) {
      const formatted = formatCurrency(1234.56, c, "en-US");
      expect(typeof formatted).toBe("string");
      expect(formatted.length).toBeGreaterThan(0);
    }
  });
});
