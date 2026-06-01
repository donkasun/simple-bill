// src/contexts/toast/toastStore.ts
import type {
  Toast,
  ToastOptions,
  ToastVariant,
  PromiseMessages,
} from "./types";

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
// Tracks toasts currently in a hover/focus-paused state so add() can defer
// starting a timer when a promise resolves while the toast is being hovered.
const paused = new Set<string>();
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

function clearSchedule(id: string): void {
  clearTimer(id);
  remaining.delete(id);
  startTimes.delete(id);
  paused.delete(id);
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
      for (const e of evicted) clearSchedule(e.id);
    }
  }

  if (duration != null) {
    // If the toast is currently hover/focus-paused, defer the timer; resume()
    // will start it when the user moves the pointer away.
    if (paused.has(id)) {
      remaining.set(id, duration); // resume() will call scheduleDismiss with this
    } else {
      scheduleDismiss(id, duration);
    }
  } else {
    clearSchedule(id);
  }

  emit();
  return id;
}

function dismiss(id: string): void {
  if (!toasts.some((t) => t.id === id)) return;
  toasts = toasts.filter((t) => t.id !== id);
  clearSchedule(id);
  emit();
}

function pause(id: string): void {
  if (!toasts.some((t) => t.id === id)) return;
  paused.add(id);
  const timer = timers.get(id);
  if (timer === undefined) return; // sticky toast — just mark as paused above
  clearTimeout(timer);
  timers.delete(id);
  const rem = remaining.get(id);
  const start = startTimes.get(id);
  if (rem == null || start == null) return; // maps out of sync — should not happen
  remaining.set(id, Math.max(0, rem - (Date.now() - start)));
}

function resume(id: string): void {
  paused.delete(id);
  const rem = remaining.get(id);
  if (rem == null) return; // sticky — no timer to schedule
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
  for (const id of [...timers.keys()]) clearSchedule(id);
  paused.clear();
  toasts = [];
  emit();
}

function resolveMessage<T>(
  message: string | ((value: T) => string),
  value: T,
): string {
  return typeof message === "function"
    ? (message as (value: T) => string)(value)
    : message;
}

function promise<T>(
  input: Promise<T>,
  messages: PromiseMessages<T>,
  opts?: ToastOptions,
): Promise<T> {
  const id = add("loading", messages.loading, { ...opts, duration: null });
  input.then(
    (value) => {
      add("success", resolveMessage(messages.success, value), {
        id,
        duration: opts?.duration,
      });
    },
    (err: unknown) => {
      add("error", resolveMessage(messages.error, err), {
        id,
        duration: opts?.duration,
      });
    },
  );
  return input;
}

export const toast = {
  success: (message: string, opts?: ToastOptions) =>
    add("success", message, opts),
  error: (message: string, opts?: ToastOptions) => add("error", message, opts),
  info: (message: string, opts?: ToastOptions) => add("info", message, opts),
  loading: (message: string, opts?: ToastOptions) =>
    add("loading", message, opts),
  promise,
  dismiss,
} as const;

export const toastStore = {
  subscribe,
  getSnapshot,
  pause,
  resume,
  clearAll,
} as const;
