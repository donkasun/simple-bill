import React from "react";

type ErrorBannerProps = {
  children?: React.ReactNode;
  message?: string;
  variant?: "error" | "warning" | "info";
  style?: React.CSSProperties;
};

const palette: Record<NonNullable<ErrorBannerProps["variant"]>, { color: string; background: string; border: string }> = {
  error: { color: "#a61b2b", background: "#fde7ea", border: "#f5c2c7" },
  warning: { color: "#8a6d3b", background: "#fcf8e3", border: "#faebcc" },
  info: { color: "#0c5460", background: "#d1ecf1", border: "#bee5eb" },
};

const ErrorBanner: React.FC<ErrorBannerProps> = ({ children, message, variant = "error", style }) => {
  const theme = palette[variant];
  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        color: theme.color,
        background: theme.background,
        border: `1px solid ${theme.border}`,
        padding: 12,
        borderRadius: 6,
        marginBottom: 12,
        ...style,
      }}
    >
      {children ?? message}
    </div>
  );
};

export default ErrorBanner;


