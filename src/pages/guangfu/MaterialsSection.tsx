import { useEffect, useRef } from 'react';
import { useScrubProgress } from '@/lib/useScrubProgress';
import { useChapterReveal } from '@/lib/useChapterReveal';
import GfAmbientParticles from '@/components/GfAmbientParticles';

/**
 * Chapter 06 — 材料 (Materials)
 *
 * 静态内容章节（140vh）：以广府文化展馆的六种核心材质为线索，呈现每种材
 * 料的语义与展馆应用。中央三列布局承载完整内容（标题 + 副标 + 六张材质
 * 卡片），整体在网页视窗正中显示。
 *
 * 动画驱动（基于滚动 scrub，与全站一致；键盘方向键跳转到本章节时，会自
 * 然完成入场并在停留期稳定显示，向下离开时再完成出场）：
 *   0%  – 18% : 入场 —— 标题区与卡片群自下淡入 + 上浮归位（错峰）
 *  18%  – 82% : 稳定期 —— 完整内容居中可读
 *  82% – 100% : 出场 —— 内容上移 + 渐隐，让位下一章
 */

type Material = {
  id: string;
  cn: string;
  en: string;
  pinyin: string;
  hue: [number, number, number];
  motif: string;
  desc: string;
  usage: string;
};

const MATERIALS: Material[] = [
  {
    id: 'm1',
    cn: '铜',
    en: 'BRONZE',
    pinyin: 'Tóng',
    hue: [201, 138, 60],
    motif: '金石之音',
    desc: '岭南铜器承秦汉遗韵，敲之有金石清响，是祠堂礼器与门钉的肌理之源。',
    usage: '入口序厅的青铜浮雕墙',
  },
  {
    id: 'm2',
    cn: '木',
    en: 'TIMBER',
    pinyin: 'Mù',
    hue: [150, 100, 56],
    motif: '榫卯之间',
    desc: '酸枝、坤甸与杉木构筑骑楼骨架，榫卯咬合无声，留存时间打磨的温度。',
    usage: '展廊格栅与展柜骨架',
  },
  {
    id: 'm3',
    cn: '琉璃',
    en: 'GLAZE',
    pinyin: 'Liúlí',
    hue: [120, 180, 200],
    motif: '光色穿廊',
    desc: '广府琉璃以"岭南三彩"为底，光穿过满洲窗，于地面织出彩色光影。',
    usage: '中庭天窗与满洲窗复刻',
  },
  {
    id: 'm4',
    cn: '石',
    en: 'STONE',
    pinyin: 'Shí',
    hue: [180, 175, 165],
    motif: '青砖旧痕',
    desc: '青麻石与蚝壳墙是岭南的呼吸肌理，雨痕苔迹皆为时间的笔触。',
    usage: '地铺与场景复原墙',
  },
  {
    id: 'm5',
    cn: '绸',
    en: 'SILK',
    pinyin: 'Chóu',
    hue: [200, 120, 130],
    motif: '缱绻流光',
    desc: '香云纱以薯莨染就，泥金暗纹游走于丝绸之间，是广绣的呼吸与肌理。',
    usage: '展品柔帘与互动投影幕',
  },
  {
    id: 'm6',
    cn: '漆',
    en: 'LACQUER',
    pinyin: 'Qī',
    hue: [120, 40, 40],
    motif: '朱漆描金',
    desc: '广式描金漆器朱底金线，繁而不乱，将木雕的呼吸封存于釉色之下。',
    usage: '文物展龛与品牌铭牌',
  },
];

function seg(p: number, s: number, e: number) {
  if (e <= s) return p <= s ? 0 : 1;
  return Math.max(0, Math.min(1, (p - s) / (e - s)));
}
function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}
function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export default function MaterialsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);

  const { progress } = useScrubProgress(sectionRef, { range: 'full', lead: 1, initial: 0.1 });

  useChapterReveal(sectionRef, innerRef);

  // 入场 / 出场以 section 自身 bounding rect 为基准（与 useChapterReveal 同源），
  // 这样键盘跳转 / 直接锚定到本章节时，停留期 opacity 稳定为 1，内容完整呈现；
  // scrub progress 仅用于背景与微尘的衰减。
  useEffect(() => {
    let raf = 0;
    const apply = () => {
      raf = 0;
      const section = sectionRef.current;
      if (!section) return;
      const vh = window.innerHeight;
      const rect = section.getBoundingClientRect();

      // 进入：section 顶部从 vh 上升到 vh*0.55 —— 钉住即完成入场
      const enter = clamp01((vh - rect.top) / (vh - vh * 0.55));
      // 离开：section 底部从 vh 滑到 0
      const exit = clamp01((vh - rect.bottom) / vh);

      const enterE = easeOutCubic(enter);
      const exitE = easeOutCubic(exit);

      // 舞台：整体上浮 + 透明度
      if (stageRef.current) {
        const lift = (1 - enterE) * 48 + exitE * 64;
        stageRef.current.style.transform = `translateY(${(-lift).toFixed(2)}px)`;
        stageRef.current.style.opacity = String(enterE * (1 - exitE));
      }
      // 标题：略晚入场 / 略早出场
      if (headRef.current) {
        const hIn = easeOutCubic(clamp01((enter - 0.1) / 0.9));
        const hOut = easeOutCubic(clamp01((exit - 0) / 0.8));
        headRef.current.style.transform = `translateY(${((1 - hIn) * 28 - hOut * 28).toFixed(2)}px)`;
        headRef.current.style.opacity = String(hIn * (1 - hOut));
      }
      // 卡片错峰入场
      cardRefs.current.forEach((el, i) => {
        if (!el) return;
        const start = 0.08 + (i / 6) * 0.5;
        const localIn = easeOutCubic(clamp01((enter - start) / 0.4));
        const localOut = easeOutCubic(clamp01((exit - (i / 6) * 0.1) / 0.7));
        const lift = (1 - localIn) * 40 + localOut * 52;
        el.style.transform = `translateY(${(-lift).toFixed(2)}px) scale(${(0.94 + localIn * 0.06).toFixed(3)})`;
        el.style.opacity = String(localIn * (1 - localOut));
      });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    apply();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [sectionRef]);

  return (
    <section
      ref={sectionRef}
      id="chapter-06"
      data-chapter="06"
      data-title="材料"
      className="gf-chapter"
      style={{ position: 'relative', height: '140vh', width: '100%', background: 'transparent' }}
    >
      <div
        ref={innerRef}
        className="gf-chapter-reveal-wrap"
        style={{ position: 'absolute', inset: 0, willChange: 'opacity, transform' }}
      >
        <div
          className="gf-chapter-inner"
          style={{
            position: 'sticky',
            top: 0,
            height: '100vh',
            width: '100%',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* 背景暖光 */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(ellipse at center, rgba(216, 200, 168, 0.32) 0%, transparent 68%)',
            }}
          />

          {/* 漂浮微尘 */}
          <GfAmbientParticles
            count={36}
            opacity={0.28 * (1 - seg(progress, 0.85, 1))}
            minSize={0.4}
            maxSize={1.3}
            color={[180, 150, 100]}
            driftX={10}
            driftY={12}
            style={{ zIndex: 5 }}
          />

          {/* 章节标签 */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 'max(80px, 12vh)',
              left: 'max(28px, 4vw)',
              display: 'flex',
              alignItems: 'baseline',
              gap: '10px',
              zIndex: 40,
              pointerEvents: 'none',
              mixBlendMode: 'difference',
            }}
          >
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: '11px', letterSpacing: '0.4em', color: '#7a5a2a', opacity: 0.85 }}>
              CHAPTER
            </span>
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: '32px', color: '#7a5a2a', lineHeight: 1 }}>06</span>
            <span style={{ fontFamily: "'Noto Serif SC', serif", fontSize: '12px', letterSpacing: '0.25em', color: 'rgba(80,60,30,0.7)', marginLeft: '6px' }}>
              材料
            </span>
          </div>

          <div
            style={{
              position: 'absolute',
              top: 'max(80px, 12vh)',
              right: 'max(28px, 4vw)',
              textAlign: 'right',
              zIndex: 40,
              pointerEvents: 'none',
              mixBlendMode: 'difference',
              opacity: Math.max(0, 1 - progress * 3),
              transition: 'opacity 0.3s linear',
            }}
          >
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: '10px', letterSpacing: '0.32em', color: '#7a5a2a', opacity: 0.85 }}>
              MATERIALS &amp; TEXTURE
            </div>
            <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: '14px', letterSpacing: '0.18em', color: 'rgba(80,60,30,0.65)', marginTop: '4px' }}>
              金石 · 木作 · 琉璃
            </div>
          </div>

          {/* 中央舞台 —— 完整内容 */}
          <div
            ref={stageRef}
            style={{
              position: 'relative',
              zIndex: 20,
              width: 'min(1120px, 92vw)',
              margin: '0 auto',
              padding: '0 16px',
              opacity: 0,
              willChange: 'transform, opacity',
            }}
          >
            {/* 标题区 */}
            <div ref={headRef} style={{ textAlign: 'center', marginBottom: 'clamp(28px, 4vh, 48px)' }}>
              <div
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: '12px',
                  letterSpacing: '0.45em',
                  color: 'rgba(122, 90, 42, 0.85)',
                  marginBottom: '14px',
                }}
              >
                GUANGFU · MATERIAL LANGUAGE
              </div>
              <h2
                style={{
                  fontFamily: "'Noto Serif SC', serif",
                  fontSize: 'clamp(30px, 4.4vw, 52px)',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  color: 'rgba(60, 44, 22, 0.92)',
                  margin: 0,
                  lineHeight: 1.1,
                }}
              >
                六材成器 · 物候生光
              </h2>
              <p
                style={{
                  marginTop: '16px',
                  fontFamily: "'Noto Serif SC', serif",
                  fontSize: 'clamp(13px, 1.4vw, 16px)',
                  letterSpacing: '0.12em',
                  lineHeight: 1.9,
                  color: 'rgba(70, 54, 30, 0.78)',
                  maxWidth: '760px',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                }}
              >
                展馆以岭南六材为骨——铜鸣、木构、琉璃、青石、丝绸、漆色，承载
                广府的物质记忆与气候智慧。每一材皆是展陈语言，亦是与光、风、人
                对话的媒介。
              </p>
            </div>

            {/* 六张材质卡片 —— 三列网格 */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: 'clamp(14px, 1.6vw, 22px)',
              }}
            >
              {MATERIALS.map((m) => {
                const [r, g, b] = m.hue;
                return (
                  <div
                    key={m.id}
                    ref={(el) => {
                      const idx = MATERIALS.findIndex((x) => x.id === m.id);
                      cardRefs.current[idx] = el;
                    }}
                    style={{
                      position: 'relative',
                      padding: 'clamp(18px, 2vw, 26px) clamp(16px, 1.8vw, 24px)',
                      borderRadius: '4px',
                      background: `linear-gradient(160deg, rgba(${r}, ${g}, ${b}, 0.14) 0%, rgba(${r}, ${g}, ${b}, 0.05) 100%)`,
                      border: '1px solid rgba(122, 90, 42, 0.22)',
                      borderTop: `2px solid rgba(${r}, ${g}, ${b}, 0.75)`,
                      boxShadow: '0 10px 28px rgba(80, 60, 30, 0.10)',
                      opacity: 0,
                      willChange: 'transform, opacity',
                      overflow: 'hidden',
                    }}
                  >
                    {/* 卡片右上序号 / 拼音 */}
                    <div
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '14px',
                        fontFamily: "'Cinzel', serif",
                        fontSize: '10px',
                        letterSpacing: '0.3em',
                        color: 'rgba(122, 90, 42, 0.55)',
                      }}
                    >
                      {m.en}
                    </div>

                    {/* 大字 + 拼音 */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                      <span
                        style={{
                          fontFamily: "'Noto Serif SC', serif",
                          fontSize: 'clamp(40px, 5vw, 56px)',
                          fontWeight: 600,
                          color: `rgb(${r}, ${g}, ${b})`,
                          lineHeight: 1,
                          textShadow: '0 2px 10px rgba(0,0,0,0.08)',
                        }}
                      >
                        {m.cn}
                      </span>
                      <span
                        style={{
                          fontFamily: "'Cinzel', serif",
                          fontSize: '12px',
                          letterSpacing: '0.18em',
                          color: 'rgba(80, 60, 30, 0.6)',
                        }}
                      >
                        {m.pinyin}
                      </span>
                    </div>

                    {/* 母题 */}
                    <div
                      style={{
                        marginTop: '10px',
                        fontFamily: "'Noto Serif SC', serif",
                        fontSize: '14px',
                        letterSpacing: '0.22em',
                        color: 'rgba(60, 44, 22, 0.82)',
                      }}
                    >
                      {m.motif}
                    </div>

                    {/* 分隔线 */}
                    <div
                      aria-hidden="true"
                      style={{
                        marginTop: '14px',
                        marginBottom: '14px',
                        height: '1px',
                        width: '36px',
                        background: `rgba(${r}, ${g}, ${b}, 0.6)`,
                      }}
                    />

                    {/* 说明 */}
                    <p
                      style={{
                        margin: 0,
                        fontFamily: "'Noto Serif SC', serif",
                        fontSize: 'clamp(12.5px, 1.3vw, 14.5px)',
                        lineHeight: 1.85,
                        letterSpacing: '0.04em',
                        color: 'rgba(70, 54, 30, 0.82)',
                      }}
                    >
                      {m.desc}
                    </p>

                    {/* 展馆应用 */}
                    <div
                      style={{
                        marginTop: '14px',
                        paddingTop: '10px',
                        borderTop: '1px dashed rgba(122, 90, 42, 0.28)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          display: 'inline-block',
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: `rgba(${r}, ${g}, ${b}, 0.9)`,
                        }}
                      />
                      <span
                        style={{
                          fontFamily: "'Noto Serif SC', serif",
                          fontSize: '12px',
                          letterSpacing: '0.16em',
                          color: 'rgba(80, 60, 30, 0.7)',
                        }}
                      >
                        {m.usage}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
