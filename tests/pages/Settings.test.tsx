import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Settings from "../../src/pages/Settings";
import useUserProfile from "@hooks/useUserProfile";

vi.mock("@hooks/useUserProfile");
vi.mock("../../src/firebase/config", () => ({ db: {}, auth: {} }));
vi.mock("@hooks/useTheme", () => ({
  useTheme: () => ({
    theme: "system",
    setTheme: vi.fn(),
    resolvedTheme: "light",
  }),
}));

const mockUseUserProfile = useUserProfile as vi.MockedFunction<
  typeof useUserProfile
>;

describe("Settings", () => {
  const updateUserProfile = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseUserProfile.mockReturnValue({
      profile: { userId: "u1", currency: "USD", onboarding: {} },
      loading: false,
      error: null,
      updateUserProfile,
    } as unknown as ReturnType<typeof useUserProfile>);
  });

  afterEach(() => {
    cleanup();
  });

  it("renders currency and theme controls", () => {
    render(
      <BrowserRouter>
        <Settings />
      </BrowserRouter>,
    );

    expect(screen.getByLabelText(/global currency/i)).toBeTruthy();
    expect(screen.getByLabelText(/^theme:/i)).toBeTruthy();
    expect(screen.getByDisplayValue("USD")).toBeTruthy();
  });

  it("calls updateUserProfile when currency changes", () => {
    render(
      <BrowserRouter>
        <Settings />
      </BrowserRouter>,
    );

    fireEvent.change(screen.getByLabelText(/global currency/i), {
      target: { value: "LKR" },
    });

    expect(updateUserProfile).toHaveBeenCalledWith({ currency: "LKR" });
  });
});
