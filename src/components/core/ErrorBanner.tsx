import React from "react";

type ErrorBannerProps = {
  children?: React.ReactNode;
  message?: string;
  variant?: "error" | "warning" | "info";
  style?: React.CSSProperties;
};

const palette: Record<
  NonNullable<ErrorBannerProps["variant"]>,
  { color: string; background: string; border: string }
> = {
  error: {
    color: "var(--brand-danger)",
    background: "#fde7ea",
    border: "rgba(192, 57, 43, 0.2)",
  },
  warning: {
    color: "var(--brand-warning)",
    background: "#fcf8e3",
    border: "rgba(243, 156, 18, 0.2)",
  },
  info: {
    color: "var(--brand-primary)",
    background: "#e6f7f1",
    border: "rgba(15, 82, 56, 0.2)",
  },
};

const ErrorBanner: React.FC<ErrorBannerProps> = ({
  children,
  message,
  variant = "error",
  style,
}) => {
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
        borderRadius: 8,
        marginBottom: 12,
        fontWeight: 600,
        ...style,
      }}
    >
      {children ?? message}
    </div>
  );
};

export default ErrorBanner;
