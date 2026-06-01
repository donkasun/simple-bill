import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor, cleanup } from "@testing-library/react";

import { useDocumentMutations } from "../../src/hooks/pages/useDocumentMutations";
import { allocateNextDocumentNumber } from "@utils/docNumber";
import { buildDuplicatePayload } from "@utils/documents";
import { toast } from "@contexts/toast";

vi.mock("@utils/docNumber", () => ({
  allocateNextDocumentNumber: vi.fn().mockResolvedValue("INV-2026-002"),
}));
vi.mock("@utils/documents", () => ({
  buildDuplicatePayload: vi.fn().mockReturnValue({ type: "invoice" }),
  getDocumentFilename: vi.fn().mockReturnValue("invoice-INV-2026-002"),
}));
vi.mock("@utils/download", () => ({ downloadBlob: vi.fn() }));
vi.mock("@utils/pdf", () => ({
  generateDocumentPdf: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
}));

vi.mock("@contexts/toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
    promise: vi.fn((p: Promise<unknown>) => p),
  },
}));

const mockNavigate = vi.fn();
const mockAllocateNextDocumentNumber =
  allocateNextDocumentNumber as vi.MockedFunction<
    typeof allocateNextDocumentNumber
  >;
const mockBuildDuplicatePayload = buildDuplicatePayload as vi.MockedFunction<
  typeof buildDuplicatePayload
>;
const toastMock = vi.mocked(toast);

const sourceDoc = { id: "doc1", type: "invoice" as const, userId: "user1" };

describe("useDocumentMutations", () => {
  const add = vi.fn().mockResolvedValue("doc-new");
  const update = vi.fn().mockResolvedValue(undefined);
  const remove = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  function renderHook(
    overrides: Partial<Parameters<typeof useDocumentMutations>[0]> = {},
  ) {
    let vm: ReturnType<typeof useDocumentMutations> | null = null;
    const Comp = () => {
      vm = useDocumentMutations({
        userId: "user1",
        add,
        update,
        remove,
        navigate: mockNavigate,
        ...overrides,
      });
      return null;
    };
    render(<Comp />);
    return () => vm!;
  }

  it("duplicates document and navigates to edit", async () => {
    const getVm = renderHook();
    await getVm().actions.duplicate(sourceDoc as never);
    await waitFor(() => {
      expect(mockAllocateNextDocumentNumber).toHaveBeenCalled();
      expect(mockBuildDuplicatePayload).toHaveBeenCalled();
      expect(add).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/documents/doc-new/edit", {
        state: { autoEdit: true },
      });
    });
  });

  it("wraps duplicate in toast.promise", async () => {
    const getVm = renderHook();
    await getVm().actions.duplicate(sourceDoc as never);
    await waitFor(() => expect(toastMock.promise).toHaveBeenCalled());
  });

  it("reports duplicate failure via onDuplicateError", async () => {
    add.mockRejectedValueOnce(new Error("Duplicate failed"));
    const onDuplicateError = vi.fn();
    const getVm = renderHook({ onDuplicateError });
    await getVm().actions.duplicate(sourceDoc as never);
    await waitFor(() => expect(onDuplicateError).toHaveBeenCalled());
  });

  it("confirms delete, calls remove, and toasts success", async () => {
    const getVm = renderHook();
    getVm().actions.requestDelete("doc1");
    await waitFor(() => expect(getVm().confirms.deleteId).toBe("doc1"));
    await getVm().actions.confirmDelete();
    await waitFor(() => {
      expect(remove).toHaveBeenCalledWith("doc1");
      expect(toastMock.success).toHaveBeenCalled();
    });
  });

  it("toasts error when delete fails", async () => {
    remove.mockRejectedValueOnce(new Error("Delete failed"));
    const getVm = renderHook();
    getVm().actions.requestDelete("doc1");
    await waitFor(() => expect(getVm().confirms.deleteId).toBe("doc1"));
    await getVm().actions.confirmDelete();
    await waitFor(() =>
      expect(toastMock.error).toHaveBeenCalledWith("Delete failed"),
    );
  });

  it("wraps download in toast.promise", async () => {
    const getVm = renderHook();
    await getVm().actions.download(sourceDoc as never);
    await waitFor(() => expect(toastMock.promise).toHaveBeenCalled());
  });

  it("toasts error when mark paid fails", async () => {
    update.mockRejectedValueOnce(new Error("Update failed"));
    const getVm = renderHook();
    getVm().actions.requestMarkPaid("doc2");
    await waitFor(() => expect(getVm().confirms.markPaidId).toBe("doc2"));
    await getVm().actions.confirmMarkPaid();
    await waitFor(() =>
      expect(toastMock.error).toHaveBeenCalledWith("Update failed"),
    );
  });

  it("confirms mark paid, updates with paidAt, and toasts success", async () => {
    const getVm = renderHook();
    getVm().actions.requestMarkPaid("doc2");
    await waitFor(() => expect(getVm().confirms.markPaidId).toBe("doc2"));
    await getVm().actions.confirmMarkPaid();
    await waitFor(() => {
      expect(update).toHaveBeenCalledWith(
        "doc2",
        expect.objectContaining({ status: "paid", paidAt: expect.any(Date) }),
      );
      expect(toastMock.success).toHaveBeenCalled();
    });
  });

  it("does not expose mutationError", () => {
    const getVm = renderHook();
    expect("mutationError" in getVm()).toBe(false);
  });
});
