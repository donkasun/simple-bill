import React from "react";

export type ButtonVariant = "primary" | "secondary" | "danger";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  /** Pill-style CTA (e.g. New invoice, Add customer) */
  prominent?: boolean;
  children?: React.ReactNode;
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      prominent = false,
      children,
      className,
      style,
      ...props
    },
    ref,
  ) => {
    const variantClass =
      variant === "primary"
        ? "btn-primary"
        : variant === "danger"
          ? "btn-danger"
          : "btn-secondary";

    return (
      <button
        ref={ref}
        {...props}
        className={[variantClass, className].filter(Boolean).join(" ")}
        style={{
          padding: prominent ? "0 16px" : "0 24px",
          fontSize: "var(--text-base)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          ...(prominent
            ? {
                minHeight: 44,
                borderRadius: 9999,
                boxShadow: "0 10px 22px rgba(0, 0, 0, 0.1)",
              }
            : {}),
          ...style,
        }}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
