import { useEffect } from 'react';

/**
 * Smooth-scroll that matches keyboard chapter navigation — no dependencies.
 *
 * Two modes, auto-detected per wheel event:
 *
 * 1. **Discrete (mouse wheel / notch)**: each wheel event advances ~85% of
 *    one viewport height, throttled to one jump per 450ms. This puts the
 *    mouse on the same cadence as the keyboard arrows (which already jump
 *    chapter-by-chapter via `goToChapter` in GuangfuPage).
 *
 * 2. **Continuous (trackpad / high-frequency small deltas)**: accumulates
 *    deltas with a 2.0× multiplier + 800px cap, lerps at 0.22. Trackpads
 *    fire 30+ tiny events/sec; treating each as a discrete jump would
 *    rocket through chapters.
 *
 * Mode is decided by looking at the recent event frequency and delta size.
 *
 * Disabled under `prefers-reduced-motion: reduce` and on touch (native
 * momentum is already good).
 */
export function useSmoothScroll(): void {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) return;
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    if (isTouch) return;

    let target = window.scrollY;
    let current = window.scrollY;
    let rafId = 0;
    let active = false;

    // Trackpad detection state.
    let lastWheelTs = 0;
    let recentWheelCount = 0; // events in the current 80ms window
    let windowStartTs = 0;

    // Discrete-mode throttle: ignore events that arrive before the previous
    // jump has settled AND less than DISCRETE_COOLDOWN ms has passed.
    let lastDiscreteJumpTs = 0;

    const DISCRETE_COOLDOWN_MS = 220;
    const DISCRETE_STEP_RATIO = 2.2; // × viewport height per jump — 1 notch ≈ 2 chapters
    const SETTLE_THRESHOLD = 0.5;

    // Continuous-mode tuning.
    const CONTINUOUS_MULTIPLIER = 3.4;
    const CONTINUOUS_MAX_DELTA = 1600;
    const CONTINUOUS_LERP = 0.32;

    // Discrete-mode lerp — fast convergence so a notch lands almost instantly.
    const DISCRETE_LERP = 0.28;

    let currentLerp = CONTINUOUS_LERP;

    const onWheel = (e: WheelEvent) => {
      // Allow ctrl+wheel (browser zoom) and command+wheel through.
      if (e.ctrlKey || e.metaKey) return;
      e.preventDefault();

      const now = performance.now();
      const raw = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;

      // ── Trackpad vs mouse-wheel detection ────────────────────────────
      // Reset the 80ms sliding window if it expired.
      if (now - windowStartTs > 80) {
        recentWheelCount = 0;
        windowStartTs = now;
      }
      recentWheelCount++;

      // Trackpad signature: ≥3 events within 80ms AND small deltas (<60px).
      // Mouse wheel notch: typically 1 event per ~80-120ms with |delta|≥100.
      const isTrackpad = recentWheelCount >= 3 || Math.abs(raw) < 30;

      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

      if (!isTrackpad) {
        // ── Discrete mode: one notch → one near-chapter jump ──────────
        // Throttle: if we're still in cooldown, ignore.
        if (now - lastDiscreteJumpTs < DISCRETE_COOLDOWN_MS) return;
        lastDiscreteJumpTs = now;

        const step = window.innerHeight * DISCRETE_STEP_RATIO;
        const dir = raw >= 0 ? 1 : -1;
        target = Math.max(0, Math.min(target + dir * step, maxScroll));
        currentLerp = DISCRETE_LERP;
      } else {
        // ── Continuous mode: accumulate scaled delta ──────────────────
        const scaled = Math.max(
          -CONTINUOUS_MAX_DELTA,
          Math.min(CONTINUOUS_MAX_DELTA, raw * CONTINUOUS_MULTIPLIER),
        );
        target = Math.max(0, Math.min(target + scaled, maxScroll));
        currentLerp = CONTINUOUS_LERP;
      }

      if (!active) {
        active = true;
        rafId = requestAnimationFrame(tick);
      }
      // Keep lastWheelTs fresh for any future heuristics.
      lastWheelTs = now;
      void lastWheelTs;
    };

    // Keyboard / programmatic scroll — resync target so we don't fight them.
    const onNativeScroll = () => {
      target = window.scrollY;
      current = window.scrollY;
    };

    const tick = () => {
      const diff = target - current;
      if (Math.abs(diff) < SETTLE_THRESHOLD) {
        current = target;
        window.scrollTo(0, current);
        active = false;
        return;
      }
      current += diff * currentLerp;
      window.scrollTo(0, current);
      rafId = requestAnimationFrame(tick);
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('scroll', onNativeScroll, { passive: true });

    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('scroll', onNativeScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);
}
