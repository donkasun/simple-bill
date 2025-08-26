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
  const inputWidth = "calc(100% - 24px)";
  return (
    <FieldWrapper label={label} required={required} error={error} style={style}>
      <div style={{ position: "relative", width: inputWidth }}>
        <textarea
          id={id}
          {...props}
          style={{
            border: "none",
            outline: "none",
            width: "100%",
            paddingRight: "0px",
            backgroundColor: "transparent",
          }}
        />
      </div>
    </FieldWrapper>
  );
};

export default StyledTextarea;
