import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SecondaryButton from "../../../src/components/core/SecondaryButton";

describe("SecondaryButton", () => {
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
      expect(button).toHaveClass("btn-secondary");
    });

    it("should render button with custom style", () => {
      renderSecondaryButton({ style: { backgroundColor: "red" } });
      const button = screen.getByRole("button");
      expect(button).toHaveStyle({ backgroundColor: "red" });
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
        padding: "10px 20px",
        border: "1px solid var(--brand-border)",
        borderRadius: "8px",
        fontSize: "1rem",
        fontWeight: "600",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        minHeight: "44px",
        background: "var(--white)",
        color: "var(--brand-text-primary)",
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
