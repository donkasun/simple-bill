import Lottie from "lottie-react";
import { useEffect, useState, type CSSProperties } from "react";

const OVERLAY_STYLE: CSSProperties = {
  position: "absolute",
  inset: 0,
  opacity: 0.2,
  pointerEvents: "none",
};

const STATIC_IMAGE_STYLE: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const LOTTIE_STYLE: CSSProperties = {
  width: "100%",
  height: "100%",
};

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function StaticCoinsOverlay() {
  return (
    <div aria-hidden style={OVERLAY_STYLE}>
      <img src="/coins-zen.png" alt="" style={STATIC_IMAGE_STYLE} />
    </div>
  );
}

export default function CtaCoinsBackground() {
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion);
  const [animationData, setAnimationData] = useState<object | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setReducedMotion(mediaQuery.matches);
    syncPreference();
    mediaQuery.addEventListener("change", syncPreference);
    return () => mediaQuery.removeEventListener("change", syncPreference);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      setAnimationData(null);
      setLoadFailed(false);
      return;
    }

    let cancelled = false;
    setLoadFailed(false);

    fetch("/lottie/coins-ambient.json")
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load Lottie animation");
        return response.json();
      })
      .then((data) => {
        if (!cancelled) setAnimationData(data);
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [reducedMotion]);

  if (reducedMotion || loadFailed || !animationData) {
    return <StaticCoinsOverlay />;
  }

  return (
    <div aria-hidden style={OVERLAY_STYLE}>
      <Lottie
        animationData={animationData}
        loop
        autoplay
        rendererSettings={{ preserveAspectRatio: "xMidYMid slice" }}
        style={LOTTIE_STYLE}
      />
    </div>
  );
}
