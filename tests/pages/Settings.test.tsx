import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Settings from "../../src/pages/Settings";
import useUserProfile from "@hooks/useUserProfile";

vi.mock("@hooks/useUserProfile");
vi.mock("../../src/firebase/config", () => ({ db: {}, auth: {} }));
const mockSetTheme = vi.fn();
vi.mock("@hooks/useTheme", () => ({
  useTheme: () => ({
    theme: "system",
    setTheme: mockSetTheme,
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

  it("renders currency and appearance controls", () => {
    render(
      <BrowserRouter>
        <Settings />
      </BrowserRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /default currency/i }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: /appearance/i })).toBeTruthy();
    expect(screen.getByRole("radio", { name: /us dollar/i })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("radio", { name: /^light$/i })).toBeTruthy();
    expect(
      screen.getByRole("radio", { name: /match device/i }),
    ).toHaveAttribute("aria-checked", "true");
    expect(document.querySelector(".settings-theme-picker")).toBeTruthy();
  });

  it("calls updateUserProfile when currency changes", () => {
    render(
      <BrowserRouter>
        <Settings />
      </BrowserRouter>,
    );

    fireEvent.click(screen.getByRole("radio", { name: /sri lankan rupee/i }));

    expect(updateUserProfile).toHaveBeenCalledWith({ currency: "LKR" });
  });

  it("calls setTheme when appearance changes", () => {
    render(
      <BrowserRouter>
        <Settings />
      </BrowserRouter>,
    );

    fireEvent.click(screen.getByRole("radio", { name: /^dark$/i }));

    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });
});
