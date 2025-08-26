import React from "react";
import FieldWrapper from "./FieldWrapper";

type StyledInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

const StyledInput: React.FC<StyledInputProps> = ({
  label,
  style,
  error,
  required,
  id,
  ...props
}) => {
  return (
    <FieldWrapper label={label} required={required} error={error} style={style}>
      <input
        id={id}
        {...props}
        style={{
          border: "none",
          outline: "none",
          width: "100%",
          backgroundColor: "transparent",
          ...(style || {}),
        }}
      />
    </FieldWrapper>
  );
};

export default StyledInput;
