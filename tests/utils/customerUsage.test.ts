import { describe, it, expect, beforeEach } from "vitest";
import {
  loadCustomerUsage,
  recordCustomerBilled,
  recentCustomerIds,
  formatLastBilled,
} from "../../src/utils/customerUsage";

beforeEach(() => {
  localStorage.clear();
});

describe("loadCustomerUsage", () => {
  it("returns empty object when nothing stored", () => {
    expect(loadCustomerUsage("user1")).toEqual({});
  });

  it("returns stored map", () => {
    localStorage.setItem(
      "simplebill:customerUsage:user1",
      JSON.stringify({ cust1: 1000, cust2: 2000 }),
    );
    expect(loadCustomerUsage("user1")).toEqual({ cust1: 1000, cust2: 2000 });
  });

  it("ignores non-numeric values", () => {
    localStorage.setItem(
      "simplebill:customerUsage:user1",
      JSON.stringify({ cust1: "bad", cust2: 2000 }),
    );
    expect(loadCustomerUsage("user1")).toEqual({ cust2: 2000 });
  });

  it("returns empty object on corrupt JSON", () => {
    localStorage.setItem("simplebill:customerUsage:user1", "not-json");
    expect(loadCustomerUsage("user1")).toEqual({});
  });
});

describe("recordCustomerBilled", () => {
  it("stores a timestamp for the customer", () => {
    const before = Date.now();
    const result = recordCustomerBilled("user1", "cust1");
    const after = Date.now();
    expect(result.cust1).toBeGreaterThanOrEqual(before);
    expect(result.cust1).toBeLessThanOrEqual(after);
  });

  it("overwrites existing timestamp", () => {
    localStorage.setItem(
      "simplebill:customerUsage:user1",
      JSON.stringify({ cust1: 1000 }),
    );
    const result = recordCustomerBilled("user1", "cust1");
    expect(result.cust1).toBeGreaterThan(1000);
  });

  it("persists to localStorage", () => {
    recordCustomerBilled("user1", "cust1");
    const stored = JSON.parse(
      localStorage.getItem("simplebill:customerUsage:user1") ?? "{}",
    ) as Record<string, number>;
    expect(typeof stored.cust1).toBe("number");
  });

  it("preserves other customers", () => {
    localStorage.setItem(
      "simplebill:customerUsage:user1",
      JSON.stringify({ cust2: 9999 }),
    );
    const result = recordCustomerBilled("user1", "cust1");
    expect(result.cust2).toBe(9999);
  });
});

describe("recentCustomerIds", () => {
  it("returns IDs sorted by timestamp desc", () => {
    const usage = { a: 1000, b: 3000, c: 2000 };
    expect(recentCustomerIds(usage, 3)).toEqual(["b", "c", "a"]);
  });

  it("respects max", () => {
    const usage = { a: 1000, b: 3000, c: 2000 };
    expect(recentCustomerIds(usage, 2)).toEqual(["b", "c"]);
  });

  it("returns empty array for empty usage", () => {
    expect(recentCustomerIds({}, 3)).toEqual([]);
  });
});

describe("formatLastBilled", () => {
  it("returns 'Last billed today' for same-day timestamp", () => {
    expect(formatLastBilled(Date.now())).toBe("Last billed today");
  });

  it("returns 'Last billed yesterday' for ~24h ago", () => {
    expect(formatLastBilled(Date.now() - 25 * 60 * 60 * 1000)).toBe(
      "Last billed yesterday",
    );
  });

  it("returns 'Last billed N days ago' for older timestamps", () => {
    expect(formatLastBilled(Date.now() - 3 * 24 * 60 * 60 * 1000)).toBe(
      "Last billed 3 days ago",
    );
  });
});
