import { useRef } from 'react';
import { useChapterReveal } from '@/lib/useChapterReveal';

/**
 * Chapter 02 — 文化背景 (Cultural Background)
 *
 * 静态章节（100vh），滚动到达即完整呈现。左侧 2×2 文化元素卡（透 / 轩 /
 * 篳 / 岩），每张卡片用大字中文元素名 + 英文翻译 + 中文说明，并以装饰性
 * 线条 / 序号作为视觉锚点（无图片）。右侧文字阐述广府智慧的核心理念。
 * 视觉调性与 Chapter 03 调研背景一致：暗底 + 金衬线 + Cinzel 英文小标。
 */

type Element = {
  key: string;
  index: string;
  cn: string;
  en: string;
  desc: string;
};

const ELEMENTS: Element[] = [
  {
    key: 'tou',
    index: '01',
    cn: '透',
    en: 'Man-window Light',
    desc: '参数化窗格实现隐私与光影的变化',
  },
  {
    key: 'xuan',
    index: '02',
    cn: '轩',
    en: 'Open Veranda / Elevated Space',
    desc: '架空平台与冷巷通风，营造开放流通的空间',
  },
  {
    key: 'bi',
    index: '03',
    cn: '篳',
    en: 'Expansiveness / Wide Open',
    desc: '大尺度可开合隔断，实现室内外的融合贯通',
  },
  {
    key: 'yan',
    index: '04',
    cn: '岩',
    en: 'Rockery / Stone Integration',
    desc: '盆景与叠石营造可触可感的微缩山水意境',
  },
];

export default function ResearchSection() {
  const sectionRef = useRef<HTMLElement>(null);

  // 静态章节：直接对 section 本身施加淡入包络，不需要 sticky-inner 包装。
  useChapterReveal(sectionRef, sectionRef);

  return (
    <section
      ref={sectionRef}
      id="chapter-02"
      data-chapter="02"
      data-title="文化背景"
      className="gf-chapter"
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        background: 'transparent',
        padding: 'max(80px, 10vh) max(72px, 6vw)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'stretch',
        overflow: 'hidden',
      }}
    >
      {/* ── 左上角章节标签 ── */}
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
          02
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
          文化背景
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
          CULTURAL BACKGROUND
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
          岭南休闲的精神原乡
        </div>
      </div>

      {/* ── 主体：左右两栏 ── */}
      <div
        style={{
          width: '100%',
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 1fr)',
          gap: 'clamp(32px, 4vw, 64px)',
          alignItems: 'center',
        }}
      >
        {/* 左：2×2 文化元素卡片网格（纯文字版） */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: '1fr 1fr',
            gap: '14px',
          }}
        >
          {ELEMENTS.map((el) => (
            <div
              key={el.key}
              style={{
                position: 'relative',
                borderRadius: '4px',
                padding: '22px 22px 20px',
                border: '1px solid rgba(201,168,76,0.22)',
                background:
                  'linear-gradient(155deg, rgba(28,22,16,0.92) 0%, rgba(16,12,10,0.95) 100%)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '150px',
              }}
            >
              {/* 顶部右上序号 */}
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: '14px',
                  right: '18px',
                  fontFamily: "'Cinzel', serif",
                  fontSize: '10px',
                  letterSpacing: '0.32em',
                  color: 'rgba(201,168,76,0.55)',
                }}
              >
                {el.index}
              </span>

              {/* 顶部装饰短横线 */}
              <span
                aria-hidden="true"
                style={{
                  display: 'block',
                  width: '28px',
                  height: '1px',
                  background: 'var(--gf-gold)',
                  opacity: 0.7,
                  marginBottom: '14px',
                }}
              />

              {/* 中部：大字元素名 + 英文 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                  <span
                    style={{
                      fontFamily: "'Noto Serif SC', serif",
                      fontSize: '44px',
                      color: 'var(--gf-gold)',
                      lineHeight: 1,
                      fontWeight: 600,
                      textShadow: '0 2px 16px rgba(201,168,76,0.25)',
                    }}
                  >
                    {el.cn}
                  </span>
                  <span
                    style={{
                      fontFamily: "'Cinzel', serif",
                      fontSize: '9px',
                      letterSpacing: '0.26em',
                      color: 'rgba(245,236,210,0.7)',
                      maxWidth: '60%',
                      lineHeight: 1.4,
                    }}
                  >
                    {el.en}
                  </span>
                </div>
              </div>

              {/* 底部：说明文字 */}
              <p
                style={{
                  fontFamily: "'Noto Serif SC', serif",
                  fontSize: 'clamp(11px, 0.8vw, 13px)',
                  letterSpacing: '0.08em',
                  lineHeight: 1.65,
                  color: 'rgba(245,236,210,0.82)',
                  margin: '14px 0 0',
                }}
              >
                {el.desc}
              </p>
            </div>
          ))}
        </div>

        {/* 右：广府智慧 — 标题 + 正文 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Overline */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <span
              style={{
                display: 'block',
                width: '32px',
                height: '1px',
                background: 'var(--gf-gold)',
              }}
            />
            <span
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: '11px',
                letterSpacing: '0.4em',
                color: 'var(--gf-gold)',
              }}
            >
              GUANGFU WISDOM
            </span>
          </div>

          {/* 主标题 */}
          <h2
            style={{
              fontFamily: "'Noto Serif SC', serif",
              fontWeight: 600,
              fontSize: 'clamp(44px, 5.2vw, 78px)',
              lineHeight: 1.05,
              letterSpacing: '0.04em',
              margin: 0,
              color: '#f5ecd2',
              textShadow: '0 4px 30px rgba(0,0,0,0.5)',
            }}
          >
            广府智慧
          </h2>

          {/* 装饰性下划线 */}
          <span
            aria-hidden="true"
            style={{
              display: 'block',
              height: '1px',
              width: '120px',
              background:
                'linear-gradient(90deg, var(--gf-gold-light), var(--gf-gold), transparent)',
              boxShadow: '0 0 8px rgba(201,168,76,0.55)',
            }}
          />

          {/* 正文 */}
          <p
            style={{
              fontFamily: "'Noto Serif SC', serif",
              fontWeight: 300,
              fontSize: 'clamp(14px, 1.05vw, 17px)',
              lineHeight: 2.05,
              letterSpacing: '0.04em',
              color: 'rgba(245,236,210,0.88)',
              margin: 0,
              maxWidth: '36ch',
            }}
          >
            提取岭南文化
            <span style={{ color: 'var(--gf-gold)', margin: '0 4px' }}>「顺应自然、约束市井」</span>
            的休闲内核，
            作为<span style={{ color: 'var(--gf-gold)', margin: '0 4px' }}>空间疗愈</span>
            的天然解药。
          </p>

          {/* 论点 callout */}
          <div
            style={{
              marginTop: '6px',
              padding: '16px 20px',
              borderLeft: '1px solid rgba(201,168,76,0.6)',
            }}
          >
            <span
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: '10px',
                letterSpacing: '0.32em',
                color: 'var(--gf-gold)',
                display: 'block',
                marginBottom: '8px',
              }}
            >
              THE NATURAL ANTIDOTE
            </span>
            <span
              style={{
                fontFamily: "'Noto Serif SC', serif",
                fontSize: 'clamp(14px, 1.05vw, 16px)',
                letterSpacing: '0.1em',
                color: 'rgba(245,236,210,0.95)',
              }}
            >
              作为空间疗愈的天然解药
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
