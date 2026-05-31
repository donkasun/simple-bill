import { describe, it, expect } from "vitest";
import {
  easeInCubic,
  easeOutCubic,
  createParticles,
  applyPhase,
  type Particle,
} from "../../../src/components/effects/particles";

describe("easing", () => {
  it("easeInCubic maps endpoints and midpoint", () => {
    expect(easeInCubic(0)).toBe(0);
    expect(easeInCubic(1)).toBe(1);
    expect(easeInCubic(0.5)).toBeCloseTo(0.125, 5);
  });

  it("easeOutCubic maps endpoints and midpoint", () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutCubic(0.5)).toBeCloseTo(0.875, 5);
  });
});

// Build a device-pixel RGBA row from an array of alpha values.
function row(alphas: number[]): Uint8ClampedArray {
  const data = new Uint8ClampedArray(alphas.length * 4);
  alphas.forEach((a, i) => {
    data[i * 4 + 3] = a;
  });
  return data;
}

describe("createParticles", () => {
  const opts = { gap: 1, dpr: 1, driftX: -100, scatterY: 20, rng: () => 0.5 };

  it("emits one particle per opaque pixel and skips transparent ones", () => {
    const data = row([255, 0, 255, 255]); // 3 opaque, 1 transparent
    const ps = createParticles(data, 4, 1, opts);
    expect(ps).toHaveLength(3);
  });

  it("places home positions in CSS pixels (device / dpr)", () => {
    // dpr=2, gap=1 -> stepDevice = round(1*2) = 2, so x=0 and x=2 are sampled.
    // Only x=2 is opaque; its CSS home must be 2/2 = 1 (not 2).
    const data = row([0, 0, 255, 0]);
    const ps = createParticles(data, 4, 1, { ...opts, dpr: 2 });
    expect(ps).toHaveLength(1);
    expect(ps[0].homeX).toBe(1);
    expect(ps[0].homeY).toBe(0);
  });

  it("scatter target is to the left of home (negative driftX)", () => {
    const data = row([255, 0, 0, 0]);
    const ps = createParticles(data, 4, 1, opts);
    expect(ps[0].scatterX).toBeLessThan(ps[0].homeX);
  });

  it("respects gap by sub-sampling", () => {
    const data = row([255, 255, 255, 255]); // all opaque
    const ps = createParticles(data, 4, 1, { ...opts, gap: 2 });
    expect(ps).toHaveLength(2); // x = 0 and x = 2
  });

  it("starts each particle at its home position, fully opaque", () => {
    const data = row([255, 0, 0, 0]);
    const ps = createParticles(data, 4, 1, opts);
    expect(ps[0].x).toBe(ps[0].homeX);
    expect(ps[0].y).toBe(ps[0].homeY);
    expect(ps[0].alpha).toBe(1);
  });
});

function makeParticle(): Particle {
  return {
    homeX: 10,
    homeY: 5,
    scatterX: -90,
    scatterY: 25,
    x: 10,
    y: 5,
    size: 1.5,
    alpha: 1,
  };
}

describe("applyPhase", () => {
  it("dissolving at progress 0 sits at home, fully opaque", () => {
    const p = makeParticle();
    applyPhase([p], "dissolving", 0);
    expect(p.x).toBeCloseTo(10, 5);
    expect(p.y).toBeCloseTo(5, 5);
    expect(p.alpha).toBeCloseTo(1, 5);
  });

  it("dissolving at progress 1 reaches scatter, fully transparent", () => {
    const p = makeParticle();
    applyPhase([p], "dissolving", 1);
    expect(p.x).toBeCloseTo(-90, 5);
    expect(p.y).toBeCloseTo(25, 5);
    expect(p.alpha).toBeCloseTo(0, 5);
  });

  it("reforming at progress 0 sits at scatter, transparent", () => {
    const p = makeParticle();
    applyPhase([p], "reforming", 0);
    expect(p.x).toBeCloseTo(-90, 5);
    expect(p.alpha).toBeCloseTo(0, 5);
  });

  it("reforming at progress 1 returns home, fully opaque", () => {
    const p = makeParticle();
    applyPhase([p], "reforming", 1);
    expect(p.x).toBeCloseTo(10, 5);
    expect(p.y).toBeCloseTo(5, 5);
    expect(p.alpha).toBeCloseTo(1, 5);
  });
});
