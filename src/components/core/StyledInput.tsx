import React from "react";
import FieldWrapper from "./FieldWrapper";

type StyledInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  showDropdownIcon?: boolean;
  isDropdownToggled?: boolean;
  onDropdownToggle?: () => void;
};

const StyledInput: React.FC<StyledInputProps> = ({
  label,
  style,
  error,
  required,
  id,
  showDropdownIcon = false,
  isDropdownToggled = false,
  onDropdownToggle,
  disabled,
  ...props
}) => {
  const inputWidth = "calc(100% - 24px)";
  return (
    <FieldWrapper label={label} required={required} error={error} style={style}>
      <div style={{ position: "relative", width: inputWidth }}>
        <input
          id={id}
          {...props}
          style={{
            border: "none",
            outline: "none",
            width: "100%",
            paddingRight: "0px",
            backgroundColor: "transparent",
            ...(props.style || {}),
          }}
        />
        {showDropdownIcon && (
          <button
            type="button"
            onClick={onDropdownToggle}
            disabled={disabled}
            style={{
              position: "absolute",
              right: "0px",
              top: "50%",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "2px",
              color: "#666",
              fontSize: "10px",
              transition: "transform 0.2s ease",
              transform: `translateY(-50%) rotate(${isDropdownToggled ? 180 : 0}deg)`,
              zIndex: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "16px",
              height: "16px",
            }}
            aria-label="Toggle dropdown"
          >
            ▼
          </button>
        )}
      </div>
    </FieldWrapper>
  );
};

export default StyledInput;
