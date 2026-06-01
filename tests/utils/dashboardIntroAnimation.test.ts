import { describe, it, expect, beforeEach } from "vitest";
import {
  dashboardIntroAnimationClasses,
  markDashboardIntroPlayed,
  shouldPlayDashboardIntro,
} from "../../src/utils/dashboardIntroAnimation";

describe("dashboardIntroAnimation", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("allows intro on first visit in a session", () => {
    expect(shouldPlayDashboardIntro()).toBe(true);
  });

  it("skips intro after it has been marked played", () => {
    markDashboardIntroPlayed();
    expect(shouldPlayDashboardIntro()).toBe(false);
  });

  it("returns animation classes only when playIntro is true", () => {
    expect(
      dashboardIntroAnimationClasses(
        false,
        "dashboard-animate-fade-up--delay-1",
      ),
    ).toBe("");
    expect(
      dashboardIntroAnimationClasses(
        true,
        "dashboard-animate-fade-up--delay-1",
      ),
    ).toBe("dashboard-animate-fade-up dashboard-animate-fade-up--delay-1");
  });
});
