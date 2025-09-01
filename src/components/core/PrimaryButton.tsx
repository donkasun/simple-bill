import React from "react";

type PrimaryButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: React.ReactNode;
};

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  children,
  className,
  style,
  ...props
}) => {
  return (
    <button
      {...props}
      className={`btn-primary ${className || ""}`}
      style={{
        padding: "10px 20px",
        border: "none",
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
        ...style,
      }}
    >
      {children}
    </button>
  );
};

export default PrimaryButton;
