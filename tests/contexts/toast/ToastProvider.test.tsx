// tests/contexts/toast/ToastProvider.test.tsx
import React from "react";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, act } from "@testing-library/react";
import { ToastProvider, toast } from "../../../src/contexts/toast";
import { toastStore } from "../../../src/contexts/toast/toastStore";

describe("ToastProvider", () => {
  beforeEach(() => toastStore.clearAll());
  afterEach(() => {
    cleanup();
    toastStore.clearAll();
  });

  it("renders children and portals toasts into the document", () => {
    render(
      <ToastProvider>
        <main>app content</main>
      </ToastProvider>,
    );
    expect(screen.getByText("app content")).toBeInTheDocument();
    act(() => {
      toast.success("Portaled");
    });
    expect(screen.getByText("Portaled")).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: /notifications/i }),
    ).toBeInTheDocument();
  });
});
