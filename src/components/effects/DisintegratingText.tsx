import { useEffect, useRef, useState, type RefObject } from "react";
import { createParticles, type Particle, type Phase } from "./particles";

interface DisintegratingTextProps {
  text: string;
  color: string;
  triggerRef: RefObject<HTMLElement | null>;
  sampleGap?: number;
  drift?: { x: number; scatterY: number };
  duration?: number;
}

export default function DisintegratingText({
  text,
  color,
  triggerRef,
  sampleGap = 3,
  drift = { x: -260, scatterY: 40 },
  duration = 1100,
}: DisintegratingTextProps) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const phaseRef = useRef<Phase>("solid");
  const builtRef = useRef(false);
  const fillRef = useRef<string>(color);
  const offsetRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);
  // 0 = fully solid (home), 1 = fully scattered. Tweened toward `target`.
  const amountRef = useRef(0);
  const targetRef = useRef(0);
  const animatingRef = useRef(false);
  const [phase, setPhase] = useState<Phase>("solid");

  const prefersReduced =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (prefersReduced) return;
    const target = triggerRef.current;
    if (!target) return;

    // Reset state when inputs change so stale particles aren't reused.
    builtRef.current = false;
    amountRef.current = 0;
    targetRef.current = 0;
    phaseRef.current = "solid";

    const buildParticles = (): boolean => {
      const span = spanRef.current;
      const canvas = canvasRef.current;
      if (!span || !canvas) return false;
      const rect = span.getBoundingClientRect();
      const w = Math.ceil(rect.width);
      const h = Math.ceil(rect.height);
      if (w === 0 || h === 0) return false;
      const dpr = window.devicePixelRatio || 1;

      const off = document.createElement("canvas");
      off.width = w * dpr;
      off.height = h * dpr;
      const octx = off.getContext("2d");
      if (!octx) return false;
      octx.scale(dpr, dpr);
      const cs = getComputedStyle(span);
      octx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      octx.textBaseline = "top";
      octx.fillStyle = "#000";
      octx.fillText(text, 0, 0);
      fillRef.current = cs.color; // resolves CSS var to rgb()

      const img = octx.getImageData(0, 0, off.width, off.height);
      particlesRef.current = createParticles(img.data, off.width, off.height, {
        gap: sampleGap,
        dpr,
        driftX: drift.x,
        scatterYRange: drift.scatterY,
      });

      // Pad the visible canvas so particles can drift left / scatter vertically
      // beyond the text box instead of being clipped at its edge.
      const padX = Math.ceil(Math.abs(drift.x)) + 24; // left travel room
      const padRight = 24;
      const padTop = Math.ceil(drift.scatterY * 1.5) + 24;
      const padBottom = Math.ceil(drift.scatterY) + 24;
      const cssW = padX + w + padRight;
      const cssH = padTop + h + padBottom;
      offsetRef.current = { x: padX, y: padTop };

      canvas.width = cssW * dpr;
      canvas.height = cssH * dpr;
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      canvas.style.left = `${-padX}px`;
      canvas.style.top = `${-padTop}px`;
      return true;
    };

    const ensureBuilt = (): boolean => {
      if (builtRef.current) return true;
      builtRef.current = buildParticles();
      return builtRef.current;
    };

    // Interpolate every particle to the given 0..1 amount (smoothstep eased so
    // it looks good in BOTH directions, which a one-way ease wouldn't).
    const renderAt = (amount: number) => {
      const e = amount * amount * (3 - 2 * amount);
      for (const p of particlesRef.current) {
        p.x = p.homeX + (p.scatterX - p.homeX) * e;
        p.y = p.homeY + (p.scatterTargetY - p.homeY) * e;
        p.alpha = 1 - e;
      }
    };

    const paint = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      const { x: ox, y: oy } = offsetRef.current;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      ctx.translate(ox, oy);
      ctx.fillStyle = fillRef.current;
      for (const p of particlesRef.current) {
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
      ctx.globalAlpha = 1;
    };

    // Continuously tween `amount` toward `target`; reversible mid-flight.
    const tween = () => {
      if (animatingRef.current) return;
      animatingRef.current = true;
      let last = performance.now();
      const step = (now: number) => {
        const dt = now - last;
        last = now;
        const tgt = targetRef.current;
        const cur = amountRef.current;
        if (cur !== tgt) {
          const dir = tgt > cur ? 1 : -1;
          let next = cur + (dir * dt) / duration;
          if ((dir === 1 && next >= tgt) || (dir === -1 && next <= tgt)) {
            next = tgt;
          }
          amountRef.current = next;
        }
        renderAt(amountRef.current);
        paint();
        if (amountRef.current !== targetRef.current) {
          rafRef.current = requestAnimationFrame(step);
        } else {
          animatingRef.current = false;
          const settled: Phase =
            targetRef.current === 1 ? "scattered" : "solid";
          phaseRef.current = settled;
          setPhase(settled);
        }
      };
      rafRef.current = requestAnimationFrame(step);
    };

    const setTarget = (t: 0 | 1) => {
      if (t === 1 && !ensureBuilt()) return;
      targetRef.current = t;
      const interim: Phase = t === 1 ? "dissolving" : "reforming";
      if (phaseRef.current !== interim) {
        phaseRef.current = interim;
        setPhase(interim);
      }
      tween();
    };

    // Dissolve once the hero has scrolled up so its top passes ~30% of the
    // viewport height — still clearly on screen — and reform when it returns.
    const evaluate = () => {
      const rect = target.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const want: 0 | 1 = rect.top < vh * 0.3 ? 1 : 0;
      if (want !== targetRef.current) setTarget(want);
    };

    const onScroll = () => evaluate();
    const onResize = () => {
      if (targetRef.current === 0 && !animatingRef.current) {
        builtRef.current = false; // text box may have changed; rebuild next time
      }
      evaluate();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    evaluate(); // handle a page that loads already scrolled

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [
    triggerRef,
    prefersReduced,
    text,
    sampleGap,
    drift.x,
    drift.scatterY,
    duration,
  ]);

  // Clear leftover particles after the span is committed in a static phase,
  // so the visible <span> reappears before the canvas is wiped (no blank frame).
  useEffect(() => {
    if (phase !== "solid" && phase !== "scattered") return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [phase]);

  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <span
        ref={spanRef}
        style={{
          color,
          visibility: phase === "solid" ? "visible" : "hidden",
        }}
      >
        {text}
      </span>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
      />
    </span>
  );
}
