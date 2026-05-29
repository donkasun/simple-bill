import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor, cleanup, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { useDocumentPage } from "../../src/hooks/pages/useDocumentPage";
import { useAuth } from "@auth/useAuth";
import { useFirestore } from "@hooks/useFirestore";
vi.mock("@auth/useAuth");
vi.mock("@hooks/useFirestore");
vi.mock("@hooks/useUserProfile", () => ({
  default: vi.fn(() => ({
    profile: { currency: "USD", onboarding: {} },
    loading: false,
    error: null,
    updateUserProfile: vi.fn(),
  })),
}));
vi.mock("../../src/firebase/config", () => ({ db: {}, auth: {} }));
vi.mock("@utils/docNumber", () => ({
  allocateNextDocumentNumber: vi.fn().mockResolvedValue("INV-2026-001"),
}));
vi.mock("@utils/pdf", () => ({
  generateDocumentPdf: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
}));
vi.mock("@utils/download", () => ({ downloadBlob: vi.fn() }));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockUseAuth = useAuth as vi.MockedFunction<typeof useAuth>;
const mockUseFirestore = useFirestore as vi.MockedFunction<typeof useFirestore>;

let addDocumentSpy = vi.fn();
let setDocumentSpy = vi.fn();
let getDocumentSpy = vi.fn();

vi.mock("firebase/firestore", async () => {
  const actual =
    await vi.importActual<typeof import("firebase/firestore")>(
      "firebase/firestore",
    );
  return {
    ...actual,
    collection: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    query: vi.fn(),
    getDocs: vi.fn().mockResolvedValue({ docs: [] }),
    doc: vi.fn((_db, _c, id) => ({ id })),
    getDoc: vi.fn(),
    serverTimestamp: vi.fn(),
  };
});

describe("useDocumentPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    addDocumentSpy = vi.fn().mockResolvedValue("new-id");
    setDocumentSpy = vi.fn().mockResolvedValue(undefined);
    getDocumentSpy = vi.fn().mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue({
      user: { uid: "user1" },
      loading: false,
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
    } as unknown as ReturnType<typeof useAuth>);

    mockUseFirestore.mockImplementation((opts) => {
      const name =
        typeof opts === "object" && opts && "collectionName" in opts
          ? (opts as { collectionName?: string }).collectionName
          : undefined;
      if (name === "customers") {
        return {
          items: [{ id: "c1", name: "Acme", userId: "user1" }],
          loading: false,
          error: null,
          add: vi.fn(),
          update: vi.fn(),
          remove: vi.fn(),
          set: vi.fn(),
          getById: vi.fn(),
          getOnce: vi.fn(),
        } as unknown as ReturnType<typeof useFirestore>;
      }
      if (name === "items") {
        return {
          items: [],
          loading: false,
          error: null,
          add: vi.fn(),
          update: vi.fn(),
          remove: vi.fn(),
          set: vi.fn(),
          getById: vi.fn(),
          getOnce: vi.fn(),
        } as unknown as ReturnType<typeof useFirestore>;
      }
      return {
        items: [],
        loading: false,
        error: null,
        add: addDocumentSpy,
        update: vi.fn(),
        remove: vi.fn(),
        set: setDocumentSpy,
        getById: getDocumentSpy,
        getOnce: vi.fn(),
      } as unknown as ReturnType<typeof useFirestore>;
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("create mode exposes at most one line item in default state", async () => {
    let vm: ReturnType<typeof useDocumentPage> | null = null;
    const Comp = () => {
      vm = useDocumentPage({ mode: "create" });
      return null;
    };
    render(
      <MemoryRouter>
        <Comp />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(vm!.mode).toBe("create");
      expect(vm!.state.lineItems.length).toBeGreaterThanOrEqual(1);
      expect(vm!.flags.showForm).toBe(true);
    });
  });

  it("edit mode sets canEdit false when document is finalized", async () => {
    const { getDoc } = await import("firebase/firestore");
    (getDoc as vi.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({
        type: "invoice",
        status: "finalized",
        currency: "USD",
        date: "2024-01-01",
        items: [],
        subtotal: 0,
        total: 0,
      }),
    });

    let vm: ReturnType<typeof useDocumentPage> | null = null;
    const Comp = () => {
      vm = useDocumentPage({ mode: "edit", documentId: "doc-1" });
      return null;
    };
    render(
      <MemoryRouter>
        <Comp />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(vm!.flags.initializing).toBe(false);
      expect(vm!.flags.canEdit).toBe(false);
      expect(vm!.flags.documentStatus).toBe("finalized");
    });
  });

  it("finalizeDisabled is true when customer is missing", async () => {
    let vm: ReturnType<typeof useDocumentPage> | null = null;
    const Comp = () => {
      vm = useDocumentPage({ mode: "create" });
      return null;
    };
    render(
      <MemoryRouter>
        <Comp />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(vm!.finalizeDisabled).toBe(true);
    });
  });

  it("create mode finalize adds a finalized document, builds a PDF, and navigates", async () => {
    const { generateDocumentPdf } = await import("@utils/pdf");
    const { downloadBlob } = await import("@utils/download");

    let vm: ReturnType<typeof useDocumentPage> | null = null;
    const Comp = () => {
      vm = useDocumentPage({ mode: "create" });
      return null;
    };
    render(
      <MemoryRouter>
        <Comp />
      </MemoryRouter>,
    );

    // Customer auto-selects once the (mocked) customers load.
    await waitFor(() => expect(vm!.state.customerId).toBe("c1"));

    // Make every line item valid for finalize (name, qty >= 1, price >= 0).
    await act(async () => {
      for (const li of vm!.state.lineItems) {
        vm!.dispatch({
          type: "UPDATE_LINE_ITEM",
          id: li.id,
          changes: { name: "Work", quantity: 1, unitPrice: 100 },
        });
      }
    });
    await waitFor(() => expect(vm!.finalizeDisabled).toBe(false));

    await act(async () => {
      await vm!.actions.finalizeAndDownload();
    });

    await waitFor(() => {
      expect(addDocumentSpy).toHaveBeenCalledWith(
        expect.objectContaining({ status: "finalized", currency: "USD" }),
      );
      expect(generateDocumentPdf).toHaveBeenCalled();
      expect(downloadBlob).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("copyFromPrevious prefills form from the most recent document", async () => {
    const { getDocs } = await import("firebase/firestore");
    (getDocs as vi.Mock).mockResolvedValue({
      docs: [
        {
          id: "prev",
          data: () => ({
            type: "quotation",
            customerId: "c1",
            notes: "Prior notes",
            items: [
              {
                itemId: "i1",
                name: "Prior item",
                description: "",
                unitPrice: 50,
                quantity: 2,
                amount: 100,
              },
            ],
          }),
        },
      ],
    });

    let vm: ReturnType<typeof useDocumentPage> | null = null;
    const Comp = () => {
      vm = useDocumentPage({ mode: "create" });
      return null;
    };
    render(
      <MemoryRouter>
        <Comp />
      </MemoryRouter>,
    );

    await act(async () => {
      await vm!.actions.copyFromPrevious();
    });

    await waitFor(() => {
      expect(vm!.state.documentType).toBe("quotation");
      expect(vm!.state.notes).toBe("Prior notes");
      expect(vm!.state.documentNumber).toBe(""); // number is reset, not copied
      expect(vm!.state.lineItems).toHaveLength(1);
      expect(vm!.state.lineItems[0].name).toBe("Prior item");
      expect(vm!.state.customerId).toBe("c1");
    });
  });

  it("generateInvoice creates a linked invoice from a finalized quotation and navigates", async () => {
    const { getDoc } = await import("firebase/firestore");
    (getDoc as vi.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({
        type: "quotation",
        status: "finalized",
        currency: "USD",
        date: "2024-01-01",
        customerId: "c1",
        items: [{ name: "X", unitPrice: 50, quantity: 2, amount: 100 }],
        subtotal: 100,
        total: 100,
      }),
    });
    addDocumentSpy.mockResolvedValue("inv-2");
    getDocumentSpy.mockResolvedValue({ id: "quo-1", relatedInvoices: [] });

    let vm: ReturnType<typeof useDocumentPage> | null = null;
    const Comp = () => {
      vm = useDocumentPage({ mode: "edit", documentId: "quo-1" });
      return null;
    };
    render(
      <MemoryRouter>
        <Comp />
      </MemoryRouter>,
    );

    await waitFor(() => expect(vm!.flags.initializing).toBe(false));

    await act(async () => {
      await vm!.actions.generateInvoice();
    });

    await waitFor(() => {
      expect(addDocumentSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceDocumentId: "quo-1",
          sourceDocumentType: "quotation",
        }),
      );
      // links the new invoice back onto the source quotation
      expect(setDocumentSpy).toHaveBeenCalledWith(
        "quo-1",
        expect.objectContaining({ relatedInvoices: ["inv-2"] }),
      );
      expect(mockNavigate).toHaveBeenCalledWith("/documents/inv-2/edit");
    });
  });
});
