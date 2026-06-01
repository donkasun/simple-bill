// src/contexts/toast/toastStore.ts
import type { Toast, ToastOptions, ToastVariant } from "./types";

const MAX_TOASTS = 3;

const DEFAULT_DURATIONS: Record<ToastVariant, number | null> = {
  success: 4000,
  info: 4000,
  error: null,
  loading: null,
};

let toasts: Toast[] = [];
const listeners = new Set<() => void>();
let counter = 0;

function genId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `toast-${Date.now()}-${counter++}`;
}

function emit(): void {
  for (const listener of listeners) listener();
}

function add(
  variant: ToastVariant,
  message: string,
  opts?: ToastOptions,
): string {
  const id = opts?.id ?? genId();
  const duration =
    opts?.duration !== undefined ? opts.duration : DEFAULT_DURATIONS[variant];
  const next: Toast = { id, variant, message, duration, createdAt: Date.now() };

  const existingIndex = toasts.findIndex((t) => t.id === id);
  if (existingIndex >= 0) {
    toasts = toasts.map((t, i) => (i === existingIndex ? next : t));
  } else {
    toasts = [next, ...toasts];
    if (toasts.length > MAX_TOASTS) {
      toasts = toasts.slice(0, MAX_TOASTS);
    }
  }
  emit();
  return id;
}

function dismiss(id: string): void {
  if (!toasts.some((t) => t.id === id)) return;
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): Toast[] {
  return toasts;
}

function clearAll(): void {
  toasts = [];
  emit();
}

export const toast = {
  success: (message: string, opts?: ToastOptions) =>
    add("success", message, opts),
  error: (message: string, opts?: ToastOptions) => add("error", message, opts),
  info: (message: string, opts?: ToastOptions) => add("info", message, opts),
  loading: (message: string, opts?: ToastOptions) =>
    add("loading", message, opts),
  dismiss,
} as const;

export const toastStore = {
  subscribe,
  getSnapshot,
  clearAll,
} as const;
