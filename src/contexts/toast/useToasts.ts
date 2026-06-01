// src/contexts/toast/useToasts.ts
import { useSyncExternalStore } from "react";
import { toastStore } from "./toastStore";
import type { Toast } from "./types";

const EMPTY: Toast[] = [];

export function useToasts(): Toast[] {
  return useSyncExternalStore(
    toastStore.subscribe,
    toastStore.getSnapshot,
    () => EMPTY, // server snapshot (no toasts during SSR)
  );
}
