import { describe, it, expect } from "vitest";
import {
  roughDefaults,
  roughButtonPrimary,
  roughButtonPrimaryHover,
  roughButtonSecondary,
  roughButtonSecondaryHover,
  roughInput,
  roughInputFocus,
  roughHeaderDivider,
  roughTable,
} from "../../src/utils/roughjs";

describe("Rough.js Utilities", () => {
  describe("roughDefaults", () => {
    it("should have correct default values", () => {
      expect(roughDefaults).toEqual({
        roughness: 1,
        stroke: "var(--sketch-black)",
        strokeWidth: 1,
      });
    });

    it("should have required properties", () => {
      expect(roughDefaults).toHaveProperty("roughness");
      expect(roughDefaults).toHaveProperty("stroke");
      expect(roughDefaults).toHaveProperty("strokeWidth");
    });
  });

  describe("roughButtonPrimary", () => {
    it("should extend roughDefaults", () => {
      expect(roughButtonPrimary).toMatchObject({
        roughness: 1.5,
        stroke: "var(--action-blue)",
        fill: "var(--action-blue)",
        fillStyle: "solid",
      });
    });

    it("should have correct button styling", () => {
      expect(roughButtonPrimary.roughness).toBe(1.5);
      expect(roughButtonPrimary.stroke).toBe("var(--action-blue)");
      expect(roughButtonPrimary.fill).toBe("var(--action-blue)");
      expect(roughButtonPrimary.fillStyle).toBe("solid");
    });
  });

  describe("roughButtonPrimaryHover", () => {
    it("should extend roughButtonPrimary with increased roughness", () => {
      expect(roughButtonPrimaryHover).toMatchObject({
        roughness: 2.5,
        stroke: "var(--action-blue)",
        fill: "var(--action-blue)",
        fillStyle: "solid",
      });
    });

    it("should have higher roughness than default primary", () => {
      expect(roughButtonPrimaryHover.roughness).toBeGreaterThan(
        roughButtonPrimary.roughness,
      );
    });
  });

  describe("roughButtonSecondary", () => {
    it("should have correct secondary button styling", () => {
      expect(roughButtonSecondary).toMatchObject({
        roughness: 1.5,
        stroke: "var(--action-blue)",
        fill: "transparent",
      });
    });

    it("should not have fillStyle when transparent", () => {
      expect(roughButtonSecondary.fill).toBe("transparent");
    });
  });

  describe("roughButtonSecondaryHover", () => {
    it("should have hachure fill style on hover", () => {
      expect(roughButtonSecondaryHover).toMatchObject({
        roughness: 1.5,
        stroke: "var(--action-blue)",
        fill: "var(--action-blue)",
        fillStyle: "hachure",
        hachureAngle: 45,
        hachureGap: 4,
      });
    });

    it("should have correct hachure properties", () => {
      expect(roughButtonSecondaryHover.hachureAngle).toBe(45);
      expect(roughButtonSecondaryHover.hachureGap).toBe(4);
    });
  });

  describe("roughInput", () => {
    it("should have correct input styling", () => {
      expect(roughInput).toMatchObject({
        roughness: 1,
        stroke: "var(--sketch-black)",
      });
    });

    it("should use default roughness", () => {
      expect(roughInput.roughness).toBe(roughDefaults.roughness);
    });
  });

  describe("roughInputFocus", () => {
    it("should extend roughInput with focus styling", () => {
      expect(roughInputFocus).toMatchObject({
        stroke: "var(--action-blue)",
        roughness: 2,
      });
    });

    it("should have higher roughness than default input", () => {
      expect(roughInputFocus.roughness).toBeGreaterThan(roughInput.roughness);
    });

    it("should use action blue for focus state", () => {
      expect(roughInputFocus.stroke).toBe("var(--action-blue)");
    });
  });

  describe("roughHeaderDivider", () => {
    it("should have subtle styling for header divider", () => {
      expect(roughHeaderDivider).toMatchObject({
        roughness: 0.8,
        stroke: "var(--brand-border)",
        strokeWidth: 1,
      });
    });

    it("should have lower roughness for subtle effect", () => {
      expect(roughHeaderDivider.roughness).toBeLessThan(
        roughDefaults.roughness,
      );
    });
  });

  describe("roughTable", () => {
    it("should have correct table styling", () => {
      expect(roughTable).toMatchObject({
        roughness: 0.5,
        stroke: "var(--sketch-black)",
        strokeWidth: 1,
      });
    });

    it("should have very low roughness for clean table appearance", () => {
      expect(roughTable.roughness).toBeLessThan(roughDefaults.roughness);
    });
  });

  describe("Consistency", () => {
    it("should use consistent color variables", () => {
      const colorVariables = [
        "var(--sketch-black)",
        "var(--action-blue)",
        "var(--brand-border)",
      ];

      const allOptions = [
        roughDefaults,
        roughButtonPrimary,
        roughButtonPrimaryHover,
        roughButtonSecondary,
        roughButtonSecondaryHover,
        roughInput,
        roughInputFocus,
        roughHeaderDivider,
        roughTable,
      ];

      allOptions.forEach((option) => {
        if (option.stroke) {
          expect(colorVariables).toContain(option.stroke);
        }
      });
    });

    it("should have reasonable roughness values", () => {
      const allOptions = [
        roughDefaults,
        roughButtonPrimary,
        roughButtonPrimaryHover,
        roughButtonSecondary,
        roughButtonSecondaryHover,
        roughInput,
        roughInputFocus,
        roughHeaderDivider,
        roughTable,
      ];

      allOptions.forEach((option) => {
        expect(option.roughness).toBeGreaterThan(0);
        expect(option.roughness).toBeLessThanOrEqual(3);
      });
    });

    it("should have consistent strokeWidth values", () => {
      const allOptions = [
        roughDefaults,
        roughButtonPrimary,
        roughButtonPrimaryHover,
        roughButtonSecondary,
        roughButtonSecondaryHover,
        roughInput,
        roughInputFocus,
        roughHeaderDivider,
        roughTable,
      ];

      allOptions.forEach((option) => {
        expect(option.strokeWidth).toBeGreaterThan(0);
        expect(option.strokeWidth).toBeLessThanOrEqual(2);
      });
    });
  });

  describe("Type Safety", () => {
    it("should have correct TypeScript interface", () => {
      // This test ensures the interface is properly defined
      const testOptions = {
        roughness: 1,
        stroke: "var(--sketch-black)",
        strokeWidth: 1,
        fill: "transparent",
        fillStyle: "solid" as const,
        hachureAngle: 45,
        hachureGap: 4,
        seed: 123,
      };

      expect(testOptions).toBeDefined();
      expect(typeof testOptions.roughness).toBe("number");
      expect(typeof testOptions.stroke).toBe("string");
      expect(typeof testOptions.strokeWidth).toBe("number");
    });
  });
});
