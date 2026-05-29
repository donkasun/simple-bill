import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  within,
  waitFor,
  cleanup,
} from "@testing-library/react";

import Customers from "../../src/pages/Customers";
import { useAuth } from "@auth/useAuth";
import { useFirestore } from "@hooks/useFirestore";

vi.mock("@auth/useAuth");
vi.mock("@hooks/useFirestore");
vi.mock("../../src/firebase/config", () => ({ db: {}, auth: {} }));

const mockUseAuth = useAuth as vi.MockedFunction<typeof useAuth>;
const mockUseFirestore = useFirestore as vi.MockedFunction<typeof useFirestore>;

type MockUser = { uid: string };
type MockAuthReturn = {
  user: MockUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void> | void;
  signOut: () => Promise<void> | void;
};

const mockCustomer = {
  id: "cust-1",
  userId: "uid-1",
  name: "Acme Corp",
  address: "Colombo",
  addressDisplay: "Colombo",
};

describe("Customers page", () => {
  const remove = vi.fn().mockResolvedValue(undefined);

  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    const authValue: MockAuthReturn = {
      user: { uid: "uid-1" },
      loading: false,
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
    };
    mockUseAuth.mockReturnValue(
      authValue as unknown as ReturnType<typeof useAuth>,
    );
    mockUseFirestore.mockReturnValue({
      items: [mockCustomer],
      loading: false,
      error: null,
      add: vi.fn(),
      update: vi.fn(),
      remove,
      set: vi.fn(),
      getById: vi.fn(),
      getOnce: vi.fn(),
    } as unknown as ReturnType<typeof useFirestore>);
  });

  it("renders customer list", () => {
    render(<Customers />);

    expect(screen.getByRole("heading", { name: "Customers" })).toBeTruthy();
    expect(screen.getByText("Acme Corp")).toBeTruthy();
    expect(screen.getByText("Colombo")).toBeTruthy();
  });

  it("opens add modal from header CTA", () => {
    render(<Customers />);

    const headerActions = document.querySelector(".page-header__actions");
    expect(headerActions).toBeTruthy();
    fireEvent.click(
      within(headerActions as HTMLElement).getByRole("button", {
        name: "Add customer",
      }),
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "Add Customer" }),
    ).toBeTruthy();
  });

  it("opens delete confirm and calls remove on confirm", async () => {
    render(<Customers />);

    const row = screen.getAllByText("Acme Corp")[0]!.closest("div")
      ?.parentElement?.parentElement;
    expect(row).toBeTruthy();
    fireEvent.click(
      within(row as HTMLElement).getByRole("button", {
        name: "Delete customer",
      }),
    );

    const dialog = screen.getByRole("dialog", { name: "Delete Customer" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(remove).toHaveBeenCalledWith("cust-1");
    });
  });

  it("shows empty state CTA and opens modal", () => {
    mockUseFirestore.mockReturnValue({
      items: [],
      loading: false,
      error: null,
      add: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      set: vi.fn(),
      getById: vi.fn(),
      getOnce: vi.fn(),
    } as unknown as ReturnType<typeof useFirestore>);

    render(<Customers />);

    expect(screen.getByText("Grow your list")).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Add your first customer" }),
    );
    expect(
      screen.getByRole("heading", { level: 2, name: "Add Customer" }),
    ).toBeTruthy();
  });
});
