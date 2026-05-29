import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@auth/useAuth";
import { useFirestore } from "@hooks/useFirestore";
import type { DocumentEntity } from "../../types/document";
import type { Customer } from "../../types/customer";
import {
  loadCustomerUsage,
  recentCustomerIds,
  type CustomerUsageMap,
} from "@utils/customerUsage";
import { useDocumentMutations } from "./useDocumentMutations";
import type { DocumentRow } from "./useDocumentsPage";

export type DashboardFinancialSummary = {
  outstanding: number;
  paidThisMonth: number;
  drafts: number;
};

export type DashboardPageViewModel = {
  greeting: string;
  firstName: string;
  loading: boolean;
  firestoreError: string | null;
  mutationError: string | null;
  financialSummary: DashboardFinancialSummary;
  formatSummaryCurrency: (value: number) => string;
  customerUsage: CustomerUsageMap;
  quickActionCustomers: Customer[];
  recentDocuments: DocumentRow[];
  hasDocuments: boolean;
  showRecentList: boolean;
  pending: ReturnType<typeof useDocumentMutations>["pending"];
  confirms: ReturnType<typeof useDocumentMutations>["confirms"];
  actions: ReturnType<typeof useDocumentMutations>["actions"] & {
    navigateToDocuments: () => void;
    navigateToNewInvoice: () => void;
    navigateToNewQuotation: () => void;
    navigateToCustomerInvoice: (customerId: string) => void;
    navigateToDrafts: () => void;
    navigateToCreateFirstInvoice: () => void;
  };
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function useDashboardPage(): DashboardPageViewModel {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [customerUsage, setCustomerUsage] = useState<CustomerUsageMap>({});

  const {
    items: documents,
    loading,
    error: firestoreError,
    add,
    remove,
    update,
  } = useFirestore<DocumentEntity, DocumentRow>({
    collectionName: "documents",
    userId: user?.uid,
    orderByField: "createdAt",
    select: (doc) => ({
      ...doc,
      typeLabel: doc.type === "invoice" ? "Invoice" : "Quotation",
      customerName: doc.customerDetails?.name ?? "—",
    }),
  });

  const { items: customers } = useFirestore<Customer>({
    collectionName: "customers",
    userId: user?.uid,
    orderByField: "createdAt",
  });

  const mutations = useDocumentMutations({
    userId: user?.uid,
    add,
    update,
    remove,
    navigate,
    onDuplicateError: (e) => console.error("Failed to duplicate document:", e),
  });

  useEffect(() => {
    if (!user?.uid) return;
    setCustomerUsage(loadCustomerUsage(user.uid));
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    if (Object.keys(customerUsage).length > 0) return;
    if (documents.length === 0) return;

    const next: CustomerUsageMap = {};
    for (const d of documents) {
      if (!d.customerId) continue;
      if (next[d.customerId]) continue;
      const ts = d.date ? new Date(d.date).getTime() : 0;
      next[d.customerId] = Number.isFinite(ts) && ts > 0 ? ts : Date.now();
      if (Object.keys(next).length >= 6) break;
    }
    if (Object.keys(next).length > 0) setCustomerUsage(next);
  }, [customerUsage, documents, user?.uid]);

  const quickActionCustomers = useMemo(() => {
    const recentIds = recentCustomerIds(customerUsage, 2);
    return recentIds
      .map((id) => customers.find((c) => c.id === id))
      .filter((c): c is Customer => c !== undefined);
  }, [customerUsage, customers]);

  const summaryCurrency = documents[0]?.currency || "LKR";

  const formatSummaryCurrency = useCallback(
    (value: number) => {
      const safe = Number.isFinite(value) ? value : 0;
      const fractionDigits = Number.isInteger(safe) ? 0 : 2;
      try {
        return new Intl.NumberFormat(
          typeof navigator !== "undefined" ? navigator.language : "en-US",
          {
            style: "currency",
            currency: summaryCurrency,
            minimumFractionDigits: fractionDigits,
            maximumFractionDigits: fractionDigits,
          },
        ).format(safe);
      } catch {
        const fixed = safe.toFixed(fractionDigits);
        return `${summaryCurrency} ${fixed}`;
      }
    },
    [summaryCurrency],
  );

  const financialSummary = useMemo((): DashboardFinancialSummary => {
    const now = new Date();
    const outstanding = documents
      .filter((doc) => doc.status === "finalized")
      .reduce((sum, doc) => sum + doc.total, 0);
    const paidThisMonth = documents
      .filter((doc) => {
        if (doc.status !== "paid") return false;
        const paidDate =
          doc.paidAt instanceof Date
            ? doc.paidAt
            : (doc.paidAt?.toDate?.() ?? doc.updatedAt?.toDate?.());
        return (
          paidDate &&
          paidDate.getFullYear() === now.getFullYear() &&
          paidDate.getMonth() === now.getMonth()
        );
      })
      .reduce((sum, doc) => sum + doc.total, 0);
    const drafts = documents.filter(
      (doc) => !doc.status || doc.status === "draft",
    ).length;

    return { outstanding, paidThisMonth, drafts };
  }, [documents]);

  const recentDocuments = useMemo(() => documents.slice(0, 5), [documents]);

  const greeting = getGreeting();
  const firstName = user?.displayName?.split(" ")[0] ?? "";
  const showRecentList = !loading && !firestoreError;
  const hasDocuments = documents.length > 0;

  return {
    greeting,
    firstName,
    loading,
    firestoreError,
    mutationError: mutations.mutationError,
    financialSummary,
    formatSummaryCurrency,
    customerUsage,
    quickActionCustomers,
    recentDocuments,
    hasDocuments,
    showRecentList,
    pending: mutations.pending,
    confirms: mutations.confirms,
    actions: {
      ...mutations.actions,
      navigateToDocuments: () => navigate("/documents"),
      navigateToNewInvoice: () => navigate("/documents/new"),
      navigateToNewQuotation: () =>
        navigate("/documents/new", { state: { documentType: "quotation" } }),
      navigateToCustomerInvoice: (customerId: string) =>
        navigate("/documents/new", { state: { customerId } }),
      navigateToDrafts: () => navigate("/documents?status=draft"),
      navigateToCreateFirstInvoice: () => navigate("/documents/new"),
    },
  };
}
