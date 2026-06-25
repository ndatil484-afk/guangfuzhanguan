import { useRef } from 'react';
import { useChapterReveal } from '@/lib/useChapterReveal';
import anxietySubwayImg from '@/assets/guangfu-research/research-anxiety-2.png';
import anxietyLandmarkImg from '@/assets/guangfu-research/research-anxiety-1.png';

/**
 * Chapter 03 — 调研背景 (Research Background)
 *
 * 情绪调研叙事，单视口（100vh）满版呈现，与平滑滚动器
 * "一章一跳"的节奏对齐。
 */

type Figure = {
  src: string;
  alt: string;
  en: string;
};

const FIGURES: Figure[] = [
  { src: anxietySubwayImg, alt: '快节奏年轻群体上班挤地铁', en: 'DAILY COMMUTE' },
  { src: anxietyLandmarkImg, alt: '情绪地标转化图', en: 'EMOTIONAL LANDMARK' },
];

export default function ResearchBackgroundSection() {
  const sectionRef = useRef<HTMLElement>(null);
  // Static (non-sticky) chapter: apply the reveal envelope directly to the
  // section itself — no sticky-inner wrapper needed. transform/opacity on
  // the section element doesn't disturb its document-flow layout.
  useChapterReveal(sectionRef, sectionRef);

  return (
    <section
      ref={sectionRef}
      id="chapter-03"
      data-chapter="03"
      data-title="调研背景"
      className="gf-chapter"
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        background: 'transparent',
        padding: 'max(80px, 10vh) max(72px, 9vw)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'stretch',
        overflow: 'hidden',
      }}
    >
      {/* ── Chapter label ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 'max(80px, 12vh)',
          left: 'max(28px, 4vw)',
          display: 'flex',
          alignItems: 'baseline',
          gap: '10px',
          zIndex: 5,
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
          03
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
          调研背景
        </span>
      </div>

      {/* ── 右上角英文副标题 ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 'max(80px, 12vh)',
          right: 'max(28px, 4vw)',
          textAlign: 'right',
          zIndex: 5,
        }}
      >
        <div
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: '10px',
            letterSpacing: '0.32em',
            color: 'var(--gf-cold-accent)',
            opacity: 0.7,
          }}
        >
          RESEARCH BACKGROUND
        </div>
        <div
          style={{
            fontFamily: "'Noto Serif SC', serif",
            fontSize: '13px',
            letterSpacing: '0.18em',
            color: 'rgba(245,240,232,0.5)',
            marginTop: '4px',
          }}
        >
          高压 · 同质 · 钝化
        </div>
      </div>

      {/* ── 主体内容容器 ── */}
      <div
        style={{
          width: '100%',
          maxWidth: '1040px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1.05fr 1fr',
          gridTemplateRows: 'auto auto',
          gap: '28px 40px',
          alignItems: 'center',
        }}
      >
        {/* 左上：主标题 + 引言 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2
            style={{
              fontFamily: "'Noto Serif SC', serif",
              fontSize: 'clamp(28px, 3.4vw, 42px)',
              letterSpacing: '0.12em',
              color: 'var(--gf-ivory)',
              fontWeight: 300,
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            都市青年的
            <br />
            <span style={{ color: 'var(--gf-gold)' }}>情绪困境</span>
          </h2>
          <p
            style={{
              fontFamily: "'Noto Serif SC', serif",
              fontSize: 'clamp(13px, 1vw, 15px)',
              lineHeight: 2,
              letterSpacing: '0.05em',
              color: 'rgba(245,240,232,0.78)',
              margin: 0,
            }}
          >
            现代都市正处于
            <span style={{ color: 'var(--gf-gold)', margin: '0 3px' }}>「高压、快节奏、同质化」</span>
            的恶性循环之中。最新的城市生活调查显示，
            <span style={{ color: 'var(--gf-gold)', fontWeight: 500, margin: '0 3px' }}>
              近 70% 的青年群体（20-35 岁）
            </span>
            长期处于
            <span style={{ color: 'var(--gf-gold)', margin: '0 3px' }}>「高功能焦虑」</span>
            状态。
          </p>
        </div>

        {/* 右上：第一张图（挤地铁） */}
        <figure
          style={{
            position: 'relative',
            margin: 0,
            borderRadius: '4px',
            overflow: 'hidden',
            border: '1px solid rgba(201,168,76,0.22)',
            background: '#0c0a14',
            aspectRatio: '4 / 3',
          }}
        >
          <img
            src={FIGURES[0].src}
            alt={FIGURES[0].alt}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              filter: 'brightness(0.85) contrast(1.05)',
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(to bottom, transparent 55%, rgba(10,8,16,0.85) 100%)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '14px',
              left: '18px',
              fontFamily: "'Cinzel', serif",
              fontSize: '10px',
              letterSpacing: '0.3em',
              color: 'var(--gf-gold)',
              opacity: 0.9,
            }}
          >
            {FIGURES[0].en}
          </div>
        </figure>

        {/* 左下：第二张图（情绪地标） */}
        <figure
          style={{
            position: 'relative',
            margin: 0,
            borderRadius: '4px',
            overflow: 'hidden',
            border: '1px solid rgba(201,168,76,0.22)',
            background: '#0c0a14',
            aspectRatio: '4 / 3',
          }}
        >
          <img
            src={FIGURES[1].src}
            alt={FIGURES[1].alt}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              filter: 'brightness(0.85) contrast(1.05)',
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(to bottom, transparent 55%, rgba(10,8,16,0.85) 100%)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '14px',
              left: '18px',
              fontFamily: "'Cinzel', serif",
              fontSize: '10px',
              letterSpacing: '0.3em',
              color: 'var(--gf-gold)',
              opacity: 0.9,
            }}
          >
            {FIGURES[1].en}
          </div>
        </figure>

        {/* 右下：双关键词 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            padding: '8px 0',
          }}
        >
          {[
            { word: '精神焦虑', en: 'MENTAL ANXIETY' },
            { word: '感官钝化', en: 'SENSORY NUMBING' },
          ].map((k, i, arr) => (
            <div
              key={k.en}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '18px',
                paddingBottom: i < arr.length - 1 ? '20px' : 0,
                borderBottom:
                  i < arr.length - 1 ? '1px solid rgba(201,168,76,0.18)' : 'none',
              }}
            >
              <span
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: 'clamp(28px, 3vw, 40px)',
                  color: 'rgba(201,168,76,0.35)',
                  lineHeight: 1,
                  minWidth: '32px',
                }}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span
                  style={{
                    fontFamily: "'Noto Serif SC', serif",
                    fontSize: 'clamp(20px, 2vw, 26px)',
                    letterSpacing: '0.18em',
                    color: 'var(--gf-gold)',
                    lineHeight: 1.1,
                  }}
                >
                  {k.word}
                </span>
                <span
                  style={{
                    fontFamily: "'Cinzel', serif",
                    fontSize: '10px',
                    letterSpacing: '0.28em',
                    color: 'rgba(245,240,232,0.4)',
                  }}
                >
                  {k.en}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
