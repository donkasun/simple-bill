import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { useAuth } from "@auth/useAuth";
import { useFirestore } from "@hooks/useFirestore";
import useUserProfile from "@hooks/useUserProfile";
import {
  useDocumentForm,
  getDefaultInitialState,
  createEmptyLineItem,
} from "@hooks/useDocumentForm";
import { useDocumentCatalogModals } from "@hooks/useDocumentCatalogModals";
import type {
  DocumentEntity,
  DocumentFormState,
  DocumentStatus,
  DocumentType,
} from "../../types/document";
import type { Customer } from "../../types/customer";
import type { Item } from "../../types/item";
import { db } from "../../firebase/config";
import {
  allocateNextDocumentNumber,
  isDocNumberTaken,
  reconcileDocCounter,
  DuplicateDocNumberError,
} from "@utils/docNumber";
import {
  buildDocumentPayload,
  selectCustomerDetails,
  getDocumentFilename,
} from "@utils/documents";
import { downloadBlob } from "@utils/download";
import { todayIso } from "@utils/date";
import { computeAmount } from "@utils/documentMath";
import {
  validateDraft,
  validateFinalize,
  type HeaderErrors,
  type LineItemFieldErrors,
} from "@utils/documentValidation";
import { focusFirstValidationError } from "@utils/documentFormFocus";
import {
  incrementItemUsage,
  loadItemUsage,
  recentItemIds,
  sortCatalogByUsage,
  type ItemUsageMap,
} from "@utils/itemUsage";
import { recordCustomerBilled } from "@utils/customerUsage";
import type { DocumentEditorFormProps } from "@components/documents/DocumentEditorForm";

export type UseDocumentPageArgs =
  | { mode: "create" }
  | { mode: "edit"; documentId: string };

export type DocumentPageViewModel = {
  mode: "create" | "edit";
  state: ReturnType<typeof useDocumentForm>["state"];
  dispatch: ReturnType<typeof useDocumentForm>["dispatch"];
  currency: string;
  subtotal: number;
  total: number;
  visibleCustomers: Customer[];
  loadingCustomers: boolean;
  sortedCatalog: Item[];
  recentItemIds: string[];
  loadingItems: boolean;
  headerErrors: HeaderErrors;
  itemErrors: Record<string, LineItemFieldErrors>;
  finalizeDisabled: boolean;
  banners: {
    saveError: string | null;
    finalizeError: string | null;
    loadError: string | null;
    generateError: string | null;
  };
  flags: {
    saving: boolean;
    finalizing: boolean;
    prefilling: boolean;
    initializing: boolean;
    generatingInvoice: boolean;
    canEdit: boolean;
    documentStatus: DocumentStatus;
    showCreateGuide: boolean;
    showForm: boolean;
  };
  catalogModals: ReturnType<typeof useDocumentCatalogModals>;
  formProps: Omit<
    DocumentEditorFormProps,
    "showDocumentTypeHint" | "showDraftFinalizeHint"
  >;
  actions: {
    saveDraft: () => Promise<void>;
    saveChanges: () => Promise<void>;
    finalizeAndDownload: () => Promise<void>;
    copyFromPrevious: () => Promise<void>;
    dismissCreateGuide: () => void;
    generateInvoice: () => Promise<void>;
    enterEditMode: () => void;
    navigateCancel: () => void;
  };
};

export function useDocumentPage(
  args: UseDocumentPageArgs,
): DocumentPageViewModel {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { profile, updateUserProfile } = useUserProfile();

  const locationState = location.state as {
    customerId?: string;
    documentType?: DocumentType;
    autoEdit?: boolean;
  } | null;

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
    add: addDocument,
    set: setDocument,
    getById: getDocument,
  } = useFirestore<DocumentEntity>({
    collectionName: "documents",
    userId: user?.uid,
    subscribe: false,
  });

  const isCreate = args.mode === "create";
  const documentId = args.mode === "edit" ? args.documentId : undefined;

  const [documentStatus, setDocumentStatus] = useState<DocumentStatus>("draft");
  const [isEditMode, setIsEditMode] = useState(
    () =>
      isCreate || !!(locationState as { autoEdit?: boolean } | null)?.autoEdit,
  );
  const [currency, setCurrency] = useState("USD");
  const [itemUsage, setItemUsage] = useState<ItemUsageMap>({});
  const [headerErrors, setHeaderErrors] = useState<HeaderErrors>({});
  const [itemErrors, setItemErrors] = useState<
    Record<string, LineItemFieldErrors>
  >({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const [finalizeError, setFinalizeError] = useState<string | null>(null);
  const [prefilling, setPrefilling] = useState(false);
  const [initializing, setInitializing] = useState(!isCreate);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [hasDocs, setHasDocs] = useState<boolean | null>(null);

  // Tracks an in-flight create→finalize so a retry (e.g. after a PDF or
  // download failure) updates the same document and reuses the same number
  // instead of creating a duplicate. Reset once a finalize fully succeeds.
  const finalizeCreatedIdRef = useRef<string | null>(null);
  const finalizeDocNumberRef = useRef<string | null>(null);
  // Once the currency is set explicitly (user choice or loaded document), a
  // late-arriving profile default must not overwrite it.
  const currencyPinnedRef = useRef(false);

  const canEdit = isCreate || (documentStatus === "draft" && isEditMode);

  const { state, dispatch, addLine, selectItemById, subtotal, total } =
    useDocumentForm({
      initial: isCreate
        ? getDefaultInitialState()
        : {
            documentType: "invoice",
            documentNumber: "",
            date: todayIso(),
            customerId: undefined,
            notes: "",
            lineItems: [createEmptyLineItem()],
          },
      customers,
      itemCatalog,
      canEdit,
    });

  useEffect(() => {
    if (!isCreate || !user?.uid) return;
    const q = query(
      collection(db, "documents"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(1),
    );
    getDocs(q)
      .then((snap) => setHasDocs(snap.docs.length > 0))
      .catch(() => setHasDocs(true));
  }, [isCreate, user?.uid]);

  useEffect(() => {
    if (!isCreate) return;
    if (customers.length === 0) return;
    if (state.customerId) return;
    const preselected = locationState?.customerId;
    const target =
      preselected && customers.some((c) => c.id === preselected)
        ? preselected
        : customers[0].id;
    dispatch({ type: "SET_FIELD", field: "customerId", value: target });
  }, [
    customers,
    dispatch,
    isCreate,
    locationState?.customerId,
    state.customerId,
  ]);

  useEffect(() => {
    if (!isCreate || !locationState?.documentType) return;
    dispatch({
      type: "SET_FIELD",
      field: "documentType",
      value: locationState.documentType,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user?.uid) return;
    setItemUsage(loadItemUsage(user.uid));
  }, [user?.uid]);

  const setCurrencyExplicit = useCallback((next: string) => {
    currencyPinnedRef.current = true;
    setCurrency(next);
  }, []);

  useEffect(() => {
    if (currencyPinnedRef.current) return;
    if (profile?.currency) setCurrency(profile.currency);
  }, [profile?.currency]);

  useEffect(() => {
    if (isCreate) return;
    if (!documentId) {
      setLoadError("Document not found");
      setInitializing(false);
      return;
    }
    const loadId = documentId;
    let mounted = true;
    async function loadDocument() {
      try {
        const ref = doc(db, "documents", loadId);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          if (!mounted) return;
          setLoadError("Document not found");
          setInitializing(false);
          return;
        }
        const data = snap.data() as DocumentEntity;
        if (!mounted) return;
        setDocumentStatus(data.status);
        setCurrencyExplicit(data.currency || "USD");
        setIsEditMode(data.status === "draft");
        const items = (data.items ?? []).map((it) => ({
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
        if (!mounted) return;
        setLoadError(
          e instanceof Error ? e.message : "Failed to load document",
        );
      } finally {
        if (mounted) setInitializing(false);
      }
    }
    void loadDocument();
    return () => {
      mounted = false;
    };
  }, [dispatch, documentId, isCreate]);

  useEffect(() => {
    if (isCreate) return;
    if (!state.customerId && customers.length > 0) {
      dispatch({
        type: "SET_FIELD",
        field: "customerId",
        value: customers[0].id,
      });
    }
  }, [customers, dispatch, isCreate, state.customerId]);

  const dismissCreateGuide = !!profile?.onboarding?.createInvoiceDismissed;
  const showCreateGuide = isCreate && !dismissCreateGuide && hasDocs === false;
  const showForm = isCreate || (!initializing && !loadError);

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
      dispatch({ type: "SET_ITEM_SELECTION", id: lineId, item });
      if (item.id && user?.uid) {
        setItemUsage(incrementItemUsage(user.uid, item.id));
      }
    },
  });

  const handleSelectItem = useCallback(
    (lineId: string, itemId?: string) => {
      selectItemById(lineId, itemId);
      if (user?.uid && itemId) {
        setItemUsage(incrementItemUsage(user.uid, itemId));
      }
    },
    [selectItemById, user?.uid],
  );

  const finalizeDisabled = useMemo(() => {
    const res = validateFinalize(state);
    return (
      Object.keys(res.header).length > 0 || Object.keys(res.items).length > 0
    );
  }, [state]);

  const applyValidationErrors = useCallback(
    (validation: ReturnType<typeof validateDraft>) => {
      setHeaderErrors(validation.header);
      setItemErrors(validation.items);
      return (
        Object.keys(validation.header).length > 0 ||
        Object.keys(validation.items).length > 0
      );
    },
    [],
  );

  const resolveDocNumber = useCallback(async () => {
    if (!user?.uid) throw new Error("Not signed in");
    const manual = state.documentNumber?.trim();
    if (manual) {
      if (await isDocNumberTaken(user.uid, manual, documentId)) {
        throw new DuplicateDocNumberError(manual);
      }
      // Keep the auto-number counter ahead of manually entered sequences so a
      // later auto-allocation can't re-emit the same number.
      await reconcileDocCounter(user.uid, manual);
      return manual;
    }
    return allocateNextDocumentNumber(user.uid, state.documentType, state.date);
  }, [
    documentId,
    state.date,
    state.documentNumber,
    state.documentType,
    user?.uid,
  ]);

  // Surfaces a duplicate-number failure as a field error on Document #.
  // Returns true when it handled the error.
  const applyDocNumberError = useCallback((e: unknown): boolean => {
    if (e instanceof DuplicateDocNumberError) {
      setHeaderErrors((prev) => ({
        ...prev,
        documentNumber: "This number is already used by another document.",
      }));
      return true;
    }
    return false;
  }, []);

  const saveChanges = useCallback(async () => {
    setSaveError(null);
    if (!user?.uid || !documentId) return;
    setSaving(true);
    try {
      const validation = validateDraft(state);
      if (applyValidationErrors(validation)) {
        setSaveError(
          "Please fix the highlighted fields before saving changes.",
        );
        focusFirstValidationError(state, validation);
        return;
      }
      const docNumber = await resolveDocNumber();
      const payload = buildDocumentPayload(
        user.uid,
        state,
        "draft",
        docNumber,
        selectCustomerDetails(customers, state.customerId),
        { subtotal, total },
      );
      await setDocument(documentId, { ...payload, currency });
      if (state.customerId) {
        recordCustomerBilled(user.uid, state.customerId);
      }
    } catch (e: unknown) {
      if (applyDocNumberError(e)) {
        setSaveError("That document number is already in use. Pick another.");
      } else {
        setSaveError(e instanceof Error ? e.message : "Failed to save changes");
      }
    } finally {
      setSaving(false);
    }
  }, [
    applyValidationErrors,
    applyDocNumberError,
    currency,
    customers,
    documentId,
    resolveDocNumber,
    setDocument,
    state,
    subtotal,
    total,
    user?.uid,
  ]);

  const saveDraft = useCallback(async () => {
    setSaveError(null);
    if (!user?.uid) return;
    setSaving(true);
    try {
      const validation = validateDraft(state);
      if (applyValidationErrors(validation)) {
        setSaveError(
          "Please fix the highlighted fields before saving the draft.",
        );
        focusFirstValidationError(state, validation);
        return;
      }
      const autoDocNumber = await resolveDocNumber();
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
      if (id && state.customerId) {
        recordCustomerBilled(user.uid, state.customerId);
      }
      if (id) navigate("/dashboard");
    } catch (e: unknown) {
      if (applyDocNumberError(e)) {
        setSaveError("That document number is already in use. Pick another.");
      } else {
        setSaveError(e instanceof Error ? e.message : "Failed to save draft");
      }
    } finally {
      setSaving(false);
    }
  }, [
    addDocument,
    applyValidationErrors,
    applyDocNumberError,
    currency,
    customers,
    navigate,
    resolveDocNumber,
    state,
    subtotal,
    total,
    user?.uid,
  ]);

  const finalizeAndDownload = useCallback(async () => {
    setFinalizeError(null);
    if (!user?.uid) return;
    setFinalizing(true);
    try {
      const validation = validateFinalize(state);
      if (applyValidationErrors(validation)) {
        setFinalizeError("Please resolve the errors to finalize.");
        focusFirstValidationError(state, validation);
        return;
      }
      // Reuse the number allocated on a previous (failed) attempt so retries
      // don't burn sequence numbers or change the document's identity.
      const docNumber =
        finalizeDocNumberRef.current ?? (await resolveDocNumber());
      finalizeDocNumberRef.current = docNumber;
      const base = buildDocumentPayload(
        user.uid,
        state,
        "finalized",
        docNumber,
        selectCustomerDetails(customers, state.customerId),
        { subtotal, total },
      );

      // Generate the PDF *before* persisting. It is pure given the form state,
      // so a PDF failure must never leave a finalized document behind that a
      // retry would then duplicate.
      const { generateDocumentPdf } = await import("../../utils/pdf");
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

      const payload: Partial<DocumentEntity> = {
        ...base,
        currency,
        finalizedAt:
          serverTimestamp() as unknown as import("firebase/firestore").Timestamp,
      };

      if (isCreate) {
        if (finalizeCreatedIdRef.current) {
          // A previous attempt already created the document; update it in
          // place rather than creating a second finalized document.
          await setDocument(finalizeCreatedIdRef.current, payload);
        } else {
          finalizeCreatedIdRef.current = await addDocument(
            payload as Omit<
              DocumentEntity,
              "id" | "createdAt" | "updatedAt"
            > & {
              finalizedAt: import("firebase/firestore").Timestamp;
            },
          );
        }
      } else if (documentId) {
        await setDocument(documentId, payload);
        setDocumentStatus("finalized");
        setIsEditMode(false);
      }

      if (state.customerId) {
        recordCustomerBilled(user.uid, state.customerId);
      }

      const filename = `${getDocumentFilename(
        base.type as DocumentType,
        base.docNumber as string,
        base.date as string,
      )}.pdf`;
      downloadBlob(filename, pdfBytes, "application/pdf");
      // Fully succeeded — clear the retry guards for any future finalize.
      finalizeCreatedIdRef.current = null;
      finalizeDocNumberRef.current = null;
      navigate("/dashboard");
    } catch (e: unknown) {
      if (applyDocNumberError(e)) {
        setFinalizeError(
          "That document number is already in use. Pick another.",
        );
      } else {
        setFinalizeError(
          e instanceof Error ? e.message : "Failed to finalize & download",
        );
      }
    } finally {
      setFinalizing(false);
    }
  }, [
    addDocument,
    applyValidationErrors,
    applyDocNumberError,
    currency,
    customers,
    documentId,
    isCreate,
    navigate,
    resolveDocNumber,
    setDocument,
    state,
    subtotal,
    total,
    user?.uid,
  ]);

  const copyFromPrevious = useCallback(async () => {
    if (!isCreate || !user?.uid) return;
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
      setSaveError(
        e instanceof Error
          ? e.message
          : "Failed to copy from previous document",
      );
    } finally {
      setPrefilling(false);
    }
  }, [customers, dispatch, isCreate, user?.uid]);

  const handleDismissCreateGuide = useCallback(() => {
    void updateUserProfile({
      onboarding: {
        ...(profile?.onboarding ?? {}),
        createInvoiceDismissed: true,
      },
    });
  }, [profile?.onboarding, updateUserProfile]);

  const generateInvoice = useCallback(async () => {
    setGenerateError(null);
    if (!user?.uid || !documentId) return;
    setGeneratingInvoice(true);
    try {
      const newDocNumber = await allocateNextDocumentNumber(
        user.uid,
        "invoice",
        todayIso(),
      );
      const newInvoiceState: DocumentFormState = {
        ...state,
        documentType: "invoice",
        documentNumber: newDocNumber,
        date: todayIso(),
      };
      const payload = buildDocumentPayload(
        user.uid,
        newInvoiceState,
        "draft",
        newDocNumber,
        selectCustomerDetails(customers, state.customerId),
        { subtotal, total },
      );
      const invoicePayload = {
        ...payload,
        currency,
        sourceDocumentId: documentId,
        sourceDocumentType: "quotation" as const,
      };
      const newInvoiceId = await addDocument(invoicePayload);
      const currentDoc = await getDocument(documentId);
      if (currentDoc) {
        const updatedRelatedInvoices = [
          ...(currentDoc.relatedInvoices || []),
          newInvoiceId,
        ];
        await setDocument(documentId, {
          relatedInvoices: updatedRelatedInvoices,
        });
      }
      navigate(`/documents/${newInvoiceId}/edit`);
    } catch (e: unknown) {
      setGenerateError(
        e instanceof Error ? e.message : "Failed to generate invoice",
      );
    } finally {
      setGeneratingInvoice(false);
    }
  }, [
    addDocument,
    currency,
    customers,
    documentId,
    getDocument,
    navigate,
    setDocument,
    state,
    subtotal,
    total,
    user?.uid,
  ]);

  const formProps: DocumentPageViewModel["formProps"] = {
    canEdit,
    state,
    dispatch,
    currency,
    onCurrencyChange: setCurrencyExplicit,
    headerErrors,
    itemErrors,
    visibleCustomers,
    loadingCustomers,
    sortedCatalog,
    recentItemIds: recentIds,
    loadingItems,
    subtotal,
    total,
    onSelectItem: handleSelectItem,
    onAddLine: addLine,
    onOpenCustomerModal: catalogModals.openCustomerModal,
    onOpenItemModal: catalogModals.openItemModal,
  };

  return {
    mode: args.mode,
    state,
    dispatch,
    currency,
    subtotal,
    total,
    visibleCustomers,
    loadingCustomers,
    sortedCatalog,
    recentItemIds: recentIds,
    loadingItems,
    headerErrors,
    itemErrors,
    finalizeDisabled,
    banners: {
      saveError,
      finalizeError,
      loadError,
      generateError,
    },
    flags: {
      saving,
      finalizing,
      prefilling,
      initializing,
      generatingInvoice,
      canEdit,
      documentStatus,
      showCreateGuide,
      showForm,
    },
    catalogModals,
    formProps,
    actions: {
      saveDraft,
      saveChanges,
      finalizeAndDownload,
      copyFromPrevious,
      dismissCreateGuide: handleDismissCreateGuide,
      generateInvoice,
      enterEditMode: () => setIsEditMode(true),
      navigateCancel: () => navigate("/dashboard"),
    },
  };
}
