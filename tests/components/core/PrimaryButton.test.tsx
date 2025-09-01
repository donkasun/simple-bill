import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import PrimaryButton from "../../../src/components/core/PrimaryButton";

describe("PrimaryButton", () => {
  const renderPrimaryButton = (props = {}) => {
    return render(<PrimaryButton {...props}>Test Button</PrimaryButton>);
  };

  describe("Basic Rendering", () => {
    it("should render button with children", () => {
      renderPrimaryButton();
      expect(screen.getByText("Test Button")).toBeTruthy();
    });

    it("should render button with custom className", () => {
      renderPrimaryButton({ className: "custom-class" });
      const button = screen.getByRole("button");
      expect(button).toHaveClass("custom-class");
      expect(button).toHaveClass("btn-primary");
    });

    it("should render button with custom style", () => {
      renderPrimaryButton({ style: { backgroundColor: "red" } });
      const button = screen.getByRole("button");
      expect(button).toHaveStyle({ backgroundColor: "red" });
    });
  });

  describe("Button Props", () => {
    it("should pass through button props", () => {
      const mockOnClick = vi.fn();
      renderPrimaryButton({ onClick: mockOnClick });

      const button = screen.getByRole("button");
      expect(button).toBeTruthy();

      fireEvent.click(button);
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it("should handle disabled state", () => {
      const mockOnClick = vi.fn();
      renderPrimaryButton({ onClick: mockOnClick, disabled: true });

      const button = screen.getByRole("button");
      expect(button).toBeTruthy();

      // Disabled buttons should not call onClick
      fireEvent.click(button);
      expect(mockOnClick).toHaveBeenCalledTimes(0);
    });

    it("should handle type prop", () => {
      renderPrimaryButton({ type: "submit" });
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("type", "submit");
    });

    it("should handle aria-label prop", () => {
      renderPrimaryButton({ "aria-label": "Submit form" });
      const button = screen.getByRole("button", { name: "Submit form" });
      expect(button).toBeTruthy();
    });
  });

  describe("Hover States", () => {
    it("should handle mouse enter event", () => {
      const mockOnMouseEnter = vi.fn();
      renderPrimaryButton({ onMouseEnter: mockOnMouseEnter });

      const button = screen.getByRole("button");
      fireEvent.mouseEnter(button);

      expect(mockOnMouseEnter).toHaveBeenCalledTimes(1);
    });

    it("should handle mouse leave event", () => {
      const mockOnMouseLeave = vi.fn();
      renderPrimaryButton({ onMouseLeave: mockOnMouseLeave });

      const button = screen.getByRole("button");
      fireEvent.mouseLeave(button);

      expect(mockOnMouseLeave).toHaveBeenCalledTimes(1);
    });
  });

  describe("Styling", () => {
    it("should have correct default styles", () => {
      renderPrimaryButton();
      const button = screen.getByRole("button");

      expect(button).toHaveStyle({
        padding: "10px 20px",
        border: "none",
        borderRadius: "8px",
        fontSize: "1rem",
        fontWeight: "600",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        minHeight: "44px",
      });
    });
  });

  describe("Accessibility", () => {
    it("should have button role", () => {
      renderPrimaryButton();
      expect(screen.getByRole("button")).toBeTruthy();
    });

    it("should be focusable", () => {
      renderPrimaryButton();
      const button = screen.getByRole("button");
      button.focus();
      expect(button).toHaveFocus();
    });

    it("should handle keyboard events", () => {
      const mockOnKeyDown = vi.fn();
      renderPrimaryButton({ onKeyDown: mockOnKeyDown });

      const button = screen.getByRole("button");
      fireEvent.keyDown(button, { key: "Enter" });

      expect(mockOnKeyDown).toHaveBeenCalledTimes(1);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty children", () => {
      render(<PrimaryButton />);
      const button = screen.getByRole("button");
      expect(button).toBeTruthy();
    });

    it("should handle complex children", () => {
      render(
        <PrimaryButton>
          <span>Icon</span>
          <span>Text</span>
        </PrimaryButton>,
      );

      expect(screen.getByText("Icon")).toBeTruthy();
      expect(screen.getByText("Text")).toBeTruthy();
    });

    it("should handle undefined className", () => {
      renderPrimaryButton({ className: undefined });
      const button = screen.getByRole("button");
      expect(button).toBeTruthy();
    });
  });
});
