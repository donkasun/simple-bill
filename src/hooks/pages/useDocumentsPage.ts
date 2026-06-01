import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@auth/useAuth";
import { useFirestore } from "@hooks/useFirestore";
import type { DocumentEntity } from "../../types/document";
import { useDocumentMutations } from "./useDocumentMutations";

export type DocumentRow = DocumentEntity & {
  typeLabel: string;
  customerName: string;
};

export type TypeFilter = "all" | "invoice" | "quotation";
export type StatusFilter = "all" | "draft" | "finalized" | "paid";

export type DocumentsPageViewModel = {
  title: string;
  subtitle: string;
  loading: boolean;
  firestoreError: string | null;
  showDocumentList: boolean;
  typeFilter: TypeFilter;
  statusFilter: StatusFilter;
  filteredDocuments: DocumentRow[];
  hasDocuments: boolean;
  hasFilteredResults: boolean;
  pending: {
    duplicatingId: string | null;
    deletingId: string | null;
    downloadingId: string | null;
    markingPaidId: string | null;
    markingUnpaidId: string | null;
  };
  confirms: {
    deleteId: string | null;
    markPaidId: string | null;
    markUnpaidId: string | null;
  };
  actions: {
    setTypeFilter: (value: TypeFilter) => void;
    setStatusFilter: (value: StatusFilter) => void;
    requestDelete: (id: string) => void;
    confirmDelete: () => Promise<void>;
    cancelDelete: () => void;
    requestMarkPaid: (id: string) => void;
    confirmMarkPaid: () => Promise<void>;
    cancelMarkPaid: () => void;
    requestMarkUnpaid: (id: string) => void;
    confirmMarkUnpaid: () => Promise<void>;
    cancelMarkUnpaid: () => void;
    duplicate: (source: DocumentEntity) => Promise<void>;
    download: (doc: DocumentEntity) => Promise<void>;
    navigateNewDocument: () => void;
    navigateNewInvoice: () => void;
    navigateNewQuotation: () => void;
  };
};

export function useDocumentsPage(): DocumentsPageViewModel {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

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

  const mutations = useDocumentMutations({
    userId: user?.uid,
    add,
    update,
    remove,
    navigate,
  });

  const filteredDocuments = useMemo(() => {
    return documents.filter((d) => {
      const typeMatch = typeFilter === "all" || d.type === typeFilter;
      const statusMatch =
        statusFilter === "all" ||
        d.status === statusFilter ||
        (!d.status && statusFilter === "draft");
      return typeMatch && statusMatch;
    });
  }, [documents, statusFilter, typeFilter]);

  const subtitle = useMemo(() => {
    const drafts = documents.filter(
      (doc) => !doc.status || doc.status === "draft",
    ).length;
    const sent = documents.filter((doc) => doc.status === "finalized").length;
    const paid = documents.filter((doc) => doc.status === "paid").length;
    const countLabel = documents.length === 1 ? "document" : "documents";
    return `${documents.length} ${countLabel} · ${drafts} drafts · ${sent} sent · ${paid} paid`;
  }, [documents]);

  useEffect(() => {
    const type = searchParams.get("type");
    const status = searchParams.get("status");

    if (type === "invoice" || type === "quotation" || type === "all") {
      setTypeFilter(type);
    }
    if (
      status === "draft" ||
      status === "finalized" ||
      status === "paid" ||
      status === "all"
    ) {
      setStatusFilter(status);
    }
  }, [searchParams]);

  const showDocumentList = !loading && !firestoreError;
  const hasDocuments = documents.length > 0;
  const hasFilteredResults = filteredDocuments.length > 0;

  return {
    title: "Documents",
    subtitle,
    loading,
    firestoreError,
    showDocumentList,
    typeFilter,
    statusFilter,
    filteredDocuments,
    hasDocuments,
    hasFilteredResults,
    pending: mutations.pending,
    confirms: mutations.confirms,
    actions: {
      setTypeFilter,
      setStatusFilter,
      requestDelete: mutations.actions.requestDelete,
      confirmDelete: mutations.actions.confirmDelete,
      cancelDelete: mutations.actions.cancelDelete,
      requestMarkPaid: mutations.actions.requestMarkPaid,
      confirmMarkPaid: mutations.actions.confirmMarkPaid,
      cancelMarkPaid: mutations.actions.cancelMarkPaid,
      requestMarkUnpaid: mutations.actions.requestMarkUnpaid,
      confirmMarkUnpaid: mutations.actions.confirmMarkUnpaid,
      cancelMarkUnpaid: mutations.actions.cancelMarkUnpaid,
      duplicate: mutations.actions.duplicate,
      download: mutations.actions.download,
      navigateNewDocument: () => navigate("/documents/new"),
      navigateNewInvoice: () => navigate("/documents/new"),
      navigateNewQuotation: () =>
        navigate("/documents/new", { state: { documentType: "quotation" } }),
    },
  };
}
