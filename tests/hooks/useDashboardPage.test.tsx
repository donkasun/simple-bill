import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor, cleanup } from "@testing-library/react";

import { useDashboardPage } from "../../src/hooks/pages/useDashboardPage";
import { useAuth } from "@auth/useAuth";
import { useFirestore } from "@hooks/useFirestore";
import * as customerUsage from "@utils/customerUsage";

vi.mock("@auth/useAuth");
vi.mock("@hooks/useFirestore");
vi.mock("@hooks/pages/useDocumentMutations", () => ({
  useDocumentMutations: () => ({
    mutationError: null,
    pending: {
      duplicatingId: null,
      deletingId: null,
      downloadingId: null,
      markingPaidId: null,
      markingUnpaidId: null,
    },
    confirms: {
      deleteId: null,
      markPaidId: null,
      markUnpaidId: null,
    },
    actions: {
      requestDelete: vi.fn(),
      confirmDelete: vi.fn(),
      cancelDelete: vi.fn(),
      requestMarkPaid: vi.fn(),
      confirmMarkPaid: vi.fn(),
      cancelMarkPaid: vi.fn(),
      requestMarkUnpaid: vi.fn(),
      confirmMarkUnpaid: vi.fn(),
      cancelMarkUnpaid: vi.fn(),
      duplicate: vi.fn(),
      download: vi.fn(),
    },
  }),
}));
vi.mock("../../src/firebase/config", () => ({ db: {}, auth: {} }));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockUseAuth = useAuth as vi.MockedFunction<typeof useAuth>;
const mockUseFirestore = useFirestore as vi.MockedFunction<typeof useFirestore>;

const mockCustomers = [
  { id: "cust1", name: "Acme", userId: "user1" },
  { id: "cust2", name: "Beta", userId: "user1" },
];

const makeDocs = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: `doc${i}`,
    type: "invoice" as const,
    typeLabel: "Invoice",
    status: i === 0 ? ("finalized" as const) : ("draft" as const),
    customerName: `Customer ${i}`,
    customerId: i < 2 ? `cust${i + 1}` : undefined,
    total: 100 * (i + 1),
    currency: "USD",
    userId: "user1",
    date: "2024-06-01",
  }));

describe("useDashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(customerUsage, "loadCustomerUsage").mockReturnValue({
      cust1: Date.now(),
      cust2: Date.now() - 1000,
    });
    mockUseAuth.mockReturnValue({
      user: { uid: "user1", displayName: "Jane Doe" },
      loading: false,
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
    } as unknown as ReturnType<typeof useAuth>);
    mockUseFirestore.mockImplementation((options) => {
      if (options.collectionName === "customers") {
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
      return {
        items: makeDocs(8),
        loading: false,
        error: null,
        add: vi.fn(),
        update: vi.fn(),
        remove: vi.fn(),
        set: vi.fn(),
        getById: vi.fn(),
        getOnce: vi.fn(),
      } as unknown as ReturnType<typeof useFirestore>;
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("limits recent documents to five", async () => {
    let vm: ReturnType<typeof useDashboardPage> | null = null;
    const Comp = () => {
      vm = useDashboardPage();
      return null;
    };
    render(<Comp />);

    await waitFor(() => {
      expect(vm!.recentDocuments).toHaveLength(5);
      expect(vm!.hasDocuments).toBe(true);
    });
  });

  it("computes financial summary from documents", async () => {
    let vm: ReturnType<typeof useDashboardPage> | null = null;
    const Comp = () => {
      vm = useDashboardPage();
      return null;
    };
    render(<Comp />);

    await waitFor(() => {
      expect(vm!.financialSummary.outstanding).toBe(100);
      expect(vm!.financialSummary.drafts).toBe(7);
    });
  });

  it("resolves quick action customers from usage", async () => {
    let vm: ReturnType<typeof useDashboardPage> | null = null;
    const Comp = () => {
      vm = useDashboardPage();
      return null;
    };
    render(<Comp />);

    await waitFor(() => {
      expect(vm!.quickActionCustomers).toHaveLength(2);
      expect(vm!.quickActionCustomers[0]?.name).toBe("Acme");
    });
  });

  it("hides recent list when firestore error is set", async () => {
    mockUseFirestore.mockImplementation((options) => {
      if (options.collectionName === "customers") {
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
        error: "Failed to load",
        add: vi.fn(),
        update: vi.fn(),
        remove: vi.fn(),
        set: vi.fn(),
        getById: vi.fn(),
        getOnce: vi.fn(),
      } as unknown as ReturnType<typeof useFirestore>;
    });

    let vm: ReturnType<typeof useDashboardPage> | null = null;
    const Comp = () => {
      vm = useDashboardPage();
      return null;
    };
    render(<Comp />);

    await waitFor(() => {
      expect(vm!.firestoreError).toBe("Failed to load");
      expect(vm!.showRecentList).toBe(false);
    });
  });

  it("exposes greeting and first name", async () => {
    let vm: ReturnType<typeof useDashboardPage> | null = null;
    const Comp = () => {
      vm = useDashboardPage();
      return null;
    };
    render(<Comp />);

    await waitFor(() => {
      expect(vm!.firstName).toBe("Jane");
      expect(vm!.greeting).toMatch(/Good (morning|afternoon|evening)/);
    });
  });
});
