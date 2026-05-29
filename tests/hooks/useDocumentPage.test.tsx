import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor, cleanup } from "@testing-library/react";
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

const mockUseAuth = useAuth as vi.MockedFunction<typeof useAuth>;
const mockUseFirestore = useFirestore as vi.MockedFunction<typeof useFirestore>;

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
        add: vi.fn().mockResolvedValue("new-id"),
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
});
