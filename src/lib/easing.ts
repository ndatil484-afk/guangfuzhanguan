/**
 * Unified easing library.
 *
 * All site-wide scroll-driven animations should pull from here instead of
 * declaring inline `easeOutBack` / `easeInOut` copies. Mirrors the names used
 * by GSAP so the design vocabulary stays consistent if the team ever migrates.
 */

export type EasingFn = (t: number) => number;

export const powerIn =
  (n: number): EasingFn =>
  (t) =>
    Math.pow(t, n);

export const powerOut =
  (n: number): EasingFn =>
  (t) =>
    1 - Math.pow(1 - t, n);

export const powerInOut =
  (n: number): EasingFn =>
  (t) =>
    t < 0.5
      ? Math.pow(2, n - 1) * Math.pow(t, n)
      : 1 - Math.pow(-2 * t + 2, n) / 2;

export const power2In = powerIn(2);
export const power2Out = powerOut(2);
export const power2InOut = powerInOut(2);
export const power3In = powerIn(3);
export const power3Out = powerOut(3);
export const power3InOut = powerInOut(3);
export const power4Out = powerOut(4);

export const backOut =
  (s = 1.70158): EasingFn =>
  (t) => {
    const c1 = s;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  };

export const backInOut =
  (s = 1.70158): EasingFn =>
  (t) => {
    const c1 = s * 1.525;
    const c3 = c1 + 1;
    return t < 0.5
      ? (Math.pow(2 * t, 2) * ((c3 + 1) * 2 * t - c3)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c3 + 1) * (t * 2 - 2) + c3) + 2) / 2;
  };

export const elasticOut =
  (amp = 1, period = 0.5): EasingFn =>
  (t) => {
    if (t === 0 || t === 1) return t;
    const p = 1 - period;
    return (
      Math.pow(2, -10 * t) * Math.sin(((t - p / 4) * (2 * Math.PI)) / p) * amp +
      1
    );
  };

export const elasticInOut =
  (amp = 1, period = 0.5): EasingFn =>
  (t) => {
    if (t === 0 || t === 1) return t;
    const p = 1 - period;
    const scaled = t < 0.5 ? 2 * t : 2 * (1 - t);
    const wave =
      Math.pow(2, 10 * (scaled - 1)) *
      Math.sin(((scaled - p / 4) * (2 * Math.PI)) / p) *
      amp;
    return t < 0.5 ? (wave - 1) / 2 + 0.5 : 1 - (wave - 1) / 2;
  };

export const expoOut = (t: number) =>
  t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

export const expoIn = (t: number) =>
  t === 0 ? 0 : Math.pow(2, 10 * t - 10);

export const expoInOut = (t: number) => {
  if (t === 0 || t === 1) return t;
  return t < 0.5
    ? Math.pow(2, 20 * t - 10) / 2
    : (2 - Math.pow(2, -20 * t + 10)) / 2;
};

export const sineInOut = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

export const linear = (t: number) => t;

/**
 * Linear interpolation helper — kept here so all animation math lives in one
 * module.
 */
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Clamp a 0..1 progress to a [start,end] window. Returns 0 below start, 1
 * above end, and a linear 0..1 in between. The basis of every scrub-driven
 * segment throughout the chapters.
 */
export function seg(p: number, start: number, end: number): number {
  if (end <= start) return p <= start ? 0 : 1;
  const t = (p - start) / (end - start);
  return Math.max(0, Math.min(1, t));
}

/**
 * Map a 0..1 progress through a window AND apply an easing fn. The most
 * common call site in the codebase, e.g.:
 *   const p1 = ease(progress, 0, 0.3, power2Out);
 */
export function ease(
  p: number,
  start: number,
  end: number,
  fn: EasingFn = linear,
): number {
  return fn(seg(p, start, end));
}
