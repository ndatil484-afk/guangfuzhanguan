import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

export type ScrubProgressOptions = {
  /**
   * How much of the scroll range maps to the 0→1 progress.
   * - 'full' (default): progress reaches 1 only when the section's bottom
   *   hits the viewport bottom (i.e. the section has fully scrolled past).
   * - 'center': progress hits 1 when the section center crosses viewport
   *   center; useful for shorter "snapshot" sections.
   */
  range?: 'full' | 'center';
  /**
   * Clamp progress to [0,1] (default true). When false, progress can go
   * negative or above 1 so callers can implement pre/post states.
   */
  clamp?: boolean;
  /**
   * Lead-in: shift the progress start earlier by this fraction of viewport
   * height. With lead=0.5, the section's progress begins advancing when its
   * top is still 0.5vh below the viewport top (i.e. during the brief moment
   * when the previous sticky chapter is releasing but the next hasn't fully
   * pinned yet). Eliminates the visual "blank gap" between sticky chapters.
   * Default 0 (no lead).
   */
  lead?: number;
  /**
   * Initial progress offset. When set (>0), the section's progress is
   * pre-advanced by this fraction on entry, so that when the chapter pins
   * (its top reaches viewport top) the visual state is already past the
   * "intro animation" phase — the user sees a settled opening composition
   * rather than a still-animating one. Default 0.
   *
   * Use ~0.08–0.12 so the opening composition is fully landed (intro
   * animations are typically squeezed into the first ~10% of progress).
   */
  initial?: number;
  /**
   * Inertial smoothing factor (0–1, default 0). When >0, the reported
   * progress lags the raw scroll progress and lerps toward it on each frame,
   * giving scrub-driven animations a soft trailing feel instead of a 1:1
   * bind to the scroll position.
   *
   * Recommended range: 0.05–0.1. At 0.08 progress takes ~6 frames (~100ms)
   * to converge after a sudden scroll jump. Anything above ~0.15 starts to
   * feel sluggish and disconnected from the user's input.
   *
   * Disabled automatically under `prefers-reduced-motion: reduce`.
   */
  smoothing?: number;
};

export type ScrubProgressApi = {
  /** Current 0-1 (or unclamped) progress through the section. */
  progress: number;
  /** Whether the section is currently in view (any part visible). */
  inView: boolean;
};

/**
 * Track the scroll-driven progress through a sticky-pinned section.
 *
 * Designed to drive "ScrollTrigger-like" pinned chapter animations:
 * the section is `height: 220vh` (or similar) with its inner content
 * `position: sticky; top: 0; height: 100vh`. As the user scrolls through
 * the section's 120vh of "extra" scroll, this hook emits progress 0→1.
 *
 * The same hook works whether the browser supports native CSS
 * Scroll-Driven Animations or not — we always compute progress in JS
 * for two reasons:
 *   1. So Canvas-based effects (particle dissolve) can be driven by it
 *   2. As a uniform fallback for Safari < 17.4
 */
export function useScrubProgress(
  sectionRef: RefObject<HTMLElement>,
  options: ScrubProgressOptions = {},
): ScrubProgressApi {
  const {
    range = 'full',
    clamp = true,
    lead = 0,
    initial = 0,
    smoothing = 0,
  } = options;
  const [progress, setProgress] = useState(0);
  const [inView, setInView] = useState(false);
  const rafRef = useRef(0);
  const sectionElRef = sectionRef;

  // Raw (unsmoothed) progress and the displayed (lerped) progress are kept
  // in refs to avoid re-renders inside the animation frame loop.
  const rawRef = useRef(0);
  const displayedRef = useRef(0);
  const lerpRafRef = useRef(0);
  const smoothingRef = useRef(smoothing);
  useEffect(() => {
    smoothingRef.current =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 0
        : smoothing;
  }, [smoothing]);

  // Lerp loop — runs continuously while displayed has not converged to raw.
  const lerpTick = useCallback(() => {
    lerpRafRef.current = 0;
    const target = rawRef.current;
    const cur = displayedRef.current;
    // smoothing is in 0..1 — convert to a per-frame catch-up factor.
    // At smoothing=0.08, factor ≈ 0.49 per frame at 60fps → ~6 frames to converge.
    const factor = Math.min(1, smoothingRef.current * 8);
    const next = cur + (target - cur) * factor;
    displayedRef.current = next;
    setProgress(next);
    if (Math.abs(target - next) > 0.0005) {
      lerpRafRef.current = requestAnimationFrame(lerpTick);
    } else {
      displayedRef.current = target;
      setProgress(target);
    }
  }, []);

  const compute = useCallback(() => {
    rafRef.current = 0;
    const el = sectionElRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const sectionH = rect.height;

    const leadPx = lead * vh;
    const scrollable = Math.max(1, sectionH - vh);
    const traveled = -rect.top + leadPx;

    let p = traveled / scrollable;
    p += initial;
    if (range === 'center') {
      const center = rect.top + sectionH / 2;
      p = (vh / 2 - center) / (sectionH / 2 - vh / 2) * -1 + 0.5;
      p = (p - 0.5) * 2 + 0.5;
    }
    if (clamp) p = Math.max(0, Math.min(1, p));

    rawRef.current = p;
    const sm = smoothingRef.current;
    if (sm <= 0) {
      displayedRef.current = p;
      setProgress(p);
    } else if (!lerpRafRef.current) {
      // Kick off a rAF-driven lerp toward the raw target.
      lerpRafRef.current = requestAnimationFrame(lerpTick);
    }

    const visible = rect.bottom > 0 && rect.top < vh;
    setInView(visible);
  }, [sectionElRef, range, clamp, lead, initial, lerpTick]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const onScroll = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(compute);
    };

    compute();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (lerpRafRef.current) cancelAnimationFrame(lerpRafRef.current);
    };
  }, [sectionRef, compute, lerpTick]);

  return { progress, inView };
}

/**
 * Detect once whether the browser supports native CSS Scroll-Driven
 * Animations. Used by CSS-driven effects to decide whether to opt in.
 */
export function supportsScrollDrivenAnimations(): boolean {
  if (typeof window === 'undefined') return false;
  const sample = document.createElement('div');
  // animationTimeline isn't in TS's lib.dom yet — access via unknown cast.
  const style = sample.style as unknown as Partial<Record<string, string>>;
  style.animationTimeline = 'view()';
  return Boolean(style.animationTimeline && style.animationTimeline !== '');
}
