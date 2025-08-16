import React from "react";
import type { FormLineItem } from "../../types/document";
import type { Item } from "../../types/item";
import StyledTable from "../core/StyledTable";
import StyledDropdown from "../core/StyledDropdown";
import StyledInput from "../core/StyledInput";
import StyledTextarea from "@components/core/StyledTextarea";
import { formatCurrency } from "@utils/currency";

type ItemErrors = { name?: string; unitPrice?: string; quantity?: string };

type LineItemsTableProps = {
  items: FormLineItem[];
  itemErrors: Record<string, ItemErrors>;
  catalog: Item[];
  loadingCatalog?: boolean;
  canEdit?: boolean;
  currency: string;
  onSelectItem: (lineId: string, itemId?: string) => void;
  onChange: (lineId: string, changes: Partial<FormLineItem>) => void;
  onRemove: (lineId: string) => void;
};

const LineItemsTable: React.FC<LineItemsTableProps> = ({
  items,
  itemErrors,
  catalog,
  loadingCatalog = false,
  canEdit = true,
  currency,
  onSelectItem,
  onChange,
  onRemove,
}) => {
  return (
    <StyledTable>
      <thead>
        <tr>
          <th style={{ width: "22%" }}>Item</th>
          <th>Description</th>
          <th className="td-right" style={{ width: 140 }}>
            Unit Price
          </th>
          <th className="td-right" style={{ width: 120 }}>
            Qty
          </th>
          <th className="td-right" style={{ width: 140 }}>
            Amount
          </th>
          <th className="td-right" style={{ width: 90 }}>
            Actions
          </th>
        </tr>
      </thead>
      <tbody>
        {items.map((li) => (
          <tr key={li.id}>
            <td>
              <StyledDropdown
                value={li.itemId ?? ""}
                onChange={(e) =>
                  onSelectItem(li.id, e.target.value || undefined)
                }
                disabled={loadingCatalog || !canEdit}
              >
                <option value="">
                  {loadingCatalog ? "Loading…" : "Select item"}
                </option>
                {catalog.map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.name}
                  </option>
                ))}
              </StyledDropdown>
              <StyledInput
                placeholder="Custom item name"
                id={`li-${li.id}-name`}
                value={li.name}
                onChange={(e) => onChange(li.id, { name: e.target.value })}
                style={{ marginTop: 8 }}
                disabled={!canEdit}
                error={itemErrors[li.id]?.name}
              />
            </td>
            <td>
              <StyledTextarea
                placeholder="Description"
                value={li.description}
                onChange={(e) =>
                  onChange(li.id, { description: e.target.value })
                }
                disabled={!canEdit}
              />
            </td>
            <td className="td-right">
              <StyledInput
                type="number"
                inputMode="decimal"
                min={0}
                step={0.01}
                id={`li-${li.id}-unitPrice`}
                value={
                  Number.isFinite(li.unitPrice) ? String(li.unitPrice) : ""
                }
                onChange={(e) =>
                  onChange(li.id, {
                    unitPrice: parseFloat(e.target.value || "0"),
                  })
                }
                disabled={!canEdit}
                error={itemErrors[li.id]?.unitPrice}
              />
            </td>
            <td className="td-right">
              <StyledInput
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                id={`li-${li.id}-quantity`}
                value={Number.isFinite(li.quantity) ? String(li.quantity) : ""}
                onChange={(e) =>
                  onChange(li.id, {
                    quantity: parseInt(e.target.value || "0", 10),
                  })
                }
                disabled={!canEdit}
                error={itemErrors[li.id]?.quantity}
              />
            </td>
            <td className="td-right">
              <span className="td-strong">
                {formatCurrency(li.amount, currency)}
              </span>
            </td>
            <td className="td-right">
              <button
                className="link-btn link-danger"
                onClick={() => onRemove(li.id)}
                disabled={items.length <= 1 || !canEdit}
              >
                Remove
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </StyledTable>
  );
};

export default LineItemsTable;
