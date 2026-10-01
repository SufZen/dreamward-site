/** Small geometry helpers for the inline-SVG illustrations. */

export type Pt = readonly [number, number];

/** Point on a cubic Bézier at t ∈ [0, 1]. */
export function bezier(p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt {
  const u = 1 - t;
  const x = u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0];
  const y = u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1];
  return [round(x), round(y)];
}

/** Point at `r` from (cx, cy), angle in degrees clockwise from 12 o'clock. */
export function polar(cx: number, cy: number, r: number, deg: number): Pt {
  const a = ((deg - 90) * Math.PI) / 180;
  return [round(cx + r * Math.cos(a)), round(cy + r * Math.sin(a))];
}

export const round = (n: number) => Math.round(n * 100) / 100;

/** Deterministic pseudo-random numbers (the same sky on every build). */
export function prng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A four-point star (the Dreamward north star) centred at (cx, cy). */
export function starPath(cx: number, cy: number, h: number, w = h * 0.67, inner = h * 0.146): string {
  const p = (x: number, y: number) => `${round(x)} ${round(y)}`;
  return `M${p(cx, cy - h)} L${p(cx + inner, cy - inner)} L${p(cx + w, cy)} L${p(cx + inner, cy + inner)} L${p(cx, cy + h)} L${p(cx - inner, cy + inner)} L${p(cx - w, cy)} L${p(cx - inner, cy - inner)} Z`;
}

/** A field of stars inside a box, avoiding nothing in particular. */
export function starfield(seed: number, count: number, w: number, h: number) {
  const rnd = prng(seed);
  return Array.from({ length: count }, (_, i) => ({
    x: round(rnd() * w),
    y: round(rnd() * h),
    r: round(0.5 + rnd() * rnd() * 1.6),
    o: round(0.25 + rnd() * 0.6),
    twinkle: i % 4 === 0,
    delay: round(rnd() * 4),
  }));
}
