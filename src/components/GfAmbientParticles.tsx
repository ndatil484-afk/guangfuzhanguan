import { useEffect, useRef, type CSSProperties } from 'react';

type GfAmbientParticlesProps = {
  /** Particle count. Tune for density vs. perf. Default 90. */
  count?: number;
  /** Base color (RGB triplet) of the particles. Default gold. */
  color?: [number, number, number];
  /** Min particle radius in px. Default 0.6. */
  minSize?: number;
  /** Max particle radius in px. Default 2.4. */
  maxSize?: number;
  /** Base opacity (0–1). Default 0.5. */
  opacity?: number;
  /** Horizontal drift amplitude in px. Default 18. */
  driftX?: number;
  /** Vertical drift amplitude in px. Default 22. */
  driftY?: number;
  /** Whether the layer should render. Default true. */
  active?: boolean;
  className?: string;
  style?: CSSProperties;
};

type Dust = {
  x: number;
  y: number;
  baseSize: number;
  phase: number;
  speed: number;
  ax: number;
  ay: number;
  twPhase: number;
  twSpeed: number;
};

/**
 * Lightweight ambient particle field — slow-drifting golden dust motes.
 * Cheap: a single canvas, simple sin-based motion, no per-frame allocations.
 * Used to give "static" frames (hero at rest, end-of-page team section) a
 * living, atmospheric feel without the cost of the full image-particle dissolve.
 */
export default function GfAmbientParticles({
  count = 90,
  color = [201, 168, 76],
  minSize = 0.6,
  maxSize = 2.4,
  opacity = 0.5,
  driftX = 18,
  driftY = 22,
  active = true,
  className,
  style,
}: GfAmbientParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dustRef = useRef<Dust[]>([]);
  const rafRef = useRef(0);
  const opacityRef = useRef(opacity);

  useEffect(() => {
    opacityRef.current = opacity;
  }, [opacity]);

  // (Re)build dust field when count or container size changes.
  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    const build = () => {
      const rect = container.getBoundingClientRect();
      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);
      const dust: Dust[] = [];
      for (let i = 0; i < count; i++) {
        dust.push({
          x: Math.random() * w,
          y: Math.random() * h,
          baseSize: minSize + Math.random() * (maxSize - minSize),
          phase: Math.random() * Math.PI * 2,
          speed: 0.0004 + Math.random() * 0.0009,
          ax: 0.4 + Math.random() * 0.6,
          ay: 0.4 + Math.random() * 0.6,
          twPhase: Math.random() * Math.PI * 2,
          twSpeed: 0.0008 + Math.random() * 0.0018,
        });
      }
      dustRef.current = dust;
    };

    build();

    const onResize = () => build();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [active, count, minSize, maxSize]);

  // Render loop.
  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const setup = () => {
      const rect = container.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { w, h };
    };

    let dims = setup();
    const onResize = () => {
      dims = setup();
    };
    window.addEventListener('resize', onResize);

    const [cr, cg, cb] = color;

    const draw = () => {
      const { w, h } = dims;
      ctx.clearRect(0, 0, w, h);
      const baseOpacity = opacityRef.current;
      const dust = dustRef.current;
      const t = performance.now();

      for (let i = 0; i < dust.length; i++) {
        const d = dust[i];
        // Slow orbital drift around anchor.
        const ox = d.x + Math.sin(t * d.speed + d.phase) * driftX * d.ax;
        const oy = d.y + Math.cos(t * d.speed * 0.8 + d.phase) * driftY * d.ay;
        // Twinkle: opacity flicker.
        const tw = 0.5 + 0.5 * Math.sin(t * d.twSpeed + d.twPhase);
        const a = baseOpacity * (0.35 + 0.65 * tw);
        // Soft glow via radial gradient — only worthwhile for larger motes.
        if (d.baseSize > 1.6) {
          const r = d.baseSize * 2.4;
          const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, r);
          g.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, ${a})`);
          g.addColorStop(0.4, `rgba(${cr}, ${cg}, ${cb}, ${a * 0.4})`);
          g.addColorStop(1, `rgba(${cr}, ${cg}, ${cb}, 0)`);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(ox, oy, r, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${a})`;
          ctx.beginPath();
          ctx.arc(ox, oy, d.baseSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener('resize', onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, color, driftX, driftY]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        ...style,
      }}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
    </div>
  );
}
