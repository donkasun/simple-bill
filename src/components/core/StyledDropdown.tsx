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
  ...props
}) => {
  const inputWidth = "calc(100% - 24px)";
  return (
    <FieldWrapper label={label} required={required} error={error} style={style}>
      <div style={{ position: "relative", width: inputWidth }}>
        <select
          id={id}
          {...props}
          style={{
            border: "none",
            outline: "none",
            width: "100%",
            paddingRight: "0px",
            backgroundColor: "transparent",
          }}
        >
          {children}
        </select>
      </div>
    </FieldWrapper>
  );
};

export default StyledDropdown;
