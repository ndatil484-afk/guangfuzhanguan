import { memo } from 'react';

export type GfPageDotsProps = {
  count: number;
  current: number;
  labels: string[];
  /** Overall progress 0-1 across all chapters. */
  overallProgress?: number;
  onGoTo: (idx: number) => void;
};

const BAR_HEIGHT = 280; // px, the visible progress bar height
const TICK_COUNT_DEFAULT = 8;

function GfPageDotsBase({
  count,
  current,
  labels,
  overallProgress = 0,
  onGoTo,
}: GfPageDotsProps) {
  const ticks = Math.max(count, TICK_COUNT_DEFAULT);

  return (
    <div
      className="gf-page-progress"
      aria-label="章节进度"
      style={{
        position: 'fixed',
        right: 'max(28px, 3.2vw)',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '14px',
        pointerEvents: 'auto',
      }}
    >
      {/* Chapter tick list */}
      <div
        style={{
          position: 'relative',
          height: BAR_HEIGHT,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
        }}
      >
        {/* Track background */}
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: '1px',
            background: 'rgba(245,240,232,0.18)',
          }}
        />
        {/* Progress fill */}
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            width: '1px',
            height: `${overallProgress * 100}%`,
            background:
              'linear-gradient(to bottom, var(--gf-gold-light), var(--gf-gold))',
            boxShadow: '0 0 6px rgba(201,168,76,0.55)',
            transition: 'height 0.12s linear',
          }}
        />

        {/* Tick marks per chapter */}
        {Array.from({ length: ticks }).map((_, i) => {
          const active = i === current;
          const done = i < current;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onGoTo(i)}
              className="gf-page-progress-tick"
              aria-label={`跳转到第 ${i + 1} 章：${labels[i] ?? ''}`}
              aria-current={active ? 'true' : 'false'}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: 'transparent',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                outline: 'none',
                height: '14px',
              }}
            >
              <span
                className="gf-page-progress-label"
                style={{
                  fontFamily: "'Noto Serif SC', serif",
                  fontSize: '10px',
                  letterSpacing: '0.22em',
                  color: active ? 'var(--gf-gold)' : 'rgba(245,240,232,0.45)',
                  opacity: active || done ? 1 : 0,
                  transform: active ? 'translateX(0)' : 'translateX(8px)',
                  transition:
                    'opacity 0.6s cubic-bezier(0.25,0.1,0.25,1), transform 0.6s cubic-bezier(0.25,0.1,0.25,1), color 0.6s ease',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                }}
              >
                {labels[i]}
              </span>
              <span
                aria-hidden="true"
                style={{
                  display: 'block',
                  width: active ? '14px' : done ? '6px' : '4px',
                  height: '1px',
                  background: active
                    ? 'var(--gf-gold)'
                    : done
                      ? 'rgba(201,168,76,0.55)'
                      : 'rgba(245,240,232,0.32)',
                  boxShadow: active ? '0 0 6px rgba(201,168,76,0.6)' : 'none',
                  transition:
                    'width 0.6s cubic-bezier(0.25,0.1,0.25,1), background 0.6s ease, box-shadow 0.6s ease',
                }}
              />
            </button>
          );
        })}
      </div>

      {/* Overall percentage */}
      <div
        aria-hidden="true"
        style={{
          fontFamily: "'Cinzel', serif",
          fontSize: '10px',
          letterSpacing: '0.3em',
          color: 'rgba(245,240,232,0.55)',
          textAlign: 'right',
        }}
      >
        <span style={{ color: 'var(--gf-gold)' }}>
          {String(Math.round(overallProgress * 100)).padStart(2, '0')}
        </span>
        <span style={{ opacity: 0.4, margin: '0 4px' }}>%</span>
      </div>
    </div>
  );
}

const GfPageDots = memo(GfPageDotsBase);
export default GfPageDots;
