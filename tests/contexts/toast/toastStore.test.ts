// tests/contexts/toast/toastStore.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { toast, toastStore } from "../../../src/contexts/toast/toastStore";

describe("toastStore", () => {
  beforeEach(() => {
    toastStore.clearAll();
  });
  afterEach(() => {
    vi.useRealTimers();
    toastStore.clearAll();
  });

  it("adds a success toast to the snapshot", () => {
    const id = toast.success("Saved");
    const list = toastStore.getSnapshot();
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({
      id,
      variant: "success",
      message: "Saved",
      duration: 4000,
    });
  });

  it("puts newest toast first", () => {
    toast.success("first");
    toast.error("second");
    const list = toastStore.getSnapshot();
    expect(list[0].message).toBe("second");
    expect(list[1].message).toBe("first");
  });

  it("makes errors sticky (duration null) by default", () => {
    toast.error("Boom");
    expect(toastStore.getSnapshot()[0].duration).toBeNull();
  });

  it("dismisses by id", () => {
    const id = toast.info("Hi");
    expect(toastStore.getSnapshot()).toHaveLength(1);
    toast.dismiss(id);
    expect(toastStore.getSnapshot()).toHaveLength(0);
  });

  it("notifies subscribers on change", () => {
    const listener = vi.fn();
    const unsub = toastStore.subscribe(listener);
    toast.success("x");
    expect(listener).toHaveBeenCalledTimes(1);
    unsub();
    toast.success("y");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("keeps a stable snapshot reference when unchanged", () => {
    toast.success("x");
    const a = toastStore.getSnapshot();
    const b = toastStore.getSnapshot();
    expect(a).toBe(b);
  });

  it("auto-dismisses success after its duration", () => {
    vi.useFakeTimers();
    toast.success("bye", { duration: 4000 });
    expect(toastStore.getSnapshot()).toHaveLength(1);
    vi.advanceTimersByTime(3999);
    expect(toastStore.getSnapshot()).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(toastStore.getSnapshot()).toHaveLength(0);
  });

  it("does not auto-dismiss sticky toasts", () => {
    vi.useFakeTimers();
    toast.error("stay");
    vi.advanceTimersByTime(100000);
    expect(toastStore.getSnapshot()).toHaveLength(1);
  });

  it("evicts the oldest when exceeding max 3", () => {
    toast.info("a");
    toast.info("b");
    toast.info("c");
    toast.info("d");
    const list = toastStore.getSnapshot();
    expect(list).toHaveLength(3);
    expect(list.map((t) => t.message)).toEqual(["d", "c", "b"]);
  });

  it("pauses and resumes the dismiss timer", () => {
    vi.useFakeTimers();
    const id = toast.success("hover", { duration: 4000 });
    vi.advanceTimersByTime(1000);
    toastStore.pause(id);
    vi.advanceTimersByTime(10000); // paused: nothing happens
    expect(toastStore.getSnapshot()).toHaveLength(1);
    toastStore.resume(id);
    vi.advanceTimersByTime(2999); // 3000 remained
    expect(toastStore.getSnapshot()).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(toastStore.getSnapshot()).toHaveLength(0);
  });
});
