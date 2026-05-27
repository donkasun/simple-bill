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
        padding: "0 24px",
        fontSize: "1rem",
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

export default SecondaryButton;
