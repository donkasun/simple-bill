import React, { useMemo, cloneElement } from "react";

type FieldWrapperProps = {
  label?: string;
  required?: boolean;
  error?: string;
  style?: React.CSSProperties;
  children: React.ReactElement<React.HTMLAttributes<HTMLElement>>;
};

const FieldWrapper: React.FC<FieldWrapperProps> = ({
  label,
  required,
  error,
  style,
  children,
}) => {
  const errorId = useMemo(
    () => `field-error-${Math.random().toString(36).slice(2)}`,
    [],
  );

  const enhancedChild = cloneElement(children, {
    "aria-invalid": !!error,
    "aria-describedby": error ? errorId : undefined,
    required,
    style: {
      width: "100%",
      padding: "12px 16px",
      border: error
        ? "1px solid var(--brand-danger)"
        : "1px solid var(--brand-border)",
      borderRadius: "8px",
      outline: "none",
      background: "var(--white)",
      fontSize: "1rem",
      transition: "border-color 0.2s ease, box-shadow 0.2s ease",
      ...(children.props?.style || {}),
    },
  } as React.HTMLAttributes<HTMLElement>);

  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: "8px", ...style }}
    >
      {label && (
        <label
          style={{ fontWeight: "600", color: "var(--brand-text-primary)" }}
        >
          {label}
          {required && <span style={{ color: "var(--brand-danger)" }}> *</span>}
        </label>
      )}
      {enhancedChild}
      {error && (
        <div
          id={errorId}
          style={{
            color: "var(--brand-danger)",
            fontSize: "0.875rem",
            fontWeight: "500",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
};

export default FieldWrapper;
