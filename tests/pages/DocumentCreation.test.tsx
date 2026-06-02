import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";

import DocumentCreation from "../../src/pages/DocumentCreation";
import { useAuth } from "@auth/useAuth";
import { useFirestore } from "@hooks/useFirestore";
import useUserProfile from "@hooks/useUserProfile";

vi.mock("@auth/useAuth");
vi.mock("@hooks/useFirestore");
vi.mock("@hooks/useUserProfile", () => ({ default: vi.fn() }));
vi.mock("../../src/firebase/config", () => ({ db: {}, auth: {} }));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});
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

let capturedDismiss: undefined | (() => void);
vi.mock("@components/core/OnboardingStepper", () => ({
  default: ({ onDismissForever }: { onDismissForever?: () => void }) => {
    capturedDismiss = onDismissForever;
    return (
      <button type="button" data-has-dismiss={String(!!onDismissForever)}>
        DismissGuide
      </button>
    );
  },
}));

const mockUseAuth = useAuth as vi.MockedFunction<typeof useAuth>;
const mockUseFirestore = useFirestore as vi.MockedFunction<typeof useFirestore>;
const mockUseUserProfile = useUserProfile as unknown as vi.MockedFunction<
  typeof useUserProfile
>;

type MockUser = { uid: string };
type MockAuthReturn = {
  user: MockUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void> | void;
  signOut: () => Promise<void> | void;
};

// Mock firestore query helpers used by the onboarding gate (first-run check)
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
    getDocs: vi.fn(),
  };
});

describe("DocumentCreation onboarding", () => {
  let updateUserProfileSpy: ReturnType<typeof vi.fn>;

  afterEach(() => {
    cleanup();
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    updateUserProfileSpy = vi.fn().mockResolvedValue(undefined);
    expect(vi.isMockFunction(useUserProfile)).toBe(true);
    const authValue: MockAuthReturn = {
      user: { uid: "uid-1" },
      loading: false,
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
    };
    mockUseAuth.mockReturnValue(
      authValue as unknown as ReturnType<typeof useAuth>,
    );

    const addDocument = vi.fn().mockResolvedValue("new-doc-id");
    mockUseFirestore.mockImplementation((opts: unknown) => {
      const collectionName =
        typeof opts === "object" && opts && "collectionName" in opts
          ? (opts as { collectionName?: string }).collectionName
          : undefined;

      if (collectionName === "documents") {
        return {
          items: [],
          loading: false,
          error: null,
          add: addDocument,
          update: vi.fn(),
          remove: vi.fn(),
          set: vi.fn(),
          getById: vi.fn(),
          getOnce: vi.fn(),
        } as unknown as ReturnType<typeof useFirestore>;
      }
      // customers/items collections
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
    });

    mockUseUserProfile.mockReturnValue({
      profile: { userId: "uid-1", currency: "USD", onboarding: {} } as unknown,
      loading: false,
      error: null,
      updateUserProfile: updateUserProfileSpy,
    } as unknown as ReturnType<typeof useUserProfile>);

    const { getDocs } = await import("firebase/firestore");
    (getDocs as unknown as vi.Mock).mockResolvedValue({ docs: [] }); // no documents
  });

  it("shows first-invoice guide when user has no documents and not dismissed", async () => {
    render(
      <BrowserRouter>
        <DocumentCreation />
      </BrowserRouter>,
    );

    expect(
      await screen.findByRole("button", { name: "DismissGuide" }),
    ).toBeTruthy();
  });

  it("dismisses guide and persists via updateUserProfile", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    render(
      <BrowserRouter>
        <DocumentCreation />
      </BrowserRouter>,
    );

    const dismiss = await screen.findByRole("button", { name: "DismissGuide" });
    expect(dismiss.getAttribute("data-has-dismiss")).toBe("true");
    expect(typeof capturedDismiss).toBe("function");
    capturedDismiss?.();
    await waitFor(() => {
      expect(updateUserProfileSpy).toHaveBeenCalledWith({
        onboarding: { createInvoiceDismissed: true },
      });
    });
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

describe("DocumentCreation actions", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(async () => {
    vi.clearAllMocks();

    mockUseAuth.mockReturnValue({
      user: { uid: "uid-1" },
      loading: false,
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
    } as unknown as ReturnType<typeof useAuth>);

    const addDocument = vi.fn().mockResolvedValue("new-doc-id");
    mockUseFirestore.mockImplementation((opts: unknown) => {
      const collectionName =
        typeof opts === "object" && opts && "collectionName" in opts
          ? (opts as { collectionName?: string }).collectionName
          : undefined;
      if (collectionName === "documents") {
        return {
          items: [],
          loading: false,
          error: null,
          add: addDocument,
          update: vi.fn(),
          remove: vi.fn(),
          set: vi.fn(),
          getById: vi.fn(),
          getOnce: vi.fn(),
        } as unknown as ReturnType<typeof useFirestore>;
      }
      return {
        items: [{ id: "c1", name: "Acme", userId: "uid-1" }],
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

    mockUseUserProfile.mockReturnValue({
      profile: { userId: "uid-1", currency: "USD", onboarding: {} } as unknown,
      loading: false,
      error: null,
      updateUserProfile: vi.fn(),
    } as unknown as ReturnType<typeof useUserProfile>);

    const { getDocs } = await import("firebase/firestore");
    (getDocs as unknown as vi.Mock).mockResolvedValue({
      docs: [{ id: "prev" }],
    });
  });

  it("save draft navigates to the edit page for the new doc", async () => {
    render(
      <BrowserRouter>
        <DocumentCreation />
      </BrowserRouter>,
    );

    await screen.findByRole("button", { name: "Save draft" });

    // Save draft is disabled until the user makes a change
    const notes = screen.getByPlaceholderText(
      "Additional notes for the customer",
    );
    fireEvent.change(notes, { target: { value: "Test note" } });

    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        "/documents/new-doc-id/edit",
        expect.objectContaining({ state: { autoEdit: true } }),
      );
    });
  });
});
