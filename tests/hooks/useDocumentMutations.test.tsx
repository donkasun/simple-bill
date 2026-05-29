import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor, cleanup } from "@testing-library/react";

import { useDocumentMutations } from "../../src/hooks/pages/useDocumentMutations";
import { allocateNextDocumentNumber } from "@utils/docNumber";
import { buildDuplicatePayload } from "@utils/documents";
import { generateDocumentPdf } from "@utils/pdf";

vi.mock("@utils/docNumber", () => ({
  allocateNextDocumentNumber: vi.fn().mockResolvedValue("INV-2026-002"),
}));
vi.mock("@utils/documents", () => ({
  buildDuplicatePayload: vi.fn().mockReturnValue({ type: "invoice" }),
  getDocumentFilename: vi.fn(),
}));
vi.mock("@utils/download", () => ({ downloadBlob: vi.fn() }));
vi.mock("@utils/pdf", () => ({
  generateDocumentPdf: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
}));

const mockGenerateDocumentPdf = generateDocumentPdf as vi.MockedFunction<
  typeof generateDocumentPdf
>;

const mockNavigate = vi.fn();

const mockAllocateNextDocumentNumber =
  allocateNextDocumentNumber as vi.MockedFunction<
    typeof allocateNextDocumentNumber
  >;
const mockBuildDuplicatePayload = buildDuplicatePayload as vi.MockedFunction<
  typeof buildDuplicatePayload
>;

const sourceDoc = {
  id: "doc1",
  type: "invoice" as const,
  userId: "user1",
};

describe("useDocumentMutations", () => {
  const add = vi.fn().mockResolvedValue("doc-new");
  const update = vi.fn().mockResolvedValue(undefined);
  const remove = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

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

  it("sets mutationError when duplicate fails", async () => {
    add.mockRejectedValueOnce(new Error("Duplicate failed"));
    const onDuplicateError = vi.fn();
    const getVm = renderHook({ onDuplicateError });

    await getVm().actions.duplicate(sourceDoc as never);

    await waitFor(() => {
      expect(getVm().mutationError).toBe("Duplicate failed");
      expect(onDuplicateError).toHaveBeenCalled();
    });
  });

  it("confirms delete and calls remove", async () => {
    const getVm = renderHook();

    getVm().actions.requestDelete("doc1");
    await waitFor(() => expect(getVm().confirms.deleteId).toBe("doc1"));
    await getVm().actions.confirmDelete();

    await waitFor(() => {
      expect(remove).toHaveBeenCalledWith("doc1");
    });
  });

  it("sets mutationError when delete fails", async () => {
    remove.mockRejectedValueOnce(new Error("Delete failed"));
    const getVm = renderHook();

    getVm().actions.requestDelete("doc1");
    await waitFor(() => expect(getVm().confirms.deleteId).toBe("doc1"));
    await getVm().actions.confirmDelete();

    await waitFor(() => {
      expect(getVm().mutationError).toBe("Delete failed");
    });
  });

  it("sets mutationError when download fails", async () => {
    mockGenerateDocumentPdf.mockRejectedValueOnce(new Error("PDF failed"));
    const getVm = renderHook();

    await getVm().actions.download(sourceDoc as never);

    await waitFor(() => {
      expect(getVm().mutationError).toBe("PDF failed");
    });
  });

  it("sets mutationError when mark paid fails", async () => {
    update.mockRejectedValueOnce(new Error("Update failed"));
    const getVm = renderHook();

    getVm().actions.requestMarkPaid("doc2");
    await waitFor(() => expect(getVm().confirms.markPaidId).toBe("doc2"));
    await getVm().actions.confirmMarkPaid();

    await waitFor(() => {
      expect(getVm().mutationError).toBe("Update failed");
    });
  });

  it("confirms mark paid and updates with paidAt", async () => {
    const getVm = renderHook();

    getVm().actions.requestMarkPaid("doc2");
    await waitFor(() => expect(getVm().confirms.markPaidId).toBe("doc2"));
    await getVm().actions.confirmMarkPaid();

    await waitFor(() => {
      expect(update).toHaveBeenCalledWith(
        "doc2",
        expect.objectContaining({
          status: "paid",
          paidAt: expect.any(Date),
        }),
      );
    });
  });
});
