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

const DocumentCreation: React.FC = () => {
  usePageTitle("Create Document");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useUserProfile();

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
  const [customerQuery, setCustomerQuery] = useState("");
  const [itemUsage, setItemUsage] = useState<ItemUsageMap>({});

  useEffect(() => {
    if (!user?.uid) return;
    setItemUsage(loadItemUsage(user.uid));
  }, [user?.uid]);

  const visibleCustomers = useMemo(() => {
    const q = customerQuery.trim().toLowerCase();
    if (!q) return customers;
    const filtered = customers.filter((c) =>
      String(c.name ?? "")
        .toLowerCase()
        .includes(q),
    );
    const selected = state.customerId
      ? customers.find((c) => c.id === state.customerId)
      : undefined;
    if (selected && !filtered.some((c) => c.id === selected.id))
      return [selected, ...filtered];
    return filtered;
  }, [customers, customerQuery, state.customerId]);

  const sortedCatalog = useMemo(
    () => sortCatalogByUsage(itemCatalog, itemUsage),
    [itemCatalog, itemUsage],
  );
  const recentIds = useMemo(() => recentItemIds(itemUsage, 5), [itemUsage]);

  const handleSelectItem = (lineId: string, itemId?: string) => {
    selectItemById(lineId, itemId);
    if (user?.uid && itemId) setItemUsage(incrementItemUsage(user.uid, itemId));
  };

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
        currency: profile?.currency || "USD",
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
        currency: profile?.currency || "USD",
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
            <SecondaryButton
              onClick={handleCopyFromPrevious}
              disabled={prefilling || saving || finalizing}
              aria-disabled={prefilling || saving || finalizing}
            >
              {prefilling ? "Copying…" : "Copy from previous"}
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

            <StyledInput
              label="Find customer"
              placeholder="Start typing a name…"
              value={customerQuery}
              onChange={(e) => setCustomerQuery(e.target.value)}
              disabled={loadingCustomers}
            />
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
                {loadingCustomers ? "Loading customers..." : "Select customer"}
              </option>
              {visibleCustomers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </StyledDropdown>
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
            currency={profile?.currency || "USD"}
            onSelectItem={handleSelectItem}
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
              <div style={{ textAlign: "right" }}>
                <div className="muted" style={{ fontSize: 12 }}>
                  Subtotal
                </div>
                <div className="td-strong">
                  {formatCurrency(subtotal, profile?.currency || "USD")}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="muted" style={{ fontSize: 12 }}>
                  Total
                </div>
                <div className="td-strong" style={{ fontSize: 18 }}>
                  {formatCurrency(total, profile?.currency || "USD")}
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
    </div>
  );
};

export default DocumentCreation;
