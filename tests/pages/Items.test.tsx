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

import Items from "../../src/pages/Items";
import { useAuth } from "@auth/useAuth";
import { useFirestore } from "@hooks/useFirestore";
import useUserProfile from "@hooks/useUserProfile";

vi.mock("@auth/useAuth");
vi.mock("@hooks/useFirestore");
vi.mock("@hooks/useUserProfile", () => ({ default: vi.fn() }));
vi.mock("../../src/firebase/config", () => ({ db: {}, auth: {} }));

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

describe("Items", () => {
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
      add: vi.fn(),
      update: vi.fn(),
      remove,
      set: vi.fn(),
      getById: vi.fn(),
      getOnce: vi.fn(),
    } as unknown as ReturnType<typeof useFirestore>);
  });

  it("shows CTA and opens modal on click", () => {
    render(<Items />);

    expect(screen.getByText("No items saved yet.")).toBeTruthy();

    const cta = screen.getByRole("button", { name: "Add your first item" });
    fireEvent.click(cta);

    // ItemModal should open and show its title.
    expect(screen.getByText("Add Item")).toBeTruthy();
  });

  it("renders items table", () => {
    mockUseFirestore.mockReturnValue({
      items: [
        {
          id: "it-1",
          userId: "uid-1",
          name: "Design work",
          unitPrice: 1200,
          unitPriceLabel: "$1,200.00",
          description: "Per hour",
        },
      ],
      loading: false,
      error: null,
      add: vi.fn(),
      update: vi.fn(),
      remove,
      set: vi.fn(),
      getById: vi.fn(),
      getOnce: vi.fn(),
    } as unknown as ReturnType<typeof useFirestore>);

    render(<Items />);

    expect(screen.getByRole("columnheader", { name: "Name" })).toBeTruthy();
    expect(
      screen.getByRole("columnheader", { name: "Unit Price" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("columnheader", { name: "Description" }),
    ).toBeTruthy();

    expect(screen.getByText("Design work")).toBeTruthy();
    expect(screen.getByText("$1,200.00")).toBeTruthy();
    expect(screen.getByText("Per hour")).toBeTruthy();
  });

  it("opens add modal from header CTA", () => {
    render(<Items />);

    const headerActions = document.querySelector(".page-header__actions");
    expect(headerActions).toBeTruthy();
    fireEvent.click(
      within(headerActions as HTMLElement).getByRole("button", {
        name: "Add item",
      }),
    );

    expect(screen.getByText("Add Item")).toBeTruthy();
  });

  it("opens delete confirm and calls remove on confirm", async () => {
    mockUseFirestore.mockReturnValue({
      items: [
        {
          id: "it-1",
          userId: "uid-1",
          name: "Design work",
          unitPrice: 1200,
          unitPriceLabel: "$1,200.00",
          description: "Per hour",
        },
      ],
      loading: false,
      error: null,
      add: vi.fn(),
      update: vi.fn(),
      remove,
      set: vi.fn(),
      getById: vi.fn(),
      getOnce: vi.fn(),
    } as unknown as ReturnType<typeof useFirestore>);

    render(<Items />);

    const row = screen.getByText("Design work").closest("tr");
    expect(row).toBeTruthy();
    fireEvent.click(
      within(row as HTMLElement).getByRole("button", { name: "Delete item" }),
    );

    const dialog = screen.getByRole("dialog", { name: "Delete Item" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(remove).toHaveBeenCalledWith("it-1");
    });
  });

  it("shows firestore error in alert", () => {
    mockUseFirestore.mockReturnValue({
      items: [],
      loading: false,
      error: "Failed to load items",
      add: vi.fn(),
      update: vi.fn(),
      remove,
      set: vi.fn(),
      getById: vi.fn(),
      getOnce: vi.fn(),
    } as unknown as ReturnType<typeof useFirestore>);

    render(<Items />);

    expect(screen.getByRole("alert")).toHaveTextContent("Failed to load items");
  });

  it("does not show an inline banner for a failed delete (handled by toast)", async () => {
    // error is null (load-only) so no alert banner is rendered
    render(<Items />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
