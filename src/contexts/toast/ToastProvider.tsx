// src/contexts/toast/ToastProvider.tsx
import React from "react";
import { createPortal } from "react-dom";
import ToastViewport from "../../components/core/ToastViewport";

type ToastProviderProps = { children: React.ReactNode };

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  return (
    <>
      {children}
      {typeof document !== "undefined" &&
        createPortal(<ToastViewport />, document.body)}
    </>
  );
};
