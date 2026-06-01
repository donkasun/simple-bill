// tests/components/core/ToastViewport.test.tsx
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  cleanup,
  act,
  fireEvent,
} from "@testing-library/react";
import ToastViewport from "../../../src/components/core/ToastViewport";
import { toast, toastStore } from "../../../src/contexts/toast/toastStore";

describe("ToastViewport", () => {
  beforeEach(() => toastStore.clearAll());
  afterEach(() => {
    cleanup();
    toastStore.clearAll();
  });

  it("renders nothing when there are no toasts", () => {
    render(<ToastViewport />);
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("renders live toasts from the store inside a labelled region", () => {
    render(<ToastViewport />);
    act(() => {
      toast.success("Saved");
    });
    expect(
      screen.getByRole("region", { name: /notifications/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Saved")).toBeInTheDocument();
  });

  it("removes a toast from the DOM when dismissed via the store", () => {
    render(<ToastViewport />);
    let id = "";
    act(() => {
      id = toast.info("Hello");
    });
    expect(screen.getByText("Hello")).toBeInTheDocument();
    act(() => {
      toast.dismiss(id);
    });
    expect(screen.queryByText("Hello")).not.toBeInTheDocument();
  });

  it("fires pause on mouseenter and resume on mouseleave with the toast id", () => {
    const pauseSpy = vi.spyOn(toastStore, "pause");
    const resumeSpy = vi.spyOn(toastStore, "resume");
    render(<ToastViewport />);
    let id = "";
    act(() => {
      id = toast.success("Hover me");
    });
    const toastEl = screen.getByRole("status");
    fireEvent.mouseEnter(toastEl);
    expect(pauseSpy).toHaveBeenCalledWith(id);
    fireEvent.mouseLeave(toastEl);
    expect(resumeSpy).toHaveBeenCalledWith(id);
    pauseSpy.mockRestore();
    resumeSpy.mockRestore();
  });
});
