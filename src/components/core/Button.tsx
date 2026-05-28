import React from "react";

export type ButtonVariant = "primary" | "secondary";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  /** Pill-style CTA (e.g. New invoice, Add customer) */
  prominent?: boolean;
  children?: React.ReactNode;
};

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  prominent = false,
  children,
  className,
  style,
  ...props
}) => {
  const variantClass = variant === "primary" ? "btn-primary" : "btn-secondary";

  return (
    <button
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
              borderRadius: 999,
              boxShadow: "0 10px 22px rgba(0, 0, 0, 0.1)",
            }
          : {}),
        ...style,
      }}
    >
      {children}
    </button>
  );
};

export default Button;
