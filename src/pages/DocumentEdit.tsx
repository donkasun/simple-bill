import React, { useEffect, useMemo, useState } from "react";
import StyledDropdown from "@components/core/StyledDropdown";
import StyledInput from "@components/core/StyledInput";
import StyledTextarea from "@components/core/StyledTextarea";
import LineItemsTable from "@components/documents/LineItemsTable";
import PrimaryButton from "@components/core/PrimaryButton";
import SecondaryButton from "@components/core/SecondaryButton";
import ErrorBanner from "@components/core/ErrorBanner";
import { useAuth } from "@auth/useAuth";
import { useFirestore } from "@hooks/useFirestore";
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
import { allocateNextDocumentNumber } from "@utils/docNumber";
import { formatCurrency } from "@utils/currency";
import { downloadBlob } from "@utils/download";
import {
  buildDocumentPayload,
  selectCustomerDetails,
  getDocumentFilename,
  getDocNumberPlaceholder,
} from "@utils/documents";

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

import { computeAmount } from "@utils/documentMath";

import { todayIso } from "@utils/date";
import { useDocumentForm } from "@hooks/useDocumentForm";
import {
  validateDraft as validateDraftShared,
  validateFinalize as validateFinalizeShared,
} from "@utils/documentValidation";
import { usePageTitle } from "@components/layout/PageTitleContext";

const DocumentEdit: React.FC = () => {
  usePageTitle("Edit Document");
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

  const {
    set: setDocument,
    add: addDocument,
    getById: getDocument,
  } = useFirestore<PersistedDocumentEntity>({
    collectionName: "documents",
    userId: user?.uid,
    subscribe: false,
  });

  const [documentStatus, setDocumentStatus] = useState<DocumentStatus>("draft");
  const [currency, setCurrency] = useState("USD");

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
        setCurrency(data.currency || "USD");
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
  }, [id, dispatch]);

  useEffect(() => {
    if (!state.customerId && customers.length > 0) {
      dispatch({
        type: "SET_FIELD",
        field: "customerId",
        value: customers[0].id,
      });
    }
  }, [customers, state.customerId, dispatch]);

  const findItemById = (itemId?: string) =>
    itemCatalog.find((i) => i.id === itemId);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const [finalizeError, setFinalizeError] = useState<string | null>(null);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
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
          "Please fix the highlighted fields before saving changes.",
        );
        focusFirstError(validation);
        return;
      }
      const docNumber = state.documentNumber?.trim()
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
        docNumber,
        selectCustomerDetails(customers, state.customerId),
        { subtotal, total },
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

  const handleGenerateInvoice = async () => {
    setGenerateError(null);
    if (!user?.uid || !id) return;

    setGeneratingInvoice(true);

    try {
      const newDocNumber = await allocateNextDocumentNumber(
        user.uid,
        "invoice",
        todayIso(),
      );

      // We need to create a new state object for the invoice.
      // The main changes are the type, docNumber, and date.
      const newInvoiceState: DocumentFormState = {
        ...state,
        documentType: "invoice",
        documentNumber: newDocNumber,
        date: todayIso(),
      };

      const payload = buildDocumentPayload(
        user.uid,
        newInvoiceState,
        "draft", // Invoices are generated as drafts
        newDocNumber,
        selectCustomerDetails(customers, state.customerId),
        { subtotal, total },
      );

      // Add relationship tracking
      const invoicePayload = {
        ...payload,
        sourceDocumentId: id,
        sourceDocumentType: "quotation" as const,
      };

      // The `addDocument` function is already available from the `useFirestore` hook.
      const newInvoiceId = await addDocument(invoicePayload);

      // Update the source quotation to track the generated invoice
      const currentDoc = await getDocument(id);
      if (currentDoc) {
        const updatedRelatedInvoices = [
          ...(currentDoc.relatedInvoices || []),
          newInvoiceId,
        ];
        await setDocument(id, {
          ...currentDoc,
          relatedInvoices: updatedRelatedInvoices,
        });
      }

      // Redirect to the new invoice's edit page.
      navigate(`/documents/${newInvoiceId}/edit`);
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Failed to generate invoice";
      setGenerateError(message);
    } finally {
      setGeneratingInvoice(false);
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
            state.date,
          );
      const base = buildDocumentPayload(
        user.uid,
        state,
        "finalized",
        docNumber,
        selectCustomerDetails(customers, state.customerId),
        { subtotal, total },
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
        currency: base.currency || "USD",
      });
      const filename = `${getDocumentFilename(
        base.type as DocumentType,
        base.docNumber as string,
        base.date as string,
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

            {canEdit ? (
              <>
                <PrimaryButton
                  onClick={handleSaveChanges}
                  disabled={saving || finalizing || initializing}
                >
                  {saving ? "Saving…" : "Save Changes"}
                </PrimaryButton>
                <PrimaryButton
                  onClick={handleFinalizeAndDownload}
                  disabled={
                    saving || finalizing || initializing || finalizeDisabled
                  }
                >
                  {finalizing ? "Finalizing…" : "Finalize & Download PDF"}
                </PrimaryButton>
              </>
            ) : (
              state.documentType === "quotation" && (
                <PrimaryButton
                  onClick={handleGenerateInvoice}
                  disabled={generatingInvoice || initializing}
                >
                  {generatingInvoice ? "Generating…" : "Generate Invoice"}
                </PrimaryButton>
              )
            )}
          </div>
        </div>

        {initializing && <div>Loading document…</div>}
        {loadError && <ErrorBanner>{loadError}</ErrorBanner>}
        {!canEdit && !initializing && !loadError && (
          <ErrorBanner variant="warning">
            This document has been finalized and cannot be edited.
            {state.documentType === "quotation" && (
              <div style={{ marginTop: 8 }}>
                You can generate invoices from this finalized quotation.
              </div>
            )}
          </ErrorBanner>
        )}
        {saveError && <ErrorBanner>{saveError}</ErrorBanner>}
        {finalizeError && <ErrorBanner>{finalizeError}</ErrorBanner>}
        {generateError && <ErrorBanner>{generateError}</ErrorBanner>}

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
                currency={currency}
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
                      {formatCurrency(subtotal, currency)}
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
                      {formatCurrency(total, currency)}
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
