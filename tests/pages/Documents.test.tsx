import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  within,
  waitFor,
} from "@testing-library/react";
import { BrowserRouter, MemoryRouter } from "react-router-dom";
import Documents from "../../src/pages/Documents";
import { useAuth } from "@auth/useAuth";
import { useFirestore } from "@hooks/useFirestore";
import { usePageTitle } from "@components/layout/PageTitleContext";

global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

vi.mock("@firebase/config", () => ({ db: {}, auth: {} }));
vi.mock("firebase/app", () => ({ initializeApp: vi.fn() }));
vi.mock("firebase/auth", () => ({
  initializeAuth: vi.fn(),
  browserPopupRedirectResolver: {},
  indexedDBLocalPersistence: {},
  browserLocalPersistence: {},
  inMemoryPersistence: {},
}));
vi.mock("firebase/firestore", () => ({
  initializeFirestore: vi.fn(),
}));

vi.mock("@auth/useAuth");
vi.mock("@hooks/useFirestore");
vi.mock("@components/layout/PageTitleContext");
vi.mock("@utils/docNumber", () => ({
  allocateNextDocumentNumber: vi.fn().mockResolvedValue("INV-2026-002"),
}));
vi.mock("@utils/documents", () => ({
  buildDuplicatePayload: vi.fn().mockReturnValue({ type: "invoice" }),
  getDocumentFilename: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockDocuments = [
  {
    id: "doc1",
    type: "invoice",
    typeLabel: "Invoice",
    docNumber: "INV-2026-001",
    date: "2026-05-28",
    status: "draft",
    total: 1500,
    currency: "LKR",
    customerName: "Don Kasun",
    customerId: "cust1",
    items: [],
    subtotal: 1500,
    userId: "user1",
    notes: "",
    customerDetails: { name: "Don Kasun" },
    relatedCount: 0,
    sourceInfo: undefined,
  },
  {
    id: "doc2",
    type: "quotation",
    typeLabel: "Quotation",
    docNumber: "QUO-2026-001",
    date: "2026-05-27",
    status: "finalized",
    total: 6000,
    currency: "LKR",
    customerName: "Finlays",
    customerId: "cust2",
    items: [],
    subtotal: 6000,
    userId: "user1",
    notes: "",
    customerDetails: { name: "Finlays" },
    relatedCount: 0,
    sourceInfo: undefined,
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useAuth).mockReturnValue({
    user: { uid: "user1", displayName: "Don", email: "d@test.com" } as never,
    signOut: vi.fn(),
    loading: false,
  });

  vi.mocked(useFirestore).mockReturnValue({
    items: mockDocuments as never,
    loading: false,
    error: null,
    add: vi.fn(),
    set: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    getById: vi.fn(),
    getOnce: vi.fn(),
  } as never);

  vi.mocked(usePageTitle).mockImplementation(() => {});
  mockNavigate.mockReset();
});

afterEach(() => {
  cleanup();
});

function openCardMenu(customerName: string) {
  const card = screen.getByText(customerName).closest(".doc-card");
  expect(card).toBeTruthy();
  const trigger = (card as HTMLElement).querySelector(
    'summary[aria-label="More document actions"]',
  );
  expect(trigger).toBeTruthy();
  fireEvent.click(trigger!);
  return card as HTMLElement;
}

describe("Documents page", () => {
  it("renders page title", () => {
    render(
      <BrowserRouter>
        <Documents />
      </BrowserRouter>,
    );
    expect(screen.getByText("Documents")).toBeInTheDocument();
  });

  it("renders all documents by default", () => {
    render(
      <BrowserRouter>
        <Documents />
      </BrowserRouter>,
    );
    expect(screen.getAllByText("Don Kasun").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Finlays").length).toBeGreaterThan(0);
    expect(
      screen.getByText("2 documents · 1 drafts · 1 sent · 0 paid"),
    ).toBeInTheDocument();
  });

  it("filters to drafts only when Draft toggle clicked", () => {
    render(
      <BrowserRouter>
        <Documents />
      </BrowserRouter>,
    );
    fireEvent.click(screen.getByRole("radio", { name: "Draft" }));
    expect(screen.getAllByText("Don Kasun").length).toBeGreaterThan(0);
    expect(screen.queryByText("Finlays")).not.toBeInTheDocument();
  });

  it("filters to invoices only when Invoices toggle clicked", () => {
    render(
      <BrowserRouter>
        <Documents />
      </BrowserRouter>,
    );
    fireEvent.click(screen.getByRole("radio", { name: "Invoices" }));
    expect(screen.getAllByText("Don Kasun").length).toBeGreaterThan(0);
    expect(screen.queryByText("Finlays")).not.toBeInTheDocument();
  });

  it("filters to quotations only when Quotations toggle clicked", () => {
    render(
      <BrowserRouter>
        <Documents />
      </BrowserRouter>,
    );
    fireEvent.click(screen.getByRole("radio", { name: "Quotations" }));
    expect(screen.queryByText("Don Kasun")).not.toBeInTheDocument();
    expect(screen.getAllByText("Finlays").length).toBeGreaterThan(0);
  });

  it("filters to sent only when Sent toggle clicked", () => {
    render(
      <BrowserRouter>
        <Documents />
      </BrowserRouter>,
    );
    fireEvent.click(screen.getByRole("radio", { name: "Sent" }));
    expect(screen.queryByText("Don Kasun")).not.toBeInTheDocument();
    expect(screen.getAllByText("Finlays").length).toBeGreaterThan(0);
  });

  it("shows empty state when status filter produces no results", () => {
    render(
      <BrowserRouter>
        <Documents />
      </BrowserRouter>,
    );
    fireEvent.click(screen.getByRole("radio", { name: "Paid" }));
    expect(
      screen.getByText("No documents match your filters"),
    ).toBeInTheDocument();
  });

  it("New document button navigates to /documents/new", () => {
    render(
      <BrowserRouter>
        <Documents />
      </BrowserRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: /new document/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/documents/new");
  });

  it("applies status filter from URL query on load", () => {
    render(
      <MemoryRouter initialEntries={["/documents?status=draft"]}>
        <Documents />
      </MemoryRouter>,
    );

    expect(screen.getByRole("radio", { name: "Draft" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getAllByText("Don Kasun").length).toBeGreaterThan(0);
    expect(screen.queryByText("Finlays")).not.toBeInTheDocument();
  });

  it("opens delete confirm and calls remove on confirm", async () => {
    const remove = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useFirestore).mockReturnValue({
      items: mockDocuments as never,
      loading: false,
      error: null,
      add: vi.fn(),
      set: vi.fn(),
      update: vi.fn(),
      remove,
      getById: vi.fn(),
      getOnce: vi.fn(),
    } as never);

    render(
      <BrowserRouter>
        <Documents />
      </BrowserRouter>,
    );

    const card = openCardMenu("Don Kasun");
    fireEvent.click(within(card).getByRole("button", { name: "Delete" }));

    const dialog = screen.getByRole("dialog", { name: "Delete document" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(remove).toHaveBeenCalledWith("doc1");
    });
  });

  it("duplicates document and navigates to edit", async () => {
    const add = vi.fn().mockResolvedValue("doc-new");
    vi.mocked(useFirestore).mockReturnValue({
      items: mockDocuments as never,
      loading: false,
      error: null,
      add,
      set: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      getById: vi.fn(),
      getOnce: vi.fn(),
    } as never);

    render(
      <BrowserRouter>
        <Documents />
      </BrowserRouter>,
    );

    const card = openCardMenu("Don Kasun");
    fireEvent.click(within(card).getByRole("button", { name: "Duplicate" }));

    await waitFor(() => {
      expect(add).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/documents/doc-new/edit", {
        state: { autoEdit: true },
      });
    });
  });

  it("does not show an inline banner when duplicate fails (handled by toast)", async () => {
    const add = vi.fn().mockRejectedValue(new Error("Duplicate failed"));
    vi.mocked(useFirestore).mockReturnValue({
      items: mockDocuments as never,
      loading: false,
      error: null,
      add,
      set: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      getById: vi.fn(),
      getOnce: vi.fn(),
    } as never);

    render(
      <BrowserRouter>
        <Documents />
      </BrowserRouter>,
    );

    const card = openCardMenu("Don Kasun");
    fireEvent.click(within(card).getByRole("button", { name: "Duplicate" }));

    // Give async operations time to settle, then assert no inline error banner
    await waitFor(() => expect(add).toHaveBeenCalled());
    expect(screen.queryByText("Duplicate failed")).not.toBeInTheDocument();
  });

  it("hides document cards when firestore error is set", () => {
    vi.mocked(useFirestore).mockReturnValue({
      items: mockDocuments as never,
      loading: false,
      error: "Failed to load documents",
      add: vi.fn(),
      set: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      getById: vi.fn(),
      getOnce: vi.fn(),
    } as never);

    render(
      <BrowserRouter>
        <Documents />
      </BrowserRouter>,
    );

    expect(screen.getByText("Failed to load documents")).toBeInTheDocument();
    expect(screen.queryByText("Don Kasun")).not.toBeInTheDocument();
  });
});
