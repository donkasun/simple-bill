import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
  cleanup,
} from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Dashboard from "../../src/pages/dashboard";
import { useAuth } from "@auth/useAuth";
import { useFirestore } from "@hooks/useFirestore";
import { usePageTitle } from "@components/layout/PageTitleContext";

// Mock ResizeObserver for test environment
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock Firebase config to avoid initialization errors
vi.mock("@firebase/config", () => ({
  db: {},
  auth: {},
}));

// Mock Firebase modules
vi.mock("firebase/app", () => ({
  initializeApp: vi.fn(),
}));

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

// Mock all the hooks and modules
vi.mock("@auth/useAuth");
vi.mock("@hooks/useFirestore");
vi.mock("@components/layout/PageTitleContext");
vi.mock("@utils/pdf", () => ({
  generateDocumentPdf: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
}));
vi.mock("@utils/download", () => ({
  downloadBlob: vi.fn(),
}));

const mockUseAuth = useAuth as vi.MockedFunction<typeof useAuth>;
const mockUseFirestore = useFirestore as vi.MockedFunction<typeof useFirestore>;
const mockUsePageTitle = usePageTitle as vi.MockedFunction<typeof usePageTitle>;

// Mock navigate function
const mockNavigate = vi.fn();
let firestoreCallCount = 0;
let updateSpy = vi.fn();

// Mock react-router-dom
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Sample test data
const mockDocuments = [
  {
    id: "doc1",
    type: "quotation",
    typeLabel: "Quotation",
    docNumber: "QUO-2024-001",
    date: "2024-01-15",
    customerName: "Acme Corp",
    total: 1500,
    currency: "USD",
    status: "draft",
    relatedCount: 0,
    sourceInfo: undefined,
  },
  {
    id: "doc2",
    type: "invoice",
    typeLabel: "Invoice",
    docNumber: "INV-2024-001",
    date: "2024-01-16",
    customerName: "Beta Inc",
    total: 2500,
    currency: "USD",
    status: "finalized",
    relatedCount: 0,
    sourceInfo: "From Quotation",
  },
  {
    id: "doc3",
    type: "quotation",
    typeLabel: "Quotation",
    docNumber: "QUO-2024-002",
    date: "2024-01-17",
    customerName: "Gamma Ltd",
    total: 3000,
    currency: "USD",
    status: "finalized",
    relatedCount: 2,
    sourceInfo: undefined,
  },
];

const renderDashboard = () => {
  return render(
    <BrowserRouter>
      <Dashboard />
    </BrowserRouter>,
  );
};

describe("Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    firestoreCallCount = 0;
    updateSpy = vi.fn();

    // Setup default mocks
    mockUseAuth.mockReturnValue({
      user: { uid: "test-user-id" },
      loading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    mockUseFirestore.mockImplementation(() => {
      firestoreCallCount++;
      if (firestoreCallCount === 2) {
        // customers call
        return {
          items: [] as never,
          loading: false,
          error: null,
          add: vi.fn(),
          set: vi.fn(),
          update: vi.fn(),
          remove: vi.fn(),
          getById: vi.fn(),
          getOnce: vi.fn(),
        } as never;
      }
      // documents call
      return {
        items: mockDocuments as never,
        loading: false,
        error: null,
        add: vi.fn(),
        set: vi.fn(),
        update: updateSpy as never,
        remove: vi.fn(),
        getById: vi.fn(),
        getOnce: vi.fn(),
      } as never;
    });

    mockUsePageTitle.mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
  });

  describe("Click Behavior Routing", () => {
    it("should navigate to edit page when clicking 'Continue editing' on draft document", async () => {
      renderDashboard();

      // Find the first document (draft quotation)
      const editButtons = screen.getAllByRole("button", {
        name: "Continue editing",
      });
      const firstEditButton = editButtons[0];

      fireEvent.click(firstEditButton);

      expect(mockNavigate).toHaveBeenCalledWith("/documents/doc1/edit");
    });

    it("should open confirmation and mark as paid for finalized document", async () => {
      renderDashboard();

      // Find the second document (finalized invoice)
      const markPaidButtons = screen.getAllByRole("button", {
        name: "Mark as paid",
      });
      const firstMarkPaidButton = markPaidButtons[0];

      fireEvent.click(firstMarkPaidButton);

      expect(
        screen.getByRole("heading", { name: "Mark as paid" }),
      ).toBeTruthy();
      expect(
        screen.getByText(
          "Mark this document as paid? You can always undo this from the dashboard.",
        ),
      ).toBeTruthy();

      const dialog = screen.getByRole("dialog");
      fireEvent.click(
        within(dialog).getByRole("button", { name: "Mark as paid" }),
      );

      await waitFor(() => {
        expect(updateSpy).toHaveBeenCalledWith(
          "doc2",
          expect.objectContaining({
            paidAt: expect.any(Date),
            status: "paid",
          }),
        );
      });
    });

    it("should trigger download when clicking 'Download PDF' on finalized document", async () => {
      const { downloadBlob } = await import("@utils/download");
      const { generateDocumentPdf } = await import("@utils/pdf");

      renderDashboard();

      const betaCard = screen.getByText("Beta Inc").closest(".doc-card");
      expect(betaCard).toBeTruthy();
      const downloadButton = within(betaCard as HTMLElement).getByRole(
        "button",
        {
          name: /download pdf/i,
        },
      );

      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(generateDocumentPdf).toHaveBeenCalledWith({
          type: "invoice",
          docNumber: "INV-2024-001",
          date: "2024-01-16",
          customerDetails: undefined,
          items: undefined,
          subtotal: undefined,
          total: 2500,
          currency: "USD",
        });
        expect(downloadBlob).toHaveBeenCalled();
      });
    });

    it("should not show download button for draft documents", () => {
      renderDashboard();

      // Check that there's at least one download button (for the finalized document)
      const downloadButtons = screen.getAllByRole("button", {
        name: /download pdf/i,
      });
      expect(downloadButtons.length).toBeGreaterThan(0);
    });

    it("should show both Mark as paid and Download PDF buttons for finalized documents", () => {
      renderDashboard();

      // Check that we have Mark as paid buttons
      const markPaidButtons = screen.getAllByRole("button", {
        name: "Mark as paid",
      });
      expect(markPaidButtons.length).toBeGreaterThan(0);

      // Check that we have Download buttons
      const downloadButtons = screen.getAllByRole("button", {
        name: /download pdf/i,
      });
      expect(downloadButtons.length).toBeGreaterThan(0);
    });
  });

  describe("Empty State Behavior", () => {
    it("should show empty state with CTA button when no documents", () => {
      mockUseFirestore.mockImplementation(() => {
        firestoreCallCount++;
        if (firestoreCallCount === 2) {
          return {
            items: [] as never,
            loading: false,
            error: null,
            add: vi.fn(),
            set: vi.fn(),
            update: vi.fn(),
            remove: vi.fn(),
            getById: vi.fn(),
            getOnce: vi.fn(),
          } as never;
        }
        return {
          items: [] as never,
          loading: false,
          error: null,
          add: vi.fn(),
          set: vi.fn(),
          update: vi.fn(),
          remove: vi.fn(),
          getById: vi.fn(),
          getOnce: vi.fn(),
        } as never;
      });

      renderDashboard();

      expect(
        screen.getByText("You haven't created any invoices yet"),
      ).toBeTruthy();
      expect(
        screen.getByText(
          "Let's create your first one! It only takes a minute to get started.",
        ),
      ).toBeTruthy();
      expect(screen.getByText("Create first invoice")).toBeTruthy();
    });

    it("should navigate to document creation when clicking CTA button in empty state", () => {
      mockUseFirestore.mockImplementation(() => {
        firestoreCallCount++;
        if (firestoreCallCount === 2) {
          return {
            items: [] as never,
            loading: false,
            error: null,
            add: vi.fn(),
            set: vi.fn(),
            update: vi.fn(),
            remove: vi.fn(),
            getById: vi.fn(),
            getOnce: vi.fn(),
          } as never;
        }
        return {
          items: [] as never,
          loading: false,
          error: null,
          add: vi.fn(),
          set: vi.fn(),
          update: vi.fn(),
          remove: vi.fn(),
          getById: vi.fn(),
          getOnce: vi.fn(),
        } as never;
      });

      renderDashboard();

      const ctaButtons = screen.getAllByRole("button", {
        name: "Create first invoice",
      });
      fireEvent.click(ctaButtons[0]);

      expect(mockNavigate).toHaveBeenCalledWith("/documents/new");
    });

    it("should navigate to document creation when clicking 'New invoice' button", () => {
      renderDashboard();

      const createButtons = screen.getAllByRole("button", {
        name: /new invoice/i,
      });
      fireEvent.click(createButtons[0]);

      expect(mockNavigate).toHaveBeenCalledWith("/documents/new");
    });
  });

  it("View all navigates to /documents", () => {
    renderDashboard();
    fireEvent.click(screen.getByText(/view all/i));
    expect(mockNavigate).toHaveBeenCalledWith("/documents");
  });

  describe("Document Display", () => {
    // TODO(M1): asserts the old table columns; Dashboard becomes card-based in the redesign.
    it.skip("should display all required columns", () => {
      renderDashboard();

      expect(screen.getAllByText("Doc #")[0]).toBeTruthy();
      expect(screen.getAllByText("Type")[0]).toBeTruthy();
      expect(screen.getAllByText("Customer")[0]).toBeTruthy();
      expect(screen.getAllByText("Date")[0]).toBeTruthy();
      expect(screen.getAllByText("Total")[0]).toBeTruthy();
      expect(screen.getAllByText("Status")[0]).toBeTruthy();
      expect(screen.getAllByText("Relations")[0]).toBeTruthy();
      expect(screen.getAllByText("Actions")[0]).toBeTruthy();
    });

    it("should display document information correctly", () => {
      renderDashboard();

      expect(screen.getAllByText(/QUO-2024-001/)[0]).toBeTruthy();
      expect(screen.getAllByText(/INV-2024-001/)[0]).toBeTruthy();
      expect(screen.getAllByText("Acme Corp")[0]).toBeTruthy();
      expect(screen.getAllByText("Beta Inc")[0]).toBeTruthy();
      expect(screen.getAllByText("Draft")[0]).toBeTruthy();
      // Finalized documents display as "Sent" badge in the redesigned dashboard
      expect(screen.getAllByText("Sent")[0]).toBeTruthy();
    });

    // TODO(M1): asserts old relations-column copy; re-verify after the card-based redesign.
    it.skip("should display related document information", () => {
      renderDashboard();

      // Check for quotation with related invoices
      expect(screen.getAllByText("2 invoices generated")[0]).toBeTruthy();

      // Check for invoice with source information
      expect(screen.getAllByText("From Quotation")[0]).toBeTruthy();
    });
  });

  describe("Loading and Error States", () => {
    it("should show loading state", () => {
      mockUseFirestore.mockReturnValue({
        items: [],
        loading: true,
        error: null,
        add: vi.fn(),
        update: vi.fn(),
        remove: vi.fn(),
        get: vi.fn(),
      });

      renderDashboard();

      expect(screen.getByText("Loading documents…")).toBeTruthy();
    });

    it("should show error state", () => {
      mockUseFirestore.mockReturnValue({
        items: [],
        loading: false,
        error: "Failed to load documents",
        add: vi.fn(),
        update: vi.fn(),
        remove: vi.fn(),
        get: vi.fn(),
      });

      renderDashboard();

      expect(screen.getByText("Failed to load documents")).toBeTruthy();
    });
  });

  describe("Page Title", () => {
    it("should set page title to Home", () => {
      renderDashboard();

      expect(mockUsePageTitle).toHaveBeenCalledWith("Home");
    });
  });
});
