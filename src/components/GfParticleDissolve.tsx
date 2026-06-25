import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { power2In } from '@/lib/easing';

export type GfParticleDissolveProps = {
  /** Image source URL. */
  src: string;
  /** Dissolve progress 0 (intact image) → 1 (fully dispersed). */
  progress: number;
  /** Alt text for accessibility. */
  alt?: string;
  /**
   * Sample step. Higher = coarser sampling = fewer particles. Default 8.
   * At step 8 on a 1920×1080 image → ~32k samples; we cap at maxParticles.
   */
  sampleStep?: number;
  /** Hard cap on particle count for performance. Default 2000. */
  maxParticles?: number;
  /** Maximum drift distance in px at progress = 1. Default 180. */
  maxDrift?: number;
  /** Particle base color when there's no underlying image (rare). */
  fallbackColor?: string;
  /** Whether to render the canvas (default true). */
  active?: boolean;
  /**
   * Progress curve.
   * - 'gradual' (default): 4-stage dissolve — emergence (0–0.3) / acceleration
   *   (0.3–0.6) / scatter (0.6–0.9) / fade-out (0.9–1). Each particle also
   *   gets a small sin-driven jitter so the dissolve reads as "granular"
   *   rather than a rigid block translation.
   * - 'linear': legacy behavior (single power curve, no per-particle jitter).
   */
  progressCurve?: 'linear' | 'gradual';
  className?: string;
  style?: CSSProperties;
};

type Particle = {
  ox: number; // original x (canvas-space)
  oy: number;
  dx: number; // drift offset at progress=1
  dy: number;
  r: number;
  g: number;
  b: number;
  size: number;
  jitter: number; // per-particle phase for the granular sin wobble
  jx: number; // jitter amplitude x
  jy: number; // jitter amplitude y
};

/**
 * Image-as-particles canvas. Renders the image as a grid of color samples;
 * as `progress` goes 0 → 1, each particle drifts outward, fading. Lets us
 * drive the "pixel dissolve" effect from any scrub progress source.
 *
 * Performance: capped at `maxParticles`. The render loop only runs while
 * `active` is true (i.e. when the parent chapter is in view).
 */
export default function GfParticleDissolve({
  src,
  progress,
  alt = '',
  sampleStep = 8,
  maxParticles = 2000,
  maxDrift = 180,
  fallbackColor = '#c9a84c',
  active = true,
  progressCurve = 'gradual',
  className,
  style,
}: GfParticleDissolveProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const progressRef = useRef(progress);
  const rafRef = useRef(0);
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });
  const [ready, setReady] = useState(false);

  // Keep latest progress in a ref so the render loop doesn't restart on each change.
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  const curveRef = useRef(progressCurve);
  useEffect(() => {
    curveRef.current = progressCurve;
  }, [progressCurve]);

  // Load image + sample particles.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;
    imgRef.current = img;

    let cancelled = false;

    const buildParticles = () => {
      if (cancelled) return;
      const container2 = containerRef.current;
      if (!container2) return;
      const rect = container2.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));

      // Off-screen canvas to read pixels.
      const off = document.createElement('canvas');
      off.width = w;
      off.height = h;
      const offCtx = off.getContext('2d', { willReadFrequently: true });
      if (!offCtx) return;

      // Cover-fit the image.
      const ir = img.naturalWidth / img.naturalHeight || 16 / 9;
      const cr = w / h;
      let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
      if (ir > cr) {
        sw = img.naturalHeight * cr;
        sx = (img.naturalWidth - sw) / 2;
      } else {
        sh = img.naturalWidth / cr;
        sy = (img.naturalHeight - sh) / 2;
      }
      offCtx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);

      let data: Uint8ClampedArray;
      try {
        data = offCtx.getImageData(0, 0, w, h).data;
      } catch {
        // CORS-tainted canvas: fall back to a flat color.
        const fallback: Particle[] = [];
        const step = sampleStep;
        let count = 0;
        for (let y = 0; y < h; y += step) {
          for (let x = 0; x < w; x += step) {
            if (count >= maxParticles) break;
            const angle = Math.random() * Math.PI * 2;
            fallback.push({
              ox: x, oy: y,
              dx: Math.cos(angle) * maxDrift * (0.5 + Math.random() * 0.5),
              dy: Math.sin(angle) * maxDrift * (0.5 + Math.random() * 0.5),
              r: 201, g: 168, b: 76,
              size: 1.5,
              jitter: Math.random() * Math.PI * 2,
              jx: 1 + Math.random() * 2,
              jy: 1 + Math.random() * 2,
            });
            count++;
          }
        }
        particlesRef.current = fallback;
        sizeRef.current = { w, h, dpr: Math.min(window.devicePixelRatio || 1, 2) };
        setReady(true);
        return;
      }

      const step = sampleStep;
      const candidates: Particle[] = [];
      const cx = w / 2;
      const cy = h / 2;
      for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
          const idx = (y * w + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];
          if (a < 16) continue;
          // Outward drift direction, biased by center vector.
          const ang = Math.atan2(y - cy, x - cx) + (Math.random() - 0.5) * 1.4;
          const drift = maxDrift * (0.45 + Math.random() * 0.55);
          candidates.push({
            ox: x,
            oy: y,
            dx: Math.cos(ang) * drift,
            dy: Math.sin(ang) * drift,
            r,
            g,
            b,
            size: step * 0.55,
            jitter: Math.random() * Math.PI * 2,
            jx: 1 + Math.random() * 2,
            jy: 1 + Math.random() * 2,
          });
        }
      }

      // Cap particle count while keeping distribution.
      let final: Particle[];
      if (candidates.length <= maxParticles) {
        final = candidates;
      } else {
        const ratio = candidates.length / maxParticles;
        final = candidates.filter((_, i) => i % Math.ceil(ratio) === 0).slice(0, maxParticles);
      }
      particlesRef.current = final;
      sizeRef.current = { w, h, dpr: Math.min(window.devicePixelRatio || 1, 2) };
      setReady(true);
    };

    if (img.complete && img.naturalWidth > 0) {
      buildParticles();
    } else {
      img.onload = buildParticles;
    }

    return () => {
      cancelled = true;
    };
  }, [src, sampleStep, maxParticles, maxDrift, fallbackColor]);

  // Render loop.
  useEffect(() => {
    if (!active || !ready) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { w, h, dpr } = sizeRef.current;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const particles = particlesRef.current;

    const draw = () => {
      const p = Math.max(0, Math.min(1, progressRef.current));
      ctx.clearRect(0, 0, w, h);

      // Intact image at p=0, particles at p=1. Cross-fade.
      if (p < 0.05 && imgRef.current) {
        ctx.globalAlpha = 1;
        ctx.drawImage(imgRef.current, 0, 0, w, h);
      }

      const gradual = curveRef.current === 'gradual';

      // Resolve a drift factor + alpha for the current progress.
      let drift: number;
      let alpha: number;
      if (gradual) {
        // 4-stage curve. Each segment linearly maps into a target range so
        // transitions between stages stay continuous.
        if (p < 0.3) {
          // Emergence — slow start, low alpha so the dissolve feels like
          // the image is just beginning to "wake up".
          const t = p / 0.3;
          drift = power2In(t) * 0.18;
          alpha = 0.05 + t * 0.35; // 0.05 → 0.4
        } else if (p < 0.6) {
          // Acceleration — drift catches up, alpha peaks.
          const t = (p - 0.3) / 0.3;
          drift = 0.18 + t * 0.45;
          alpha = 0.4 + t * 0.5; // 0.4 → 0.9
        } else if (p < 0.9) {
          // Scatter — particles fly outward fast, alpha starts dropping.
          const t = (p - 0.6) / 0.3;
          drift = 0.63 + t * 0.32;
          alpha = 0.9 - t * 0.4; // 0.9 → 0.5
        } else {
          // Fade-out — drift tapers, alpha goes to 0.
          const t = (p - 0.9) / 0.1;
          drift = 0.95 + t * 0.05;
          alpha = 0.5 - t * 0.5; // 0.5 → 0
        }
      } else {
        // Legacy linear curve.
        drift = p * p;
        alpha = Math.min(1, p * 1.4 + 0.05);
      }

      ctx.globalAlpha = Math.max(0, alpha);
      const now = performance.now();
      for (let i = 0; i < particles.length; i++) {
        const pt = particles[i];
        const x =
          pt.ox +
          pt.dx * drift +
          (gradual ? Math.sin(now * 0.003 + pt.jitter) * pt.jx * drift : 0);
        const y =
          pt.oy +
          pt.dy * drift +
          (gradual ? Math.cos(now * 0.0028 + pt.jitter * 1.3) * pt.jy * drift : 0);
        ctx.fillStyle = `rgb(${pt.r}, ${pt.g}, ${pt.b})`;
        ctx.fillRect(x, y, pt.size, pt.size);
      }
      ctx.globalAlpha = 1;

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, ready]);

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
      role="img"
      aria-label={alt}
    >
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
    </div>
  );
}
