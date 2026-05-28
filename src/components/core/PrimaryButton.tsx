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
        padding: "0 24px",
        fontSize: "var(--text-base)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        ...style,
      }}
    >
      {children}
    </button>
  );
};

export default PrimaryButton;
