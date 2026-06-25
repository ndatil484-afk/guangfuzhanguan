import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

export type PageScrollOptions = {
  count: number;
  /** Anchor prefix, e.g. "page" → #/page1, #/page2. */
  anchorPrefix?: string;
  /** Enable keyboard arrow / PageUp / PageDown / Home / End navigation. */
  enableKeyboard?: boolean;
  /** Intersection ratio above which a slide is considered "current". */
  activateRatio?: number;
};

export type PageScrollApi = {
  /** Current 0-indexed page. */
  current: number;
  /** Programmatically flip to a page (0-indexed), with smooth snap. */
  goTo: (idx: number) => void;
  /** Flip to the next page if possible. */
  next: () => void;
  /** Flip to the previous page if possible. */
  prev: () => void;
};

/**
 * Lightweight page observer for native CSS Scroll Snap layouts.
 *
 * Does NOT hijack wheel/touch — the browser handles snap transitions natively,
 * giving a smooth 0.6-0.8s slide. This hook only:
 *   • tracks the active slide via IntersectionObserver
 *   • syncs the active index to a URL hash anchor
 *   • wires keyboard navigation
 *   • exposes a programmatic goTo()
 *
 * Emits `document` events of type `page-change` with `{ from, to }` so
 * downstream effects (parallax, layered reveals) can hook in.
 */
export function usePageScroll(
  containerRef: RefObject<HTMLElement>,
  options: PageScrollOptions,
): PageScrollApi {
  const {
    count,
    anchorPrefix = 'page',
    enableKeyboard = true,
    activateRatio = 0.55,
  } = options;

  const [current, setCurrent] = useState(0);
  const currentRef = useRef(0);

  const sanitizeIdx = useCallback(
    (idx: number) => Math.max(0, Math.min(count - 1, idx)),
    [count],
  );

  const applyCurrent = useCallback(
    (next: number) => {
      const safe = sanitizeIdx(next);
      if (safe === currentRef.current) return;
      const from = currentRef.current;
      currentRef.current = safe;
      setCurrent(safe);

      if (typeof window !== 'undefined') {
        const target = `#/${anchorPrefix}${safe + 1}`;
        if (window.location.hash !== target) {
          try {
            history.replaceState(null, '', target);
          } catch {
            /* ignore */
          }
        }
      }

      document.dispatchEvent(
        new CustomEvent('page-change', { detail: { from, to: safe } }),
      );
    },
    [anchorPrefix, sanitizeIdx],
  );

  const goTo = useCallback(
    (idx: number) => {
      const container = containerRef.current;
      if (!container) return;
      const safe = sanitizeIdx(idx);
      const slide = container.children[safe] as HTMLElement | undefined;
      if (slide) {
        container.scrollTo({ top: slide.offsetTop, behavior: 'smooth' });
      }
    },
    [containerRef, sanitizeIdx],
  );

  const next = useCallback(() => goTo(currentRef.current + 1), [goTo]);
  const prev = useCallback(() => goTo(currentRef.current - 1), [goTo]);

  // Observe slides to track the current one.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let bestIdx = currentRef.current;
        let bestRatio = 0;
        for (const entry of entries) {
          if (entry.intersectionRatio > bestRatio) {
            bestRatio = entry.intersectionRatio;
            const idx = Array.prototype.indexOf.call(container.children, entry.target);
            if (idx >= 0) bestIdx = idx;
          }
        }
        if (bestRatio >= activateRatio * 0.5 && bestIdx !== currentRef.current) {
          applyCurrent(bestIdx);
        }
      },
      { root: container, threshold: [0.3, 0.5, 0.7, 0.9] },
    );

    Array.from(container.children).forEach((child) => observer.observe(child));

    return () => observer.disconnect();
  }, [containerRef, applyCurrent, activateRatio]);

  // Restore from URL hash on mount.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash;
    const match = hash.match(new RegExp(`#/${anchorPrefix}(\\d+)`));
    if (match) {
      const idx = sanitizeIdx(parseInt(match[1], 10) - 1);
      if (idx !== 0) {
        currentRef.current = idx;
        setCurrent(idx);
        const container = containerRef.current;
        if (container) {
          const slide = container.children[idx] as HTMLElement | undefined;
          if (slide) container.scrollTo({ top: slide.offsetTop });
        }
      }
    }
  }, []);

  // Keyboard navigation.
  useEffect(() => {
    if (!enableKeyboard) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      switch (e.key) {
        case 'ArrowDown':
        case 'PageDown':
          e.preventDefault();
          next();
          break;
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault();
          prev();
          break;
        case 'Home':
          e.preventDefault();
          goTo(0);
          break;
        case 'End':
          e.preventDefault();
          goTo(count - 1);
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enableKeyboard, next, prev, goTo, count]);

  return { current, goTo, next, prev };
}
