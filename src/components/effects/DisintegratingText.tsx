import { useEffect, useRef, useState, type RefObject } from "react";
import {
  createParticles,
  applyPhase,
  type Particle,
  type Phase,
} from "./particles";

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
  const [phase, setPhase] = useState<Phase>("solid");

  const prefersReduced =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (prefersReduced) return;
    const target = triggerRef.current;
    if (!target || typeof IntersectionObserver === "undefined") return;
    builtRef.current = false; // re-measure/rebuild whenever inputs change

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

    const run = (next: "dissolving" | "reforming") => {
      cancelAnimationFrame(rafRef.current);
      phaseRef.current = next;
      setPhase(next);
      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min(1, (now - start) / duration);
        applyPhase(particlesRef.current, next, progress);
        paint();
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          const done: Phase = next === "dissolving" ? "scattered" : "solid";
          phaseRef.current = done;
          setPhase(done);
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    };

    const ensureBuilt = (): boolean => {
      if (builtRef.current) return true;
      builtRef.current = buildParticles();
      return builtRef.current;
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting && entry.intersectionRatio >= 0.4;
        if (!visible && phaseRef.current === "solid") {
          if (ensureBuilt()) run("dissolving");
        } else if (visible && phaseRef.current === "scattered") {
          run("reforming");
        }
      },
      { threshold: [0, 0.4, 1] },
    );
    io.observe(target);

    const onResize = () => {
      if (phaseRef.current === "solid") builtRef.current = false;
    };
    window.addEventListener("resize", onResize);

    return () => {
      io.disconnect();
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
