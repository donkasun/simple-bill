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
  { id: "cust1", name: "Acme", email: "acme@example.com", userId: "user1" },
  { id: "cust2", name: "Beta", email: "beta@example.com", userId: "user1" },
  { id: "cust3", name: "Gamma", userId: "user1" },
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

  it("computes status counts for bento cards", async () => {
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
        items: [
          {
            id: "paid1",
            type: "invoice" as const,
            typeLabel: "Invoice",
            status: "paid" as const,
            customerName: "Paid Co",
            total: 50,
            currency: "USD",
            userId: "user1",
            date: "2024-06-01",
          },
          {
            id: "sent1",
            type: "invoice" as const,
            typeLabel: "Invoice",
            status: "finalized" as const,
            customerName: "Sent Co",
            total: 75,
            currency: "USD",
            userId: "user1",
            date: "2024-06-02",
          },
          {
            id: "sent2",
            type: "invoice" as const,
            typeLabel: "Invoice",
            status: "finalized" as const,
            customerName: "Sent Co 2",
            total: 25,
            currency: "USD",
            userId: "user1",
            date: "2024-06-03",
          },
          {
            id: "draft1",
            type: "invoice" as const,
            typeLabel: "Invoice",
            status: "draft" as const,
            customerName: "Draft Co",
            total: 10,
            currency: "USD",
            userId: "user1",
            date: "2024-06-04",
          },
        ],
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

    let vm: ReturnType<typeof useDashboardPage> | null = null;
    const Comp = () => {
      vm = useDashboardPage();
      return null;
    };
    render(<Comp />);

    await waitFor(() => {
      expect(vm!.statusCounts).toEqual({
        paidCount: 1,
        sentCount: 2,
        draftCount: 1,
      });
    });
  });

  it("picks spotlight customer with highest outstanding balance", async () => {
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
        items: [
          {
            id: "sent1",
            type: "invoice" as const,
            typeLabel: "Invoice",
            status: "finalized" as const,
            customerId: "cust1",
            customerName: "Acme",
            total: 100,
            currency: "USD",
            userId: "user1",
            date: "2024-06-01",
          },
          {
            id: "sent2",
            type: "invoice" as const,
            typeLabel: "Invoice",
            status: "finalized" as const,
            customerId: "cust2",
            customerName: "Beta",
            total: 450,
            currency: "USD",
            userId: "user1",
            date: "2024-06-02",
          },
        ],
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

    let vm: ReturnType<typeof useDashboardPage> | null = null;
    const Comp = () => {
      vm = useDashboardPage();
      return null;
    };
    render(<Comp />);

    await waitFor(() => {
      expect(vm!.spotlightCustomer).toEqual({
        customerId: "cust2",
        name: "Beta",
        email: "beta@example.com",
        outstandingBalance: 450,
      });
    });
  });

  it("ignores finalized quotations when picking spotlight customer", async () => {
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
        items: [
          {
            id: "quo1",
            type: "quotation" as const,
            typeLabel: "Quotation",
            status: "finalized" as const,
            customerId: "cust2",
            customerName: "Beta",
            total: 9000,
            currency: "USD",
            userId: "user1",
            date: "2024-06-02",
          },
          {
            id: "inv1",
            type: "invoice" as const,
            typeLabel: "Invoice",
            status: "finalized" as const,
            customerId: "cust1",
            customerName: "Acme",
            total: 100,
            currency: "USD",
            userId: "user1",
            date: "2024-06-01",
          },
        ],
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

    let vm: ReturnType<typeof useDashboardPage> | null = null;
    const Comp = () => {
      vm = useDashboardPage();
      return null;
    };
    render(<Comp />);

    await waitFor(() => {
      expect(vm!.spotlightCustomer).toEqual({
        customerId: "cust1",
        name: "Acme",
        email: "acme@example.com",
        outstandingBalance: 100,
      });
    });
  });

  it("builds tax season tip from documents saved this month", async () => {
    const now = new Date();
    const isoThisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-15`;

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
        items: [
          {
            id: "doc1",
            type: "invoice" as const,
            typeLabel: "Invoice",
            status: "paid" as const,
            customerName: "Acme",
            total: 100,
            currency: "USD",
            userId: "user1",
            date: isoThisMonth,
          },
          {
            id: "doc2",
            type: "invoice" as const,
            typeLabel: "Invoice",
            status: "draft" as const,
            customerName: "Beta",
            total: 50,
            currency: "USD",
            userId: "user1",
            date: isoThisMonth,
          },
          {
            id: "doc3",
            type: "invoice" as const,
            typeLabel: "Invoice",
            status: "draft" as const,
            customerName: "Old",
            total: 25,
            currency: "USD",
            userId: "user1",
            date: "2020-01-01",
          },
        ],
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

    let vm: ReturnType<typeof useDashboardPage> | null = null;
    const Comp = () => {
      vm = useDashboardPage();
      return null;
    };
    render(<Comp />);

    await waitFor(() => {
      expect(vm!.taxSeasonTip).toBe(
        "Keep your receipts organized! Jane, you've saved 2 documents this month. Great progress.",
      );
    });
  });

  it("builds a neutral tax season tip when no documents were saved this month", async () => {
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
        items: [
          {
            id: "doc-old",
            type: "invoice" as const,
            typeLabel: "Invoice",
            status: "paid" as const,
            customerName: "Acme",
            total: 100,
            currency: "USD",
            userId: "user1",
            date: "2020-01-01",
          },
        ],
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

    mockUseAuth.mockReturnValue({
      user: { uid: "user1", displayName: "Jane Doe" },
      loading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    let vm: ReturnType<typeof useDashboardPage> | null = null;
    const Comp = () => {
      vm = useDashboardPage();
      return null;
    };
    render(<Comp />);

    await waitFor(() => {
      expect(vm!.taxSeasonTip).toBe(
        "Keep your receipts organized! Jane, you haven't saved any documents this month yet.",
      );
    });
  });

  it("exposes stitch-ready view-model fields", async () => {
    let vm: ReturnType<typeof useDashboardPage> | null = null;
    const Comp = () => {
      vm = useDashboardPage();
      return null;
    };
    render(<Comp />);

    await waitFor(() => {
      expect(vm!.statusCounts).toEqual(
        expect.objectContaining({
          paidCount: expect.any(Number),
          sentCount: expect.any(Number),
          draftCount: expect.any(Number),
        }),
      );
      expect(typeof vm!.taxSeasonTip).toBe("string");
      expect(vm!.taxSeasonTip.length).toBeGreaterThan(0);
      expect(
        vm!.spotlightCustomer === null ||
          typeof vm!.spotlightCustomer === "object",
      ).toBe(true);
    });
  });
});
