import { useEffect, useState } from "react";
import {
  markDashboardIntroPlayed,
  shouldPlayDashboardIntro,
} from "@utils/dashboardIntroAnimation";

/**
 * Staggered dashboard entrance motion runs once per browser tab session,
 * not on every SPA return to /dashboard.
 */
export function useDashboardIntroAnimation(): boolean {
  const [playIntro] = useState(shouldPlayDashboardIntro);

  useEffect(() => {
    if (playIntro) markDashboardIntroPlayed();
  }, [playIntro]);

  return playIntro;
}
