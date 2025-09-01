import React from "react";

type SecondaryButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: React.ReactNode;
};

const SecondaryButton: React.FC<SecondaryButtonProps> = ({
  children,
  className,
  style,
  ...props
}) => {
  return (
    <button
      {...props}
      className={`btn-secondary ${className || ""}`}
      style={{
        padding: "10px 20px",
        border: "1px solid var(--brand-border)",
        borderRadius: "8px",
        fontSize: "1rem",
        fontWeight: "600",
        cursor: "pointer",
        transition: "all 0.2s ease",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        minHeight: "44px",
        background: "var(--white)",
        color: "var(--brand-text-primary)",
        ...style,
      }}
    >
      {children}
    </button>
  );
};

export default SecondaryButton;
