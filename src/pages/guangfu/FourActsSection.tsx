import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { useScrubProgress } from '@/lib/useScrubProgress';
import { useChapterReveal } from '@/lib/useChapterReveal';
import GfAmbientParticles from '@/components/GfAmbientParticles';
// Chapter 05 — 设计转译 矩阵素材
// 按"列优先"组织：每一列代表一个转译阶段（原型采集 / 几何转译 / 建成成果），
// 同一行则展示同一类文化元素在三个阶段中的演进。
import stage1Cell1 from '@/assets/chapter05/cell-stage1-1.png';
import stage1Cell2 from '@/assets/chapter05/cell-stage1-2.png';
import stage1Cell3 from '@/assets/chapter05/cell-stage1-3.png';
import stage2Cell1 from '@/assets/chapter05/cell-stage2-1.png';
import stage2Cell2 from '@/assets/chapter05/cell-stage2-2.png';
import stage2Cell3 from '@/assets/chapter05/cell-stage2-3.png';
import stage3Cell1 from '@/assets/chapter05/cell-stage3-1.png';
import stage3Cell2 from '@/assets/chapter05/cell-stage3-2.png';
import stage3Cell3 from '@/assets/chapter05/cell-stage3-3.png';

/**
 * Chapter 05 — 设计转译 (Design Translation)
 *
 * 叙事结构：3 列 × 3 行矩阵 —— 转译过程"从左往右"展开
 *   横向（列）= 设计转译的三个阶段：原型采集 → 几何转译 → 建成成果
 *   纵向（行）= 同一类文化元素在三阶段中的演进
 *   列标签置于矩阵下方，配合从左到右的引导箭头
 */

// 列阶段定义（用于底部列标签 + 引导箭头）
type ColumnStage = { stage: string; stageEn: string };
const COLUMN_STAGES: ColumnStage[] = [
  { stage: '原型采集', stageEn: 'ARCHETYPE' },
  { stage: '几何转译', stageEn: 'PARAMETRIC TRANSLATION' },
  { stage: '建成成果', stageEn: 'REALIZATION' },
];

// 矩阵按"行优先"组织扁平数组，每个元素标注其所属列（0/1/2 = 原型/转译/成果）。
// 同一行的三张图 = 同一类文化元素的三个阶段（从左到右）。
//   行 1 = 纹样：原型纹样 → 几何参数化 → 光影投射成果
//   行 2 = 建筑形体：传统坡屋顶实景 → 参数化曲面线框 → 流线型屋顶成果
//   行 3 = 自然元素：岭南盆景实景 → 剖面树形线框 → 树形+水景成果
type MatrixCell = { src: string; col: 0 | 1 | 2 };
const MATRIX_ROWS: MatrixCell[][] = [
  [
    { src: stage1Cell1, col: 0 }, // 满洲窗彩色玻璃纹样
    { src: stage2Cell2, col: 1 }, // 纹样几何参数化
    { src: stage1Cell3, col: 2 }, // 纹样光影投射效果
  ],
  [
    { src: stage2Cell1, col: 0 }, // 传统建筑坡屋顶聚落实景
    { src: stage1Cell2, col: 1 }, // 参数化曲面屋顶几何线框
    { src: stage2Cell3, col: 2 }, // 树形结构 + 水景最终效果（原第9张）
  ],
  [
    { src: stage3Cell1, col: 0 }, // 岭南盆景实景
    { src: stage3Cell2, col: 1 }, // 建筑剖面线框（含树形结构）
    { src: stage3Cell3, col: 2 }, // 流线型屋顶最终效果图（原第6张）
  ],
];

// 扁平化供逐格动画逻辑使用（顺序对应 3×3 grid 的 DOM 顺序：行优先）
const CELLS: Array<{ src: string; col: 0 | 1 | 2 }> = MATRIX_ROWS.flat();

function seg(p: number, s: number, e: number) {
  if (e <= s) return p <= s ? 0 : 1;
  return Math.max(0, Math.min(1, (p - s) / (e - s)));
}
function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export default function FourActsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef<Array<HTMLDivElement | null>>([]);
  const pointRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  const { progress } = useScrubProgress(sectionRef, { range: 'full', lead: 1, initial: 0.12 });

  // Whole-chapter scroll-driven fade + scale envelope.
  useChapterReveal(sectionRef, innerRef);

  // Mouse parallax (only active during recede phase).
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setMouse({ x, y });
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  useEffect(() => {
    const p = progress;
    const pBorder = seg(p, 0, 0.15);
    const pLightup = seg(p, 0.05, 0.2);
    const pScan = seg(p, 0.15, 0.35);
    const pRecede = seg(p, 0.35, 0.55);
    // Float / river / veil phases retired — they dissolved the nine-cell
    // grid into a fullscreen light veil and hid the actual content under a
    // process animation. Grid now stays as readable content; only a gentle 、  
    // scroll-away fade at the end hands off to the next chapter.
    const pFloat = 0;
    const pRiver = 0;

    // Central point: visible only at very start.
    if (pointRef.current) {
      pointRef.current.style.opacity = String(1 - pBorder);
      pointRef.current.style.transform = `translate(-50%, -50%) scale(${(1 - pBorder * 0.5).toFixed(3)})`;
    }

    // Grid container: recede (rotateY + scale) + mouse parallax during recede/push.
    if (gridRef.current) {
      const rotY = 5 * pRecede * (1 - pFloat);
      const sc = (1 - pRecede * 0.1) * (1 - pFloat * 0.3);
      const parX = mouse.x * 12 * pRecede * (1 - pFloat);
      const parY = mouse.y * 8 * pRecede * (1 - pFloat);
      const floatUp = pFloat * -120;
      gridRef.current.style.transform = `perspective(1400px) rotateY(${rotY.toFixed(2)}deg) translate3d(${parX.toFixed(2)}px, ${(parY + floatUp).toFixed(2)}px, 0) scale(${sc.toFixed(3)})`;
      // Grid opacity stays at 1 throughout — exit fade is owned by the
      // chapter-level useChapterReveal wrapper. Multiplying by (1 - pOut*0.6)
      // here greyed the whole matrix near scroll-end.
      gridRef.current.style.opacity = String(1 - pRiver);
      // Row labels fade in alongside the cell lightup phase.
      gridRef.current.style.setProperty('--grid-labels-op', String(Math.min(1, pLightup * 1.2)));
    }

    // Per-cell behavior.
    CELLS.forEach((_cell, i) => {
      const cell = cellRefs.current[i];
      if (!cell) return;

      // Distance from center (cell 4 = center).
      const cx = i % 3;
      const cy = Math.floor(i / 3);
      const dCenter = Math.hypot(cx - 1, cy - 1); // 0..√2
      const maxD = Math.sqrt(2);

      // Stagger lightup: center first.
      const lightupLocal = seg(pLightup, (dCenter / maxD) * 0.6, (dCenter / maxD) * 0.6 + 0.5);
      // Scan reveal: also from center outward.
      const scanLocal = seg(pScan, (dCenter / maxD) * 0.5, (dCenter / maxD) * 0.5 + 0.6);

      // Push phase disabled: previously the center cell (i=4) was scaled up
      // and pushed forward while the other eight shrank, which made the middle
      // image visibly larger than its neighbours and broke the uniform grid.
      // All nine cells now keep identical size throughout the scroll.
      const pushScale = 1;
      const pushZ = 0;

      // Float phase: each cell floats up with stagger + horizontal drift.
      const floatLocal = seg(pFloat, (i / 9) * 0.4, (i / 9) * 0.4 + 0.7);
      const floatY = -floatLocal * 200;
      const floatDrift = (i % 3 - 1) * floatLocal * 60;
      const floatRot = (i - 4) * floatLocal * 8;
      const floatOp = 1 - floatLocal;

      // Scanline position (0 → 100%).
      const scanY = easeOutCubic(scanLocal) * 100;

      cell.style.transform = `translateZ(${pushZ.toFixed(2)}px) scale(${(pushScale).toFixed(3)}) translateY(${floatY.toFixed(2)}px) translateX(${floatDrift.toFixed(2)}px) rotate(${floatRot.toFixed(2)}deg)`;
      cell.style.opacity = String(lightupLocal * floatOp);
      // No per-cell blur filter — preserves image sharpness across all phases.
      cell.style.filter = 'none';
      cell.style.zIndex = '1';

      // CSS var for scanline position + visibility.
      cell.style.setProperty('--scan-y', `${scanY}%`);
      cell.style.setProperty('--img-op', String(scanLocal));
    });

    // River + veil logic removed — overlays retired (see file header).
  }, [progress, mouse]);

  return (
    <section
      ref={sectionRef}
      id="chapter-05"
      data-chapter="05"
      data-title="设计转译"
      className="gf-chapter"
      style={{ position: 'relative', height: '130vh', width: '100%', background: 'transparent' }}
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
        {/* Background */}
        {/* Background owned by .gf-flow gradient — kept transparent here. */}

        <GfAmbientParticles
          count={50}
          opacity={0.3 * (1 - seg(progress, 0.9, 1))}
          minSize={0.3}
          maxSize={1.4}
          color={[200, 180, 220]}
          driftX={12}
          driftY={16}
          style={{ zIndex: 1 }}
        />

        {/* Central light point (start) */}
        <div
          ref={pointRef}
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: 'white',
            boxShadow: '0 0 24px 8px rgba(255,255,255,0.7), 0 0 60px 20px rgba(201,168,76,0.4)',
            transform: 'translate(-50%, -50%)',
            zIndex: 5,
            pointerEvents: 'none',
          }}
        />

        {/* Grid (centered 3×3 matrix + bottom column labels + LTR guide arrow)

            ★ 稳定结构 ★ 单一规整 3×3 grid + 绝对定位悬浮箭头。
            过去用"中间行 gap 加宽"来留出箭头空间，会导致中间行整体宽度变化、
            三列水平位置不再与第一/三行对齐（连锁错位）。
            现在统一网格参数：
              · 单元格边长 --gf05-cell-size：桌面端 200px（九张图共用同一基准）
              · 列 gap = 行 gap = 48px（足够容纳 36px 宽的悬浮箭头）
              · 网格总宽 = 3 × 200 + 2 × 48 = 696px
              · 网格总高 = 3 × 200 + 2 × 48 = 696px
            三行三列共用同一套列/行坐标 → 9 张图构成真正规整的 3×3 网格。
            中间行箭头用 position:absolute 悬浮在网格之上，完全不参与 grid 计算，
            箭头中心点：
              · 水平：第一间隙中心 = 200 + 24 = 224px → 224/696 ≈ 32.18%
                       第二间隙中心 = 696 − 224 = 472px → 472/696 ≈ 67.82%
              · 垂直：第二行中心 = 200 + 48 + 100 = 348px → 348/696 = 50%
            箭头宽度 36px < 间隙 48px，左右各留 6px 余量，绝不接触图片边缘。 */}
        <div
          ref={gridRef}
          style={{
            '--gf05-cell-size': 'min((62vw - 96px) / 3, 200px)',
            '--gf05-gap': '48px',
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px',
            padding: '10vh 8vw',
            transformStyle: 'preserve-3d',
            willChange: 'transform, opacity',
            zIndex: 3,
          } as CSSProperties}
        >
          {/* Main 3×3 matrix wrapper —— 仅承载规整 grid 与绝对定位的悬浮箭头 */}
          <div
            style={{
              flex: '0 0 auto',
              width: 'calc(var(--gf05-cell-size) * 3 + var(--gf05-gap) * 2)',
              position: 'relative',
              transformStyle: 'preserve-3d',
            }}
          >
            {/* 单一规整 3×3 grid：三列等宽 + 三行等高 + 列/行 gap 全部统一。
                9 张图片共用同一组列位置坐标，三行三列严格对齐。 */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, var(--gf05-cell-size))',
                gridTemplateRows: 'repeat(3, var(--gf05-cell-size))',
                gap: 'var(--gf05-gap)',
                position: 'relative',
              }}
            >
              {CELLS.map((cell, i) => (
                <div
                  key={i}
                  ref={(el) => { cellRefs.current[i] = el; }}
                  data-gallery-card
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: '2px',
                    background: 'rgba(255,255,255,0.02)',
                    opacity: 0,
                    width: 'var(--gf05-cell-size)',
                    height: 'var(--gf05-cell-size)',
                    willChange: 'transform, opacity',
                  }}
                >
                  {/* Four corner accents — refined frame corners instead of full border */}
                  <span aria-hidden="true" style={{ position: 'absolute', top: 6, left: 6, width: 10, height: 10, borderTop: '1px solid rgba(201,168,76,0.55)', borderLeft: '1px solid rgba(201,168,76,0.55)', zIndex: 2, pointerEvents: 'none' }} />
                  <span aria-hidden="true" style={{ position: 'absolute', top: 6, right: 6, width: 10, height: 10, borderTop: '1px solid rgba(201,168,76,0.55)', borderRight: '1px solid rgba(201,168,76,0.55)', zIndex: 2, pointerEvents: 'none' }} />
                  <span aria-hidden="true" style={{ position: 'absolute', bottom: 6, left: 6, width: 10, height: 10, borderBottom: '1px solid rgba(201,168,76,0.55)', borderLeft: '1px solid rgba(201,168,76,0.55)', zIndex: 2, pointerEvents: 'none' }} />
                  <span aria-hidden="true" style={{ position: 'absolute', bottom: 6, right: 6, width: 10, height: 10, borderBottom: '1px solid rgba(201,168,76,0.55)', borderRight: '1px solid rgba(201,168,76,0.55)', zIndex: 2, pointerEvents: 'none' }} />
                  {/* Image, faded in by scan — uniform aspect ratio via object-fit cover */}
                  <img
                    src={cell.src}
                    alt=""
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center',
                      opacity: 'var(--img-op, 0)',
                      transition: 'opacity 0.1s linear',
                    }}
                  />
                  {/* Scanline */}
                  <div
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: 'var(--scan-y, 0%)',
                      height: '3px',
                      background: 'linear-gradient(to bottom, transparent, rgba(201,168,76,0.9), transparent)',
                      boxShadow: '0 0 12px rgba(201,168,76,0.7)',
                      opacity: 'calc(var(--img-op, 0) * (1 - var(--img-op, 0) * 1.1))',
                      transition: 'top 0.1s linear, opacity 0.1s linear',
                      pointerEvents: 'none',
                    }}
                  />
                </div>
              ))}
            </div>

            {/* 列间方向引导箭头：绝对定位悬浮层，不参与 grid 宽度计算。
                箭头宽度 36px < gap 48px，悬浮在第二行两个列间隙的正中，
                左右各留 6px 余量，绝不接触图片边缘。 */}
            {[0, 1].map((gapIdx) => (
              <span
                key={`gap-arrow-${gapIdx}`}
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: gapIdx === 0 ? '32.18%' : '67.82%',
                  transform: 'translate(-50%, -50%) translateZ(40px)',
                  zIndex: 50,
                  pointerEvents: 'none',
                  display: 'block',
                  width: '36px',
                  height: '14px',
                }}
              >
                <svg
                  className="gf05-arrow-bold"
                  width="36"
                  height="14"
                  viewBox="0 0 92 30"
                  fill="none"
                  preserveAspectRatio="none"
                  style={{ color: 'var(--gf-gold-light)', display: 'block', width: '100%', height: '100%' }}
                >
                  {/* 箭杆：粗实线，圆头收尾 */}
                  <path
                    d="M4 15 H62"
                    stroke="currentColor"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                  />
                  {/* 实心三角箭头头部 */}
                  <path
                    d="M58 4 L86 15 L58 26 Z"
                    fill="currentColor"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeLinejoin="round"
                  />
                  {/* 流光高光带 */}
                  <g clipPath={`url(#gf05-clip-${gapIdx})`}>
                    <rect
                      className="gf05-arrow-flow"
                      x="0"
                      y="11"
                      width="14"
                      height="8"
                      rx="4"
                      fill="rgba(255, 248, 220, 0.85)"
                    />
                  </g>
                  <defs>
                    <clipPath id={`gf05-clip-${gapIdx}`}>
                      <rect x="4" y="11" width="58" height="8" rx="4" />
                    </clipPath>
                  </defs>
                </svg>
              </span>
            ))}
          </div>

          {/* Bottom column labels — 宽度 / 列模板 / gap 全部与上方矩阵严格一致，
              确保底部三列标签与矩阵三列边界精确垂直对齐。 */}
          <div
            aria-hidden="true"
            style={{
              flex: '0 0 auto',
              width: 'calc(var(--gf05-cell-size) * 3 + var(--gf05-gap) * 2)',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, var(--gf05-cell-size))',
              gap: 'var(--gf05-gap)',
              opacity: 'var(--grid-labels-op, 0)',
              transition: 'opacity 0.3s linear',
            }}
          >
            {COLUMN_STAGES.map((s, ci) => (
              <div
                key={ci}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  paddingTop: '6px',
                  borderTop: '1px solid rgba(201,168,76,0.25)',
                  position: 'relative',
                }}
              >
                <span
                  style={{
                    fontFamily: "'Noto Serif SC', serif",
                    fontSize: '15px',
                    letterSpacing: '0.22em',
                    color: 'rgba(245,240,232,0.92)',
                    lineHeight: 1.2,
                  }}
                >
                  {s.stage}
                </span>
                <span
                  style={{
                    fontFamily: "'Cinzel', serif",
                    fontSize: '10px',
                    letterSpacing: '0.28em',
                    color: 'var(--gf-gold)',
                    opacity: 0.85,
                    lineHeight: 1.2,
                  }}
                >
                  {s.stageEn}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Neon border overlay retired — replaced by subtle per-cell corner
            accents for a more refined, less heavy framing. */}

        {/* Light river + final veil retired — they hid the grid content
            under a fullscreen golden process animation. See file header. */}

        {/* Chapter label */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 'max(80px, 12vh)',
            left: 'max(28px, 4vw)',
            display: 'flex',
            alignItems: 'baseline',
            gap: '10px',
            zIndex: 8,
            pointerEvents: 'none',
          }}
        >
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: '11px', letterSpacing: '0.4em', color: 'var(--gf-gold)', opacity: 0.7 }}>CHAPTER</span>
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: '32px', color: 'var(--gf-gold)', lineHeight: 1 }}>05</span>
          <span style={{ fontFamily: "'Noto Serif SC', serif", fontSize: '12px', letterSpacing: '0.25em', color: 'rgba(245,240,232,0.45)', marginLeft: '6px' }}>设计转译</span>
        </div>

        <div
          style={{
            position: 'absolute',
            top: 'max(80px, 12vh)',
            right: 'max(28px, 4vw)',
            textAlign: 'right',
            zIndex: 8,
            pointerEvents: 'none',
            opacity: Math.max(0, 1 - progress * 4),
            transition: 'opacity 0.3s linear',
          }}
        >
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: '10px', letterSpacing: '0.32em', color: 'var(--gf-cold-accent)', opacity: 0.7 }}>DESIGN TRANSLATION</div>
          <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: '14px', letterSpacing: '0.18em', color: 'rgba(245,240,232,0.55)', marginTop: '4px' }}>三阶矩阵 · 原型 → 转译 → 成果</div>
        </div>
      </div>
      </div>
    </section>
  );
}
