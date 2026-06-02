export type TokenRow = {
  token: string;
  light: string;
  dark: string;
  use: string;
};

export type ThemeVariant = {
  pillBg: string;
  pillFg: string;
};

export type StatusSample = {
  label: string;
  light: ThemeVariant;
  dark: ThemeVariant;
};

export const PRIMARY_TOKENS: TokenRow[] = [
  {
    token: "--md-primary",
    light: "#0e5138",
    dark: "#5acea4",
    use: "Primary buttons, dark sidebar wordmark",
  },
  {
    token: "--md-primary-hover",
    light: "#002114",
    dark: "#4ab88f",
    use: "Primary hover",
  },
  {
    token: "--md-on-primary",
    light: "#ffffff",
    dark: "#002114",
    use: "Text on primary",
  },
  {
    token: "--md-primary-container",
    light: "#309860",
    dark: "#1e5d3b",
    use: "Paid bento, light sidebar wordmark",
  },
  {
    token: "--md-on-primary-container",
    light: "#002114",
    dark: "#95d4b3",
    use: "Text on primary container",
  },
  {
    token: "--brand-warning",
    light: "#f39c12",
    dark: "#f39c12",
    use: "Sent bento / row pills (dashboard)",
  },
  {
    token: "--brand-success",
    light: "#309860",
    dark: "#309860",
    use: "Paid border on documents list",
  },
  {
    token: "--brand-danger",
    light: "#ba1a1a",
    dark: "#ba1a1a",
    use: "Outstanding balance (spotlight)",
  },
];

export const SURFACE_TOKENS: TokenRow[] = [
  {
    token: "--md-surface",
    light: "#f8f9fa",
    dark: "#191c1d",
    use: "App / sidebar background",
  },
  {
    token: "--md-surface-container-lowest",
    light: "#ffffff",
    dark: "#141718",
    use: "Cards, document rows, settings sections",
  },
  {
    token: "--md-surface-container",
    light: "#edeeef",
    dark: "#232627",
    use: "Unselected settings tiles, row hover",
  },
  {
    token: "--md-surface-container-highest",
    light: "#e1e3e4",
    dark: "#333638",
    use: "Draft bento card",
  },
  {
    token: "--md-on-surface",
    light: "#191c1d",
    dark: "#e1e3e4",
    use: "Headings, body on surfaces",
  },
  {
    token: "--md-on-surface-variant",
    light: "#404943",
    dark: "#bfc9c1",
    use: "Subtitles, dates, helper text",
  },
  {
    token: "--md-outline-variant",
    light: "#bfc9c1",
    dark: "#3f4945",
    use: "Card borders",
  },
];

export const DASHBOARD_TOKENS: TokenRow[] = [
  {
    token: "--dashboard-headline-accent",
    light: "#309860",
    dark: "#5acea4",
    use: "Welcome title, row amounts",
  },
  {
    token: "--sidebar-nav-active-fg",
    light: "#309860",
    dark: "#5acea4",
    use: "Sidebar wordmark + active nav",
  },
  {
    token: "--settings-choice-selected-bg",
    light: "#5acea4",
    dark: "#5acea4",
    use: "Settings selected tile background",
  },
];

export const STATUS_SAMPLES: StatusSample[] = [
  {
    label: "Draft",
    light: { pillBg: "#e1e3e4", pillFg: "#404943" },
    dark: { pillBg: "#333638", pillFg: "#bfc9c1" },
  },
  {
    label: "Ready",
    // ── PROPOSED — adjust before implementing ──
    light: { pillBg: "#1d6fb5", pillFg: "#ffffff" },
    dark: { pillBg: "#5aa7e8", pillFg: "#0b2a44" },
  },
  {
    label: "Sent",
    light: { pillBg: "#f39c12", pillFg: "#191c1d" },
    dark: { pillBg: "#f39c12", pillFg: "#191c1d" },
  },
  {
    label: "Paid",
    light: { pillBg: "#309860", pillFg: "#ffffff" },
    dark: { pillBg: "#1e5d3b", pillFg: "#95d4b3" },
  },
];
