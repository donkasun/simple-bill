import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor, cleanup } from "@testing-library/react";

import { useItemsPage } from "../../src/hooks/pages/useItemsPage";
import { useAuth } from "@auth/useAuth";
import { useFirestore } from "@hooks/useFirestore";
import useUserProfile from "@hooks/useUserProfile";
import { formatCurrency } from "@utils/currency";
import { toast } from "@contexts/toast";

vi.mock("@auth/useAuth");
vi.mock("@hooks/useFirestore");
vi.mock("@hooks/useUserProfile", () => ({ default: vi.fn() }));
vi.mock("@utils/currency", () => ({ formatCurrency: vi.fn() }));
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
const mockUseUserProfile = useUserProfile as unknown as vi.MockedFunction<
  typeof useUserProfile
>;
const mockFormatCurrency = formatCurrency as unknown as vi.MockedFunction<
  typeof formatCurrency
>;

describe("useItemsPage", () => {
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
    mockUseUserProfile.mockReturnValue({
      profile: { userId: "uid-1", currency: "USD" } as unknown,
      loading: false,
      error: null,
      updateUserProfile: vi.fn(),
    } as unknown as ReturnType<typeof useUserProfile>);
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
    let vm: ReturnType<typeof useItemsPage> | null = null;
    const Comp = () => {
      vm = useItemsPage();
      return null;
    };
    render(<Comp />);

    await waitFor(() => {
      expect(vm!.empty).toBe(true);
      expect(vm!.showItemsTable).toBe(true);
      expect(vm!.error).toBeNull();
    });
  });

  it("opens add modal with default title", async () => {
    let vm: ReturnType<typeof useItemsPage> | null = null;
    const Comp = () => {
      vm = useItemsPage();
      return null;
    };
    render(<Comp />);

    vm!.actions.openAdd();

    await waitFor(() => {
      expect(vm!.modal.open).toBe(true);
      expect(vm!.modal.title).toBe("Add Item");
      expect(vm!.modal.initial).toBeUndefined();
    });
  });

  it("submits new item via add", async () => {
    let vm: ReturnType<typeof useItemsPage> | null = null;
    const Comp = () => {
      vm = useItemsPage();
      return null;
    };
    render(<Comp />);

    vm!.actions.openAdd();
    await vm!.actions.submitItem({
      name: "Service",
      unitPrice: 12,
      description: "Per hour",
    });

    await waitFor(() => {
      expect(add).toHaveBeenCalledWith({
        name: "Service",
        unitPrice: 12,
        description: "Per hour",
        userId: "uid-1",
      });
      expect(vm!.modal.open).toBe(false);
    });
  });

  it("submits edit via update", async () => {
    mockUseFirestore.mockReturnValue({
      items: [
        {
          id: "it-1",
          userId: "uid-1",
          name: "Service",
          unitPrice: 12,
          description: "Per hour",
          unitPriceLabel: "$12.00",
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

    let vm: ReturnType<typeof useItemsPage> | null = null;
    const Comp = () => {
      vm = useItemsPage();
      return null;
    };
    render(<Comp />);

    await waitFor(() => expect(vm!.items).toHaveLength(1));

    vm!.actions.openEdit(vm!.items[0]!);
    await waitFor(() => expect(vm!.modal.title).toBe("Edit Item"));
    await vm!.actions.submitItem({
      name: "Service updated",
      unitPrice: 15,
      description: "",
    });

    await waitFor(() => {
      expect(update).toHaveBeenCalledWith("it-1", {
        name: "Service updated",
        unitPrice: 15,
        description: "",
      });
    });
  });

  it("toasts an error when save fails and leaves error (load) null", async () => {
    add.mockRejectedValueOnce(new Error("Network down"));

    let vm: ReturnType<typeof useItemsPage> | null = null;
    const Comp = () => {
      vm = useItemsPage();
      return null;
    };
    render(<Comp />);

    await vm!.actions.submitItem({ name: "Widget", unitPrice: 10 });
    await waitFor(() =>
      expect(toastMock.error).toHaveBeenCalledWith("Network down"),
    );
    expect(vm!.error).toBeNull();
  });

  it("hides table when firestore error is set", async () => {
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

    let vm: ReturnType<typeof useItemsPage> | null = null;
    const Comp = () => {
      vm = useItemsPage();
      return null;
    };
    render(<Comp />);

    await waitFor(() => {
      expect(vm!.error).toBe("Failed to load");
      expect(vm!.showItemsTable).toBe(false);
    });
  });

  it("formats unitPriceLabel using profile currency with USD fallback", async () => {
    mockFormatCurrency.mockReturnValue("FMT");
    mockUseUserProfile.mockReturnValue({
      profile: { userId: "uid-1", currency: "EUR" } as unknown,
      loading: false,
      error: null,
      updateUserProfile: vi.fn(),
    } as unknown as ReturnType<typeof useUserProfile>);

    type MinimalItem = { unitPrice: number };
    type MinimalItemRow = MinimalItem & { unitPriceLabel: string };

    let selectFn: ((it: MinimalItem) => MinimalItemRow) | undefined;
    mockUseFirestore.mockImplementation(((args: {
      select: typeof selectFn;
    }) => {
      selectFn = args.select;
      return {
        items: [],
        loading: false,
        error: null,
        add,
        update,
        remove,
        set: vi.fn(),
        getById: vi.fn(),
        getOnce: vi.fn(),
      };
    }) as unknown as typeof useFirestore);

    let vm: ReturnType<typeof useItemsPage> | null = null;
    const Comp = () => {
      vm = useItemsPage();
      return null;
    };
    render(<Comp />);

    await waitFor(() => expect(vm).not.toBeNull());
    const out = selectFn?.({ unitPrice: 12 });
    expect(out?.unitPriceLabel).toBe("FMT");
    expect(mockFormatCurrency).toHaveBeenCalledWith(12, "EUR");
  });
});
