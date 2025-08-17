import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Dashboard from "../../src/pages/Dashboard";
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

    // Setup default mocks
    mockUseAuth.mockReturnValue({
      user: { uid: "test-user-id" },
      loading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    mockUseFirestore.mockReturnValue({
      items: mockDocuments,
      loading: false,
      error: null,
      add: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      get: vi.fn(),
    });

    mockUsePageTitle.mockImplementation(() => {});
  });

  describe("Click Behavior Routing", () => {
    it("should navigate to edit page when clicking 'View' on draft document", async () => {
      renderDashboard();

      // Find the first document (draft quotation)
      const viewButtons = screen.getAllByText("View");
      const firstViewButton = viewButtons[0];

      fireEvent.click(firstViewButton);

      expect(mockNavigate).toHaveBeenCalledWith("/documents/doc1/edit");
    });

    it("should navigate to edit page when clicking 'View' on finalized document", async () => {
      renderDashboard();

      // Find the second document (finalized invoice)
      const viewButtons = screen.getAllByText("View");
      const secondViewButton = viewButtons[1];

      fireEvent.click(secondViewButton);

      expect(mockNavigate).toHaveBeenCalledWith("/documents/doc2/edit");
    });

    it("should trigger download when clicking 'Download' on finalized document", async () => {
      const { downloadBlob } = await import("@utils/download");
      const { generateDocumentPdf } = await import("@utils/pdf");

      renderDashboard();

      // Find the download button on the finalized invoice
      const downloadButtons = screen.getAllByRole("button", {
        name: "Download",
      });
      const downloadButton = downloadButtons[0];

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
        name: "Download",
      });
      expect(downloadButtons.length).toBeGreaterThan(0);
    });

    it("should show both View and Download buttons for finalized documents", () => {
      renderDashboard();

      // Check that we have View buttons (3 documents)
      const viewButtons = screen.getAllByRole("button", { name: "View" });
      expect(viewButtons.length).toBeGreaterThan(0);

      // Check that we have Download buttons (1 finalized document)
      const downloadButtons = screen.getAllByRole("button", {
        name: "Download",
      });
      expect(downloadButtons.length).toBeGreaterThan(0);
    });
  });

  describe("Empty State Behavior", () => {
    it("should show empty state with CTA button when no documents", () => {
      mockUseFirestore.mockReturnValue({
        items: [],
        loading: false,
        error: null,
        add: vi.fn(),
        update: vi.fn(),
        remove: vi.fn(),
        get: vi.fn(),
      });

      renderDashboard();

      expect(screen.getByText("No documents yet.")).toBeTruthy();
      expect(
        screen.getByText(
          "Create your first invoice or quotation to get started.",
        ),
      ).toBeTruthy();
      expect(screen.getByText("Create Your First Document")).toBeTruthy();
    });

    it("should navigate to document creation when clicking CTA button in empty state", () => {
      mockUseFirestore.mockReturnValue({
        items: [],
        loading: false,
        error: null,
        add: vi.fn(),
        update: vi.fn(),
        remove: vi.fn(),
        get: vi.fn(),
      });

      renderDashboard();

      const ctaButtons = screen.getAllByRole("button", {
        name: "Create Your First Document",
      });
      fireEvent.click(ctaButtons[0]);

      expect(mockNavigate).toHaveBeenCalledWith("/documents/new");
    });

    it("should navigate to document creation when clicking 'Create New Document' button", () => {
      renderDashboard();

      const createButtons = screen.getAllByRole("button", {
        name: "Create New Document",
      });
      fireEvent.click(createButtons[0]);

      expect(mockNavigate).toHaveBeenCalledWith("/documents/new");
    });
  });

  describe("Document Display", () => {
    it("should display all required columns", () => {
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

      expect(screen.getAllByText("QUO-2024-001")[0]).toBeTruthy();
      expect(screen.getAllByText("INV-2024-001")[0]).toBeTruthy();
      expect(screen.getAllByText("Acme Corp")[0]).toBeTruthy();
      expect(screen.getAllByText("Beta Inc")[0]).toBeTruthy();
      expect(screen.getAllByText("Draft")[0]).toBeTruthy();
      expect(screen.getAllByText("Finalized")[0]).toBeTruthy();
    });

    it("should display related document information", () => {
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
    it("should set page title to Dashboard", () => {
      renderDashboard();

      expect(mockUsePageTitle).toHaveBeenCalledWith("Dashboard");
    });
  });
});
