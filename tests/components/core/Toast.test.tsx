// tests/components/core/Toast.test.tsx
import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Toast from "../../../src/components/core/Toast";
import type { Toast as ToastModel } from "../../../src/contexts/toast/types";

const base: ToastModel = {
  id: "t1",
  variant: "success",
  message: "Saved",
  duration: 4000,
  createdAt: 0,
};

describe("Toast", () => {
  afterEach(() => cleanup());

  it("renders the message", () => {
    render(<Toast toast={base} onDismiss={() => {}} />);
    expect(screen.getByText("Saved")).toBeInTheDocument();
  });

  it("uses role=alert for errors and role=status otherwise", () => {
    const { rerender } = render(
      <Toast toast={{ ...base, variant: "error" }} onDismiss={() => {}} />,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    rerender(<Toast toast={base} onDismiss={() => {}} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("calls onDismiss with the id when the dismiss button is clicked", async () => {
    const onDismiss = vi.fn();
    render(<Toast toast={base} onDismiss={onDismiss} />);
    await userEvent.click(
      screen.getByRole("button", { name: /dismiss notification/i }),
    );
    expect(onDismiss).toHaveBeenCalledWith("t1");
  });

  it("does not render a dismiss button for loading toasts", () => {
    render(
      <Toast
        toast={{ ...base, variant: "loading", duration: null }}
        onDismiss={() => {}}
      />,
    );
    expect(
      screen.queryByRole("button", { name: /dismiss notification/i }),
    ).not.toBeInTheDocument();
  });
});
