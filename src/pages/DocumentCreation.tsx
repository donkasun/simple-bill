import React, { useEffect, useMemo, useState } from "react";
import StyledDropdown from "@components/core/StyledDropdown";
import StyledInput from "@components/core/StyledInput";
import StyledTextarea from "@components/core/StyledTextarea";
import LineItemsTable from "@components/documents/LineItemsTable";
import PrimaryButton from "@components/core/PrimaryButton";
import SecondaryButton from "@components/core/SecondaryButton";
import { useAuth } from "@auth/useAuth";
import { useFirestore } from "@hooks/useFirestore";
import { useNavigate } from "react-router-dom";
import { serverTimestamp } from "firebase/firestore";
import { allocateNextDocumentNumber } from "@utils/docNumber";
import { formatCurrency } from "@utils/currency";
import type { DocumentEntity, DocumentType } from "../types/document";
import type { Customer } from "../types/customer";
import type { Item } from "../types/item";
import {
  buildDocumentPayload,
  selectCustomerDetails,
  getDocumentFilename,
  getDocNumberPlaceholder,
} from "@utils/documents";
import { downloadBlob } from "../utils/download";
import ErrorBanner from "@components/core/ErrorBanner";
import {
  useDocumentForm,
  type LineItemFieldErrors,
  type HeaderErrors,
  type ValidationResult,
  getDefaultInitialState,
} from "@hooks/useDocumentForm";
import { validateDraft, validateFinalize } from "@utils/documentValidation";
import { usePageTitle } from "@components/layout/PageTitleContext";
import useUserProfile from "@hooks/useUserProfile";

const currencies = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD"];

const DocumentCreation: React.FC = () => {
  usePageTitle("Create Document");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, loading: loadingProfile } = useUserProfile();

  const { items: customers, loading: loadingCustomers } =
    useFirestore<Customer>({
      collectionName: "customers",
      userId: user?.uid,
      orderByField: "createdAt",
    });
  const { items: itemCatalog, loading: loadingItems } = useFirestore<Item>({
    collectionName: "items",
    userId: user?.uid,
    orderByField: "createdAt",
  });

  const { add: addDocument } = useFirestore<DocumentEntity>({
    collectionName: "documents",
    userId: user?.uid,
    subscribe: false,
  });

  const {
    state,
    dispatch,
    addLine,
    removeLine,
    changeLine,
    selectItemById,
    subtotal,
    total,
  } = useDocumentForm({
    initial: getDefaultInitialState(profile?.currency),
    customers,
    itemCatalog,
    canEdit: true,
  });

  useEffect(() => {
    if (profile?.currency && state.currency !== profile.currency) {
      dispatch({
        type: "SET_FIELD",
        field: "currency",
        value: profile.currency,
      });
    }
  }, [profile, state.currency, dispatch]);

  useEffect(() => {
    if (!state.customerId && customers.length > 0) {
      dispatch({
        type: "SET_FIELD",
        field: "customerId",
        value: customers[0].id,
      });
    }
  }, [customers, state.customerId]);

  const handleAddRow = () => addLine();

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const [finalizeError, setFinalizeError] = useState<string | null>(null);
  const [headerErrors, setHeaderErrors] = useState<HeaderErrors>({});
  const [itemErrors, setItemErrors] = useState<
    Record<string, LineItemFieldErrors>
  >({});

  const finalizeDisabled = useMemo(() => {
    const res = validateFinalize(state);
    return (
      Object.keys(res.header).length > 0 || Object.keys(res.items).length > 0
    );
  }, [state]);

  function focusFirstError(res: ValidationResult) {
    const orderHeaderIds = [
      res.header.documentType ? "doc-documentType" : null,
      res.header.date ? "doc-date" : null,
      res.header.customerId ? "doc-customerId" : null,
    ].filter(Boolean) as string[];
    if (orderHeaderIds.length > 0) {
      document.getElementById(orderHeaderIds[0])?.focus();
      return;
    }
    for (const li of state.lineItems) {
      const e = res.items[li.id];
      if (!e) continue;
      const id = e.name
        ? `li-${li.id}-name`
        : e.unitPrice
          ? `li-${li.id}-unitPrice`
          : e.quantity
            ? `li-${li.id}-quantity`
            : null;
      if (id) {
        document.getElementById(id)?.focus();
        return;
      }
    }
  }

  const handleSaveDraft = async () => {
    setSaveError(null);
    if (!user?.uid) return;
    setSaving(true);
    try {
      const validation = validateDraft(state);
      setHeaderErrors(validation.header);
      setItemErrors(validation.items);
      const hasErrors =
        Object.keys(validation.header).length > 0 ||
        Object.keys(validation.items).length > 0;
      if (hasErrors) {
        setSaveError(
          "Please fix the highlighted fields before saving the draft.",
        );
        focusFirstError(validation);
        return;
      }

      const autoDocNumber = state.documentNumber?.trim()
        ? state.documentNumber.trim()
        : await allocateNextDocumentNumber(
            user.uid,
            state.documentType,
            state.date,
          );
      const payload = buildDocumentPayload(
        user.uid,
        state,
        "draft",
        autoDocNumber,
        selectCustomerDetails(customers, state.customerId),
        { subtotal, total },
      );
      const id = await addDocument(payload);
      if (id) navigate("/dashboard");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to save draft";
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleFinalizeAndDownload = async () => {
    setFinalizeError(null);
    if (!user?.uid) return;
    setFinalizing(true);
    try {
      const validation = validateFinalize(state);
      setHeaderErrors(validation.header);
      setItemErrors(validation.items);
      const hasErrors =
        Object.keys(validation.header).length > 0 ||
        Object.keys(validation.items).length > 0;
      if (hasErrors) {
        setFinalizeError("Please resolve the errors to finalize.");
        focusFirstError(validation);
        return;
      }

      const autoDocNumber = state.documentNumber?.trim()
        ? state.documentNumber.trim()
        : await allocateNextDocumentNumber(
            user.uid,
            state.documentType,
            state.date,
          );
      const payload = {
        ...buildDocumentPayload(
          user.uid,
          state,
          "finalized",
          autoDocNumber,
          selectCustomerDetails(customers, state.customerId),
          { subtotal, total },
        ),
        finalizedAt:
          serverTimestamp() as unknown as import("firebase/firestore").Timestamp,
      } as Omit<DocumentEntity, "id" | "createdAt" | "updatedAt"> & {
        finalizedAt: import("firebase/firestore").Timestamp;
      };

      const id = await addDocument(payload);

      const { generateDocumentPdf } = await import("../utils/pdf");
      const pdfBytes = await generateDocumentPdf({
        type: payload.type,
        docNumber: payload.docNumber,
        date: payload.date,
        customerDetails: payload.customerDetails,
        items: payload.items,
        subtotal: payload.subtotal,
        total: payload.total,
      });
      const filename = `${getDocumentFilename(
        payload.type,
        payload.docNumber,
        payload.date,
      )}.pdf`;
      downloadBlob(filename, pdfBytes, "application/pdf");

      if (id) navigate("/dashboard");
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Failed to finalize & download";
      setFinalizeError(message);
    } finally {
      setFinalizing(false);
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <div className="container-xl">
        <div className="page-header">
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>
            Create Document
          </h2>
          <div style={{ display: "flex", gap: 8 }}>
            <SecondaryButton onClick={() => navigate("/dashboard")}>
              Cancel
            </SecondaryButton>
            <PrimaryButton
              onClick={handleSaveDraft}
              disabled={saving || finalizing}
              aria-disabled={saving || finalizing}
            >
              {saving ? "Saving…" : "Save Draft"}
            </PrimaryButton>
            <PrimaryButton
              onClick={handleFinalizeAndDownload}
              disabled={saving || finalizing || finalizeDisabled}
              aria-disabled={saving || finalizing || finalizeDisabled}
            >
              {finalizing ? "Finalizing…" : "Finalize & Download PDF"}
            </PrimaryButton>
          </div>
        </div>

        {saveError && <ErrorBanner>{saveError}</ErrorBanner>}
        {finalizeError && <ErrorBanner>{finalizeError}</ErrorBanner>}

        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            <StyledDropdown
              label="Document Type"
              id="doc-documentType"
              value={state.documentType}
              onChange={(e) =>
                dispatch({
                  type: "SET_FIELD",
                  field: "documentType",
                  value: e.target.value as DocumentType,
                })
              }
              required
              error={headerErrors.documentType}
            >
              <option value="invoice">Invoice</option>
              <option value="quotation">Quotation</option>
            </StyledDropdown>

            <StyledDropdown
              label="Currency"
              id="doc-currency"
              value={state.currency}
              onChange={(e) =>
                dispatch({
                  type: "SET_FIELD",
                  field: "currency",
                  value: e.target.value,
                })
              }
              disabled={loadingProfile}
            >
              {currencies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </StyledDropdown>

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
              required
              error={headerErrors.date}
            />

            <StyledDropdown
              label="Bill To"
              id="doc-customerId"
              value={state.customerId ?? ""}
              onChange={(e) =>
                dispatch({
                  type: "SET_FIELD",
                  field: "customerId",
                  value: e.target.value || undefined,
                })
              }
              disabled={loadingCustomers}
              required={false}
              error={headerErrors.customerId}
            >
              <option value="" disabled>
                {loadingCustomers ? "Loading customers…" : "Select a customer"}
              </option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </StyledDropdown>
          </div>
        </div>

        <div>
          <LineItemsTable
            items={state.lineItems}
            itemErrors={itemErrors}
            catalog={itemCatalog}
            loadingCatalog={loadingItems}
            canEdit
            onSelectItem={selectItemById}
            onChange={changeLine}
            onRemove={removeLine}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 12,
              padding: "0 16px",
            }}
          >
            <SecondaryButton onClick={handleAddRow}>
              Add Line Item
            </SecondaryButton>
            <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>
                  Subtotal
                </div>
                <div className="td-strong" style={{ textAlign: "right" }}>
                  {formatCurrency(subtotal, state.currency)}
                </div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>
                  Total
                </div>
                <div
                  className="td-strong"
                  style={{ textAlign: "right", fontSize: 18 }}
                >
                  {formatCurrency(total, state.currency)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 16, marginTop: 16 }}>
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
          />
        </div>
      </div>
    </div>
  );
};

export default DocumentCreation;
