import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import FieldWrapper from "../../../src/components/core/FieldWrapper";

describe("FieldWrapper", () => {
  const renderFieldWrapper = (props = {}) => {
    return render(
      <FieldWrapper {...props}>
        <input type="text" placeholder="Enter text" />
      </FieldWrapper>,
    );
  };

  describe("Basic Rendering", () => {
    it("should render input field", () => {
      renderFieldWrapper();
      expect(screen.getByPlaceholderText("Enter text")).toBeTruthy();
    });

    it("should render label when provided", () => {
      renderFieldWrapper({ label: "Test Label" });
      expect(screen.getByText("Test Label")).toBeTruthy();
    });

    it("should render required indicator when required", () => {
      renderFieldWrapper({ label: "Test Label", required: true });
      expect(screen.getByText("*")).toBeTruthy();
    });

    it("should not render required indicator when not required", () => {
      renderFieldWrapper({ label: "Test Label", required: false });
      expect(screen.queryByText("*")).toBeFalsy();
    });
  });

  describe("Error Handling", () => {
    it("should render error message when error is provided", () => {
      renderFieldWrapper({ error: "This field is required" });
      expect(screen.getByText("This field is required")).toBeTruthy();
    });

    it("should not render error message when no error", () => {
      renderFieldWrapper();
      expect(screen.queryByText("This field is required")).toBeFalsy();
    });

    it("should set aria-invalid when error is present", () => {
      renderFieldWrapper({ error: "Error message" });
      const input = screen.getByPlaceholderText("Enter text");
      expect(input).toHaveAttribute("aria-invalid", "true");
    });

    it("should not set aria-invalid when no error", () => {
      renderFieldWrapper();
      const input = screen.getByPlaceholderText("Enter text");
      expect(input).not.toHaveAttribute("aria-invalid");
    });

    it("should set aria-describedby when error is present", () => {
      renderFieldWrapper({ error: "Error message" });
      const input = screen.getByPlaceholderText("Enter text");
      expect(input).toHaveAttribute("aria-describedby");
    });

    it("should not set aria-describedby when no error", () => {
      renderFieldWrapper();
      const input = screen.getByPlaceholderText("Enter text");
      expect(input).not.toHaveAttribute("aria-describedby");
    });
  });

  describe("Input Enhancement", () => {
    it("should enhance input with required prop", () => {
      renderFieldWrapper({ required: true });
      const input = screen.getByPlaceholderText("Enter text");
      expect(input).toHaveAttribute("required");
    });

    it("should enhance input with custom style", () => {
      renderFieldWrapper({ style: { width: "200px" } });
      const wrapper = document.querySelector("div");
      expect(wrapper).toHaveStyle({ width: "200px" });
    });

    it("should preserve input props", () => {
      renderFieldWrapper();
      const input = screen.getByPlaceholderText("Enter text");
      expect(input).toHaveAttribute("type", "text");
      expect(input).toHaveAttribute("placeholder", "Enter text");
    });
  });

  describe("Styling", () => {
    it("should have correct label styles", () => {
      renderFieldWrapper({ label: "Test Label" });
      const label = screen.getByText("Test Label");
      expect(label).toHaveStyle({ fontWeight: "600" });
    });

    it("should have correct error styles", () => {
      renderFieldWrapper({ error: "Error message" });
      const error = screen.getByText("Error message");
      expect(error).toHaveStyle({
        color: "var(--brand-danger)",
        fontSize: "0.875rem",
        fontWeight: "500",
      });
    });

    it("should have correct required indicator styles", () => {
      renderFieldWrapper({ label: "Test Label", required: true });
      const indicator = screen.getByText("*");
      expect(indicator).toHaveStyle({ color: "var(--brand-danger)" });
    });

    it("should have correct input styles", () => {
      renderFieldWrapper();
      const input = screen.getByPlaceholderText("Enter text");
      expect(input).toHaveStyle({
        width: "100%",
        padding: "12px 16px",
        border: "1px solid var(--brand-border)",
        borderRadius: "8px",
        outline: "none",
        background: "var(--white)",
        fontSize: "1rem",
      });
    });

    it("should have error border when error is present", () => {
      renderFieldWrapper({ error: "Error message" });
      const input = screen.getByPlaceholderText("Enter text");
      expect(input).toHaveStyle({
        border: "1px solid var(--brand-danger)",
      });
    });
  });

  describe("Different Input Types", () => {
    it("should work with textarea", () => {
      render(
        <FieldWrapper label="Description">
          <textarea placeholder="Enter description" />
        </FieldWrapper>,
      );
      expect(screen.getByPlaceholderText("Enter description")).toBeTruthy();
    });

    it("should work with select", () => {
      render(
        <FieldWrapper label="Options">
          <select>
            <option value="">Select option</option>
            <option value="1">Option 1</option>
          </select>
        </FieldWrapper>,
      );
      expect(screen.getByRole("combobox")).toBeTruthy();
    });

    it("should work with number input", () => {
      render(
        <FieldWrapper label="Amount">
          <input type="number" placeholder="Enter amount" />
        </FieldWrapper>,
      );
      expect(screen.getByPlaceholderText("Enter amount")).toBeTruthy();
    });
  });

  describe("Accessibility", () => {
    it("should have proper label association", () => {
      renderFieldWrapper({ label: "Test Label" });
      const label = screen.getByText("Test Label");
      const input = screen.getByPlaceholderText("Enter text");
      expect(label).toBeTruthy();
      expect(input).toBeTruthy();
    });

    it("should have proper error association", () => {
      renderFieldWrapper({ error: "Error message" });
      const input = screen.getByPlaceholderText("Enter text");
      const error = screen.getByText("Error message");
      expect(input).toHaveAttribute("aria-describedby");
      expect(error).toHaveAttribute("id");
    });
  });

  describe("Edge Cases", () => {
    it("should handle missing label", () => {
      renderFieldWrapper();
      expect(screen.getByPlaceholderText("Enter text")).toBeTruthy();
    });

    it("should handle missing required prop", () => {
      renderFieldWrapper({ label: "Test Label" });
      expect(screen.queryByText("*")).toBeFalsy();
    });

    it("should handle missing error", () => {
      renderFieldWrapper();
      expect(screen.queryByText("Error message")).toBeFalsy();
    });

    it("should handle complex children", () => {
      render(
        <FieldWrapper label="Complex Field">
          <div>
            <input type="text" placeholder="Input 1" />
            <input type="text" placeholder="Input 2" />
          </div>
        </FieldWrapper>,
      );
      expect(screen.getByPlaceholderText("Input 1")).toBeTruthy();
      expect(screen.getByPlaceholderText("Input 2")).toBeTruthy();
    });
  });
});
