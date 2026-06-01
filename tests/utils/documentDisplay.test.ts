import { describe, expect, it } from "vitest";
import {
  getDocumentListTitle,
  getDocumentStatusPill,
  getDocumentTypeIconName,
} from "../../src/utils/documentDisplay";

describe("documentDisplay", () => {
  it("maps status to pills", () => {
    expect(getDocumentStatusPill("paid")).toEqual({
      label: "Paid",
      modifier: "paid",
    });
    expect(getDocumentStatusPill("finalized")).toEqual({
      label: "Sent",
      modifier: "sent",
    });
    expect(getDocumentStatusPill("draft")).toEqual({
      label: "Draft",
      modifier: "draft",
    });
  });

  it("picks type icons", () => {
    expect(getDocumentTypeIconName("invoice")).toBe("receipt_long");
    expect(getDocumentTypeIconName("quotation")).toBe("request_quote");
  });

  it("formats list title", () => {
    expect(
      getDocumentListTitle({ typeLabel: "Invoice", docNumber: "INV-1" }),
    ).toBe("Invoice INV-1");
  });
});
