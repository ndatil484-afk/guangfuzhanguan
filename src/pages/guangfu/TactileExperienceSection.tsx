import { useEffect, useRef, useState } from 'react';
import GfAmbientParticles from '@/components/GfAmbientParticles';
import brickImg from '@/assets/tactile/brick.jpg';
import woodImg from '@/assets/tactile/wood.jpg';
import ceramicImg from '@/assets/tactile/ceramic.jpg';
import silkImg from '@/assets/tactile/silk.jpg';
import stoneImg from '@/assets/tactile/stone.jpg';
import paperImg from '@/assets/tactile/paper.jpg';

const MATERIALS = [
  {
    id: 'brick',
    name: '青砖',
    en: 'GREEN BRICK',
    description: '粗糙而温暖的触感，仿佛能感受到时光的沉淀。',
    image: brickImg,
    color: [74, 85, 104],
    temperature: '微凉',
    weight: '厚重',
  },
  {
    id: 'wood',
    name: '酸枝木',
    en: 'ROSEWOOD',
    description: '细腻温润的木纹，散发着淡淡的木香。',
    image: woodImg,
    color: [92, 61, 46],
    temperature: '温润',
    weight: '坚实',
  },
  {
    id: 'ceramic',
    name: '广彩瓷',
    en: 'GUANGCAI',
    description: '光滑如玉的釉面，细腻而清凉。',
    image: ceramicImg,
    color: [200, 180, 150],
    temperature: '清凉',
    weight: '轻盈',
  },
  {
    id: 'silk',
    name: '香云纱',
    en: 'GAMUZA SILK',
    description: '柔软而有光泽的触感，丝滑如流水。',
    image: silkImg,
    color: [139, 90, 43],
    temperature: '凉爽',
    weight: '轻柔',
  },
  {
    id: 'stone',
    name: '麻石',
    en: 'GRANITE',
    description: '坚硬而粗粝的表面，蕴含着山的沉稳。',
    image: stoneImg,
    color: [107, 114, 128],
    temperature: '冰凉',
    weight: '厚重',
  },
  {
    id: 'paper',
    name: '宣纸',
    en: 'RICE PAPER',
    description: '轻薄而坚韧的触感，纤维交织的纹理。',
    image: paperImg,
    color: [230, 220, 180],
    temperature: '温暖',
    weight: '轻薄',
  },
];

const CENTER_X = 50;
const CENTER_Y = 50;
const ASPECT = 16 / 9;

const getOrbitRadius = (vw: number): number => {
  if (vw <= 480) return 28;
  if (vw <= 768) return 30;
  return 32;
};

const getMaterialPositions = (vw: number) => {
  const r = getOrbitRadius(vw);
  const materials = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
    const x = CENTER_X + (Math.cos(angle) * r) / ASPECT;
    const y = CENTER_Y + Math.sin(angle) * r;
    materials.push({
      ...MATERIALS[i],
      x,
      y,
      angle,
      radius: r,
    });
  }
  return materials;
};

const easeOutBack = (t: number): number => {
  const c1 = 1.4;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

const getBadgeSize = (vw: number): number => {
  if (vw <= 480) return 56;
  if (vw <= 768) return 72;
  return 88;
};

export default function TactileExperienceSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const progressRef = useRef(0);
  const teleportRef = useRef(false);
  const viewportRef = useRef({ vw: typeof window !== 'undefined' ? window.innerWidth : 1280 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState<typeof MATERIALS[0] | null>(null);

  const iconRefs = useRef<Array<HTMLDivElement | null>>([]);
  const labelRefs = useRef<Array<HTMLDivElement | null>>([]);
  const connRefs = useRef<Array<SVGPathElement | null>>([]);
  const connFlowRefs = useRef<Array<SVGCircleElement | null>>([]);

  const initialVw = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const materials = getMaterialPositions(initialVw);

  const apply = (p: number) => {
    p = clamp01(p);
    const t = easeOutBack(p);
    const rot = p * 120;
    const op = clamp01(p * 1.15);

    materials.forEach((mat, i) => {
      const el = iconRefs.current[i];
      if (!el) return;

      const radius = mat.radius * t;
      const angle = mat.angle + (1 - p) * 0.8;
      const dx = (Math.cos(angle) * radius) / ASPECT;
      const dy = Math.sin(angle) * radius;
      const x = CENTER_X + dx;
      const y = CENTER_Y + dy;

      el.style.left = `${x}%`;
      el.style.top = `${y}%`;
      el.style.transform = `translate(-50%, -50%) scale(${Math.max(0, t)}) rotate(${rot * (i % 2 === 0 ? 1 : -1)}deg)`;
      el.style.opacity = `${op}`;
    });

    connRefs.current.forEach((conn, i) => {
      if (!conn) return;
      const mat = materials[i];
      const radius = mat.radius * t;
      const angle = mat.angle + (1 - p) * 0.8;
      const ex = CENTER_X + (Math.cos(angle) * radius) / ASPECT;
      const ey = CENTER_Y + Math.sin(angle) * radius;
      const midX = (CENTER_X + ex) / 2;
      const midY = (CENTER_Y + ey) / 2;
      conn.setAttribute('d', `M ${CENTER_X} ${CENTER_Y} Q ${midX} ${midY} ${ex} ${ey}`);
      conn.style.opacity = `${clamp01(p * 1.1) * 0.6}`;

      const flow = connFlowRefs.current[i];
      if (flow) {
        const period = 3000;
        const time = performance.now();
        const tau = ((time % period) / period) * 2;
        const ft = tau <= 1 ? tau : 2 - tau;
        const u = 1 - ft;
        const fx = u * u * CENTER_X + 2 * u * ft * midX + ft * ft * ex;
        const fy = u * u * CENTER_Y + 2 * u * ft * midY + ft * ft * ey;
        flow.setAttribute('cx', `${fx}`);
        flow.setAttribute('cy', `${fy}`);
        flow.setAttribute('r', `${0.8 * (0.7 + ft * 0.3)}`);
        flow.style.opacity = `${clamp01(p * 1.1) * (0.85 * (1 - ft * 0.5))}`;
      }
    });

    labelRefs.current.forEach((lab) => {
      if (lab) lab.style.opacity = `${clamp01(p * 1.2)}`;
    });
  };

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    let raf = 0;
    const tick = () => {
      raf = 0;
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      viewportRef.current.vw = vw;
      const rect = section.getBoundingClientRect();
      const secCenter = rect.top + rect.height / 2;
      const vpCenter = vh / 2;
      const dist = Math.abs(secCenter - vpCenter);
      const target = clamp01(1 - dist / vh);

      if (teleportRef.current) {
        progressRef.current = target;
      } else {
        const cur = progressRef.current;
        const next = cur + (target - cur) * 0.18;
        progressRef.current = Math.abs(target - next) < 0.001 ? target : next;
      }
      apply(progressRef.current);

      const settled = Math.abs(target - progressRef.current) < 0.001;
      const visible = progressRef.current > 0.01;
      const needMore = !settled || visible || (teleportRef.current && target > 0.001);
      if (needMore) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = 0;
      }
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);

    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const isNav =
        e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'ArrowLeft' ||
        e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === 'PageUp' ||
        e.key === 'Home' || e.key === 'End';
      if (!isNav) return;
      teleportRef.current = true;
      schedule();
    };
    const onWheel = () => {
      if (teleportRef.current) {
        teleportRef.current = false;
        schedule();
      }
    };

    window.addEventListener('keydown', onKey, { passive: true });
    window.addEventListener('wheel', onWheel, { passive: true });

    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('wheel', onWheel);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const badgeSize = getBadgeSize(initialVw);

  return (
    <section
      ref={sectionRef}
      id="chapter-09"
      data-title="触觉体验"
      className="gf-chapter"
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        background: 'transparent',
        overflow: 'hidden',
      }}
    >
      {/* 背景光效 */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(ellipse 55% 50% at 50% 46%, rgba(201,168,76,0.08) 0%, rgba(201,168,76,0.03) 35%, rgba(10,13,20,0) 65%)',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(ellipse 90% 90% at 50% 50%, rgba(10,13,20,0) 55%, rgba(6,8,12,0.55) 100%)',
        }}
      />

      {/* 金尘粒子 */}
      <GfAmbientParticles
        count={80}
        opacity={0.42}
        minSize={0.4}
        maxSize={1.6}
        color={[201, 168, 76]}
        driftX={20}
        driftY={28}
        style={{ zIndex: 1 }}
      />

      {/* 圆环系统 SVG */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          zIndex: 3,
          pointerEvents: 'none',
        }}
      >
        <defs>
          <linearGradient id="gfTactileRingGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#c9a84c" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#f0d080" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#c9a84c" stopOpacity="0.4" />
          </linearGradient>
          <radialGradient id="gfTactileCoreGlow">
            <stop offset="0%" stopColor="#fff8e0" stopOpacity="1" />
            <stop offset="30%" stopColor="#f0d080" stopOpacity="0.7" />
            <stop offset="70%" stopColor="#c9a84c" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#c9a84c" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 外层轨道圆环 */}
        <circle
          cx="50"
          cy="50"
          r="32"
          fill="none"
          stroke="url(#gfTactileRingGrad)"
          strokeWidth="0.5"
          strokeDasharray="0.6 2"
          vectorEffect="non-scaling-stroke"
          style={{ opacity: 0.5 }}
        />

        {/* 内层圆环 */}
        <circle
          cx="50"
          cy="50"
          r="16"
          fill="none"
          stroke="url(#gfTactileRingGrad)"
          strokeWidth="0.8"
          vectorEffect="non-scaling-stroke"
          style={{ opacity: 0.7 }}
        />

        {/* 中心核心发光点 */}
        <circle
          cx="50"
          cy="50"
          r="5"
          fill="url(#gfTactileCoreGlow)"
          vectorEffect="non-scaling-stroke"
          style={{ opacity: 0.85, filter: 'blur(0.5px)' }}
        />

        {/* 中心文字 */}
        <text
          x="50"
          y="49"
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            fontFamily: "'Noto Serif SC', serif",
            fontSize: 'clamp(2px, 0.5vw, 3.5px)',
            fill: '#f0d080',
            opacity: 0.9,
            letterSpacing: '0.15em',
          }}
        >
          六材共生
        </text>
        <text
          x="50"
          y="53"
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 'clamp(1px, 0.25vw, 1.8px)',
            fill: 'rgba(245,240,232,0.6)',
            letterSpacing: '0.3em',
          }}
        >
          SIX MATERIALS
        </text>

        {/* 连接线和流动光点 */}
        {materials.map((mat, i) => (
          <g key={`conn-${mat.id}`}>
            <path
              ref={(el) => { connRefs.current[i] = el; }}
              d={`M 50 50 Q 50 50 ${mat.x} ${mat.y}`}
              fill="none"
              stroke="rgba(201,168,76,0.4)"
              strokeWidth="0.12"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              style={{ opacity: 0 }}
            />
            <circle
              ref={(el) => { connFlowRefs.current[i] = el; }}
              cx="50"
              cy="50"
              r="0.6"
              fill="#f0d080"
              vectorEffect="non-scaling-stroke"
              style={{ opacity: 0, filter: 'blur(0.3px)' }}
            />
          </g>
        ))}

        {/* 放射状刻度 */}
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i * 15 * Math.PI) / 180;
          const x1 = 50 + 18 * Math.cos(angle);
          const y1 = 50 + 18 * Math.sin(angle);
          const x2 = 50 + 21 * Math.cos(angle);
          const y2 = 50 + 21 * Math.sin(angle);
          return (
            <line
              key={`tick-${i}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="rgba(201,168,76,0.3)"
              strokeWidth="0.2"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>

      {/* 材质徽章圆环分布 */}
      {materials.map((mat, i) => (
        <div
          key={mat.id}
          ref={(el) => { iconRefs.current[i] = el; }}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%) scale(0) rotate(0deg)',
            opacity: 0,
            zIndex: 4,
            cursor: 'pointer',
            willChange: 'transform, opacity, left, top',
          }}
          onClick={() => setShowPreview(mat)}
          onMouseEnter={() => setSelectedId(mat.id)}
          onMouseLeave={() => setSelectedId(null)}
        >
          {/* 圆形材质图片 */}
          <div
            style={{
              position: 'relative',
              width: `${badgeSize}px`,
              height: `${badgeSize}px`,
              borderRadius: '50%',
              overflow: 'hidden',
              border: '2px solid rgba(201,168,76,0.6)',
              boxShadow: selectedId === mat.id
                ? '0 0 30px rgba(201,168,76,0.7), 0 8px 24px rgba(0,0,0,0.4)'
                : '0 4px 16px rgba(0,0,0,0.3)',
              transition: 'box-shadow 0.3s ease, transform 0.3s ease',
              transform: selectedId === mat.id ? 'scale(1.1)' : 'scale(1)',
            }}
          >
            <img
              src={mat.image}
              alt={mat.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: selectedId === mat.id ? 'brightness(1.1)' : 'brightness(0.85)',
                transition: 'filter 0.3s ease',
              }}
            />
            {/* 内部渐变叠加 */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15) 0%, transparent 50%)',
                pointerEvents: 'none',
              }}
            />
          </div>

          {/* 名称标签 */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '100%',
              transform: 'translateX(-50%)',
              marginTop: '10px',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              opacity: selectedId === mat.id ? 1 : 0.8,
              transition: 'opacity 0.3s ease',
            }}
          >
            <div
              style={{
                fontFamily: "'Noto Serif SC', serif",
                fontSize: initialVw <= 480 ? '11px' : initialVw <= 768 ? '13px' : '15px',
                color: '#fffef8',
                fontWeight: '500',
                textShadow: '0 2px 8px rgba(0,0,0,0.6)',
              }}
            >
              {mat.name}
            </div>
            <div
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: initialVw <= 480 ? '8px' : initialVw <= 768 ? '9px' : '10px',
                color: 'rgba(201,168,76,0.8)',
                letterSpacing: '0.2em',
                marginTop: '2px',
              }}
            >
              {mat.en}
            </div>
          </div>
        </div>
      ))}

      {/* 左上章节标签 */}
      <div
        ref={(el) => { labelRefs.current[0] = el; }}
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 'max(140px, 16vh)',
          left: 'max(20px, 5vw)',
          display: 'flex',
          alignItems: 'baseline',
          gap: '10px',
          zIndex: 6,
          pointerEvents: 'none',
          opacity: 0,
        }}
      >
        <span
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 'clamp(10px, 1.4vw, 12px)',
            letterSpacing: '0.4em',
            color: 'var(--gf-gold)',
            opacity: 0.8,
          }}
        >
          CHAPTER
        </span>
        <span
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 'clamp(26px, 3.5vw, 36px)',
            color: 'var(--gf-gold)',
            lineHeight: 1,
          }}
        >
          09
        </span>
        <span
          style={{
            fontFamily: "'Noto Serif SC', serif",
            fontSize: 'clamp(10px, 1.4vw, 13px)',
            letterSpacing: '0.25em',
            color: 'rgba(245,240,232,0.45)',
            marginLeft: '6px',
          }}
        >
          触觉体验
        </span>
      </div>

      {/* 右上副标题 */}
      <div
        ref={(el) => { labelRefs.current[1] = el; }}
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 'max(140px, 16vh)',
          right: 'max(20px, 5vw)',
          textAlign: 'right',
          zIndex: 6,
          pointerEvents: 'none',
          opacity: 0,
        }}
      >
        <div
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 'clamp(9px, 1.3vw, 12px)',
            letterSpacing: '0.35em',
            color: 'var(--gf-cold-accent)',
            opacity: 0.8,
          }}
        >
          TACTILE EXPERIENCE
        </div>
        <div
          style={{
            fontFamily: "'Noto Serif SC', serif",
            fontSize: 'clamp(11px, 1.6vw, 15px)',
            letterSpacing: '0.18em',
            color: 'rgba(245,240,232,0.55)',
            marginTop: '4px',
          }}
        >
          建筑与身体对话
        </div>
      </div>

      {/* 底部说明 */}
      <div
        ref={(el) => { labelRefs.current[2] = el; }}
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: 'max(30px, 6vh)',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          zIndex: 6,
          pointerEvents: 'none',
          opacity: 0,
          maxWidth: '500px',
        }}
      >
        <p
          style={{
            fontSize: 'clamp(12px, 1.6vw, 14px)',
            lineHeight: '1.8',
            color: 'rgba(245,240,232,0.6)',
            letterSpacing: '0.08em',
          }}
        >
          点击材质感受纹理 · 六种材质承载广府文化记忆
        </p>
      </div>

      {/* 全屏预览 */}
      {showPreview && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeIn 0.3s ease forwards',
            cursor: 'pointer',
          }}
          onClick={() => setShowPreview(null)}
        >
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: 'min(70vw, 500px)',
                height: 'min(70vw, 500px)',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '3px solid rgba(201,168,76,0.6)',
                boxShadow: '0 0 60px rgba(201,168,76,0.4)',
                margin: '0 auto',
                animation: 'zoomIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
              }}
            >
              <img
                src={showPreview.image}
                alt={showPreview.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </div>
            <h3
              style={{
                fontSize: 'clamp(28px, 5vw, 48px)',
                color: '#fffef8',
                marginTop: '32px',
                marginBottom: '8px',
                fontWeight: '500',
                letterSpacing: '0.2em',
                animation: 'fadeInUp 0.5s ease 0.2s forwards',
                opacity: 0,
              }}
            >
              {showPreview.name}
            </h3>
            <p
              style={{
                fontSize: 'clamp(12px, 1.8vw, 16px)',
                color: 'rgba(245,240,232,0.7)',
                letterSpacing: '0.1em',
                marginBottom: '24px',
                animation: 'fadeInUp 0.5s ease 0.3s forwards',
                opacity: 0,
              }}
            >
              {showPreview.en}
            </p>
            <p
              style={{
                fontSize: 'clamp(13px, 1.8vw, 16px)',
                color: 'rgba(245,240,232,0.8)',
                maxWidth: '400px',
                margin: '0 auto 24px',
                lineHeight: '1.8',
                animation: 'fadeInUp 0.5s ease 0.4s forwards',
                opacity: 0,
              }}
            >
              {showPreview.description}
            </p>
            <div
              style={{
                display: 'flex',
                gap: '24px',
                justifyContent: 'center',
                animation: 'fadeInUp 0.5s ease 0.5s forwards',
                opacity: 0,
              }}
            >
              <span style={{ color: 'rgba(201,168,76,0.8)', fontSize: '14px' }}>
                温度：{showPreview.temperature}
              </span>
              <span style={{ color: 'rgba(201,168,76,0.8)', fontSize: '14px' }}>
                质感：{showPreview.weight}
              </span>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes zoomIn {
          from {
            transform: scale(0.5);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </section>
  );
}