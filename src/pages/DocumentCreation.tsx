import React, { useEffect, useMemo, useState } from "react";
import StyledDropdown from "@components/core/StyledDropdown";
import StyledInput from "@components/core/StyledInput";
import StyledTextarea from "@components/core/StyledTextarea";
import SegmentedToggle from "@components/core/SegmentedToggle";
import LineItemsTable from "@components/documents/LineItemsTable";
import Button from "@components/core/Button";
import { useAuth } from "@auth/useAuth";
import { useFirestore } from "@hooks/useFirestore";
import { useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
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
import PageHeader from "@components/layout/PageHeader";
import useUserProfile from "@hooks/useUserProfile";
import { db } from "../firebase/config";
import { todayIso } from "@utils/date";
import { computeAmount } from "@utils/documentMath";
import {
  incrementItemUsage,
  loadItemUsage,
  recentItemIds,
  sortCatalogByUsage,
  type ItemUsageMap,
} from "@utils/itemUsage";
import { SUPPORTED_CURRENCIES } from "@utils/currency";
import OnboardingStepper from "@components/core/OnboardingStepper";
import ItemModal from "@components/items/ItemModal";
import CustomerModal from "@components/customers/CustomerModal";
import { useDocumentCatalogModals } from "@hooks/useDocumentCatalogModals";

const DocumentCreation: React.FC = () => {
  usePageTitle("Create Document");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, updateUserProfile } = useUserProfile();

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
    initial: getDefaultInitialState(),
    customers,
    itemCatalog,
    canEdit: true,
  });

  useEffect(() => {
    if (!state.customerId && customers.length > 0) {
      dispatch({
        type: "SET_FIELD",
        field: "customerId",
        value: customers[0].id,
      });
    }
  }, [customers, state.customerId, dispatch]);

  const handleAddRow = () => addLine();

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const [finalizeError, setFinalizeError] = useState<string | null>(null);
  const [headerErrors, setHeaderErrors] = useState<HeaderErrors>({});
  const [itemErrors, setItemErrors] = useState<
    Record<string, LineItemFieldErrors>
  >({});
  const [prefilling, setPrefilling] = useState(false);
  const [itemUsage, setItemUsage] = useState<ItemUsageMap>({});
  const [currency, setCurrency] = useState<string>("USD");
  const [hasDocs, setHasDocs] = useState<boolean | null>(null);
  const dismissCreateGuide = !!profile?.onboarding?.createInvoiceDismissed;

  useEffect(() => {
    if (!user?.uid) return;
    // Determine whether this is a first-run scenario (no documents yet).
    const q = query(
      collection(db, "documents"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(1),
    );
    getDocs(q)
      .then((snap) => setHasDocs(snap.docs.length > 0))
      .catch(() => setHasDocs(true)); // fail open: hide onboarding if uncertain
  }, [user?.uid]);

  const showCreateGuide = !dismissCreateGuide && hasDocs === false;

  const handleDismissCreateGuide = () => {
    void updateUserProfile({
      onboarding: {
        ...(profile?.onboarding ?? {}),
        createInvoiceDismissed: true,
      },
    });
  };

  useEffect(() => {
    if (!user?.uid) return;
    setItemUsage(loadItemUsage(user.uid));
  }, [user?.uid]);

  useEffect(() => {
    if (profile?.currency) setCurrency(profile.currency);
  }, [profile?.currency]);

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

  const handleSelectItem = (lineId: string, itemId?: string) => {
    selectItemById(lineId, itemId);
    if (user?.uid && itemId) setItemUsage(incrementItemUsage(user.uid, itemId));
  };

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
      if (lineId) {
        dispatch({ type: "SET_ITEM_SELECTION", id: lineId, item });
        if (item.id && user?.uid) {
          setItemUsage(incrementItemUsage(user.uid, item.id));
        }
      }
    },
  });

  const handleCopyFromPrevious = async () => {
    if (!user?.uid) return;
    setPrefilling(true);
    setSaveError(null);
    setFinalizeError(null);
    setHeaderErrors({});
    setItemErrors({});
    try {
      const q = query(
        collection(db, "documents"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(1),
      );
      const snap = await getDocs(q);
      const d = snap.docs[0];
      if (!d) return;

      const prev = {
        id: d.id,
        ...(d.data() as DocumentEntity),
      } as DocumentEntity;
      const nextCustomerId = prev.customerId
        ? customers.some((c) => c.id === prev.customerId)
          ? prev.customerId
          : undefined
        : undefined;

      dispatch({
        type: "SET_ALL",
        value: {
          documentType: prev.type,
          documentNumber: "",
          date: todayIso(),
          customerId: nextCustomerId,
          notes: prev.notes ?? "",
          lineItems:
            prev.items?.length > 0
              ? prev.items.map((it) => ({
                  id: crypto.randomUUID(),
                  itemId: it.itemId,
                  name: it.name ?? "",
                  description: it.description ?? "",
                  unitPrice: Number.isFinite(it.unitPrice) ? it.unitPrice : 0,
                  quantity: Number.isFinite(it.quantity) ? it.quantity : 1,
                  amount: computeAmount(
                    Number.isFinite(it.unitPrice) ? it.unitPrice : 0,
                    Number.isFinite(it.quantity) ? it.quantity : 1,
                  ),
                }))
              : getDefaultInitialState().lineItems,
        },
      });
    } catch (e: unknown) {
      const message =
        e instanceof Error
          ? e.message
          : "Failed to copy from previous document";
      setSaveError(message);
    } finally {
      setPrefilling(false);
    }
  };

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
      const payload = {
        ...buildDocumentPayload(
          user.uid,
          state,
          "draft",
          autoDocNumber,
          selectCustomerDetails(customers, state.customerId),
          { subtotal, total },
        ),
        currency,
      };
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
        currency,
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
        currency: payload.currency || "USD",
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
    <>
      <div className="app-page">
        <PageHeader
          toolbar
          title="New invoice or quote"
          subtitle="Fill in the details below, then save a draft or download a PDF."
          secondaryActions={
            <>
              <Button
                variant="secondary"
                onClick={() => navigate("/dashboard")}
              >
                Cancel
              </Button>
              <Button
                variant="secondary"
                onClick={handleCopyFromPrevious}
                disabled={prefilling || saving || finalizing}
                aria-disabled={prefilling || saving || finalizing}
              >
                {prefilling ? "Copying…" : "Copy from previous"}
              </Button>
            </>
          }
          actions={
            <>
              <Button
                onClick={handleSaveDraft}
                disabled={saving || finalizing}
                aria-disabled={saving || finalizing}
              >
                {saving ? "Saving…" : "Save draft"}
              </Button>
              <Button
                onClick={handleFinalizeAndDownload}
                disabled={saving || finalizing || finalizeDisabled}
                aria-disabled={saving || finalizing || finalizeDisabled}
              >
                {finalizing ? "Finalizing…" : "Finalize & download PDF"}
              </Button>
            </>
          }
        />

        {saveError && <ErrorBanner>{saveError}</ErrorBanner>}
        {finalizeError && <ErrorBanner>{finalizeError}</ErrorBanner>}

        {showCreateGuide && (
          <OnboardingStepper
            title="First invoice guide"
            onDismissForever={handleDismissCreateGuide}
            steps={[
              {
                id: "billto",
                title: "Who are you billing?",
                body: (
                  <div>
                    Pick the customer you’re billing in <strong>Bill To</strong>
                    . If you don’t see them yet, add them from the Customers
                    page first.
                  </div>
                ),
              },
              {
                id: "items",
                title: "What are you charging for?",
                body: (
                  <div>
                    Add line items for products or services. You can choose from
                    saved items or type a custom name.
                  </div>
                ),
              },
              {
                id: "totals",
                title: "Double-check currency and totals",
                body: (
                  <div>
                    Choose a currency for this document and quickly review the
                    subtotal and total before saving.
                  </div>
                ),
              },
              {
                id: "save",
                title: "Save draft vs finalize",
                body: (
                  <div>
                    <strong>Save Draft</strong> keeps it editable.{" "}
                    <strong>Finalize</strong> generates a PDF for sharing.
                  </div>
                ),
              },
            ]}
          />
        )}

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

              <div style={{ marginLeft: "auto", minWidth: 260, maxWidth: 420 }}>
                <SegmentedToggle<DocumentType>
                  ariaLabel="Document Type"
                  id="doc-documentType"
                  value={state.documentType}
                  options={[
                    { value: "invoice", label: "Invoice" },
                    { value: "quotation", label: "Quotation" },
                  ]}
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
            <div style={{ marginTop: -8, gridColumn: "1 / -1" }}>
              <div
                className="text-xs"
                style={{ color: "var(--md-on-surface-variant)" }}
              >
                Use <strong>Quotation</strong> when you’re proposing work. Use{" "}
                <strong>Invoice</strong> when you’re billing for payment.
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
                  disabled={loadingCustomers}
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
              <Button
                type="button"
                prominent
                onClick={catalogModals.openCustomerModal}
                disabled={loadingCustomers}
              >
                Add customer
              </Button>
            </div>
            <div style={{ marginTop: -8, gridColumn: "1 / -1" }}>
              <div
                className="text-xs"
                style={{ color: "var(--md-on-surface-variant)" }}
              >
                Drafts stay editable. Finalized documents generate a PDF for
                sharing.
              </div>
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
            canEdit
            currency={currency}
            onSelectItem={handleSelectItem}
            onChange={changeLine}
            onRemove={removeLine}
            onAddCatalogItem={catalogModals.openItemModal}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 12,
            }}
          >
            <Button variant="secondary" onClick={handleAddRow}>
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
          />
        </div>
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

export default DocumentCreation;
