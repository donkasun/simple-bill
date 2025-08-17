import { describe, it, expect } from "vitest";
import { render, waitFor } from "@testing-library/react";
import React from "react";
import {
  useDocumentForm,
  getDefaultInitialState,
} from "../../src/hooks/useDocumentForm";
import type { Item } from "../../src/types/item";
import type { Customer } from "../../src/types/customer";

describe("useDocumentForm", () => {
  it("updates fields and line items, computes amount", async () => {
    let api: ReturnType<typeof useDocumentForm> | null = null;
    const Comp = () => {
      api = useDocumentForm({ initial: getDefaultInitialState() });
      return null;
    };
    render(<Comp />);

    // add one more line
    api!.dispatch({ type: "ADD_LINE_ITEM" });
    await waitFor(() => expect(api!.state.lineItems.length).toBe(2));

    // update first line
    const firstId = api!.state.lineItems[0].id;
    api!.dispatch({
      type: "UPDATE_LINE_ITEM",
      id: firstId,
      changes: { unitPrice: 5, quantity: 3 },
    });
    await waitFor(() => expect(api!.state.lineItems[0].amount).toBe(15));

    // set a header field
    api!.dispatch({
      type: "SET_FIELD",
      field: "documentType",
      value: "quotation",
    });
    await waitFor(() => expect(api!.state.documentType).toBe("quotation"));
  });

  it("defaults customer when provided and blocks edits when canEdit=false", async () => {
    let api: ReturnType<typeof useDocumentForm> | null = null;
    const customers: Customer[] = [
      { id: "1", userId: "u", name: "Acme" } as unknown as Customer,
    ];
    const Comp = () => {
      api = useDocumentForm({
        initial: getDefaultInitialState(),
        customers,
        canEdit: false,
      });
      return null;
    };
    render(<Comp />);

    // default happens only when canEdit is true, so should not set when false
    expect(api!.state.customerId).toBeUndefined();

    // try to mutate while locked
    const id = api!.state.lineItems[0].id;
    api!.dispatch({ type: "UPDATE_LINE_ITEM", id, changes: { unitPrice: 10 } });
    // no change expected
    await waitFor(() => expect(api!.state.lineItems[0].unitPrice).toBe(0));
  });

  it("selects item from catalog by id", async () => {
    let api: ReturnType<typeof useDocumentForm> | null = null;
    const items: Item[] = [
      {
        id: "a",
        userId: "u",
        name: "Service",
        unitPrice: 12,
      } as unknown as Item,
    ];
    const Comp = () => {
      api = useDocumentForm({
        initial: getDefaultInitialState(),
        itemCatalog: items,
      });
      return null;
    };
    render(<Comp />);
    const id = api!.state.lineItems[0].id;
    api!.selectItemById(id, "a");
    await waitFor(() => expect(api!.state.lineItems[0].name).toBe("Service"));
    await waitFor(() => expect(api!.state.lineItems[0].unitPrice).toBe(12));
  });
});
