import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor, cleanup } from "@testing-library/react";

import { useCustomersPage } from "../../src/hooks/pages/useCustomersPage";
import { useAuth } from "@auth/useAuth";
import { useFirestore } from "@hooks/useFirestore";
import { toast } from "@contexts/toast";

vi.mock("@auth/useAuth");
vi.mock("@hooks/useFirestore");
vi.mock("../../src/firebase/config", () => ({ db: {}, auth: {} }));
vi.mock("@contexts/toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
    promise: vi.fn((p: Promise<unknown>) => p),
  },
}));

const toastMock = toast as unknown as { success: vi.Mock; error: vi.Mock };

const mockUseAuth = useAuth as vi.MockedFunction<typeof useAuth>;
const mockUseFirestore = useFirestore as vi.MockedFunction<typeof useFirestore>;

describe("useCustomersPage", () => {
  const add = vi.fn().mockResolvedValue(undefined);
  const update = vi.fn().mockResolvedValue(undefined);
  const remove = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { uid: "uid-1" },
      loading: false,
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
    } as unknown as ReturnType<typeof useAuth>);
    mockUseFirestore.mockReturnValue({
      items: [],
      loading: false,
      error: null,
      add,
      update,
      remove,
      set: vi.fn(),
      getById: vi.fn(),
      getOnce: vi.fn(),
    } as unknown as ReturnType<typeof useFirestore>);
  });

  afterEach(() => {
    cleanup();
  });

  it("exposes empty list state", async () => {
    let vm: ReturnType<typeof useCustomersPage> | null = null;
    const Comp = () => {
      vm = useCustomersPage();
      return null;
    };
    render(<Comp />);

    await waitFor(() => {
      expect(vm!.empty).toBe(true);
      expect(vm!.showCustomerList).toBe(true);
      expect(vm!.error).toBeNull();
    });
  });

  it("opens add modal with default title", async () => {
    let vm: ReturnType<typeof useCustomersPage> | null = null;
    const Comp = () => {
      vm = useCustomersPage();
      return null;
    };
    render(<Comp />);

    vm!.actions.openAdd();

    await waitFor(() => {
      expect(vm!.modal.open).toBe(true);
      expect(vm!.modal.title).toBe("Add Customer");
      expect(vm!.modal.initial).toBeUndefined();
    });
  });

  it("submits new customer via add", async () => {
    let vm: ReturnType<typeof useCustomersPage> | null = null;
    const Comp = () => {
      vm = useCustomersPage();
      return null;
    };
    render(<Comp />);

    vm!.actions.openAdd();
    await vm!.actions.submitCustomer({
      name: "New Co",
      email: "a@b.com",
      address: "Addr",
      showEmail: true,
    });

    await waitFor(() => {
      expect(add).toHaveBeenCalledWith({
        name: "New Co",
        email: "a@b.com",
        address: "Addr",
        userId: "uid-1",
        showEmail: true,
      });
      expect(vm!.modal.open).toBe(false);
    });
  });

  it("submits edit via update", async () => {
    mockUseFirestore.mockReturnValue({
      items: [
        {
          id: "c1",
          userId: "uid-1",
          name: "Acme",
          addressDisplay: "-",
        },
      ],
      loading: false,
      error: null,
      add,
      update,
      remove,
      set: vi.fn(),
      getById: vi.fn(),
      getOnce: vi.fn(),
    } as unknown as ReturnType<typeof useFirestore>);

    let vm: ReturnType<typeof useCustomersPage> | null = null;
    const Comp = () => {
      vm = useCustomersPage();
      return null;
    };
    render(<Comp />);

    await waitFor(() => expect(vm!.customers).toHaveLength(1));

    vm!.actions.openEdit(vm!.customers[0]!);
    await waitFor(() => expect(vm!.modal.title).toBe("Edit Customer"));
    await vm!.actions.submitCustomer({
      name: "Acme Updated",
      email: null,
      address: null,
      showEmail: true,
    });

    await waitFor(() => {
      expect(update).toHaveBeenCalledWith("c1", {
        name: "Acme Updated",
        email: null,
        address: null,
        showEmail: true,
      });
    });
  });

  it("toasts an error when save fails and leaves error (load) null", async () => {
    add.mockRejectedValueOnce(new Error("Network down"));

    let vm: ReturnType<typeof useCustomersPage> | null = null;
    const Comp = () => {
      vm = useCustomersPage();
      return null;
    };
    render(<Comp />);

    await vm!.actions.submitCustomer({
      name: "Acme",
      email: "a@b.com",
      address: "",
    });
    await waitFor(() =>
      expect(toastMock.error).toHaveBeenCalledWith("Network down"),
    );
    expect(vm!.error).toBeNull();
  });

  it("hides list when firestore error is set", async () => {
    mockUseFirestore.mockReturnValue({
      items: [],
      loading: false,
      error: "Failed to load",
      add,
      update,
      remove,
      set: vi.fn(),
      getById: vi.fn(),
      getOnce: vi.fn(),
    } as unknown as ReturnType<typeof useFirestore>);

    let vm: ReturnType<typeof useCustomersPage> | null = null;
    const Comp = () => {
      vm = useCustomersPage();
      return null;
    };
    render(<Comp />);

    await waitFor(() => {
      expect(vm!.error).toBe("Failed to load");
      expect(vm!.showCustomerList).toBe(false);
    });
  });
});
