import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor, cleanup } from "@testing-library/react";
import { useSettingsPage } from "../../src/hooks/pages/useSettingsPage";
import { toast } from "@contexts/toast";

const updateUserProfile = vi.fn().mockResolvedValue(undefined);

vi.mock("@hooks/useUserProfile", () => ({
  default: () => ({
    profile: { currency: "USD" },
    loading: false,
    error: null,
    updateUserProfile,
  }),
}));
vi.mock("@hooks/useTheme", () => ({
  useTheme: () => ({
    theme: "system",
    resolvedTheme: "light",
    setTheme: vi.fn(),
  }),
}));
vi.mock("@contexts/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const toastMock = toast as unknown as { success: vi.Mock; error: vi.Mock };

function renderHook() {
  let vm: ReturnType<typeof useSettingsPage> | null = null;
  const Comp = () => {
    vm = useSettingsPage();
    return null;
  };
  render(<Comp />);
  return () => vm!;
}

describe("useSettingsPage", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it("toasts success after a currency change", async () => {
    const getVm = renderHook();
    await getVm().actions.setCurrency("LKR");
    await waitFor(() => {
      expect(updateUserProfile).toHaveBeenCalledWith({ currency: "LKR" });
      expect(toastMock.success).toHaveBeenCalled();
    });
  });

  it("toasts error when the currency update fails", async () => {
    updateUserProfile.mockRejectedValueOnce(new Error("save failed"));
    const getVm = renderHook();
    await getVm().actions.setCurrency("EUR");
    await waitFor(() => expect(toastMock.error).toHaveBeenCalled());
  });
});
