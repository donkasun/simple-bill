import React from "react";
import FieldWrapper from "./FieldWrapper";

type StyledTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
};

const StyledTextarea: React.FC<StyledTextareaProps> = ({
  label,
  style,
  error,
  required,
  id,
  ...props
}) => {
  return (
    <FieldWrapper label={label} required={required} error={error} style={style}>
      <textarea
        id={id}
        {...props}
        style={{
          border: "none",
          outline: "none",
          width: "100%",
          backgroundColor: "transparent",
          resize: "vertical",
          minHeight: "80px",
          fontFamily: "inherit",
          fontSize: "inherit",
          lineHeight: "1.5",
        }}
      />
    </FieldWrapper>
  );
};

export default StyledTextarea;
