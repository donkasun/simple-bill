// src/contexts/toast/toastStore.ts
import type { Toast, ToastOptions, ToastVariant } from "./types";

const MAX_TOASTS = 3;

const DEFAULT_DURATIONS: Record<ToastVariant, number | null> = {
  success: 4000,
  info: 4000,
  error: null,
  loading: null,
};

type Timer = ReturnType<typeof setTimeout>;

let toasts: Toast[] = [];
const listeners = new Set<() => void>();
const timers = new Map<string, Timer>();
const remaining = new Map<string, number>();
const startTimes = new Map<string, number>();
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

function clearTimer(id: string): void {
  const t = timers.get(id);
  if (t !== undefined) {
    clearTimeout(t);
    timers.delete(id);
  }
}

function forget(id: string): void {
  clearTimer(id);
  remaining.delete(id);
  startTimes.delete(id);
}

function scheduleDismiss(id: string, duration: number): void {
  clearTimer(id);
  remaining.set(id, duration);
  startTimes.set(id, Date.now());
  timers.set(
    id,
    setTimeout(() => dismiss(id), duration),
  );
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
      const evicted = toasts.slice(MAX_TOASTS);
      toasts = toasts.slice(0, MAX_TOASTS);
      for (const e of evicted) forget(e.id);
    }
  }

  if (duration != null) {
    scheduleDismiss(id, duration);
  } else {
    forget(id);
  }

  emit();
  return id;
}

function dismiss(id: string): void {
  if (!toasts.some((t) => t.id === id)) return;
  toasts = toasts.filter((t) => t.id !== id);
  forget(id);
  emit();
}

function pause(id: string): void {
  const timer = timers.get(id);
  if (timer === undefined) return; // sticky or not scheduled
  clearTimeout(timer);
  timers.delete(id);
  const rem =
    (remaining.get(id) ?? 0) -
    (Date.now() - (startTimes.get(id) ?? Date.now()));
  remaining.set(id, Math.max(0, rem));
}

function resume(id: string): void {
  const rem = remaining.get(id);
  if (rem == null) return; // sticky
  if (timers.has(id)) return; // already running
  scheduleDismiss(id, rem);
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): Toast[] {
  return toasts;
}

function clearAll(): void {
  for (const id of [...timers.keys()]) forget(id);
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
  pause,
  resume,
  clearAll,
} as const;
