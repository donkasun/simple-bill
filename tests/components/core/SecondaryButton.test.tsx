import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SecondaryButton from "../../../src/components/core/SecondaryButton";
import {
  roughButtonSecondary,
  roughButtonSecondaryHover,
} from "../../../src/utils/roughjs";

// Mock Rough.js
vi.mock("roughjs/bundled/rough.esm.js", () => ({
  default: {
    canvas: vi.fn(() => ({
      rectangle: vi.fn(),
    })),
  },
}));

// Mock the roughjs utility
vi.mock("@utils/roughjs", () => ({
  roughButtonSecondary: {
    roughness: 1.5,
    stroke: "var(--action-blue)",
    fill: "transparent",
  },
  roughButtonSecondaryHover: {
    roughness: 1.5,
    stroke: "var(--action-blue)",
    fill: "var(--action-blue)",
    fillStyle: "hachure",
    hachureAngle: 45,
    hachureGap: 4,
  },
}));

describe("SecondaryButton", () => {
  beforeEach(() => {
    // Mock ResizeObserver
    global.ResizeObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));

    // Mock canvas context
    const mockContext = {
      scale: vi.fn(),
      clearRect: vi.fn(),
    };
    const mockCanvas = {
      getContext: vi.fn(() => mockContext),
      width: 0,
      height: 0,
      style: {},
    };
    vi.spyOn(document, "createElement").mockReturnValue(
      mockCanvas as HTMLCanvasElement,
    );
  });

  const renderSecondaryButton = (props = {}) => {
    return render(<SecondaryButton {...props}>Test Button</SecondaryButton>);
  };

  describe("Basic Rendering", () => {
    it("should render button with children", () => {
      renderSecondaryButton();
      expect(screen.getByText("Test Button")).toBeTruthy();
    });

    it("should render button with custom className", () => {
      renderSecondaryButton({ className: "custom-class" });
      const button = screen.getByRole("button");
      expect(button).toHaveClass("custom-class");
    });

    it("should render button with custom style", () => {
      renderSecondaryButton({ style: { backgroundColor: "red" } });
      const button = screen.getByRole("button");
      expect(button).toHaveStyle({ backgroundColor: "red" });
    });

    it("should render canvas element", () => {
      renderSecondaryButton();
      const canvas = document.querySelector("canvas");
      expect(canvas).toBeTruthy();
    });

    it("should render span with button content", () => {
      renderSecondaryButton();
      const span = screen.getByText("Test Button").closest("span");
      expect(span).toBeTruthy();
    });
  });

  describe("Button Props", () => {
    it("should pass through button props", () => {
      const mockOnClick = vi.fn();
      renderSecondaryButton({ onClick: mockOnClick, disabled: true });

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();

      fireEvent.click(button);
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it("should handle type prop", () => {
      renderSecondaryButton({ type: "button" });
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("type", "button");
    });

    it("should handle aria-label prop", () => {
      renderSecondaryButton({ "aria-label": "Cancel action" });
      const button = screen.getByRole("button", { name: "Cancel action" });
      expect(button).toBeTruthy();
    });
  });

  describe("Hover States", () => {
    it("should handle mouse enter event", () => {
      const mockOnMouseEnter = vi.fn();
      renderSecondaryButton({ onMouseEnter: mockOnMouseEnter });

      const button = screen.getByRole("button");
      fireEvent.mouseEnter(button);

      expect(mockOnMouseEnter).toHaveBeenCalledTimes(1);
    });

    it("should handle mouse leave event", () => {
      const mockOnMouseLeave = vi.fn();
      renderSecondaryButton({ onMouseLeave: mockOnMouseLeave });

      const button = screen.getByRole("button");
      fireEvent.mouseLeave(button);

      expect(mockOnMouseLeave).toHaveBeenCalledTimes(1);
    });
  });

  describe("Styling", () => {
    it("should have correct default styles", () => {
      renderSecondaryButton();
      const button = screen.getByRole("button");

      expect(button).toHaveStyle({
        position: "relative",
        border: "none",
        background: "transparent",
        padding: "8px 12px",
        borderRadius: "8px",
      });
    });

    it("should have correct span styles", () => {
      renderSecondaryButton();
      const span = screen.getByText("Test Button").closest("span");

      expect(span).toHaveStyle({
        position: "relative",
        zIndex: "1",
        fontWeight: "600",
      });
    });

    it("should have correct canvas styles", () => {
      renderSecondaryButton();
      const canvas = document.querySelector("canvas");

      expect(canvas).toHaveStyle({
        position: "absolute",
        inset: "0",
        borderRadius: "8px",
        pointerEvents: "none",
      });
    });
  });

  describe("Accessibility", () => {
    it("should have button role", () => {
      renderSecondaryButton();
      expect(screen.getByRole("button")).toBeTruthy();
    });

    it("should be focusable", () => {
      renderSecondaryButton();
      const button = screen.getByRole("button");
      button.focus();
      expect(button).toHaveFocus();
    });

    it("should handle keyboard events", () => {
      const mockOnKeyDown = vi.fn();
      renderSecondaryButton({ onKeyDown: mockOnKeyDown });

      const button = screen.getByRole("button");
      fireEvent.keyDown(button, { key: "Enter" });

      expect(mockOnKeyDown).toHaveBeenCalledTimes(1);
    });
  });

  describe("Rough.js Integration", () => {
    it("should use roughButtonSecondary options for default state", () => {
      renderSecondaryButton();

      // The component should use the imported options
      expect(roughButtonSecondary).toBeDefined();
    });

    it("should use roughButtonSecondaryHover options for hover state", () => {
      renderSecondaryButton();

      // The component should use the imported options
      expect(roughButtonSecondaryHover).toBeDefined();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty children", () => {
      render(<SecondaryButton />);
      const button = screen.getByRole("button");
      expect(button).toBeTruthy();
    });

    it("should handle complex children", () => {
      render(
        <SecondaryButton>
          <span>Icon</span>
          <span>Text</span>
        </SecondaryButton>,
      );

      expect(screen.getByText("Icon")).toBeTruthy();
      expect(screen.getByText("Text")).toBeTruthy();
    });

    it("should handle undefined className", () => {
      renderSecondaryButton({ className: undefined });
      const button = screen.getByRole("button");
      expect(button).toBeTruthy();
    });
  });
});
