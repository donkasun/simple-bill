import React, { useEffect, useMemo, useState } from "react";
import StyledDropdown from "../components/core/StyledDropdown";
import StyledInput from "../components/core/StyledInput";
import StyledTextarea from "../components/core/StyledTextarea";
import LineItemsTable from "../components/documents/LineItemsTable";
import PrimaryButton from "../components/core/PrimaryButton";
import SecondaryButton from "../components/core/SecondaryButton";
import ErrorBanner from "../components/core/ErrorBanner";
import { useAuth } from "../auth/useAuth";
import { useFirestore } from "../hooks/useFirestore";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import type {
  DocumentEntity as PersistedDocumentEntity,
  DocumentFormState,
  FormLineItem,
  DocumentType,
  DocumentStatus,
} from "../types/document";
import type { Customer } from "../types/customer";
import type { Item } from "../types/item";
import { allocateNextDocumentNumber } from "../utils/docNumber";
import { formatCurrency } from "../utils/currency";
import { downloadBlob } from "../utils/download";
import {
  buildDocumentPayload,
  selectCustomerDetails,
  getDocumentFilename,
  getDocNumberPlaceholder,
} from "../utils/documents";

type LineItem = FormLineItem;

function createEmptyLineItem(): LineItem {
  return {
    id: crypto.randomUUID(),
    name: "",
    description: "",
    unitPrice: 0,
    quantity: 1,
    amount: 0,
  };
}

import { computeAmount } from "../utils/documentMath";

import { todayIso } from "../utils/date";
import { useDocumentForm } from "../hooks/useDocumentForm";
import {
  validateDraft as validateDraftShared,
  validateFinalize as validateFinalizeShared,
} from "../utils/documentValidation";

const DocumentEdit: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

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

  const { set: setDocument } = useFirestore<PersistedDocumentEntity>({
    collectionName: "documents",
    userId: user?.uid,
    subscribe: false,
  });

  const [documentStatus, setDocumentStatus] = useState<DocumentStatus>("draft");

  const { state, dispatch, subtotal, total } = useDocumentForm({
    initial: {
      documentType: "invoice",
      documentNumber: "",
      date: todayIso(),
      customerId: undefined,
      notes: "",
      lineItems: [createEmptyLineItem()],
    },
    customers,
    itemCatalog,
    canEdit: documentStatus === "draft",
  });

  const [initializing, setInitializing] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadDocument() {
      if (!id) {
        setLoadError("Missing document id");
        setInitializing(false);
        return;
      }
      try {
        const ref = doc(db, "documents", id);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          if (!mounted) return;
          setLoadError("Document not found");
          setInitializing(false);
          return;
        }
        const data = snap.data() as PersistedDocumentEntity;
        if (!mounted) return;
        setDocumentStatus(data.status);
        const items: LineItem[] = (data.items ?? []).map((it) => ({
          id: crypto.randomUUID(),
          itemId: it.itemId,
          name: it.name,
          description: it.description,
          unitPrice: Number.isFinite(it.unitPrice) ? it.unitPrice : 0,
          quantity: Number.isFinite(it.quantity) ? it.quantity : 0,
          amount: Number.isFinite(it.amount)
            ? it.amount
            : computeAmount(it.unitPrice ?? 0, it.quantity ?? 0),
        }));
        dispatch({
          type: "SET_ALL",
          value: {
            documentType: data.type,
            documentNumber: data.docNumber ?? "",
            date: data.date,
            customerId: data.customerId,
            notes: data.notes,
            lineItems: items.length > 0 ? items : [createEmptyLineItem()],
          },
        });
      } catch (e: unknown) {
        const message =
          e instanceof Error ? e.message : "Failed to load document";
        setLoadError(message);
      } finally {
        if (mounted) setInitializing(false);
      }
    }
    loadDocument();
    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (!state.customerId && customers.length > 0) {
      dispatch({
        type: "SET_FIELD",
        field: "customerId",
        value: customers[0].id,
      });
    }
  }, [customers, state.customerId]);

  const findItemById = (itemId?: string) =>
    itemCatalog.find((i) => i.id === itemId);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const [finalizeError, setFinalizeError] = useState<string | null>(null);
  const [headerErrors, setHeaderErrors] = useState<{
    documentType?: string;
    date?: string;
    customerId?: string;
  }>({});
  const [itemErrors, setItemErrors] = useState<
    Record<string, { name?: string; unitPrice?: string; quantity?: string }>
  >({});

  function validateDraft(s: DocumentFormState) {
    return validateDraftShared(s);
  }

  function validateFinalize(s: DocumentFormState) {
    return validateFinalizeShared(s);
  }

  const finalizeDisabled = useMemo(() => {
    const res = validateFinalize(state);
    return (
      Object.keys(res.header).length > 0 || Object.keys(res.items).length > 0
    );
  }, [state]);

  function focusFirstError(res: {
    header: { documentType?: string; date?: string; customerId?: string };
    items: Record<
      string,
      { name?: string; unitPrice?: string; quantity?: string }
    >;
  }) {
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

  const handleSaveChanges = async () => {
    setSaveError(null);
    if (!id || !user?.uid) return;
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
          "Please fix the highlighted fields before saving changes."
        );
        focusFirstError(validation);
        return;
      }
      const docNumber = state.documentNumber?.trim()
        ? state.documentNumber.trim()
        : await allocateNextDocumentNumber(
            user.uid,
            state.documentType,
            state.date
          );
      const payload = buildDocumentPayload(
        user.uid,
        state,
        "draft",
        docNumber,
        selectCustomerDetails(customers, state.customerId),
        { subtotal, total }
      );
      await setDocument(id, payload);
      navigate("/dashboard");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to save changes";
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleFinalizeAndDownload = async () => {
    setFinalizeError(null);
    if (!id || !user?.uid) return;
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
      const docNumber = state.documentNumber?.trim()
        ? state.documentNumber.trim()
        : await allocateNextDocumentNumber(
            user.uid,
            state.documentType,
            state.date
          );
      const base = buildDocumentPayload(
        user.uid,
        state,
        "finalized",
        docNumber,
        selectCustomerDetails(customers, state.customerId),
        { subtotal, total }
      );
      const payload: Partial<PersistedDocumentEntity> = {
        ...base,
        finalizedAt:
          serverTimestamp() as unknown as import("firebase/firestore").Timestamp,
      };

      await setDocument(id, payload);

      const { generateDocumentPdf } = await import("../utils/pdf");
      const pdfBytes = await generateDocumentPdf({
        type: base.type as DocumentType,
        docNumber: base.docNumber || "",
        date: base.date as string,
        customerDetails: base.customerDetails,
        items: base.items,
        subtotal: base.subtotal as number,
        total: base.total as number,
      });
      const filename = `${getDocumentFilename(
        base.type as DocumentType,
        base.docNumber as string,
        base.date as string
      )}.pdf`;
      downloadBlob(filename, pdfBytes, "application/pdf");

      navigate("/dashboard");
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Failed to finalize & download";
      setFinalizeError(message);
    } finally {
      setFinalizing(false);
    }
  };

  const canEdit = documentStatus === "draft";

  const headerTitle = "Edit Document";

  return (
    <div style={{ padding: "1rem" }}>
      <div className="container-xl">
        <div className="page-header">
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>
            {headerTitle}
          </h2>
          <div style={{ display: "flex", gap: 8 }}>
            <SecondaryButton onClick={() => navigate("/dashboard")}>
              Cancel
            </SecondaryButton>
            <PrimaryButton
              onClick={handleSaveChanges}
              disabled={saving || finalizing || initializing || !canEdit}
              aria-disabled={saving || finalizing || initializing || !canEdit}
            >
              {saving ? "Saving…" : "Save Changes"}
            </PrimaryButton>
            <PrimaryButton
              onClick={handleFinalizeAndDownload}
              disabled={
                saving ||
                finalizing ||
                initializing ||
                !canEdit ||
                finalizeDisabled
              }
              aria-disabled={
                saving ||
                finalizing ||
                initializing ||
                !canEdit ||
                finalizeDisabled
              }
            >
              {finalizing ? "Finalizing…" : "Finalize & Download PDF"}
            </PrimaryButton>
          </div>
        </div>

        {initializing && <div>Loading document…</div>}
        {loadError && <ErrorBanner>{loadError}</ErrorBanner>}
        {!canEdit && !initializing && !loadError && (
          <ErrorBanner variant="warning">
            This document has been finalized and cannot be edited.
          </ErrorBanner>
        )}
        {saveError && <ErrorBanner>{saveError}</ErrorBanner>}
        {finalizeError && <ErrorBanner>{finalizeError}</ErrorBanner>}

        {!initializing && !loadError && (
          <>
            <div className="card" style={{ padding: 16, marginBottom: 16 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
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
                  disabled={!canEdit}
                  required
                  error={headerErrors.documentType}
                >
                  <option value="invoice">Invoice</option>
                  <option value="quotation">Quotation</option>
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
                  disabled={!canEdit}
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
                  disabled={loadingCustomers || !canEdit}
                  error={headerErrors.customerId}
                >
                  <option value="" disabled>
                    {loadingCustomers
                      ? "Loading customers…"
                      : "Select a customer"}
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
                canEdit={canEdit}
                onSelectItem={(lineId, itemId) => {
                  const selected = findItemById(itemId);
                  dispatch({
                    type: "SET_ITEM_SELECTION",
                    id: lineId,
                    item: selected,
                  });
                }}
                onChange={(lineId, changes) =>
                  dispatch({ type: "UPDATE_LINE_ITEM", id: lineId, changes })
                }
                onRemove={(lineId) =>
                  dispatch({ type: "REMOVE_LINE_ITEM", id: lineId })
                }
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 12,
                  padding: "0 16px",
                }}
              >
                <SecondaryButton
                  onClick={() => dispatch({ type: "ADD_LINE_ITEM" })}
                  disabled={!canEdit}
                >
                  Add Line Item
                </SecondaryButton>
                <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                  <div>
                    <div className="muted" style={{ fontSize: 12 }}>
                      Subtotal
                    </div>
                    <div className="td-strong" style={{ textAlign: "right" }}>
                      {formatCurrency(subtotal)}
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
                      {formatCurrency(total)}
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
                disabled={!canEdit}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DocumentEdit;
