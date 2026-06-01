// src/components/core/ToastViewport.tsx
import React from "react";
import Toast from "./Toast";
import { toast as toastApi, toastStore } from "../../contexts/toast/toastStore";
import { useToasts } from "../../contexts/toast/useToasts";

const ToastViewport: React.FC = () => {
  const toasts = useToasts();
  if (toasts.length === 0) return null;

  return (
    <div className="toast-viewport" role="region" aria-label="Notifications">
      {toasts.map((t) => (
        <Toast
          key={t.id}
          toast={t}
          onDismiss={toastApi.dismiss}
          onMouseEnter={() => toastStore.pause(t.id)}
          onMouseLeave={() => toastStore.resume(t.id)}
          onFocus={() => toastStore.pause(t.id)}
          onBlur={() => toastStore.resume(t.id)}
        />
      ))}
    </div>
  );
};

export default ToastViewport;
