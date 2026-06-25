import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { useChapterReveal } from '@/lib/useChapterReveal';
import GfAmbientParticles from '@/components/GfAmbientParticles';
import spatial5 from '@/assets/spatial/spatial-5.png';

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export default function ColorTempSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  const [splitPosition, setSplitPosition] = useState(0.5);
  const isDraggingRef = useRef(false);

  useChapterReveal(sectionRef, innerRef);

  useEffect(() => {
    let startTime = Date.now();
    const duration = 8000;

    const animateLine = () => {
      if (isDraggingRef.current) {
        requestAnimationFrame(animateLine);
        return;
      }

      const elapsed = Date.now() - startTime;
      const progress = (elapsed % duration) / duration;

      const pos = 0.5 + Math.sin(progress * Math.PI * 2) * 0.1;
      setSplitPosition(clamp01(pos));

      requestAnimationFrame(animateLine);
    };

    const animationId = requestAnimationFrame(animateLine);
    return () => cancelAnimationFrame(animationId);
  }, []);

  const setFromClientX = (clientX: number) => {
    const inner = innerRef.current;
    if (!inner) return;
    const rect = inner.getBoundingClientRect();
    const ratio = clamp01((clientX - rect.left) / rect.width);
    setSplitPosition(ratio);
  };

  const onMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingRef.current = true;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setFromClientX(clientX);
  };

  const onMouseUp = () => {
    isDraggingRef.current = false;
  };

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingRef.current) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      setFromClientX(clientX);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onMouseUp);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onMouseUp);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="chapter-07"
      data-chapter="07"
      data-title="空间体验 · 色温"
      className="gf-chapter"
      style={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        height: '100vh',
        background: '#0a0d12',
        overflow: 'hidden',
      } as CSSProperties}
    >
      <div
        ref={innerRef}
        className="gf-chapter-reveal-wrap"
        style={{
          position: 'relative',
          height: '100%',
          width: '100%',
          willChange: 'opacity, transform',
        }}
      >
        <div
          onMouseDown={onMouseDown}
          onTouchStart={onMouseDown}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            cursor: isDraggingRef.current ? 'col-resize' : 'pointer',
            zIndex: 10,
            touchAction: 'none',
          }}
        >
          <img
            src={spatial5}
            alt="广府文化体验建筑 - 暖黄"
            draggable={false}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          />

          <img
            src={spatial5}
            alt="广府文化体验建筑 - 灰调"
            draggable={false}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'saturate(0.25) brightness(1.05)',
              clipPath: `inset(0 ${(1 - splitPosition) * 100}% 0 0)`,
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          />

          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(ellipse at center, rgba(0,0,0,0) 60%, rgba(0,0,0,0.35) 100%)',
              pointerEvents: 'none',
            }}
          />
        </div>

        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${splitPosition * 100}%`,
            transform: 'translateX(-50%)',
            width: '2px',
            background: isDraggingRef.current
              ? 'rgba(255, 230, 180, 1)'
              : 'rgba(255, 220, 160, 0.9)',
            boxShadow: isDraggingRef.current
              ? '0 0 24px rgba(255, 230, 180, 0.6), -2px 0 24px rgba(0,0,0,0.4), 2px 0 24px rgba(0,0,0,0.4)'
              : '0 0 16px rgba(255, 220, 160, 0.4), -2px 0 20px rgba(0,0,0,0.3), 2px 0 20px rgba(0,0,0,0.3)',
            zIndex: 20,
            transition: 'background 0.2s, box-shadow 0.2s',
          }}
        />

        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: `${splitPosition * 100}%`,
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            opacity: isDraggingRef.current ? 1 : 0.85,
            zIndex: 21,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              width: '0',
              height: '0',
              borderTop: '8px solid transparent',
              borderBottom: '8px solid transparent',
              borderRight: '10px solid rgba(255,220,160,0.95)',
              filter: 'drop-shadow(0 0 6px rgba(255,220,160,0.6))',
            }}
          />
          <div
            style={{
              width: '0',
              height: '0',
              borderTop: '8px solid transparent',
              borderBottom: '8px solid transparent',
              borderLeft: '10px solid rgba(255,220,160,0.95)',
              filter: 'drop-shadow(0 0 6px rgba(255,220,160,0.6))',
            }}
          />
        </div>

        <GfAmbientParticles
          count={20}
          opacity={0.15}
          minSize={0.3}
          maxSize={1.0}
          color={[201, 168, 76]}
          driftX={6}
          driftY={8}
          style={{ zIndex: 5 }}
        />
      </div>
    </section>
  );
}