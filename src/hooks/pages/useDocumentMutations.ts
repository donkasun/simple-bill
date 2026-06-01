import { useCallback, useState } from "react";
import type { NavigateFunction } from "react-router-dom";
import type { FirestoreId } from "@models/firestore";
import type { DocumentEntity } from "../../types/document";
import { downloadBlob } from "@utils/download";
import { buildDuplicatePayload, getDocumentFilename } from "@utils/documents";
import { allocateNextDocumentNumber } from "@utils/docNumber";
import { todayIso } from "@utils/date";
import { toast } from "@contexts/toast";

export type DocumentMutationsPending = {
  duplicatingId: string | null;
  deletingId: string | null;
  downloadingId: string | null;
  markingPaidId: string | null;
  markingUnpaidId: string | null;
};

export type DocumentMutationsConfirms = {
  deleteId: string | null;
  markPaidId: string | null;
  markUnpaidId: string | null;
};

export type DocumentMutationsActions = {
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
};

export type DocumentMutationsViewModel = {
  pending: DocumentMutationsPending;
  confirms: DocumentMutationsConfirms;
  actions: DocumentMutationsActions;
};

export type UseDocumentMutationsArgs = {
  userId: string | undefined;
  add: (
    data: Omit<DocumentEntity, "id" | "createdAt" | "updatedAt"> & {
      userId?: string;
    },
  ) => Promise<FirestoreId>;
  update: (id: FirestoreId, data: Partial<DocumentEntity>) => Promise<void>;
  remove: (id: FirestoreId) => Promise<void>;
  navigate: NavigateFunction;
  onDuplicateError?: (error: unknown) => void;
};

export function useDocumentMutations({
  userId,
  add,
  update,
  remove,
  navigate,
  onDuplicateError,
}: UseDocumentMutationsArgs): DocumentMutationsViewModel {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [markPaidConfirmId, setMarkPaidConfirmId] = useState<string | null>(
    null,
  );
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);
  const [markUnpaidConfirmId, setMarkUnpaidConfirmId] = useState<string | null>(
    null,
  );
  const [markingUnpaidId, setMarkingUnpaidId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  const duplicate = useCallback(
    async (source: DocumentEntity) => {
      if (!userId) return;
      setDuplicatingId(source.id ?? null);
      try {
        await toast.promise(
          (async () => {
            const today = todayIso();
            const nextNumber = await allocateNextDocumentNumber(
              userId,
              source.type,
              today,
            );
            const payload = buildDuplicatePayload(
              userId,
              source,
              nextNumber,
              today,
            );
            const newId = await add(payload);
            navigate(`/documents/${newId}/edit`, {
              state: { autoEdit: true },
            });
          })(),
          {
            loading: "Duplicating document…",
            success: "Document duplicated",
            error: (e) =>
              e instanceof Error ? e.message : "Failed to duplicate document",
          },
        );
      } catch (e: unknown) {
        // toast.promise re-throws the rejection after showing the error toast;
        // forward it to the optional callback (e.g. dashboard logging).
        onDuplicateError?.(e);
      } finally {
        setDuplicatingId(null);
      }
    },
    [add, navigate, onDuplicateError, userId],
  );

  const download = useCallback(async (doc: DocumentEntity) => {
    setDownloadingId(doc.id ?? null);
    try {
      await toast.promise(
        (async () => {
          const { generateDocumentPdf } = await import("../../utils/pdf");
          const pdfBytes = await generateDocumentPdf({
            type: doc.type,
            docNumber: doc.docNumber,
            date: doc.date,
            customerDetails: doc.customerDetails,
            items: doc.items,
            subtotal: doc.subtotal,
            total: doc.total,
            currency: doc.currency || "USD",
          });
          const filename = `${getDocumentFilename(doc.type, doc.docNumber, doc.date)}.pdf`;
          downloadBlob(filename, pdfBytes, "application/pdf");
        })(),
        {
          loading: "Generating PDF…",
          success: "PDF downloaded",
          error: (e) =>
            e instanceof Error ? e.message : "Failed to download PDF",
        },
      );
    } catch {
      // rejection was already surfaced as a toast by toast.promise's error
      // handler; nothing more to do here.
    } finally {
      setDownloadingId(null);
    }
  }, []);

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    const id = deleteConfirmId;
    setDeletingId(id);
    setDeleteConfirmId(null);
    try {
      await remove(id);
      toast.success("Document deleted");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to delete document");
    } finally {
      setDeletingId(null);
    }
  };

  const handleConfirmMarkPaid = useCallback(async () => {
    if (!markPaidConfirmId) return;
    const id = markPaidConfirmId;
    setMarkingPaidId(id);
    setMarkPaidConfirmId(null);
    try {
      await update(id, { status: "paid", paidAt: new Date() });
      toast.success("Marked as paid");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to mark as paid");
    } finally {
      setMarkingPaidId(null);
    }
  }, [markPaidConfirmId, update]);

  const handleConfirmMarkUnpaid = useCallback(async () => {
    if (!markUnpaidConfirmId) return;
    const id = markUnpaidConfirmId;
    setMarkingUnpaidId(id);
    setMarkUnpaidConfirmId(null);
    try {
      await update(id, { status: "finalized", paidAt: null });
      toast.success("Marked as unpaid");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to mark as unpaid");
    } finally {
      setMarkingUnpaidId(null);
    }
  }, [markUnpaidConfirmId, update]);

  return {
    pending: {
      duplicatingId,
      deletingId,
      downloadingId,
      markingPaidId,
      markingUnpaidId,
    },
    confirms: {
      deleteId: deleteConfirmId,
      markPaidId: markPaidConfirmId,
      markUnpaidId: markUnpaidConfirmId,
    },
    actions: {
      requestDelete: (id: string) => setDeleteConfirmId(id),
      confirmDelete: handleConfirmDelete,
      cancelDelete: () => setDeleteConfirmId(null),
      requestMarkPaid: (id: string) => setMarkPaidConfirmId(id),
      confirmMarkPaid: handleConfirmMarkPaid,
      cancelMarkPaid: () => setMarkPaidConfirmId(null),
      requestMarkUnpaid: (id: string) => setMarkUnpaidConfirmId(id),
      confirmMarkUnpaid: handleConfirmMarkUnpaid,
      cancelMarkUnpaid: () => setMarkUnpaidConfirmId(null),
      duplicate,
      download,
    },
  };
}
