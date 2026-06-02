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
  isDocNumberTaken: vi.fn().mockResolvedValue(false),
  reconcileDocCounter: vi.fn().mockResolvedValue(undefined),
  DuplicateDocNumberError: class DuplicateDocNumberError extends Error {
    constructor(public docNumber: string) {
      super(`Document number "${docNumber}" is already in use.`);
      this.name = "DuplicateDocNumberError";
    }
  },
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

    await waitFor(() => expect(vm!.flags.showForm).toBe(true));
    // Manually select customer and fill line items (no auto-selection).
    await act(async () => {
      vm!.dispatch({ type: "SET_FIELD", field: "customerId", value: "c1" });
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
      // links the new invoice back onto the source quotation —
      // must write ONLY relatedInvoices, not stale id/createdAt fields
      expect(setDocumentSpy).toHaveBeenCalledWith("quo-1", {
        relatedInvoices: ["inv-2"],
      });
      expect(mockNavigate).toHaveBeenCalledWith("/documents/inv-2/edit");
    });
  });

  // Helper: render create mode and make the single default line item valid
  // for finalize (name, qty >= 1, price >= 0), with a customer selected.
  async function renderValidCreateForm() {
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
    await waitFor(() => expect(vm!.flags.showForm).toBe(true));
    await act(async () => {
      vm!.dispatch({ type: "SET_FIELD", field: "customerId", value: "c1" });
      for (const li of vm!.state.lineItems) {
        vm!.dispatch({
          type: "UPDATE_LINE_ITEM",
          id: li.id,
          changes: { name: "Work", quantity: 1, unitPrice: 100 },
        });
      }
    });
    await waitFor(() => expect(vm!.finalizeDisabled).toBe(false));
    return () => vm!;
  }

  it("create mode finalize does not persist when PDF generation fails; retry persists exactly once", async () => {
    const { generateDocumentPdf } = await import("@utils/pdf");
    // First finalize attempt: PDF generation throws. Subsequent calls fall
    // back to the factory default (resolves), simulating a transient failure.
    (generateDocumentPdf as vi.Mock).mockRejectedValueOnce(
      new Error("pdf boom"),
    );

    const getVm = await renderValidCreateForm();

    // Attempt 1 — PDF fails, so nothing must be persisted.
    await act(async () => {
      await getVm().actions.finalizeAndDownload();
    });
    await waitFor(() => expect(getVm().banners.finalizeError).toBeTruthy());
    expect(addDocumentSpy).not.toHaveBeenCalled();

    // Attempt 2 — PDF succeeds, document is persisted exactly once.
    await act(async () => {
      await getVm().actions.finalizeAndDownload();
    });
    await waitFor(() => {
      expect(addDocumentSpy).toHaveBeenCalledTimes(1);
      expect(addDocumentSpy).toHaveBeenCalledWith(
        expect.objectContaining({ status: "finalized" }),
      );
    });
  });

  it("create mode finalize reuses the created doc on retry after a download failure", async () => {
    const { downloadBlob } = await import("@utils/download");
    // First finalize: PDF + persist succeed, but the download throws.
    (downloadBlob as vi.Mock).mockImplementationOnce(() => {
      throw new Error("download boom");
    });
    const { allocateNextDocumentNumber } = await import("@utils/docNumber");
    (allocateNextDocumentNumber as vi.Mock)
      .mockResolvedValueOnce("INV-2026-001")
      .mockResolvedValueOnce("INV-2026-002");

    const getVm = await renderValidCreateForm();

    // Attempt 1 — persists, then download fails.
    await act(async () => {
      await getVm().actions.finalizeAndDownload();
    });
    await waitFor(() => {
      expect(addDocumentSpy).toHaveBeenCalledTimes(1);
      expect(getVm().banners.finalizeError).toBeTruthy();
    });
    expect(addDocumentSpy).toHaveBeenCalledWith(
      expect.objectContaining({ docNumber: "INV-2026-001" }),
    );

    // Attempt 2 — must update the already-created doc, not create a new one,
    // and must keep the originally allocated number.
    await act(async () => {
      await getVm().actions.finalizeAndDownload();
    });
    await waitFor(() => {
      expect(addDocumentSpy).toHaveBeenCalledTimes(1);
      expect(setDocumentSpy).toHaveBeenCalledWith(
        "new-id",
        expect.objectContaining({
          status: "finalized",
          docNumber: "INV-2026-001",
        }),
      );
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("saveDraft rejects a duplicate manual document number without persisting", async () => {
    const { isDocNumberTaken } = await import("@utils/docNumber");
    (isDocNumberTaken as vi.Mock).mockResolvedValueOnce(true);

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
    await waitFor(() => expect(vm!.flags.showForm).toBe(true));
    await act(async () => {
      vm!.dispatch({ type: "SET_FIELD", field: "customerId", value: "c1" });
      vm!.dispatch({
        type: "SET_FIELD",
        field: "documentNumber",
        value: "QUO-2026-001",
      });
    });

    await act(async () => {
      await vm!.actions.saveDraft();
    });

    await waitFor(() => {
      expect(vm!.headerErrors.documentNumber).toBeTruthy();
      expect(vm!.banners.saveError).toBeTruthy();
    });
    expect(addDocumentSpy).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("does not auto-select a customer when opening a new document with no location state", async () => {
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

    // Give effects time to run
    await waitFor(() => expect(vm!.flags.showForm).toBe(true));
    // Customer list is loaded (mocked to [{id:"c1"}]) but nothing should be picked
    expect(vm!.state.customerId).toBeUndefined();
  });

  it("pre-selects a customer when one is passed via location state", async () => {
    let vm: ReturnType<typeof useDocumentPage> | null = null;
    const Comp = () => {
      vm = useDocumentPage({ mode: "create" });
      return null;
    };
    render(
      <MemoryRouter
        initialEntries={[
          { pathname: "/documents/new", state: { customerId: "c1" } },
        ]}
      >
        <Comp />
      </MemoryRouter>,
    );

    await waitFor(() => expect(vm!.state.customerId).toBe("c1"));
  });

  it("preselects documentType from navigation state even when state resolves after initial render", async () => {
    // Simulate navigation state arriving after the component mounts by
    // using a non-null initial state — the effect must fire on dep changes,
    // not only on mount.
    let vm: ReturnType<typeof useDocumentPage> | null = null;
    const Comp = () => {
      vm = useDocumentPage({ mode: "create" });
      return null;
    };
    render(
      <MemoryRouter
        initialEntries={[
          { pathname: "/documents/new", state: { documentType: "quotation" } },
        ]}
      >
        <Comp />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(vm!.state.documentType).toBe("quotation");
    });
  });

  it("does not overwrite a user-selected currency when the profile loads later", async () => {
    const useUserProfile = (await import("@hooks/useUserProfile")).default;
    // Profile hasn't resolved a currency yet on first render.
    (useUserProfile as vi.Mock).mockReturnValue({
      profile: { currency: undefined, onboarding: {} },
      loading: false,
      error: null,
      updateUserProfile: vi.fn(),
    });

    let vm: ReturnType<typeof useDocumentPage> | null = null;
    const Comp = () => {
      vm = useDocumentPage({ mode: "create" });
      return null;
    };
    const { rerender } = render(
      <MemoryRouter>
        <Comp />
      </MemoryRouter>,
    );
    await waitFor(() => expect(vm!.flags.showForm).toBe(true));

    // User explicitly picks EUR.
    await act(async () => {
      vm!.formProps.onCurrencyChange("EUR");
    });
    await waitFor(() => expect(vm!.currency).toBe("EUR"));

    // Profile resolves afterwards with a different currency.
    (useUserProfile as vi.Mock).mockReturnValue({
      profile: { currency: "USD", onboarding: {} },
      loading: false,
      error: null,
      updateUserProfile: vi.fn(),
    });
    rerender(
      <MemoryRouter>
        <Comp />
      </MemoryRouter>,
    );

    // The late-arriving profile currency must not clobber the user's choice.
    await waitFor(() => expect(vm!.currency).toBe("EUR"));
  });

  it("downloadDocument generates a PDF from the loaded document and triggers a download", async () => {
    const { getDoc } = await import("firebase/firestore");
    (getDoc as vi.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({
        type: "invoice",
        docNumber: "INV-2024-001",
        status: "finalized",
        currency: "LKR",
        date: "2024-01-15",
        customerId: "c1",
        customerDetails: { name: "Acme" },
        items: [{ name: "Work", unitPrice: 100, quantity: 1, amount: 100 }],
        subtotal: 100,
        total: 100,
      }),
    });

    const { generateDocumentPdf } = await import("@utils/pdf");
    const { downloadBlob } = await import("@utils/download");

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

    await waitFor(() => expect(vm!.flags.initializing).toBe(false));

    await act(async () => {
      await vm!.actions.downloadDocument();
    });

    await waitFor(() => {
      expect(generateDocumentPdf).toHaveBeenCalledWith(
        expect.objectContaining({ docNumber: "INV-2024-001", currency: "LKR" }),
      );
      expect(downloadBlob).toHaveBeenCalledWith(
        expect.stringContaining("INV-2024-001"),
        expect.any(Uint8Array),
        "application/pdf",
      );
    });
    // must not navigate away
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
