import { useEffect, useRef, useCallback } from 'react';
import { useScrubProgress } from '@/lib/useScrubProgress';
import { useChapterReveal } from '@/lib/useChapterReveal';
import { power2Out, power3Out, seg, ease } from '@/lib/easing';
import GfParticleDissolve from '@/components/GfParticleDissolve';
import GfAmbientParticles from '@/components/GfAmbientParticles';
import waterfrontImg from '@/assets/waterfront.jpg';

const WARM_DURATION = 1800;

// Title characters — split into per-span fragments so we can stagger each
// glyph through a sub-range of the scrub progress.
const TITLE_CHARS = [
  { ch: '广', gold: false },
  { ch: '府', gold: false },
  { ch: '雅', gold: true },
  { ch: '韵', gold: true },
];

/**
 * Chapter 01 — "广府雅韵" (Guangfu Elegance)
 *
 * A pinned, scrub-driven chapter. As the user scrolls through the 220vh
 * outer section, the inner 100vh content animates through 4 phases, each
 * eased with `power2Out` instead of a raw linear blend so motion trails off
 * softly. Three depth layers (background image / overlay / glow) advance at
 * different rates for true parallax.
 *
 *   0%–30% : layered push-in (background / mid / front scale at different speeds)
 *   30%–60%: rotation + vignette + title fade
 *   60%–85%: layered scale + particle dissolve ramps up
 *   85%–100%: fully dissolved, central white light expands (with breath at rest)
 */
export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);
  const midLayerRef = useRef<HTMLDivElement>(null);
  const frontLayerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const titleWrapRef = useRef<HTMLDivElement>(null);
  const titleCharRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const subRef = useRef<HTMLDivElement>(null);
  const lightRef = useRef<HTMLDivElement>(null);
  const warmthBgRef = useRef<HTMLDivElement>(null);

  const startTimeRef = useRef(0);
  const warmthRafRef = useRef(0);

  const { progress } = useScrubProgress(sectionRef, {
    range: 'full',
    lead: 1,
    smoothing: 0.08,
  });

  // Whole-chapter scroll-driven fade + scale envelope (entering + leaving).
  useChapterReveal(sectionRef, innerRef);

  // Apply scrub-driven visual state to refs each progress change.
  useEffect(() => {
    applyScrubState(progress);
  }, [progress]);

  // ── First-paint force-refresh ──
  // The scrub effect above runs on `progress` changes, but on initial mount
  // progress may stay at 0 across the first frames, and React's strict-mode
  // double-mount + the smoothing lerp can cause the very first paint to land
  // before refs are styled. Force one synchronous application after refs are
  // attached so the first visible frame already matches progress=0 state.
  useEffect(() => {
    applyScrubState(0);
    // Re-apply after the next frame — fonts and layout can settle async,
    // and refs created during the same render pass may not be flushed yet.
    const raf1 = requestAnimationFrame(() => applyScrubState(0));
    const raf2 = requestAnimationFrame(() => requestAnimationFrame(() => applyScrubState(0)));
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, []);

  // Pure function: maps a scrub progress value to DOM styles. Hoisted out so
  // both the scrub effect and the first-paint force-refresh can call it.
  // Soft, Apple-style scroll-away: the hero gently lifts, dims, and blurs —
  // no full-screen veil, so the next chapter's content is always readable
  // as it slides up beneath.
  function applyScrubState(p: number) {
    const p1 = seg(p, 0, 0.6);
    const p2 = seg(p, 0.4, 1);

    const e1 = power2Out(p1);
    const e2 = power3Out(p2);

    // Subtle scale-up — depth without consuming the screen.
    const sBack = 1 + e1 * 0.08;
    const sMid = 1 + e1 * 0.12;
    const sFront = 1 + e1 * 0.16;

    // Whole-hero lift + opacity falloff so the next section reads through.
    const lift = e1 * -40;
    const blur = e2 * 2;
    const vignette = 0.15 + e2 * 0.1;

    if (imgRef.current) {
      imgRef.current.style.transform = `translate3d(0, ${(lift * 0.3).toFixed(2)}px, 0) scale(${sBack.toFixed(3)})`;
      imgRef.current.style.filter = `blur(${blur.toFixed(2)}px) brightness(${(1 - e2 * 0.1).toFixed(3)})`;
    }
    if (midLayerRef.current) {
      midLayerRef.current.style.transform = `translate3d(0, ${(lift * 0.6).toFixed(2)}px, 0) scale(${sMid.toFixed(3)})`;
      midLayerRef.current.style.opacity = String(0.6 - e2 * 0.2);
    }
    if (frontLayerRef.current) {
      frontLayerRef.current.style.transform = `translate3d(0, ${lift.toFixed(2)}px, 0) scale(${sFront.toFixed(3)})`;
      frontLayerRef.current.style.opacity = String(0.3 + e1 * 0.4 - e2 * 0.3);
    }
    if (overlayRef.current) {
      overlayRef.current.style.background = `radial-gradient(ellipse at center, rgba(0,0,0,0) ${Math.max(0, 35 - vignette * 35)}%, rgba(0,0,0,${vignette}) 100%)`;
    }

    // ── Title per-char fade-OUT only. The fade-IN is handled by an
    //    independent CSS keyframe (gfTitleCharIn) so the title is visible
    //    on the very first frame; scrub takes over only once the user
    //    starts scrolling past the hero. We deliberately do NOT write
    //    char opacity/transform below ≈ 0.30 progress — that would
    //    override the CSS entrance and re-create the "missing title" bug.
    if (p > 0.3) {
      const fadeOut = ease(p, 0.3, 1, power3Out) * 0.85;
      TITLE_CHARS.forEach((_c, i) => {
        const el = titleCharRefs.current[i];
        if (!el) return;
        el.style.opacity = String(1 - fadeOut);
      });
    }
    // Whole-title fade + lift begins after p2 starts.
    if (titleWrapRef.current) {
      const titleOpacity = Math.max(0, 1 - e2 * 0.8);
      const titleLift = e1 * -10 + e2 * -30;
      titleWrapRef.current.style.opacity = String(titleOpacity);
      titleWrapRef.current.style.transform = `translateY(${titleLift}px)`;
    }
    if (subRef.current) {
      const subOpacity = Math.max(0, 1 - e1 * 0.6 - e2 * 0.4);
      subRef.current.style.opacity = String(subOpacity);
    }

    // Central light kept dormant — no full-screen takeover.
    if (lightRef.current) {
      lightRef.current.style.opacity = '0';
    }
  }

  // ── Entry warmth: 1.8s ease-out 0 → 1 on first paint, before scrub ──
  const animateWarm = useCallback((ts: number) => {
    if (!startTimeRef.current) startTimeRef.current = ts;
    const elapsed = ts - startTimeRef.current;
    const t = Math.min(elapsed / WARM_DURATION, 1);
    const eased = 1 - Math.pow(1 - t, 2.5);
    const w = eased;
    document.documentElement.style.setProperty('--gf-warmth', String(w));
    if (warmthBgRef.current) {
      applyWarmth(warmthBgRef.current, w);
    }
    if (t < 1) {
      warmthRafRef.current = requestAnimationFrame(animateWarm);
    } else {
      document.dispatchEvent(new CustomEvent('hero-warm-done'));
    }
  }, []);

  useEffect(() => {
    warmthRafRef.current = requestAnimationFrame(animateWarm);
    return () => cancelAnimationFrame(warmthRafRef.current);
  }, [animateWarm]);

  // Particle dissolve retired — it covered the screen during the chapter
  // exit and hid the actual content. Hero now scroll-aways softly instead.
  const dissolveActive = false;
  const dissolveProgress = 0;

  return (
    <section
      ref={sectionRef}
      id="chapter-01"
      data-chapter="01"
      data-title="广府雅韵"
      className="gf-chapter"
      style={{
        position: 'relative',
        height: '130vh',
        width: '100%',
        background: 'transparent',
      }}
    >
      <div
        ref={innerRef}
        className="gf-chapter-reveal-wrap"
        style={{
          position: 'absolute',
          inset: 0,
          willChange: 'opacity, transform',
        }}
      >
      <div
        className="gf-chapter-inner"
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          width: '100%',
          overflow: 'hidden',
        }}
      >
        {/* Background image layer (slowest parallax) */}
        <div
          ref={imgRef}
          style={{
            position: 'absolute',
            inset: '-5%',
            backgroundImage: `url('${waterfrontImg}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transform: 'translate3d(0,0,0) scale(1)',
            willChange: 'transform, filter',
            transition: 'none',
          }}
        />

        {/* Mid layer — atmospheric haze, scales faster, rotates more.
            Implemented as a soft gradient wash since we don't have a
            dedicated haze PNG asset. */}
        <div
          ref={midLayerRef}
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: '-10%',
            background:
              'radial-gradient(ellipse at 50% 70%, rgba(120,90,40,0.18) 0%, rgba(80,60,30,0.10) 35%, transparent 65%)',
            mixBlendMode: 'screen',
            willChange: 'transform, opacity',
          }}
        />

        {/* Front layer — golden light particles (fastest parallax) */}
        <div
          ref={frontLayerRef}
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: '-8%',
            background:
              'radial-gradient(ellipse at 50% 45%, rgba(245,220,150,0.20) 0%, rgba(201,168,76,0.08) 30%, transparent 60%)',
            mixBlendMode: 'screen',
            willChange: 'transform, opacity',
          }}
        />

        {/* Warmth overlay (entry-time) */}
        <div
          ref={warmthBgRef}
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background:
              'linear-gradient(to bottom, rgba(38,30,22,0.35) 0%, rgba(38,30,22,0.55) 50%, rgba(38,30,22,0.85) 100%)',
          }}
        />

        {/* Vignette / color overlay (scrub-driven) */}
        <div
          ref={overlayRef}
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background:
              'radial-gradient(ellipse at center, rgba(0,0,0,0) 35%, rgba(0,0,0,0.15) 100%)',
          }}
        />

        {/* Warm center glow (carried over from the old hero) */}
        <div
          ref={glowRef}
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background:
              'radial-gradient(ellipse at center, rgba(201,168,76,0.04) 0%, transparent 60%)',
          }}
        />

        {/* Ambient golden dust — visible from frame one (progress = 0),
            fades as the dissolve takes over so the two systems hand off. */}
        <GfAmbientParticles
          count={110}
          opacity={Math.max(0, 0.55 * (1 - progress * 1.6))}
          minSize={0.5}
          maxSize={2.6}
          driftX={22}
          driftY={26}
          style={{ zIndex: 3 }}
        />

        {/* Particle dissolve layer — uses the new 'gradual' 4-stage curve */}
        {dissolveActive && (
          <GfParticleDissolve
            src={waterfrontImg}
            progress={dissolveProgress}
            alt="广府建筑渲染图粒子化"
            sampleStep={9}
            maxParticles={1800}
            maxDrift={200}
            active={dissolveActive}
            progressCurve="gradual"
            style={{ opacity: Math.min(1, (progress - 0.55) * 5) }}
          />
        )}

        {/* Title + subtitle. Title wraps in a CSS entrance (opacity/transform),
            scrub only fades it out later. Per-char CSS keyframe gives the
            staggered rise independently of scroll. */}
        <div
          ref={titleWrapRef}
          className="relative z-[4] text-center"
          style={{
            position: 'absolute',
            top: '38%',
            left: 0,
            right: 0,
            opacity: 1,
            animation: 'gfHeroIn 1.6s cubic-bezier(0.25,0.1,0.25,1) 0.3s both',
            willChange: 'transform, opacity',
          }}
        >
          <div
            className="text-[11px] tracking-[0.32em] mb-5 font-light"
            style={{ color: 'var(--gf-cold-accent)', opacity: 0.7 }}
          >
            GUANGFU CULTURAL EXPERIENCE PAVILION
          </div>
          <h1 className="font-['Noto_Serif_SC'] text-[clamp(48px,8vw,96px)] font-light leading-[1.05] tracking-[0.08em] mb-4 flex justify-center">
            {TITLE_CHARS.map((c, i) => (
              <span
                key={i}
                ref={(el) => { titleCharRefs.current[i] = el; }}
                style={{
                  display: 'inline-block',
                  opacity: 0,
                  willChange: 'transform, opacity',
                  color: c.gold ? 'var(--gf-gold)' : 'inherit',
                  fontStyle: 'normal',
                  animation: `gfTitleCharIn 0.9s cubic-bezier(0.25,0.1,0.25,1) ${0.5 + i * 0.08}s both`,
                }}
              >
                {c.ch}
              </span>
            ))}
          </h1>
        </div>

        <div
          ref={subRef}
          className="relative z-[4] text-center"
          style={{
            position: 'absolute',
            top: '58%',
            left: 0,
            right: 0,
            opacity: 0,
            animation: 'gfHeroIn 1.6s cubic-bezier(0.25,0.1,0.25,1) 0.9s forwards',
            willChange: 'opacity',
          }}
        >
          <div
            className="text-sm tracking-[0.22em] font-light"
            style={{ color: 'rgba(245,240,232,0.4)' }}
          >
            广府文化体验 · 感官随行
          </div>
        </div>

        {/* Central white light — only visible from 85% → 100% */}
        <div
          ref={lightRef}
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '30vw',
            height: '30vw',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,250,230,0.7) 25%, rgba(201,168,76,0.3) 55%, transparent 75%)',
            opacity: 0,
            zIndex: 5,
            pointerEvents: 'none',
            filter: 'blur(4px)',
          }}
        />

        {/* Scroll hint — only when progress ≈ 0 */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: '32px',
            left: '50%',
            transform: 'translateX(-50%)',
            opacity: Math.max(0, 1 - progress * 8),
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            zIndex: 4,
            pointerEvents: 'none',
            transition: 'opacity 0.3s linear',
          }}
        >
          <div
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: '10px',
              letterSpacing: '0.32em',
              color: 'rgba(245,240,232,0.45)',
            }}
          >
            SCROLL
          </div>
          <svg width="14" height="22" viewBox="0 0 14 22" fill="none">
            <path
              d="M7 1 L7 19 M2 14 L7 19 L12 14"
              stroke="rgba(201,168,76,0.55)"
              strokeWidth="1"
              fill="none"
            />
          </svg>
        </div>

        {/* Chapter index label, top-right (subtle) */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 'max(80px, 12vh)',
            left: 'max(28px, 4vw)',
            display: 'flex',
            alignItems: 'baseline',
            gap: '10px',
            zIndex: 4,
            pointerEvents: 'none',
            opacity: Math.max(0, 1 - progress * 4),
            transition: 'opacity 0.3s linear',
          }}
        >
          <span
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: '11px',
              letterSpacing: '0.4em',
              color: 'var(--gf-gold)',
              opacity: 0.7,
            }}
          >
            CHAPTER
          </span>
          <span
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: '32px',
              color: 'var(--gf-gold)',
              lineHeight: 1,
            }}
          >
            01
          </span>
          <span
            style={{
              fontFamily: "'Noto Serif SC', serif",
              fontSize: '12px',
              letterSpacing: '0.25em',
              color: 'rgba(245,240,232,0.45)',
              marginLeft: '6px',
            }}
          >
            广府雅韵
          </span>
        </div>
      </div>
      </div>
    </section>
  );
}

// Apply the warmth gradient to the warmth-bg overlay. Extracted so the
// animateWarm RAF callback can drive it without re-creating closures.
function applyWarmth(el: HTMLDivElement, w: number) {
  const r = 38 + w * 6;
  const g = 30 + w * 6;
  const b = 22 - w * 4;
  el.style.background = `linear-gradient(to bottom,
    rgba(${r}, ${g}, ${b}, ${0.38 - w * 0.32}) 0%,
    rgba(${r}, ${g}, ${b}, ${0.55 - w * 0.35}) 50%,
    rgba(${r}, ${g}, ${b}, ${0.85 - w * 0.2}) 100%)`;
}
