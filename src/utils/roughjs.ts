export interface RoughOptions {
  roughness: number;
  stroke: string;
  strokeWidth: number;
  fill?: string;
  fillStyle?:
    | "solid"
    | "hachure"
    | "zigzag"
    | "cross-hatch"
    | "dots"
    | "dashed"
    | "zigzag-line";
  hachureAngle?: number;
  hachureGap?: number;
  seed?: number;
}

export const roughDefaults: RoughOptions = {
  roughness: 1,
  stroke: "var(--sketch-black)",
  strokeWidth: 1,
};

export const roughButtonPrimary: RoughOptions = {
  ...roughDefaults,
  roughness: 1.5,
  stroke: "var(--action-blue)",
  fill: "var(--action-blue)",
  fillStyle: "solid",
};

export const roughButtonPrimaryHover: RoughOptions = {
  ...roughButtonPrimary,
  roughness: 2.5,
};

export const roughButtonSecondary: RoughOptions = {
  ...roughDefaults,
  roughness: 1.5,
  stroke: "var(--action-blue)",
  fill: "transparent",
};

export const roughButtonSecondaryHover: RoughOptions = {
  ...roughButtonSecondary,
  fill: "var(--action-blue)",
  fillStyle: "hachure",
  hachureAngle: 45,
  hachureGap: 4,
};

export const roughInput: RoughOptions = {
  ...roughDefaults,
  roughness: 1,
  stroke: "var(--sketch-black)",
};

export const roughInputFocus: RoughOptions = {
  ...roughInput,
  stroke: "var(--action-blue)",
  roughness: 2,
};

export const roughHeaderDivider: RoughOptions = {
  ...roughDefaults,
  roughness: 0.8,
  stroke: "var(--brand-border)",
  strokeWidth: 1,
};

export const roughTable: RoughOptions = {
  ...roughDefaults,
  roughness: 0.5,
  stroke: "var(--sketch-black)",
  strokeWidth: 1,
};
