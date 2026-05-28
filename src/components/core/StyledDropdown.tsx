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
  style,
  style: selectStyle,
  ...props
}) => {
  return (
    <FieldWrapper label={label} required={required} error={error} style={style}>
      <select
        id={id}
        {...props}
        style={{
          width: "100%",
          boxSizing: "border-box",
          paddingRight: 0,
          ...(selectStyle ?? {}),
        }}
      >
        {children}
      </select>
    </FieldWrapper>
  );
};

export default StyledDropdown;
