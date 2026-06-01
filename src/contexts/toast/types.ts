// src/contexts/toast/types.ts
export type ToastVariant = "success" | "error" | "info" | "loading";

export type Toast = {
  id: string;
  variant: ToastVariant;
  message: string;
  /** ms until auto-dismiss; null = sticky (manual dismiss / promise resolution) */
  duration: number | null;
  createdAt: number;
};

export type ToastOptions = {
  /** Override auto-dismiss. `null` = sticky, number = ms. */
  duration?: number | null;
  /** Supply to update/replace an existing toast in place (used by `promise`). */
  id?: string;
};

export type PromiseMessages<T> = {
  loading: string;
  success: string | ((value: T) => string);
  error: string | ((err: unknown) => string);
};
