const SESSION_KEY = "simplebill:dashboard-intro-played";

/** True the first time Home is shown in this browser tab session. */
export function shouldPlayDashboardIntro(): boolean {
  if (typeof sessionStorage === "undefined") return true;
  try {
    return sessionStorage.getItem(SESSION_KEY) !== "1";
  } catch {
    return true;
  }
}

export function markDashboardIntroPlayed(): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    /* private mode / quota */
  }
}

/** Entrance animation classes; empty when intro already played this session. */
export function dashboardIntroAnimationClasses(
  playIntro: boolean,
  delayClass?: string,
): string {
  if (!playIntro) return "";
  return ["dashboard-animate-fade-up", delayClass].filter(Boolean).join(" ");
}

export function dashboardAsideIntroAnimationClasses(
  playIntro: boolean,
): string {
  if (!playIntro) return "";
  return "dashboard-animate-slide-right dashboard-animate-fade-up--delay-3";
}
