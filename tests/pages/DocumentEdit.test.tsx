import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import DocumentEdit from "../../src/pages/DocumentEdit";
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
vi.mock("@utils/pdf", () => ({
  generateDocumentPdf: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
}));
vi.mock("@utils/download", () => ({ downloadBlob: vi.fn() }));
vi.mock("@utils/docNumber", () => ({
  allocateNextDocumentNumber: vi.fn().mockResolvedValue("INV-2026-001"),
  isDocNumberTaken: vi.fn().mockResolvedValue(false),
  reconcileDocCounter: vi.fn().mockResolvedValue(undefined),
  DuplicateDocNumberError: class DuplicateDocNumberError extends Error {
    docNumber: string;
    constructor(docNumber: string) {
      super(`Document number "${docNumber}" is already in use.`);
      this.name = "DuplicateDocNumberError";
      this.docNumber = docNumber;
    }
  },
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockUseAuth = useAuth as vi.MockedFunction<typeof useAuth>;
const mockUseFirestore = useFirestore as vi.MockedFunction<typeof useFirestore>;

const mockCustomers = [{ id: "cust1", name: "Acme Corp", userId: "uid-1" }];
const mockItems = [
  { id: "item1", name: "Consulting", unitPrice: 100, userId: "uid-1" },
];

const draftDocData = {
  type: "invoice",
  docNumber: "INV-2024-001",
  date: "2024-01-15",
  customerId: "cust1",
  customerDetails: { name: "Acme Corp" },
  status: "draft",
  currency: "USD",
  items: [
    {
      name: "Consulting",
      unitPrice: 100,
      quantity: 1,
      amount: 100,
    },
  ],
  subtotal: 100,
  total: 100,
  userId: "uid-1",
};

let setDocumentSpy = vi.fn();
let addDocumentSpy = vi.fn();

vi.mock("firebase/firestore", async () => {
  const actual =
    await vi.importActual<typeof import("firebase/firestore")>(
      "firebase/firestore",
    );
  return {
    ...actual,
    doc: vi.fn((_db, _col, id) => ({ id })),
    getDoc: vi.fn(),
    serverTimestamp: vi.fn(),
    collection: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    query: vi.fn(),
    getDocs: vi.fn(),
  };
});

function renderEdit(docId = "doc-1", state?: { autoEdit?: boolean }) {
  return render(
    <MemoryRouter
      initialEntries={[{ pathname: `/documents/${docId}/edit`, state }]}
    >
      <Routes>
        <Route path="/documents/:id/edit" element={<DocumentEdit />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("DocumentEdit", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    setDocumentSpy = vi.fn().mockResolvedValue(undefined);
    addDocumentSpy = vi.fn().mockResolvedValue("invoice-new");

    mockUseAuth.mockReturnValue({
      user: { uid: "uid-1" },
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
          items: mockCustomers,
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
          items: mockItems,
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
        getById: vi.fn(),
        getOnce: vi.fn(),
      } as unknown as ReturnType<typeof useFirestore>;
    });

    const { getDoc } = await import("firebase/firestore");
    (getDoc as vi.Mock).mockResolvedValue({
      exists: () => true,
      data: () => draftDocData,
    });
  });

  it("loads draft document and shows save actions in edit mode", async () => {
    renderEdit("doc-1", { autoEdit: true });

    await screen.findByRole("button", { name: "Save changes" });
    expect(screen.getByRole("button", { name: "Save changes" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Download PDF" })).toBeTruthy();
  });

  it("shows load error when document is missing", async () => {
    const { getDoc } = await import("firebase/firestore");
    (getDoc as vi.Mock).mockResolvedValue({ exists: () => false });

    renderEdit("missing-doc");

    expect(await screen.findByText("Document not found")).toBeTruthy();
  });

  it("shows load error (not an infinite spinner) when route id is missing", async () => {
    render(
      <MemoryRouter initialEntries={["/documents/edit"]}>
        <Routes>
          <Route path="/documents/edit" element={<DocumentEdit />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Document not found")).toBeTruthy();
    expect(screen.queryByText("Loading document…")).toBeNull();
  });

  it("saves draft changes via setDocument", async () => {
    renderEdit("doc-1", { autoEdit: true });
    await screen.findByRole("button", { name: "Save changes" });

    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(setDocumentSpy).toHaveBeenCalledWith(
        "doc-1",
        expect.objectContaining({
          status: "draft",
          currency: "USD",
        }),
      );
    });
  });

  it("downloads PDF and saves document as ready", async () => {
    const { downloadBlob } = await import("@utils/download");
    const { generateDocumentPdf } = await import("@utils/pdf");

    renderEdit("doc-1", { autoEdit: true });
    await screen.findByRole("button", { name: "Download PDF" });

    fireEvent.click(screen.getByRole("button", { name: "Download PDF" }));

    await waitFor(() => {
      expect(setDocumentSpy).toHaveBeenCalledWith(
        "doc-1",
        expect.objectContaining({ status: "ready" }),
      );
      expect(generateDocumentPdf).toHaveBeenCalled();
      expect(downloadBlob).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining("/edit"),
        expect.objectContaining({ state: { autoEdit: true } }),
      );
    });
  });

  it("shows view-only UI for sent documents", async () => {
    const { getDoc } = await import("firebase/firestore");
    (getDoc as vi.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({ ...draftDocData, status: "sent" }),
    });

    renderEdit("doc-final");
    await screen.findByRole("button", { name: "Cancel" });
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Save changes" })).toBeNull();
    });
  });

  it("shows generate invoice for sent quotation", async () => {
    const { getDoc } = await import("firebase/firestore");
    (getDoc as vi.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({
        ...draftDocData,
        type: "quotation",
        status: "sent",
      }),
    });

    renderEdit("quo-1");
    expect(
      await screen.findByRole("button", { name: "Generate invoice" }),
    ).toBeTruthy();
  });
});
