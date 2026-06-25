import { useEffect, useRef, type CSSProperties } from 'react';

/**
 * Chapter-boundary transition overlay.
 *
 * Mount this inside a chapter's sticky-inner layer; pass the chapter's overall
 * scrub `progress` and the sub-range that corresponds to the very end of the
 * chapter (the "exit" zone). The overlay plays a preset transition over that
 * range and is invisible elsewhere.
 *
 * Variants:
 *   'burst'         — a point explodes outward into particles (Ch2 → Ch3)
 *   'orb-rise'      — a glowing orb lifts upward leaving a light tail (Ch3 → Ch4)
 *   'lines-solidify'— divergent stream-lines tighten into a frame, then a
 *                     blurred image "develops" inside it (Ch4 → Ch5)
 *   'curtain-open'  — a solid veil splits in two halves that pull left/right
 *                     like stage curtains (Ch6 → Ch7)
 *   'flash-decay'   — a bright flash decays leaving a residual halo, with the
 *                     next chapter's content faintly visible through it
 *                     (Ch7 → Ch8)
 */

export type TransitionVariant =
  | 'burst'
  | 'orb-rise'
  | 'lines-solidify'
  | 'curtain-open'
  | 'flash-decay';

type Props = {
  progress: number;
  /** Sub-range within `progress` that maps to the transition's 0→1. */
  start: number;
  end: number;
  variant: TransitionVariant;
  /** Optional image source for variants that need one (lines-solidify). */
  imageSrc?: string;
  zIndex?: number;
  style?: CSSProperties;
};

type Particle = {
  angle: number;
  speed: number;
  size: number;
  hue: number;
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function seg(p: number, s: number, e: number) {
  if (e <= s) return p <= s ? 0 : 1;
  return Math.max(0, Math.min(1, (p - s) / (e - s)));
}

export default function GfTransitionOverlay({
  progress,
  start,
  end,
  variant,
  imageSrc,
  zIndex = 50,
  style,
}: Props) {
  // 'burst' uses a canvas for cheap particle animation.
  const burstCanvasRef = useRef<HTMLCanvasElement>(null);
  const burstParticlesRef = useRef<Particle[]>([]);
  const burstPRef = useRef(0);

  // Keep latest progress in a ref so the canvas RAF loop doesn't restart.
  useEffect(() => {
    burstPRef.current = progress;
  }, [progress]);

  // Burst particles initialization (once).
  useEffect(() => {
    if (variant !== 'burst') return;
    const parts: Particle[] = [];
    for (let i = 0; i < 90; i++) {
      parts.push({
        angle: (i / 90) * Math.PI * 2 + Math.random() * 0.2,
        speed: 0.4 + Math.random() * 1.6,
        size: 1 + Math.random() * 2.4,
        hue: 38 + Math.random() * 20,
      });
    }
    burstParticlesRef.current = parts;
  }, [variant]);

  // Burst canvas RAF loop.
  useEffect(() => {
    if (variant !== 'burst') return;
    const canvas = burstCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const localT = seg(burstPRef.current, start, end);
      ctx.clearRect(0, 0, w, h);
      if (localT <= 0.001) {
        raf = requestAnimationFrame(draw);
        return;
      }
      const cx = w / 2;
      const cy = h / 2;
      const maxR = Math.hypot(w, h) / 2;
      const parts = burstParticlesRef.current;
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        const r = p.speed * localT * maxR * 0.7;
        const x = cx + Math.cos(p.angle) * r;
        const y = cy + Math.sin(p.angle) * r;
        const a = Math.max(0, 1 - localT);
        ctx.fillStyle = `hsla(${p.hue}, 75%, ${60 + p.size * 4}%, ${a * 0.9})`;
        ctx.beginPath();
        ctx.arc(x, y, p.size * (1 + localT * 0.5), 0, Math.PI * 2);
        ctx.fill();
      }
      // Central flash that decays.
      const flashR = maxR * 0.4 * localT;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, flashR);
      g.addColorStop(0, `rgba(255, 250, 220, ${(1 - localT) * 0.9})`);
      g.addColorStop(1, 'rgba(255, 250, 220, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf);
    };
  }, [variant, start, end]);

  const localT = seg(progress, start, end);

  // ── Variant-specific overlays (HTML/CSS) ──────────────────────────────
  if (variant === 'burst') {
    return (
      <canvas
        ref={burstCanvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: localT > 0.001 && localT < 0.99 ? 1 : 0,
          zIndex,
          pointerEvents: 'none',
          ...style,
        }}
      />
    );
  }

  if (variant === 'orb-rise') {
    const cy = lerp(50, -40, localT); // % — rise off the top
    const scale = lerp(0.6, 1.2, localT);
    const op = Math.min(1, localT * 1.5) * (1 - seg(localT, 0.85, 1));
    // Light tail: a vertical gradient stretching below the orb.
    const tailH = localT * 60; // vh
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: op,
          zIndex,
          pointerEvents: 'none',
          ...style,
        }}
      >
        {/* Tail */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: `${cy}%`,
            transform: 'translateX(-50%)',
            width: '12vw',
            height: `${tailH}vh`,
            background:
              'linear-gradient(to bottom, rgba(255,240,200,0.55), rgba(201,168,76,0.2), transparent)',
            filter: 'blur(6px)',
          }}
        />
        {/* Orb */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: `${cy}%`,
            transform: `translate(-50%, -50%) scale(${scale.toFixed(3)})`,
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,240,200,0.85) 30%, rgba(201,168,76,0.5) 60%, transparent 80%)',
            filter: 'blur(4px)',
          }}
        />
      </div>
    );
  }

  if (variant === 'lines-solidify') {
    if (!imageSrc) return null;
    // Lines tighten: stroke-dasharray shrinks; frame opacity rises.
    // Image develops via blur + brightness sweep.
    const lineT = seg(localT, 0, 0.6);
    const imageT = seg(localT, 0.4, 1);
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: localT > 0.001 ? 1 : 0,
          zIndex,
          pointerEvents: 'none',
          ...style,
        }}
      >
        {/* Tightening frame */}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        >
          <rect
            x={lerp(0, 30, lineT)}
            y={lerp(0, 30, lineT)}
            width={lerp(100, 40, lineT)}
            height={lerp(100, 40, lineT)}
            fill="none"
            stroke="rgba(201,168,76,0.9)"
            strokeWidth="0.3"
            opacity={1 - imageT * 0.6}
          />
        </svg>
        {/* Developing image inside the frame */}
        <div
          style={{
            position: 'absolute',
            left: '30%',
            top: '30%',
            width: '40%',
            height: '40%',
            backgroundImage: `url('${imageSrc}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: imageT,
            filter: `blur(${(1 - imageT) * 12}px) brightness(${0.5 + imageT * 0.5}) saturate(${imageT})`,
          }}
        />
      </div>
    );
  }

  if (variant === 'curtain-open') {
    // Two halves pull apart left/right.
    const open = seg(localT, 0.1, 0.9);
    const veilColor = 'linear-gradient(to right, rgba(245,220,150,0.95), rgba(201,168,76,0.85))';
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: localT > 0.001 && localT < 0.99 ? 1 : 0,
          zIndex,
          pointerEvents: 'none',
          ...style,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: `${50 - open * 50}%`,
            background: veilColor,
            transform: `translateX(${-open * 5}%)`,
            transition: 'width 0.05s linear',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            right: 0,
            width: `${50 - open * 50}%`,
            background: veilColor,
            transform: `translateX(${open * 5}%)`,
            transition: 'width 0.05s linear',
          }}
        />
      </div>
    );
  }

  if (variant === 'flash-decay') {
    // Full-screen flash → fades leaving residual halo.
    const flashOp = Math.max(0, 1 - localT * 1.4);
    const haloOp = seg(localT, 0.4, 1) * 0.5;
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: localT > 0.001 && localT < 0.99 ? 1 : 0,
          zIndex,
          pointerEvents: 'none',
          ...style,
        }}
      >
        {/* Flash */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'white',
            opacity: flashOp,
          }}
        />
        {/* Residual halo */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '50vw',
            height: '50vw',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(255,240,200,0.4) 0%, transparent 70%)',
            opacity: haloOp,
            filter: 'blur(8px)',
          }}
        />
      </div>
    );
  }

  return null;
}
