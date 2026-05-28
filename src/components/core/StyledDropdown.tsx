import React from "react";
import FieldWrapper from "./FieldWrapper";

type StyledDropdownProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
};

const StyledDropdown: React.FC<StyledDropdownProps> = ({
  label,
  children,
  required,
  error,
  id,
  className,
  style,
  style: selectStyle,
  ...props
}) => {
  return (
    <FieldWrapper label={label} required={required} error={error} style={style}>
      <select
        id={id}
        className={["field-select", className].filter(Boolean).join(" ")}
        {...props}
        style={{
          width: "100%",
          boxSizing: "border-box",
          ...(selectStyle ?? {}),
        }}
      >
        {children}
      </select>
    </FieldWrapper>
  );
};

export default StyledDropdown;
