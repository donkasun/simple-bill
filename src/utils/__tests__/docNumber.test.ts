import { describe, it, expect } from "vitest";
import { buildDocNumberPrefix } from "../docNumber";

describe("docNumber", () => {
  it("buildDocNumberPrefix uses type and year", () => {
    expect(buildDocNumberPrefix("invoice", "2024-05-01")).toBe("INV-2024-");
    expect(buildDocNumberPrefix("quotation", "2023-12-31")).toBe("QUO-2023-");
  });
});


