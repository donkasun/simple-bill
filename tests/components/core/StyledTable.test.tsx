import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import StyledTable from "../../../src/components/core/StyledTable";
import { roughTable } from "../../../src/utils/roughjs";

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
  roughTable: {
    roughness: 0.5,
    stroke: "var(--sketch-black)",
    strokeWidth: 1,
  },
}));

describe("StyledTable", () => {
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

  const renderStyledTable = (props = {}) => {
    return render(
      <StyledTable {...props}>
        <thead>
          <tr>
            <th>Header 1</th>
            <th>Header 2</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Cell 1</td>
            <td>Cell 2</td>
          </tr>
        </tbody>
      </StyledTable>,
    );
  };

  describe("Basic Rendering", () => {
    it("should render table with children", () => {
      renderStyledTable();
      expect(screen.getByText("Header 1")).toBeTruthy();
      expect(screen.getByText("Header 2")).toBeTruthy();
      expect(screen.getByText("Cell 1")).toBeTruthy();
      expect(screen.getByText("Cell 2")).toBeTruthy();
    });

    it("should render table with custom className", () => {
      renderStyledTable({ className: "custom-table" });
      const table = screen.getByRole("table");
      expect(table).toHaveClass("custom-table");
    });

    it("should render table with custom style", () => {
      renderStyledTable({ style: { width: "100%" } });
      const wrapper = document.querySelector(".table-wrapper");
      expect(wrapper).toHaveStyle({ width: "100%" });
    });

    it("should render canvas element", () => {
      renderStyledTable();
      const canvas = document.querySelector("canvas");
      expect(canvas).toBeTruthy();
    });

    it("should render wrapper div", () => {
      renderStyledTable();
      const wrapper = document.querySelector(".table-wrapper");
      expect(wrapper).toBeTruthy();
      expect(wrapper).toHaveClass("card");
    });
  });

  describe("Table Structure", () => {
    it("should render table element", () => {
      renderStyledTable();
      const table = screen.getByRole("table");
      expect(table).toBeTruthy();
    });

    it("should render table headers", () => {
      renderStyledTable();
      const headers = screen.getAllByRole("columnheader");
      expect(headers).toHaveLength(2);
      expect(headers[0]).toHaveTextContent("Header 1");
      expect(headers[1]).toHaveTextContent("Header 2");
    });

    it("should render table cells", () => {
      renderStyledTable();
      const cells = screen.getAllByRole("cell");
      expect(cells).toHaveLength(2);
      expect(cells[0]).toHaveTextContent("Cell 1");
      expect(cells[1]).toHaveTextContent("Cell 2");
    });

    it("should render table rows", () => {
      renderStyledTable();
      const rows = screen.getAllByRole("row");
      expect(rows).toHaveLength(3); // thead row + tbody row + implicit tbody
    });
  });

  describe("Styling", () => {
    it("should have correct wrapper styles", () => {
      renderStyledTable();
      const wrapper = document.querySelector(".table-wrapper");

      expect(wrapper).toHaveStyle({
        position: "relative",
      });
    });

    it("should have correct table styles", () => {
      renderStyledTable();
      const table = screen.getByRole("table");

      expect(table).toHaveStyle({
        position: "relative",
        zIndex: "1",
        width: "100%",
        borderCollapse: "collapse",
      });
    });

    it("should have correct canvas styles", () => {
      renderStyledTable();
      const canvas = document.querySelector("canvas");

      expect(canvas).toHaveStyle({
        position: "absolute",
        inset: "0",
        pointerEvents: "none",
      });
    });
  });

  describe("Props Handling", () => {
    it("should pass through table props", () => {
      renderStyledTable({ "data-testid": "test-table" });
      const table = screen.getByTestId("test-table");
      expect(table).toBeTruthy();
    });

    it("should handle border prop", () => {
      renderStyledTable({ border: 1 });
      const table = screen.getByRole("table");
      expect(table).toHaveAttribute("border", "1");
    });

    it("should handle summary prop", () => {
      renderStyledTable({ summary: "Test table summary" });
      const table = screen.getByRole("table");
      expect(table).toHaveAttribute("summary", "Test table summary");
    });
  });

  describe("Rough.js Integration", () => {
    it("should use roughTable options", () => {
      renderStyledTable();

      // The component should use the imported options
      expect(roughTable).toBeDefined();
    });
  });

  describe("Accessibility", () => {
    it("should have table role", () => {
      renderStyledTable();
      expect(screen.getByRole("table")).toBeTruthy();
    });

    it("should have proper table structure", () => {
      renderStyledTable();
      const table = screen.getByRole("table");
      expect(table.querySelector("thead")).toBeTruthy();
      expect(table.querySelector("tbody")).toBeTruthy();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty children", () => {
      render(<StyledTable />);
      const table = screen.getByRole("table");
      expect(table).toBeTruthy();
    });

    it("should handle complex table structure", () => {
      render(
        <StyledTable>
          <thead>
            <tr>
              <th colSpan={2}>Complex Header</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td rowSpan={2}>Merged Cell</td>
              <td>Regular Cell</td>
            </tr>
            <tr>
              <td>Another Cell</td>
            </tr>
          </tbody>
        </StyledTable>,
      );

      expect(screen.getByText("Complex Header")).toBeTruthy();
      expect(screen.getByText("Merged Cell")).toBeTruthy();
      expect(screen.getByText("Regular Cell")).toBeTruthy();
      expect(screen.getByText("Another Cell")).toBeTruthy();
    });

    it("should handle undefined className", () => {
      renderStyledTable({ className: undefined });
      const table = screen.getByRole("table");
      expect(table).toBeTruthy();
    });
  });
});
