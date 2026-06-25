import { useEffect, useRef, useCallback, useState } from 'react';
import { useSmoothScroll } from '@/lib/useSmoothScroll';
import GfNavbar from '@/components/GfNavbar';
import GfPageDots from '@/components/GfPageDots';
import HeroSection from './guangfu/HeroSection';
import ResearchSection from './guangfu/ResearchSection';
import ResearchBackgroundSection from './guangfu/ResearchBackgroundSection';
import CultureSection from './guangfu/CultureSection';
import FourActsSection from './guangfu/FourActsSection';
import MaterialsSection from './guangfu/MaterialsSection';
import LightSystemSection from './guangfu/LightSystemSection';
import ColorTempSection from './guangfu/ColorTempSection';
import TeamSection from './guangfu/TeamSection';
import './guangfu/guangfu.css';

const CHAPTERS = [
  { id: 'chapter-01', label: '广府雅韵', index: '01' },
  { id: 'chapter-02', label: '文化背景', index: '02' },
  { id: 'chapter-03', label: '调研背景', index: '03' },
  { id: 'chapter-04', label: '符号提取', index: '04' },
  { id: 'chapter-05', label: '设计转译', index: '05' },
  { id: 'chapter-06', label: '材料', index: '06' },
  { id: 'chapter-07', label: '空间体验', index: '07' },
  { id: 'chapter-08', label: '团队介绍', index: '08' },
];

const PAGE_LABELS = CHAPTERS.map((c) => c.label);

export default function GuangfuPage() {
  // Lenis smooth-scroll — mounts a single instance for the whole experience.
  useSmoothScroll();

  const mainRef = useRef<HTMLElement>(null);
  const curRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const mxRef = useRef(0);
  const myRef = useRef(0);
  const rxRef = useRef(0);
  const ryRef = useRef(0);

  // Warmth system
  const currentWarmthRef = useRef(0);
  const warmthTargetRef = useRef(0);
  const warmthTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const warmthRafRef = useRef<number>(0);

  // Chapter tracking + overall progress.
  const [currentChapter, setCurrentChapter] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const chapterProxiesRef = useRef<Array<HTMLElement | null>>([]);

  const goToChapter = useCallback((idx: number) => {
    const safe = Math.max(0, Math.min(CHAPTERS.length - 1, idx));
    const el = chapterProxiesRef.current[safe];
    if (el) {
      // 计算目标元素的绝对位置
      const rect = el.getBoundingClientRect();
      const targetTop = rect.top + window.scrollY;

      // 如果元素已经在视口内且高度小于视口，则居中显示
      // 否则滚动到顶部
      const vh = window.innerHeight;
      if (rect.top >= 0 && rect.bottom <= vh) {
        // 已经在视口内，无需滚动
        return;
      }

      window.scrollTo({ top: targetTop, behavior: 'smooth' });
    }
  }, []);

  // Cursor animation
  const animCursor = useCallback(() => {
    const cur = curRef.current;
    const ring = ringRef.current;
    if (!cur || !ring) return;
    cur.style.left = mxRef.current + 'px';
    cur.style.top = myRef.current + 'px';
    rxRef.current += (mxRef.current - rxRef.current) * 0.12;
    ryRef.current += (myRef.current - ryRef.current) * 0.12;
    ring.style.left = rxRef.current + 'px';
    ring.style.top = ryRef.current + 'px';
    requestAnimationFrame(animCursor);
  }, []);

  // Warmth system
  const heroAnimDoneRef = useRef(false);
  const setWarmth = useCallback((v: number) => {
    document.documentElement.style.setProperty('--gf-warmth', String(v));
  }, []);

  const animateWarmth = useCallback(() => {
    const diff = warmthTargetRef.current - currentWarmthRef.current;
    if (Math.abs(diff) < 0.005) {
      currentWarmthRef.current = warmthTargetRef.current;
      setWarmth(currentWarmthRef.current);
      return;
    }
    currentWarmthRef.current += diff * 0.025;
    setWarmth(currentWarmthRef.current);
    warmthRafRef.current = requestAnimationFrame(animateWarmth);
  }, [setWarmth]);

  const startWarming = useCallback(() => {
    clearTimeout(warmthTimerRef.current);
    warmthTargetRef.current = 1;
    cancelAnimationFrame(warmthRafRef.current);
    animateWarmth();
  }, [animateWarmth]);

  const startCooling = useCallback(() => {
    warmthTimerRef.current = setTimeout(() => {
      warmthTargetRef.current = 0;
      cancelAnimationFrame(warmthRafRef.current);
      animateWarmth();
    }, 8000);
  }, [animateWarmth]);

  // Fragrance trigger
  // (Sound + fragrance interactivity was retired when FourActs became a
  // pure scrub-driven chapter — kept warmth system since Hero relies on it.)

  // Listen for hero auto-warm completion
  useEffect(() => {
    const handler = () => { heroAnimDoneRef.current = true; };
    document.addEventListener('hero-warm-done', handler);
    return () => document.removeEventListener('hero-warm-done', handler);
  }, []);

  // Track current chapter + overall scroll progress.
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      const docH = document.documentElement.scrollHeight - vh;
      const sy = window.scrollY;
      const overall = docH > 0 ? Math.max(0, Math.min(1, sy / docH)) : 0;
      setOverallProgress(overall);

      // Pick the current chapter by "topmost chapter whose top edge has
      // crossed into the upper portion of the viewport" rather than by
      // "chapter whose center is nearest the viewport center".
      //
      // Why: Chapter 08 (TeamSection) is 240vh tall — its center sits
      // ~120vh below its top. Under the old center-distance rule, while
      // the user scrolled anywhere inside Chapter 08 (team poster or the
      // appended department intro), Chapter 08's center was still far
      // below the viewport center, so Chapter 07 — whose center was
      // closer — got highlighted instead. The progress rail's active
      // tick therefore appeared stuck on 07 for the entire team chapter.
      //
      // Top-cross rule: a chapter becomes "current" once its top rises
      // above 40% of the viewport height, and stays current until the
      // next chapter's top crosses that line. This keeps the rail in
      // sync with what's actually on screen, including tall pinned
      // chapters and their appended in-chapter sections.
      const threshold = vh * 0.4;
      let bestIdx = 0;
      chapterProxiesRef.current.forEach((el, i) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        if (rect.top <= threshold) {
          bestIdx = i;
        }
      });
      setCurrentChapter(bestIdx);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Keyboard navigation between chapters.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      switch (e.key) {
        case 'ArrowDown':
        case 'PageDown':
          e.preventDefault();
          goToChapter(currentChapter + 1);
          break;
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault();
          goToChapter(currentChapter - 1);
          break;
        case 'Home':
          e.preventDefault();
          goToChapter(0);
          break;
        case 'End':
          e.preventDefault();
          goToChapter(CHAPTERS.length - 1);
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [currentChapter, goToChapter]);

  useEffect(() => {
    const onMouseMove = () => {
      if (!heroAnimDoneRef.current) return;
      startWarming();
      startCooling();
    };
    const onMouseMoveCoords = (e: MouseEvent) => {
      mxRef.current = e.clientX;
      myRef.current = e.clientY;
    };

    document.addEventListener('mousemove', onMouseMoveCoords);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('scroll', onMouseMove, { passive: true });
    requestAnimationFrame(animCursor);

    const grow = () => {
      if (curRef.current) {
        curRef.current.style.width = '20px';
        curRef.current.style.height = '20px';
      }
    };
    const shrink = () => {
      if (curRef.current) {
        curRef.current.style.width = '12px';
        curRef.current.style.height = '12px';
      }
    };

    const interactiveSelector = 'a, button, .gf-color-chip, [data-gallery-card], .gf-page-progress-tick';
    const handleEnter = (e: Event) => {
      const el = e.target as HTMLElement;
      if (el?.matches(interactiveSelector)) grow();
    };
    const handleLeave = (e: Event) => {
      const el = e.target as HTMLElement;
      if (el?.matches(interactiveSelector)) shrink();
    };
    document.addEventListener('mouseover', handleEnter);
    document.addEventListener('mouseout', handleLeave);

    return () => {
      document.removeEventListener('mousemove', onMouseMoveCoords);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('scroll', onMouseMove);
      document.removeEventListener('mouseover', handleEnter);
      document.removeEventListener('mouseout', handleLeave);
      cancelAnimationFrame(warmthRafRef.current);
      clearTimeout(warmthTimerRef.current);
    };
  }, [animCursor, startWarming, startCooling]);

  const setChapterRef = (idx: number) => (el: HTMLElement | null) => {
    chapterProxiesRef.current[idx] = el;
  };

  return (
    <div className="gf-page">
      {/* Custom cursor */}
      <div ref={curRef} className="gf-cursor" />
      <div ref={ringRef} className="gf-cursor-ring" />

      {/* Navigation */}
      <GfNavbar />

      {/* Right progress rail */}
      <GfPageDots
        count={CHAPTERS.length}
        current={currentChapter}
        labels={PAGE_LABELS}
        overallProgress={overallProgress}
        onGoTo={goToChapter}
      />

      {/* Main scrollable flow */}
      <main ref={mainRef} className="gf-flow">
        {/* Chapter 01 — 广府雅韵 (Hero, scrub-driven) */}
        <div ref={setChapterRef(0)}>
          <HeroSection />
        </div>

        {/* Chapter 02 — 文化溯源 */}
        <div ref={setChapterRef(1)}>
          <ResearchSection />
        </div>

        {/* Chapter 03 — 调研背景 */}
        <div ref={setChapterRef(2)}>
          <ResearchBackgroundSection />
        </div>

        {/* Chapter 04 — 符号提取 */}
        <div ref={setChapterRef(3)}>
          <CultureSection />
        </div>

        {/* Chapter 05 — 设计转译 */}
        <div ref={setChapterRef(4)}>
          <FourActsSection />
        </div>

        {/* Chapter 06 — 材料 */}
        <div ref={setChapterRef(5)}>
          <MaterialsSection />
        </div>

        {/* Chapter 07 — 空间体验 */}
        <div ref={setChapterRef(6)}>
          <ColorTempSection />
          <LightSystemSection />
        </div>

        {/* Chapter 08 — 团队介绍 */}
        <div ref={setChapterRef(7)}>
          <TeamSection />
        </div>
      </main>
    </div>
  );
}
