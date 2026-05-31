export interface Particle {
  homeX: number;
  homeY: number;
  scatterX: number;
  scatterTargetY: number;
  x: number;
  y: number;
  size: number;
  alpha: number;
}

export type Phase = "solid" | "dissolving" | "scattered" | "reforming";

export const easeInCubic = (t: number): number => t * t * t;
export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

export interface CreateParticlesOptions {
  gap: number; // sampling gap in CSS px
  dpr: number; // device pixel ratio used when the buffer was drawn
  driftX: number; // base leftward distance (negative) for scatter
  scatterYRange: number; // vertical scatter range (± px)
  rng?: () => number; // injectable randomness, defaults to Math.random
  alphaThreshold?: number; // min alpha (0-255) to count as ink, default 128
  size?: number; // particle square size in CSS px, default 1.5
}

export function createParticles(
  data: Uint8ClampedArray,
  width: number, // device px
  height: number, // device px
  opts: CreateParticlesOptions,
): Particle[] {
  const {
    gap,
    dpr,
    driftX,
    scatterYRange,
    rng = Math.random,
    alphaThreshold = 128,
    size = 1.5,
  } = opts;
  const stepDevice = Math.max(1, Math.round(gap * dpr));
  const particles: Particle[] = [];

  for (let y = 0; y < height; y += stepDevice) {
    for (let x = 0; x < width; x += stepDevice) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha < alphaThreshold) continue;
      const homeX = x / dpr;
      const homeY = y / dpr;
      // leftward scatter: 0.6x..1.4x of driftX, plus vertical jitter and slight lift
      const scatterX = homeX + driftX * (0.6 + rng() * 0.8);
      const scatterTargetY =
        homeY + (rng() - 0.5) * 2 * scatterYRange - rng() * scatterYRange * 0.5;
      particles.push({
        homeX,
        homeY,
        scatterX,
        scatterTargetY,
        x: homeX,
        y: homeY,
        size,
        alpha: 1,
      });
    }
  }
  return particles;
}

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/**
 * Advances particles for the given phase/progress. Mutates each particle's
 * x/y/alpha in place (no per-frame allocation) — intended for a rAF loop.
 * "solid" snaps to home (fully opaque); "scattered" snaps to the scatter
 * target (fully transparent); both are static end states.
 */
export function applyPhase(
  particles: Particle[],
  phase: Phase,
  progress: number,
): void {
  if (phase === "dissolving") {
    const e = easeInCubic(progress);
    for (const p of particles) {
      p.x = lerp(p.homeX, p.scatterX, e);
      p.y = lerp(p.homeY, p.scatterTargetY, e);
      p.alpha = 1 - progress;
    }
  } else if (phase === "reforming") {
    const e = easeOutCubic(progress);
    for (const p of particles) {
      p.x = lerp(p.scatterX, p.homeX, e);
      p.y = lerp(p.scatterTargetY, p.homeY, e);
      p.alpha = progress;
    }
  } else if (phase === "solid") {
    for (const p of particles) {
      p.x = p.homeX;
      p.y = p.homeY;
      p.alpha = 1;
    }
  } else if (phase === "scattered") {
    for (const p of particles) {
      p.x = p.scatterX;
      p.y = p.scatterTargetY;
      p.alpha = 0;
    }
  }
}
