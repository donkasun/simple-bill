import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor, cleanup } from "@testing-library/react";

import { useDocumentsPage } from "../../src/hooks/pages/useDocumentsPage";
import { useAuth } from "@auth/useAuth";
import { useFirestore } from "@hooks/useFirestore";
import { allocateNextDocumentNumber } from "@utils/docNumber";
import { buildDuplicatePayload } from "@utils/documents";

vi.mock("@auth/useAuth");
vi.mock("@hooks/useFirestore");
vi.mock("@utils/docNumber", () => ({
  allocateNextDocumentNumber: vi.fn().mockResolvedValue("INV-2026-002"),
}));
vi.mock("@utils/documents", () => ({
  buildDuplicatePayload: vi.fn().mockReturnValue({ type: "invoice" }),
  getDocumentFilename: vi.fn(),
}));
vi.mock("@utils/download", () => ({ downloadBlob: vi.fn() }));
vi.mock("../../src/firebase/config", () => ({ db: {}, auth: {} }));
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
let mockSearchParams = new URLSearchParams();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [mockSearchParams],
  };
});

const mockUseAuth = useAuth as vi.MockedFunction<typeof useAuth>;
const mockUseFirestore = useFirestore as vi.MockedFunction<typeof useFirestore>;
const mockAllocateNextDocumentNumber =
  allocateNextDocumentNumber as vi.MockedFunction<
    typeof allocateNextDocumentNumber
  >;
const mockBuildDuplicatePayload = buildDuplicatePayload as vi.MockedFunction<
  typeof buildDuplicatePayload
>;

const mockDocuments = [
  {
    id: "doc1",
    type: "invoice",
    typeLabel: "Invoice",
    status: "draft",
    customerName: "Acme",
    userId: "user1",
  },
  {
    id: "doc2",
    type: "quotation",
    typeLabel: "Quotation",
    status: "finalized",
    customerName: "Finlays",
    userId: "user1",
  },
];

describe("useDocumentsPage", () => {
  const add = vi.fn().mockResolvedValue("doc-new");
  const update = vi.fn().mockResolvedValue(undefined);
  const remove = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
    mockUseAuth.mockReturnValue({
      user: { uid: "user1" },
      loading: false,
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
    } as unknown as ReturnType<typeof useAuth>);
    mockUseFirestore.mockReturnValue({
      items: mockDocuments,
      loading: false,
      error: null,
      add,
      update,
      remove,
      set: vi.fn(),
      getById: vi.fn(),
      getOnce: vi.fn(),
    } as unknown as ReturnType<typeof useFirestore>);
  });

  afterEach(() => {
    cleanup();
  });

  it("exposes filtered documents and summary", async () => {
    let vm: ReturnType<typeof useDocumentsPage> | null = null;
    const Comp = () => {
      vm = useDocumentsPage();
      return null;
    };
    render(<Comp />);

    await waitFor(() => {
      expect(vm!.filteredDocuments).toHaveLength(2);
      expect(vm!.subtitle).toBe(
        "2 items · 1 invoice · 1 quotation · 1 drafts · 1 sent · 0 paid",
      );
      expect(vm!.showDocumentList).toBe(true);
    });
  });

  it("filters documents by status", async () => {
    let vm: ReturnType<typeof useDocumentsPage> | null = null;
    const Comp = () => {
      vm = useDocumentsPage();
      return null;
    };
    render(<Comp />);

    vm!.actions.setStatusFilter("draft");

    await waitFor(() => {
      expect(vm!.filteredDocuments).toHaveLength(1);
      expect(vm!.filteredDocuments[0]?.id).toBe("doc1");
    });
  });

  it("syncs status filter from URL search params", async () => {
    mockSearchParams = new URLSearchParams("status=draft");

    let vm: ReturnType<typeof useDocumentsPage> | null = null;
    const Comp = () => {
      vm = useDocumentsPage();
      return null;
    };
    render(<Comp />);

    await waitFor(() => {
      expect(vm!.statusFilter).toBe("draft");
      expect(vm!.filteredDocuments).toHaveLength(1);
    });
  });

  it("duplicates document and navigates to edit", async () => {
    let vm: ReturnType<typeof useDocumentsPage> | null = null;
    const Comp = () => {
      vm = useDocumentsPage();
      return null;
    };
    render(<Comp />);

    await vm!.actions.duplicate(mockDocuments[0] as never);

    await waitFor(() => {
      expect(mockAllocateNextDocumentNumber).toHaveBeenCalled();
      expect(mockBuildDuplicatePayload).toHaveBeenCalled();
      expect(add).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/documents/doc-new/edit", {
        state: { autoEdit: true },
      });
    });
  });

  it("does not expose mutationError on the view model", () => {
    let vm: ReturnType<typeof useDocumentsPage> | null = null;
    const Comp = () => {
      vm = useDocumentsPage();
      return null;
    };
    render(<Comp />);

    expect("mutationError" in vm!).toBe(false);
  });

  it("confirms delete and calls remove", async () => {
    let vm: ReturnType<typeof useDocumentsPage> | null = null;
    const Comp = () => {
      vm = useDocumentsPage();
      return null;
    };
    render(<Comp />);

    vm!.actions.requestDelete("doc1");
    await waitFor(() => expect(vm!.confirms.deleteId).toBe("doc1"));
    await vm!.actions.confirmDelete();

    await waitFor(() => {
      expect(remove).toHaveBeenCalledWith("doc1");
    });
  });

  it("hides document list when firestore error is set", async () => {
    mockUseFirestore.mockReturnValue({
      items: [],
      loading: false,
      error: "Failed to load",
      add,
      update,
      remove,
      set: vi.fn(),
      getById: vi.fn(),
      getOnce: vi.fn(),
    } as unknown as ReturnType<typeof useFirestore>);

    let vm: ReturnType<typeof useDocumentsPage> | null = null;
    const Comp = () => {
      vm = useDocumentsPage();
      return null;
    };
    render(<Comp />);

    await waitFor(() => {
      expect(vm!.firestoreError).toBe("Failed to load");
      expect(vm!.showDocumentList).toBe(false);
    });
  });
});
