import { afterEach, describe, expect, it, vi } from "vitest";
import { isLocalDevHost } from "../../src/utils/isLocalDevHost";

describe("isLocalDevHost", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns false in production builds", () => {
    vi.stubEnv("DEV", false);
    vi.stubGlobal("window", {
      location: { hostname: "localhost" },
    } as Window & typeof globalThis);

    expect(isLocalDevHost()).toBe(false);
  });

  it("returns true on localhost during dev", () => {
    vi.stubEnv("DEV", true);
    vi.stubGlobal("window", {
      location: { hostname: "localhost" },
    } as Window & typeof globalThis);

    expect(isLocalDevHost()).toBe(true);
  });

  it("returns false on LAN hostname during dev", () => {
    vi.stubEnv("DEV", true);
    vi.stubGlobal("window", {
      location: { hostname: "192.168.1.10" },
    } as Window & typeof globalThis);

    expect(isLocalDevHost()).toBe(false);
  });
});
