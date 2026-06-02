import React from "react";
import StyledDropdown from "@components/core/StyledDropdown";
import StyledInput from "@components/core/StyledInput";
import StyledTextarea from "@components/core/StyledTextarea";
import ChoiceTileGroup from "@components/core/ChoiceTileGroup";
import LineItemsTable from "@components/documents/LineItemsTable";
import Button from "@components/core/Button";
import { formatCurrency } from "@utils/currency";
import { getDocNumberPlaceholder } from "@utils/documents";
import { SUPPORTED_CURRENCIES } from "@utils/currency";
import type { DocumentFormState, DocumentType } from "../../types/document";
import type { Customer } from "../../types/customer";
import type { Item } from "../../types/item";
import type { FormAction } from "@hooks/useDocumentForm";
import type {
  HeaderErrors,
  LineItemFieldErrors,
} from "@utils/documentValidation";

export type DocumentEditorFormProps = {
  canEdit: boolean;
  state: DocumentFormState;
  dispatch: React.Dispatch<FormAction>;
  currency: string;
  onCurrencyChange: (currency: string) => void;
  headerErrors: HeaderErrors;
  itemErrors: Record<string, LineItemFieldErrors>;
  visibleCustomers: Customer[];
  loadingCustomers: boolean;
  sortedCatalog: Item[];
  recentItemIds: string[];
  loadingItems: boolean;
  subtotal: number;
  total: number;
  onSelectItem: (lineId: string, itemId?: string) => void;
  onAddLine: () => void;
  onOpenCustomerModal: () => void;
  onOpenItemModal: (lineId?: string) => void;
  showDocumentTypeHint?: boolean;
  showDraftFinalizeHint?: boolean;
};

const DocumentEditorForm: React.FC<DocumentEditorFormProps> = ({
  canEdit,
  state,
  dispatch,
  currency,
  onCurrencyChange,
  headerErrors,
  itemErrors,
  visibleCustomers,
  loadingCustomers,
  sortedCatalog,
  recentItemIds,
  loadingItems,
  subtotal,
  total,
  onSelectItem,
  onAddLine,
  onOpenCustomerModal,
  onOpenItemModal,
  showDocumentTypeHint = false,
  showDraftFinalizeHint = false,
}) => {
  return (
    <>
      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
        >
          <div
            style={{
              gridColumn: "1 / -1",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            {canEdit ? (
              <StyledDropdown
                id="doc-currency"
                aria-label="Currency"
                value={currency}
                onChange={(e) => onCurrencyChange(e.target.value)}
                style={{ maxWidth: 140 }}
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </StyledDropdown>
            ) : (
              <StyledInput
                id="doc-currency"
                aria-label="Currency"
                value={currency}
                disabled
                style={{ maxWidth: 140 }}
              />
            )}

            <div style={{ marginLeft: "auto" }}>
              <ChoiceTileGroup<DocumentType>
                ariaLabel="Document Type"
                id="doc-documentType"
                value={state.documentType}
                columns={2}
                options={[
                  { value: "invoice", label: "Invoice" },
                  { value: "quotation", label: "Quotation" },
                ]}
                disabled={!canEdit}
                onChange={(next) =>
                  dispatch({
                    type: "SET_FIELD",
                    field: "documentType",
                    value: next,
                  })
                }
              />
              {headerErrors.documentType ? (
                <div className="modal-error">{headerErrors.documentType}</div>
              ) : null}
            </div>
          </div>

          {showDocumentTypeHint ? (
            <div style={{ marginTop: -8, gridColumn: "1 / -1" }}>
              <div
                className="text-xs"
                style={{ color: "var(--md-on-surface-variant)" }}
              >
                Use <strong>Quotation</strong> when you’re proposing work. Use{" "}
                <strong>Invoice</strong> when you’re billing for payment.
              </div>
            </div>
          ) : null}

          <StyledInput
            label="Document #"
            placeholder={getDocNumberPlaceholder(state.documentType)}
            value={state.documentNumber}
            onChange={(e) =>
              dispatch({
                type: "SET_FIELD",
                field: "documentNumber",
                value: e.target.value,
              })
            }
            disabled={!canEdit}
            error={headerErrors.documentNumber}
          />

          <StyledInput
            label="Date"
            type="date"
            id="doc-date"
            value={state.date}
            onChange={(e) =>
              dispatch({
                type: "SET_FIELD",
                field: "date",
                value: e.target.value,
              })
            }
            disabled={!canEdit}
            required
            error={headerErrors.date}
          />

          <div
            style={{
              gridColumn: "1 / -1",
              display: "flex",
              gap: 12,
              alignItems: "flex-end",
            }}
          >
            <div style={{ flex: 1, minWidth: 220 }}>
              <StyledDropdown
                label="Bill To"
                id="doc-customerId"
                value={state.customerId || ""}
                onChange={(e) =>
                  dispatch({
                    type: "SET_FIELD",
                    field: "customerId",
                    value: e.target.value || undefined,
                  })
                }
                required
                disabled={loadingCustomers || !canEdit}
                error={headerErrors.customerId}
              >
                <option value="">
                  {loadingCustomers
                    ? "Loading customers..."
                    : "Select customer"}
                </option>
                {visibleCustomers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </StyledDropdown>
            </div>
            {canEdit ? (
              <Button
                type="button"
                prominent
                onClick={onOpenCustomerModal}
                disabled={loadingCustomers}
              >
                Add customer
              </Button>
            ) : null}
          </div>

          {showDraftFinalizeHint ? (
            <div style={{ marginTop: -8, gridColumn: "1 / -1" }}>
              <div
                className="text-xs"
                style={{ color: "var(--md-on-surface-variant)" }}
              >
                Drafts stay editable. Finalized documents generate a PDF for
                sharing.
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div>
        <LineItemsTable
          items={state.lineItems}
          itemErrors={itemErrors}
          catalog={sortedCatalog}
          recentItemIds={recentItemIds}
          loadingCatalog={loadingItems}
          canEdit={canEdit}
          currency={currency}
          onSelectItem={onSelectItem}
          onChange={(lineId, changes) =>
            dispatch({ type: "UPDATE_LINE_ITEM", id: lineId, changes })
          }
          onRemove={(lineId) =>
            dispatch({ type: "REMOVE_LINE_ITEM", id: lineId })
          }
          onAddCatalogItem={canEdit ? onOpenItemModal : undefined}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 12,
          }}
        >
          <Button variant="secondary" onClick={onAddLine} disabled={!canEdit}>
            Add line item
          </Button>
          <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
            <div style={{ textAlign: "right" }}>
              <div className="muted">Subtotal</div>
              <div className="td-strong">
                {formatCurrency(subtotal, currency)}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="muted">Total</div>
              <div className="td-strong text-total">
                {formatCurrency(total, currency)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <StyledTextarea
          label="Notes"
          placeholder="Additional notes for the customer"
          value={state.notes}
          onChange={(e) =>
            dispatch({
              type: "SET_FIELD",
              field: "notes",
              value: e.target.value,
            })
          }
          disabled={!canEdit}
        />
      </div>
    </>
  );
};

export default DocumentEditorForm;
