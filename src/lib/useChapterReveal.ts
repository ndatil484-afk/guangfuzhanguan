import { useEffect, useRef, type RefObject } from 'react';

/**
 * Scroll-driven chapter reveal envelope.
 *
 * Drives ONE thing: a soft Apple-style opacity + scale wrap applied to a
 * NON-sticky wrapper around the chapter's content. As the chapter scrolls
 * into the viewport it fades+scales in; as it scrolls out the top it
 * fades+scales out (slightly enlarged), handing off to the next chapter.
 * While the chapter is centered/pinned the envelope sits at opacity:1,
 * scale:1 — perfectly still, internal scrub animations untouched.
 *
 *  ⚠️  The `targetRef` MUST point at a NON-sticky element. Applying
 *     `transform` directly to a `position: sticky` element breaks the
 *     sticky behaviour in most browsers, which is why callers wrap their
 *     sticky-inner in a plain `<div ref={revealRef}>`.
 *
 * Mapping — driven by the section's TOP edge for enter and BOTTOM edge for
 * exit (NOT the centre), so tall pinned chapters (160vh+) are fully
 * visible the moment they pin, instead of staying at opacity:0 until
 * their distant centre crosses the viewport centre (which renders them
 * as a blank colour block for most of the approach):
 *
 *   sectionTop:    vh → vh/2   (enter band)   opacity 0→1, scale 0.88→1
 *   pinned                          (hold)     opacity 1,   scale 1
 *   sectionBottom: vh → 0      (exit band)    opacity 1→0, scale 1→1.08
 *
 * Properties:
 *  - Scroll-driven only. No timers, no CSS animations, no rAF loops —
 *    just a rAF-batched scroll listener that writes `opacity`/`transform`
 *    directly. Stop scrolling = the style freezes at the current value.
 *  - Zero React re-renders.
 *  - Disabled (frozen at opacity:1, scale:1) under prefers-reduced-motion.
 */
export function useChapterReveal(
  sectionRef: RefObject<HTMLElement>,
  targetRef: RefObject<HTMLElement>,
  options: { scaleIn?: number; scaleOut?: number } = {},
) {
  const { scaleIn = 0.88, scaleOut = 1.08 } = options;
  const rafRef = useRef(0);

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      const el = targetRef.current;
      if (el) {
        el.style.opacity = '1';
        el.style.transform = 'none';
        el.style.transformOrigin = 'center center';
        el.style.willChange = 'auto';
      }
      return;
    }

    const apply = () => {
      rafRef.current = 0;
      const section = sectionRef.current;
      const target = targetRef.current;
      if (!section || !target) return;

      const vh = window.innerHeight;
      const rect = section.getBoundingClientRect();

      // ENTER — keyed to the section's TOP edge, not its center, so tall
      // pinned chapters (e.g. 160vh+) are fully visible as soon as their
      // top is comfortably inside the viewport. This is what makes the
      // chapter readable the moment it pins, instead of staying at
      // opacity:0 until its (very distant) center crosses the viewport
      // centre (which leaves a long stretch of "blank colour block").
      //   top = vh            → enter 0 (section just peeking into view at the bottom)
      //   top = vh * 0.6      → enter 1 (top has risen past 40% of viewport)
      const enterStart = vh;
      const enterEnd = vh * 0.6;
      const enter = clamp01((enterStart - rect.top) / (enterStart - enterEnd));

      // EXIT — keyed to the section's BOTTOM edge. While the pinned inner
      // is sticky on screen the section's bottom is still far below, so
      // exit stays 0; only when the section actually scrolls out the top
      // does it advance.
      //   bottom = vh         → exit 0
      //   bottom = 0          → exit 1
      const exit = clamp01((vh - rect.bottom) / vh);

      const opacity = Math.min(enter, 1 - exit);
      const scale = scaleIn + (1 - scaleIn) * enter + (scaleOut - 1) * exit;

      target.style.opacity = opacity.toFixed(4);
      target.style.transform = `scale(${scale.toFixed(4)})`;
      target.style.transformOrigin = 'center center';
      target.style.willChange = 'opacity, transform';
    };

    const onScroll = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [sectionRef, targetRef, scaleIn, scaleOut]);
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}
