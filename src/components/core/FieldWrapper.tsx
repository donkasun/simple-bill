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
      boxSizing: "border-box",
      padding: "var(--field-padding, 12px 16px)",
      border: error
        ? "1px solid var(--brand-danger)"
        : "1px solid var(--md-outline-variant)",
      borderRadius: "8px",
      outline: "none",
      backgroundColor: "var(--white)",
      fontSize: "var(--text-base)",
      fontFamily: "inherit",
      transition: "border-color 0.2s ease, box-shadow 0.2s ease",
      ...(children.props?.style || {}),
    },
  } as React.HTMLAttributes<HTMLElement>);

  return (
    <div
      className="FieldWrapper"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
        ...style,
      }}
    >
      {label && (
        <label
          style={{
            fontWeight: "600",
            color: "var(--brand-text-primary)",
            fontSize: "var(--text-label)",
          }}
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
            fontSize: "var(--text-sm)",
            fontWeight: "500",
            marginTop: "4px",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
};

export default FieldWrapper;
