import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
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
vi.mock("@utils/docNumber", () => ({
  allocateNextDocumentNumber: vi.fn().mockResolvedValue("INV-2026-002"),
}));
vi.mock("@utils/documents", () => ({
  buildDuplicatePayload: vi.fn().mockReturnValue({ type: "invoice" }),
  getDocumentFilename: vi.fn().mockReturnValue("invoice"),
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
    status: "sent",
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
    status: "sent",
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
    sessionStorage.clear();
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

  describe("Page layout baseline (pre–Stitch re-skin)", () => {
    it("shows the stitch dashboard header", () => {
      mockUseAuth.mockReturnValue({
        user: { uid: "test-user-id", displayName: "Jane Doe" },
        loading: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
      });

      renderDashboard();

      expect(
        screen.getByRole("heading", { level: 1, name: "Welcome back, Jane" }),
      ).toBeTruthy();
      expect(
        screen.getByText("Here is your clean status summary for this month."),
      ).toBeTruthy();
      expect(screen.getByRole("button", { name: "New Invoice" })).toBeTruthy();
    });

    it("shows the two-column dashboard split with recent documents", () => {
      const { container } = renderDashboard();

      expect(container.querySelector(".dashboard-split")).toBeTruthy();
      expect(container.querySelector(".dashboard-split__main")).toBeTruthy();
      expect(container.querySelector(".dashboard-split__aside")).toBeTruthy();
      expect(
        screen.getByRole("heading", { level: 2, name: "Recent Documents" }),
      ).toBeTruthy();
    });

    it("shows New Invoice in the header only", () => {
      renderDashboard();

      expect(
        screen.getAllByRole("button", { name: /new invoice/i }),
      ).toHaveLength(1);
    });

    it("uses the widened dashboard page shell", () => {
      const { container } = renderDashboard();

      const page = container.querySelector(".dashboard-page.app-page");
      expect(page).toBeTruthy();
    });

    it("includes stitch motion and ambient dashboard polish", () => {
      const { container } = renderDashboard();

      expect(container.querySelector(".dashboard-ambient")).toBeTruthy();
      expect(
        screen.getByRole("button", { name: "New Invoice" }).className,
      ).toContain("dashboard-pulse-breathing");
    });

    it("plays entrance motion only once per browser session", () => {
      const { unmount, container } = renderDashboard();

      expect(
        screen.getByRole("button", { name: "New Invoice" }).className,
      ).toContain("dashboard-pulse-breathing");
      expect(
        container.querySelector(".dashboard-animate-fade-up"),
      ).toBeTruthy();

      unmount();
      const { container: containerAgain } = renderDashboard();

      expect(
        screen.getByRole("button", { name: "New Invoice" }).className,
      ).not.toContain("dashboard-pulse-breathing");
      expect(
        containerAgain.querySelector(".dashboard-animate-fade-up"),
      ).toBeNull();
    });
  });

  describe("Recent document rows", () => {
    it("navigates to edit when clicking a document row", () => {
      renderDashboard();

      const acmeRow = screen
        .getByText("Acme Corp")
        .closest(".dashboard-doc-row");
      fireEvent.click(acmeRow as HTMLElement);

      expect(mockNavigate).toHaveBeenCalledWith("/documents/doc1/edit");
    });

    it("does not show document card actions on the dashboard", () => {
      renderDashboard();

      expect(
        screen.queryByRole("button", { name: "Continue editing" }),
      ).toBeNull();
      expect(screen.queryByRole("button", { name: "Mark as paid" })).toBeNull();
      expect(
        screen.queryByRole("button", { name: /download pdf/i }),
      ).toBeNull();
    });

    it("shows Pending for draft rows instead of a date", () => {
      renderDashboard();

      const acmeRow = screen
        .getByText("Acme Corp")
        .closest(".dashboard-doc-row");
      expect(within(acmeRow as HTMLElement).getByText("Pending")).toBeTruthy();
    });

    it("shows formatted date below amount for sent or paid rows", () => {
      renderDashboard();

      const betaRow = screen
        .getByText("Beta Inc")
        .closest(".dashboard-doc-row");
      const dateEl = (betaRow as HTMLElement).querySelector(
        ".dashboard-doc-row__date",
      );
      expect(dateEl?.textContent).toMatch(/2024/);
      expect(dateEl?.textContent).not.toBe("Sent");
      expect(dateEl?.textContent).not.toBe("Pending");
    });

    it("shows type icons for invoices and quotations", () => {
      const { container } = renderDashboard();

      const invoiceRow = screen
        .getByText("Beta Inc")
        .closest(".dashboard-doc-row--invoice");
      expect(invoiceRow).toBeTruthy();
      expect(
        (invoiceRow as HTMLElement).querySelector(".material-symbols-outlined")
          ?.textContent,
      ).toBe("receipt_long");

      const quotationRow = container.querySelector(
        ".dashboard-doc-row--quotation",
      );
      expect(quotationRow).toBeTruthy();
      expect(
        quotationRow?.querySelector(".material-symbols-outlined")?.textContent,
      ).toBe("request_quote");
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

  describe("Status summary bento", () => {
    it("shows paid, sent, and draft counts", () => {
      renderDashboard();

      const strip = screen.getByRole("region", {
        name: "Invoice status summary",
      });
      expect(within(strip).getByText("Paid")).toBeTruthy();
      expect(within(strip).getByText("Sent")).toBeTruthy();
      expect(within(strip).getByText("Draft")).toBeTruthy();
      expect(within(strip).getByText("0")).toBeTruthy();
      expect(within(strip).getByText("2")).toBeTruthy();
      expect(within(strip).getByText("1")).toBeTruthy();
    });

    it("navigates to filtered document lists when clicking status cards", () => {
      renderDashboard();

      const strip = screen.getByRole("region", {
        name: "Invoice status summary",
      });
      fireEvent.click(within(strip).getByRole("button", { name: /paid/i }));
      expect(mockNavigate).toHaveBeenCalledWith("/documents?status=paid");

      fireEvent.click(within(strip).getByRole("button", { name: /sent/i }));
      expect(mockNavigate).toHaveBeenCalledWith("/documents?status=sent");

      fireEvent.click(within(strip).getByRole("button", { name: /draft/i }));
      expect(mockNavigate).toHaveBeenCalledWith("/documents?status=draft");
    });
  });

  describe("Dashboard aside", () => {
    it("always shows the tax season tip", () => {
      renderDashboard();

      expect(
        screen.getByRole("region", { name: "Tax season tip" }),
      ).toBeTruthy();
      expect(screen.getByText("Tax Season Tip")).toBeTruthy();
      expect(screen.getByText(/Keep your receipts organized/)).toBeTruthy();
    });

    it("shows customer spotlight without an avatar when a customer has outstanding invoices", () => {
      mockUseFirestore.mockImplementation((options) => {
        if (options?.collectionName === "customers") {
          return {
            items: [
              {
                id: "cust-beta",
                name: "Beta Inc",
                email: "beta@example.com",
              },
            ] as never,
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
          items: [
            {
              ...mockDocuments[1],
              customerId: "cust-beta",
            },
          ] as never,
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

      const { container } = renderDashboard();

      const spotlight = screen.getByRole("region", {
        name: "Customer spotlight",
      });
      expect(
        within(spotlight).getByRole("heading", { level: 3, name: "Beta Inc" }),
      ).toBeTruthy();
      expect(within(spotlight).getByText("beta@example.com")).toBeTruthy();
      expect(
        container.querySelector(".dashboard-spotlight__avatar"),
      ).toBeNull();
      expect(
        within(spotlight).getByRole("link", { name: "Send Reminder" }),
      ).toHaveProperty(
        "href",
        expect.stringContaining("mailto:beta@example.com"),
      );
    });
  });

  describe("Recent documents list", () => {
    it("shows at most five document rows when more exist", () => {
      const manyDocs = Array.from({ length: 10 }, (_, i) => ({
        id: `doc-${i}`,
        type: "invoice" as const,
        typeLabel: "Invoice",
        docNumber: `INV-2024-${String(i).padStart(3, "0")}`,
        date: "2024-01-15",
        customerName: `Customer ${i}`,
        total: 100,
        currency: "USD",
        status: "draft" as const,
        relatedCount: 0,
        sourceInfo: undefined,
      }));

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
          items: manyDocs as never,
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

      const { container } = renderDashboard();

      expect(container.querySelectorAll(".dashboard-doc-row")).toHaveLength(5);
    });
  });
});
