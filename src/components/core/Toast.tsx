// src/components/core/Toast.tsx
import React from "react";
import type {
  Toast as ToastModel,
  ToastVariant,
} from "../../contexts/toast/types";

const ICONS: Record<ToastVariant, string> = {
  success: "✓",
  error: "!",
  info: "i",
  loading: "",
};

type ToastProps = {
  toast: ToastModel;
  onDismiss: (id: string) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
};

const Toast: React.FC<ToastProps> = ({
  toast,
  onDismiss,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
}) => {
  const isError = toast.variant === "error";
  const isLoading = toast.variant === "loading";

  return (
    <div
      className={`toast toast--${toast.variant}`}
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      <span className="toast__icon" aria-hidden="true">
        {isLoading ? <span className="toast__spinner" /> : ICONS[toast.variant]}
      </span>
      <span className="toast__message">{toast.message}</span>
      {!isLoading && (
        <button
          type="button"
          className="toast__dismiss"
          aria-label="Dismiss notification"
          onClick={() => onDismiss(toast.id)}
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default Toast;
