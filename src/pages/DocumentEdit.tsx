import React, { useEffect, useMemo, useState } from "react";
import StyledDropdown from "@components/core/StyledDropdown";
import StyledInput from "@components/core/StyledInput";
import StyledTextarea from "@components/core/StyledTextarea";
import SegmentedToggle from "@components/core/SegmentedToggle";
import LineItemsTable from "@components/documents/LineItemsTable";
import Button from "@components/core/Button";
import ErrorBanner from "@components/core/ErrorBanner";

import { useAuth } from "@auth/useAuth";
import { useFirestore } from "@hooks/useFirestore";
import { useNavigate, useParams, useLocation } from "react-router-dom";
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
import PageHeader from "@components/layout/PageHeader";
import CustomerModal from "@components/customers/CustomerModal";
import ItemModal from "@components/items/ItemModal";
import { useDocumentCatalogModals } from "@hooks/useDocumentCatalogModals";
import {
  incrementItemUsage,
  loadItemUsage,
  recentItemIds,
  sortCatalogByUsage,
  type ItemUsageMap,
} from "@utils/itemUsage";
import { SUPPORTED_CURRENCIES } from "@utils/currency";

const DocumentEdit: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const {
    items: customers,
    loading: loadingCustomers,
    add: addCustomer,
  } = useFirestore<Customer>({
    collectionName: "customers",
    userId: user?.uid,
    orderByField: "createdAt",
  });
  const {
    items: itemCatalog,
    loading: loadingItems,
    add: addItem,
  } = useFirestore<Item>({
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
  // Auto-enter edit mode when arriving from a duplicate/copy action
  const [isEditMode, setIsEditMode] = useState(
    () => !!(location.state as { autoEdit?: boolean } | null)?.autoEdit,
  );
  const [currency, setCurrency] = useState("USD");
  const [itemUsage, setItemUsage] = useState<ItemUsageMap>({});

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
    canEdit: documentStatus === "draft" && isEditMode,
  });

  const [initializing, setInitializing] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const canEdit = documentStatus === "draft" && isEditMode;
  const pageTitle = canEdit ? "Edit Document" : "View Document";
  usePageTitle(pageTitle);

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
        // Auto-enter edit mode for drafts; finalized docs are always view-only
        setIsEditMode(data.status === "draft");
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

  useEffect(() => {
    if (!user?.uid) return;
    setItemUsage(loadItemUsage(user.uid));
  }, [user?.uid]);

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

  const visibleCustomers = useMemo(() => {
    if (!state.customerId) return customers;
    const selected = customers.find((c) => c.id === state.customerId);
    if (!selected) return customers;
    return [selected, ...customers.filter((c) => c.id !== selected.id)];
  }, [customers, state.customerId]);

  const sortedCatalog = useMemo(
    () => sortCatalogByUsage(itemCatalog, itemUsage),
    [itemCatalog, itemUsage],
  );
  const recentIds = useMemo(() => recentItemIds(itemUsage, 5), [itemUsage]);

  const catalogModals = useDocumentCatalogModals({
    userId: user?.uid,
    addCustomer,
    addItem,
    onCustomerCreated: (customerId) => {
      dispatch({
        type: "SET_FIELD",
        field: "customerId",
        value: customerId,
      });
    },
    onItemCreated: (item, lineId) => {
      if (!lineId) return;
      if (user?.uid && item.id) {
        setItemUsage(incrementItemUsage(user.uid, item.id));
      }
      dispatch({ type: "SET_ITEM_SELECTION", id: lineId, item });
    },
  });

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
      await setDocument(id, { ...payload, currency });
      // Stay in edit mode after saving - don't navigate away
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
        currency,
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
        currency,
        finalizedAt:
          serverTimestamp() as unknown as import("firebase/firestore").Timestamp,
      };

      await setDocument(id, payload);

      // Update local state to reflect the finalized status
      setDocumentStatus("finalized");
      setIsEditMode(false);

      const { generateDocumentPdf } = await import("../utils/pdf");
      const pdfBytes = await generateDocumentPdf({
        type: base.type as DocumentType,
        docNumber: base.docNumber || "",
        date: base.date as string,
        customerDetails: base.customerDetails,
        items: base.items,
        subtotal: base.subtotal as number,
        total: base.total as number,
        currency,
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
        e instanceof Error ? e.message : "Failed to finish & save";
      setFinalizeError(message);
    } finally {
      setFinalizing(false);
    }
  };

  const headerTitle = canEdit ? "Edit document" : "View document";
  const headerSubtitle = canEdit
    ? "Update details, then save or download a PDF."
    : documentStatus === "draft"
      ? "Draft — click Edit to start making changes."
      : "This document is finalized and cannot be edited.";

  return (
    <>
      <div className="app-page">
        <PageHeader
          toolbar
          title={headerTitle}
          subtitle={headerSubtitle}
          secondaryActions={
            <Button variant="secondary" onClick={() => navigate("/dashboard")}>
              Cancel
            </Button>
          }
          actions={
            <>
              {canEdit ? (
                <>
                  <Button
                    onClick={handleSaveChanges}
                    disabled={saving || finalizing || initializing}
                  >
                    {saving ? "Saving…" : "Save changes"}
                  </Button>
                  <Button
                    onClick={handleFinalizeAndDownload}
                    disabled={
                      saving || finalizing || initializing || finalizeDisabled
                    }
                  >
                    {finalizing ? "Finishing…" : "Finish & download PDF"}
                  </Button>
                </>
              ) : (
                <>
                  {documentStatus === "draft" && (
                    <Button
                      variant="secondary"
                      onClick={() => setIsEditMode(true)}
                      disabled={initializing}
                    >
                      Edit document
                    </Button>
                  )}
                  {state.documentType === "quotation" && (
                    <Button
                      onClick={handleGenerateInvoice}
                      disabled={generatingInvoice || initializing}
                    >
                      {generatingInvoice ? "Generating…" : "Generate invoice"}
                    </Button>
                  )}
                </>
              )}
            </>
          }
        />

        {initializing && <div>Loading document…</div>}
        {loadError && <ErrorBanner>{loadError}</ErrorBanner>}
        {!canEdit &&
          documentStatus !== "draft" &&
          !initializing &&
          !loadError && (
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
                      onChange={(e) => setCurrency(e.target.value)}
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

                  <div
                    style={{ marginLeft: "auto", minWidth: 260, maxWidth: 420 }}
                  >
                    <SegmentedToggle<DocumentType>
                      ariaLabel="Document Type"
                      id="doc-documentType"
                      value={state.documentType}
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
                      <div className="modal-error">
                        {headerErrors.documentType}
                      </div>
                    ) : null}
                  </div>
                </div>

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
                      onClick={catalogModals.openCustomerModal}
                      disabled={loadingCustomers}
                    >
                      Add customer
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>

            <div>
              <LineItemsTable
                items={state.lineItems}
                itemErrors={itemErrors}
                catalog={sortedCatalog}
                recentItemIds={recentIds}
                loadingCatalog={loadingItems}
                canEdit={canEdit}
                currency={currency}
                onSelectItem={(lineId, itemId) => {
                  const selected = findItemById(itemId);
                  if (user?.uid && itemId)
                    setItemUsage(incrementItemUsage(user.uid, itemId));
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
                onAddCatalogItem={
                  canEdit ? catalogModals.openItemModal : undefined
                }
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 12,
                }}
              >
                <Button
                  variant="secondary"
                  onClick={() => dispatch({ type: "ADD_LINE_ITEM" })}
                  disabled={!canEdit}
                >
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
        )}
      </div>

      <CustomerModal
        open={catalogModals.customerModalOpen}
        title="Add customer"
        submitting={catalogModals.customerSubmitting}
        onSubmit={catalogModals.handleCustomerSubmit}
        onCancel={catalogModals.closeCustomerModal}
      />
      <ItemModal
        open={catalogModals.itemModalOpen}
        title="Add product or service"
        submitting={catalogModals.itemSubmitting}
        onSubmit={catalogModals.handleItemSubmit}
        onCancel={catalogModals.closeItemModal}
      />
    </>
  );
};

export default DocumentEdit;
