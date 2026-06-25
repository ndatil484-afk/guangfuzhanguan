import { useEffect, useRef } from 'react';
import GfAmbientParticles from '@/components/GfAmbientParticles';

/**
 * Chapter 04 — 符号提取 (Symbol Extraction)
 *
 * 动画模型：用单个 0–1 浮点 `progress` 同时驱动四个图标的
 *   transform: translate() rotate() scale()
 *   opacity
 * —— 全部由同一插值变量计算，保证"旋转 + 放大 + 显现"是同一动作的
 * 不同侧面，绝不出现"scale 已经变化但 opacity 仍滞后"的中间态。
 *
 * progress 的来源：
 *   - 默认：基于章节中心与视口中心的距离，连续插值（滚轮滚动 → 看到完整的
 *     从中心爆发/收束的过程动画）。
 *   - 键盘跳转（↑↓←→ / PageUp/Down / Home/End）：标记 `teleport=true`，
 *     progress 直接锁到 1（稳定终态），不重播过程动画；下一次滚轮事件
 *     解除锁定，恢复正常滚动驱动。
 */

type Dim = {
  id: string;
  label: string;
  en: string;
  // 该维度从广府文化中提取的具体特征释义（外侧低调点缀）
  note: string;
  px: number; // 视口百分比（终态角位）
  py: number;
  // 极坐标（相对中心）：终态半径 + 终态极角（弧度）
  targetR: number;
  targetA: number;
  // 入场时角度的"起始偏移"：从 (targetA + spinSweep) 扫向 targetA，
  // 制造"旋转着飞出去"的弧线轨迹（出场反向）。
  spinSweep: number;
  // 图标自转方向因子（仅影响 transform: rotate 的方向）
  spin: number;
};

const CENTER_X = 50;
const CENTER_Y = 50;
// 整体水平偏移量（负值=左移），用于修正视觉效果偏右的问题
const CENTER_X_OFFSET = -4; // 左移4%

// 把每个图标的角位 (px,py) 转成极坐标 (r, angle)。
// 半径用视口百分比下的"加权距离"（横向按 16:9 容器近似折算），
// 让左上/右上/左下/右下到中心的视觉距离一致。
const ASPECT = 16 / 9;
const toPolar = (px: number, py: number): { r: number; a: number } => {
  const dx = (px - CENTER_X) * ASPECT;
  const dy = py - CENTER_Y;
  return {
    r: Math.sqrt(dx * dx + dy * dy),
    a: Math.atan2(dy, dx),
  };
};

// 四个符号沿圆环轨道分布：半径自适应
// 减小半径，让布局更紧凑，留出更多空间给文字
const getOrbitRadius = (vw: number): number => {
  if (vw <= 480) return 15; // 手机：紧凑圆环
  if (vw <= 768) return 20; // 平板：中等圆环
  return 26; // 桌面：适中半径
};

const getRawDims = (vw: number) => {
  const r = getOrbitRadius(vw);
  // 移动端把"色"和"声"上移一些，让释义文字+底部ROOT都有空间
  const verticalAdjust = vw <= 480 ? 2.5 : vw <= 768 ? 1.5 : 0;
  return [
    { id: 'd1', label: '形', en: 'FORM', note: '镬耳山墙 · 骑楼轮廓', px: 50 + r * Math.cos(0), py: 50 + r * Math.sin(0) },
    { id: 'd2', label: '色', en: 'COLOR', note: '满洲窗彩 · 岭南暖调', px: 50 + r * Math.cos(Math.PI / 2), py: 50 + r * Math.sin(Math.PI / 2) - verticalAdjust - (vw <= 768 ? 0 : 1.5) },
    { id: 'd3', label: '质', en: 'TEXTURE', note: '砖木肌理 · 灰塑质感', px: 50 + r * Math.cos(Math.PI), py: 50 + r * Math.sin(Math.PI) },
    { id: 'd4', label: '声', en: 'SOUND', note: '粤剧腔韵 · 市井烟火', px: 50 + r * Math.cos(3 * Math.PI / 2), py: 50 + r * Math.sin(3 * Math.PI / 2) - verticalAdjust - (vw <= 768 ? 1 : 2.5) },
  ];
};

const RAW = getRawDims(typeof window !== 'undefined' ? window.innerWidth : 1280);

const DIMS: Dim[] = RAW.map((d) => {
  const { r, a } = toPolar(d.px + CENTER_X_OFFSET, d.py);
  // 沿轨道公转方向：顺时针
  const sweep = 1;
  return {
    ...d,
    targetR: r,
    targetA: a,
    spinSweep: sweep * (Math.PI / 2.4), // ±75°
    spin: sweep,
  };
});

// 旧树形结构常量已移除

// 缓动函数：略带回弹的 ease-out，让放大过程更有"粒子爆发"的张力。
const easeOutBack = (t: number): number => {
  const c1 = 1.4;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

// 响应式尺寸：根据视口宽度返回徽章尺寸
// 减小徽章尺寸，让更多空间留给文字
const getBadgeSize = (vw: number): number => {
  if (vw <= 480) return 52; // 手机：52px
  if (vw <= 768) return 68; // 平板：68px
  return 84; // 桌面：84px
};

const getCoreFontSize = (vw: number): number => {
  if (vw <= 480) return 20; // 手机：核心字20px
  if (vw <= 768) return 26; // 平板：26px
  return 32; // 桌面：32px
};

export default function CultureSection() {
  const sectionRef = useRef<HTMLElement>(null);
  // 进度（驱动所有 transform / opacity）
  const progressRef = useRef(0);
  // 键盘跳转中？true → progress 立即锁到 1，不做 lerp
  const teleportRef = useRef(false);
  // 响应式尺寸缓存（视口变化时更新）
  const viewportRef = useRef({ vw: typeof window !== 'undefined' ? window.innerWidth : 1280 });

  // 直接挂载时立即写入 DOM 的 refs（避免 React 重渲染抖动）
  const iconRefs = useRef<Array<HTMLDivElement | null>>([]);
  const noteRefs = useRef<Array<HTMLDivElement | null>>([]);
  const connRefs = useRef<Array<SVGPathElement | null>>([]);
  const connFlowRefs = useRef<Array<SVGCircleElement | null>>([]);
  const treeWrapRef = useRef<SVGSVGElement>(null);
  const labelRefs = useRef<Array<HTMLDivElement | null>>([]);

  // 把单个 progress 应用到所有图标 + 树 + 连线。
  // 同一插值变量驱动：translate / rotate / scale / opacity 全部用 progress。
  const apply = (p: number) => {
    p = clamp01(p);
    // 入场视觉缓动：从 0 到 1，先快速放大并完成大部分位移，再回弹收尾
    const t = easeOutBack(p);
    const rot = easeOutCubic(p) * 360; // 旋转一圈
    const op = clamp01(p * 1.15); // opacity 略微提前，确保不滞后

    DIMS.forEach((d, i) => {
      const el = iconRefs.current[i];
      if (!el) return;
      // 极坐标插值（progress=0 → radius=0 全部重叠在中心；
      //                progress=1 → radius=targetR、angle=targetA 到达角位）。
      // 入场过程中 angle 从 (targetA + spinSweep) 螺旋扫向 targetA，
      // 出场（progress 反向）则反向扫回，形成对称的弧线轨迹。
      const radius = d.targetR * t;
      const angle = d.targetA + d.spinSweep * (1 - p);
      const dx = (Math.cos(angle) * radius) / ASPECT; // 折算回视口百分比
      const dy = Math.sin(angle) * radius;
      const x = CENTER_X + CENTER_X_OFFSET + dx;
      const y = CENTER_Y + dy;
      const scale = Math.max(0, t);
      el.style.left = `${x}%`;
      el.style.top = `${y}%`;
      el.style.transform = `translate(-50%, -50%) scale(${scale}) rotate(${d.spin * rot}deg)`;
      el.style.opacity = `${op}`;

      // 释义文字位置：沿径向向外延伸，统一间距变量
      // 徽章半径为48px ≈ 相对视口6.4%（按750px视口宽），文字统一外推8%
      const note = noteRefs.current[i];
      if (note) {
        // 基于符号当前位置计算文字位置
        const iconLeft = CENTER_X + CENTER_X_OFFSET + (Math.cos(angle) * radius) / ASPECT;
        const iconTop = CENTER_Y + Math.sin(angle) * radius;
        
        // ── 释义文字定位：系统性设计 ──
        // 四个符号沿椭圆轨道分布，释义文字沿径向向外延伸
        // 定位策略：
        //   - 形(0°)：右侧 → 文字在徽章右侧，向上对齐
        //   - 色(90°)：底部 → 文字在徽章下方，水平居中
        //   - 质(180°)：左侧 → 文字在徽章左侧，向上对齐
        //   - 声(270°)：顶部 → 文字在徽章上方，水平居中

        // 根据视口宽度计算基础间距
        const vw = viewportRef.current.vw;
        let baseGap: number;
        if (vw <= 480) {
          baseGap = 8; // 手机：适中间距
        } else if (vw <= 768) {
          baseGap = 10; // 平板：充足间距
        } else {
          baseGap = 12; // 桌面：更充足间距
        }

        // 根据符号ID确定位置类型（0°=右侧, 90°=底部, 180°=左侧, 270°=顶部）
        // 通过符号索引判断：i=0形(右), i=1色(下), i=2质(左), i=3声(上)
        let noteLeft: number;
        let noteTop: number;
        let textAlign: string;

        // 计算徽章半径（用于判断是否需要额外偏移避开中心）
        const badgeSizePx = vw <= 480 ? 64 : vw <= 768 ? 80 : 96;
        const badgeRadiusPct = (badgeSizePx / 2 / vw) * 100; // 徽章半径占视口宽度的百分比

        if (i === 0) {
          noteLeft = iconLeft + baseGap;
          noteTop = iconTop - 2;
          textAlign = 'left';
        } else if (i === 1) {
          noteLeft = iconLeft;
          noteTop = iconTop + baseGap + badgeRadiusPct * 0.5;
          textAlign = 'center';
        } else if (i === 2) {
          noteLeft = iconLeft - baseGap;
          noteTop = iconTop - 2;
          textAlign = 'right';
        } else {
          noteLeft = iconLeft;
          noteTop = iconTop - baseGap * 0.4;
          textAlign = 'center';
        }

        note.style.left = `${noteLeft}%`;
        note.style.top = `${noteTop}%`;
        note.style.textAlign = textAlign;
      }
    });

    // 连线：起点固定在中心 (50,50)，终点实时跟随每个图标的当前位置
    // （极坐标插值结果），让连线在入场/出场过程中始终连接"中心 ↔ 图标"。
    connRefs.current.forEach((conn, i) => {
      if (!conn) return;
      const d = DIMS[i];
      const radius = d.targetR * t;
      const angle = d.targetA + d.spinSweep * (1 - p);
      const ex = CENTER_X + (Math.cos(angle) * radius) / ASPECT;
      const ey = CENTER_Y + Math.sin(angle) * radius;
      // 用经过中心的"反控制点"产生轻微弧线（与树状感呼应）。
      const midX = (CENTER_X + ex) / 2;
      const midY = (CENTER_Y + ey) / 2;
      conn.setAttribute('d', `M ${CENTER_X} ${CENTER_Y} Q ${midX} ${midY} ${ex} ${ey}`);
      conn.style.opacity = `${clamp01(p * 1.1) * 0.7}`;

      // 沿连接线流动的细微光点：在曲线 t∈[0,1] 上做周期采样，
      // 让"能量从中心向四周发散"的视觉叙事有动起来的一帧。
      // 增加更丰富的动画效果：多个时间偏移的光点，增强动感。
      const flow = connFlowRefs.current[i];
      if (flow) {
        const period = 2800; // ms 一个完整往复
        const time = performance.now();
        const tau = ((time % period) / period) * 2;
        const ft = tau <= 1 ? tau : 2 - tau; // 0→1→0 三角波
        
        // 增加第二个相位偏移的光点位置（为未来扩展预留）
        // const tau2 = (((time + period * 0.35) % period) / period) * 2;
        // const ft2 = tau2 <= 1 ? tau2 : 2 - tau2; // 预留变量，当前未使用
        
        // 主光点位置（二次贝塞尔曲线在 t 处的点）
        const u = 1 - ft;
        const fx = u * u * CENTER_X + 2 * u * ft * midX + ft * ft * ex;
        const fy = u * u * CENTER_Y + 2 * u * ft * midY + ft * ft * ey;
        flow.setAttribute('cx', `${fx}`);
        flow.setAttribute('cy', `${fy}`);
        
        // 光点大小和透明度动态变化：靠近中心时稍大且亮，靠近圆环时变小变暗
        const sizeFactor = 0.7 + ft * 0.3; // 0.7 → 1.0
        const brightness = 0.85 * (1 - ft * 0.7); // 靠近圆环更暗
        flow.setAttribute('r', `${0.9 * sizeFactor}`);
        flow.style.opacity = `${clamp01(p * 1.1) * brightness}`;
        
        // 根据位置动态调整模糊效果：靠近圆环时更模糊
        const blurAmount = 0.4 + ft * 0.6;
        flow.style.filter = `blur(${blurAmount}px)`;
      }
    });

    // 树形结构已替换为金色环形能量场系统
    // 环形系统的动画由CSS控制，这里只处理徽章和连接线的动画

    // 释义文字：滞后于圆环主标题一点（p*0.9 → 在主标题已显现后渐入），
    // 营造"主标题先到位、释义后铺陈"的层次，但保持低调点缀感。
    // 增加CSS变量控制文字本身的透明度，实现更平滑的渐入效果。
    const noteOp = clamp01((p - 0.15) * 1.4);
    noteRefs.current.forEach((note) => {
      if (note) {
        note.style.opacity = `${noteOp * 0.85}`;
        // 设置CSS变量控制文字本身的透明度，实现更平滑的渐入效果
        note.style.setProperty('--note-opacity', String(noteOp));
      }
    });

    // 章节角标 / 副标题：随 progress 一同显现
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
      // 当章节中心 == 视口中心 → progress=1；偏离 ≥ 1 视口高度 → progress=0
      const target = clamp01(1 - dist / vh);

      if (teleportRef.current) {
        // 键盘跳转：跟随 target 但不做 lerp（snap），既能"到达立即终态"、
        // 也能在跳离时立即归零。
        progressRef.current = target;
      } else {
        // 滚轮：lerp 平滑（让进入有"渐变展开"的过程感）
        const cur = progressRef.current;
        const next = cur + (target - cur) * 0.18;
        progressRef.current = Math.abs(target - next) < 0.001 ? target : next;
      }
      apply(progressRef.current);

      const settled = Math.abs(target - progressRef.current) < 0.001;
      // 稳定终态下：连接线流动光点 / 枝头光点仍需逐帧驱动（呼吸动画），
      // 因此只要 progress 处于可见状态（> 阈值），就保持 RAF 持续运转；
      // 章节完全滚离视野（progress≈0）时才允许停帧，节省空载开销。
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

    // 键盘 → 切到 snap 模式（不 lerp）：跳转到达后立即终态，跳离时立即归零
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const isNav =
        e.key === 'ArrowDown' ||
        e.key === 'ArrowUp' ||
        e.key === 'ArrowLeft' ||
        e.key === 'ArrowRight' ||
        e.key === 'PageDown' ||
        e.key === 'PageUp' ||
        e.key === 'Home' ||
        e.key === 'End';
      if (!isNav) return;
      teleportRef.current = true;
      schedule();
    };
    // 滚轮 → 解除 teleport 锁定，回到滚动驱动（让滚轮重新触发过程动画）
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

  return (
    <section
      ref={sectionRef}
      id="chapter-04"
      data-chapter="04"
      data-title="符号提取"
      className="gf-chapter"
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        background: 'transparent',
        overflow: 'hidden',
      }}
    >
      {/* 背景暖光 vignette：中心微微暖金辉光 + 四角暗角，增加空间纵深，
          纯径向渐变、零 JS、不引入新色彩，仅强化已有金色主调的"舞台聚光"。
          位于粒子层之下（zIndex 0），让金尘漂浮在暖光之上。 */}
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

       {/* 近景金尘：密度适中、漂移明显，营造画面"呼吸感"。 */}
      <GfAmbientParticles
        count={100}
        opacity={0.42}
        minSize={0.4}
        maxSize={1.8}
        color={[201, 168, 76]}
        driftX={25}
        driftY={32}
        style={{ zIndex: 1 }}
      />
{/* 远景星点：更稀疏、更小、更慢、更暗，与近景金尘拉开纵深层次，
           保持空灵感而非密集噪点。 */}
      <GfAmbientParticles
        count={50}
        opacity={0.28}
        minSize={0.3}
        maxSize={1.0}
        color={[240, 208, 128]}
        driftX={10}
        driftY={16}
        style={{ zIndex: 1 }}
      />

      {/* 岭南建筑线条残影水印层：抽象化、碎片化的线条片段，极低透明度 */}
      <div
        aria-hidden="true"
        className="gf-watermark-layer"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 2,  // 在粒子层之上，主视觉层之下
          pointerEvents: 'none',
        }}
      >
        {/* 1号线条片段：左上角，镬耳山墙曲线片段 */}
        <div
          className="gf-watermark-fragment"
          style={{
            position: 'absolute',
            top: '4%',
            left: '6%',
            width: '60px',
            height: '40px',
            opacity: 0.05,
            transform: 'rotate(-15deg)',
          }}
        >
          <svg
            viewBox="0 0 60 40"
            preserveAspectRatio="xMidYMid meet"
            style={{ width: '100%', height: '100%' }}
          >
            {/* 镬耳曲线的局部弧线：只取中间最美的一段，不闭合 */}
            <path
              d="M5,20 C15,8 25,5 35,12 C45,19"
              fill="none"
              stroke="rgba(201,168,76,0.4)"
              strokeWidth="1.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* 2号线条片段：右上角，骑楼拱券局部 */}
        <div
          className="gf-watermark-fragment"
          style={{
            position: 'absolute',
            top: '7%',
            right: '8%',
            width: '50px',
            height: '35px',
            opacity: 0.04,
            transform: 'rotate(10deg)',
          }}
        >
          <svg
            viewBox="0 0 50 35"
            preserveAspectRatio="xMidYMid meet"
            style={{ width: '100%', height: '100%' }}
          >
            {/* 拱券的四分之一弧片段 */}
            <path
              d="M10,15 Q25,5 40,15"
              fill="none"
              stroke="rgba(201,168,76,0.35)"
              strokeWidth="0.9"
              strokeLinecap="round"
            />
            {/* 支撑柱的片段 */}
            <line x1="25" y1="15" x2="25" y2="25" stroke="rgba(201,168,76,0.25)" strokeWidth="0.7" />
          </svg>
        </div>

        {/* 3号线条片段：左中偏下，窗格转折线条 */}
        <div
          className="gf-watermark-fragment"
          style={{
            position: 'absolute',
            bottom: '32%',
            left: '12%',
            width: '45px',
            height: '45px',
            opacity: 0.03,
            transform: 'rotate(25deg)',
          }}
        >
          <svg
            viewBox="0 0 45 45"
            preserveAspectRatio="xMidYMid meet"
            style={{ width: '100%', height: '100%' }}
          >
            {/* 满洲窗格转角：不完整的L形片段 */}
            <path
              d="M10,10 L25,10 M25,10 L25,25"
              fill="none"
              stroke="rgba(201,168,76,0.3)"
              strokeWidth="0.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* 4号线条片段：右下角，回纹转折片段 */}
        <div
          className="gf-watermark-fragment"
          style={{
            position: 'absolute',
            bottom: '6%',
            right: '9%',
            width: '55px',
            height: '55px',
            opacity: 0.06,
            transform: 'rotate(-20deg)',
          }}
        >
          <svg
            viewBox="0 0 55 55"
            preserveAspectRatio="xMidYMid meet"
            style={{ width: '100%', height: '100%' }}
          >
            {/* 回纹的局部转折：不完整，只取2-3个转折 */}
            <path
              d="M15,15 L30,15 L30,30 L15,30"
              fill="none"
              stroke="rgba(201,168,76,0.45)"
              strokeWidth="1.0"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* 5号线条片段：右中偏上，卷草纹曲线片段 */}
        <div
          className="gf-watermark-fragment"
          style={{
            position: 'absolute',
            top: '25%',
            right: '18%',
            width: '70px',
            height: '40px',
            opacity: 0.035,
            transform: 'rotate(-5deg)',
          }}
        >
          <svg
            viewBox="0 0 70 40"
            preserveAspectRatio="xMidYMid meet"
            style={{ width: '100%', height: '100%' }}
          >
            {/* 卷草纹的局部曲线片段 */}
            <path
              d="M10,20 Q25,10 40,20 Q55,30 40,40"
              fill="none"
              stroke="rgba(201,168,76,0.3)"
              strokeWidth="0.85"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* 6号线条片段：左下角，屋檐起翘片段 */}
        <div
          className="gf-watermark-fragment"
          style={{
            position: 'absolute',
            bottom: '10%',
            left: '18%',
            width: '65px',
            height: '30px',
            opacity: 0.045,
            transform: 'rotate(15deg)',
          }}
        >
          <svg
            viewBox="0 0 65 30"
            preserveAspectRatio="xMidYMid meet"
            style={{ width: '100%', height: '100%' }}
          >
            {/* 屋檐起翘的优雅弧线片段 */}
            <path
              d="M10,15 Q32,5 55,20"
              fill="none"
              stroke="rgba(201,168,76,0.38)"
              strokeWidth="0.95"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* 7号线条片段：中部右侧，若隐若现的装饰线条 */}
        <div
          className="gf-watermark-fragment"
          style={{
            position: 'absolute',
            top: '40%',
            right: '25%',
            width: '40px',
            height: '40px',
            opacity: 0.025,
            transform: 'rotate(30deg)',
          }}
        >
          <svg
            viewBox="0 0 40 40"
            preserveAspectRatio="xMidYMid meet"
            style={{ width: '100%', height: '100%' }}
          >
            {/* 极简的点缀线条 */}
            <path
              d="M10,20 L30,20 M20,10 L20,30"
              fill="none"
              stroke="rgba(201,168,76,0.2)"
              strokeWidth="0.6"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* 8号线条片段：左上偏右，飘逸的收尾线条 */}
        <div
          className="gf-watermark-fragment"
          style={{
            position: 'absolute',
            top: '15%',
            left: '25%',
            width: '50px',
            height: '50px',
            opacity: 0.03,
            transform: 'rotate(-25deg)',
          }}
        >
          <svg
            viewBox="0 0 50 50"
            preserveAspectRatio="xMidYMid meet"
            style={{ width: '100%', height: '100%' }}
          >
            {/* 飘逸的收尾曲线 */}
            <path
              d="M15,15 Q25,5 35,15 Q25,25 15,35"
              fill="none"
              stroke="rgba(201,168,76,0.25)"
              strokeWidth="0.7"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      {/* 金色环形能量场SVG：多层同心圆环系统 */}
      <svg
        ref={treeWrapRef}
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
        className="gf-ring-svg"
      >
        <defs>
          {/* 外层圆环渐变：细线低透明度 */}
          <linearGradient id="gfRingOuterGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#c9a84c" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#f0d080" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#c9a84c" stopOpacity="0.5" />
          </linearGradient>
          
          {/* 中间层圆环渐变：中等透明度 */}
          <linearGradient id="gfRingMiddleGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#c9a84c" stopOpacity="0.7" />
            <stop offset="50%" stopColor="#f0d080" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#c9a84c" stopOpacity="0.7" />
          </linearGradient>
          
          {/* 内层圆环渐变：高透明度 */}
          <linearGradient id="gfRingInnerGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fff8e0" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#f0d080" stopOpacity="1" />
            <stop offset="100%" stopColor="#fff8e0" stopOpacity="0.9" />
          </linearGradient>
          
          {/* 连接线渐变：从中心到符号的弧形渐变 */}
          <linearGradient id="gfConnGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#f0d080" stopOpacity="0.8" />
            <stop offset="40%" stopColor="#c9a84c" stopOpacity="0.6" />
            <stop offset="75%" stopColor="#c9a84c" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#c9a84c" stopOpacity="0.1" />
          </linearGradient>
          
          {/* 中心核心发光点渐变 */}
          <radialGradient id="gfRingCoreGlow">
            <stop offset="0%" stopColor="#fff8e0" stopOpacity="1" />
            <stop offset="30%" stopColor="#f0d080" stopOpacity="0.8" />
            <stop offset="70%" stopColor="#c9a84c" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#c9a84c" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 外层圆环：半径38，细线低透明度 */}
        <circle
          cx="50"
          cy="50"
          r="38"
          fill="none"
          stroke="url(#gfRingOuterGrad)"
          strokeWidth="0.6"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          style={{ opacity: 0.4, filter: 'blur(0.3px)' }}
        />
        
        {/* 中层圆环：半径28，中等透明度，带放射状刻度 */}
        <circle
          cx="50"
          cy="50"
          r="28"
          fill="none"
          stroke="url(#gfRingMiddleGrad)"
          strokeWidth="0.8"
          strokeLinecap="round"
          strokeDasharray="0.8 2.5"
          vectorEffect="non-scaling-stroke"
          style={{ opacity: 0.6 }}
        />
        
        {/* 内层圆环：半径18，高透明度，视觉核心锚点 */}
        <circle
          cx="50"
          cy="50"
          r="18"
          fill="none"
          stroke="url(#gfRingInnerGrad)"
          strokeWidth="1.2"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          style={{ opacity: 0.8 }}
        />
        
        {/* 中心核心发光点 */}
        <circle
          cx="50"
          cy="50"
          r="4"
          fill="url(#gfRingCoreGlow)"
          vectorEffect="non-scaling-stroke"
          style={{ opacity: 0.9, filter: 'blur(0.5px)' }}
        />
        
        {/* 中心核心文字锚点：仅桌面端显示，移动端隐藏以避免与徽章释义文字重叠 */}
        <text
          className="gf-ring-center-text"
          x="50"
          y="50"
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            fontFamily: "'Noto Serif SC', serif",
            fontSize: 'clamp(1.5px, 0.4vw, 2.8px)',
            fill: '#f0d080',
            opacity: 0.8,
            letterSpacing: '0.12em',
          }}
        >
          形色质声·四维共生
        </text>

        {DIMS.map((d, i) => (
          <g key={`conn-${d.id}`}>
            {/* 弧形连接线：从中心到符号位置的贝塞尔曲线 */}
            <path
              ref={(el) => {
                connRefs.current[i] = el;
              }}
              d={`M 50 50 Q 50 50 ${d.px} ${d.py}`}
              fill="none"
              stroke="url(#gfConnGrad)"
              strokeWidth="0.16"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              className="gf-ring-conn"
              style={{ opacity: 0 }}
            />
            {/* 连接线流动光点 */}
            <circle
              ref={(el) => {
                connFlowRefs.current[i] = el;
              }}
              cx="50"
              cy="50"
              r="0.7"
              fill="#f0d080"
              vectorEffect="non-scaling-stroke"
              className="gf-ring-conn-flow"
              style={{ opacity: 0, filter: 'blur(0.3px)' }}
            />
          </g>
        ))}
        
        {/* 放射状刻度短线（中层圆环上） */}
        {Array.from({ length: 36 }).map((_, i) => {
          const angle = (i * 10 * Math.PI) / 180;
          const x1 = 50 + 26 * Math.cos(angle);
          const y1 = 50 + 26 * Math.sin(angle);
          const x2 = 50 + 30 * Math.cos(angle);
          const y2 = 50 + 30 * Math.sin(angle);
          return (
            <line
              key={`tick-${i}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="rgba(201,168,76,0.4)"
              strokeWidth="0.3"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>

      {/* 精致徽章符号：沿圆环轨道分布 */}
      {DIMS.map((d, i) => {
        // 响应式尺寸：根据当前视口宽度计算（initial 时基于 window）
        const initialVw = typeof window !== 'undefined' ? window.innerWidth : 1280;
        const badgeSize = getBadgeSize(initialVw);
        const coreFontSize = getCoreFontSize(initialVw);
        // 副标题字号也按比例缩放
        const subFontSize = initialVw <= 480 ? 6 : initialVw <= 768 ? 7 : 9;
        return (
        <div
          key={d.id}
          ref={(el) => {
            iconRefs.current[i] = el;
          }}
          className="gf-ring-badge"
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%) scale(0) rotate(0deg)',
            opacity: 0,
            zIndex: 4,
            pointerEvents: 'none',
            willChange: 'transform, opacity, left, top',
          }}
        >
          <div
            style={{
              position: 'relative',
              width: `${badgeSize}px`,
              height: `${badgeSize}px`,
              borderRadius: '50%',
              background:
                'radial-gradient(circle at 30% 30%, rgba(60,70,60,0.95) 0%, rgba(25,35,28,0.98) 100%)',
              border: 'double 2px rgba(201,168,76,0.7)',
              boxShadow:
                '0 0 32px rgba(201,168,76,0.5), inset 0 0 16px rgba(201,168,76,0.25), 0 4px 12px rgba(10,13,20,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
            }}
          >
            {/* 外层细线装饰环 */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: '-6px',
                borderRadius: '50%',
                border: '1px solid rgba(240,208,128,0.4)',
                animation: 'gfSymRing 24s linear infinite',
                pointerEvents: 'none',
              }}
            />
            {/* 内层细线装饰环 */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: '-12px',
                borderRadius: '50%',
                border: '1px dashed rgba(201,168,76,0.3)',
                animation: 'gfSymRing 36s linear infinite reverse',
                pointerEvents: 'none',
              }}
            />
            {/* 徽章核心文字 */}
            <div
              style={{
                fontFamily: "'Noto Serif SC', serif",
                fontSize: `${coreFontSize}px`,
                color: '#f0d080',
                lineHeight: 1,
                fontWeight: 700,
                textShadow: '0 0 16px rgba(201,168,76,0.6), 0 0 4px rgba(255,255,255,0.3)',
                filter: 'drop-shadow(0 0 2px rgba(201,168,76,0.8))',
              }}
            >
              {d.label}
            </div>
            <div
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: `${subFontSize}px`,
                letterSpacing: '0.3em',
                color: 'rgba(245,240,232,0.75)',
                marginTop: '6px',
                textShadow: '0 0 6px rgba(201,168,76,0.4)',
              }}
            >
              {d.en}
            </div>
          </div>
        </div>
        );
      })}

      {/* 释义文字：独立于徽章（不参与 rotate/scale），只跟随位置 + 透明度。
           位置在 apply() 里根据符号位置动态计算，确保远离椭圆轨道线。 */}
      {DIMS.map((d, i) => {
        const initialVw = typeof window !== 'undefined' ? window.innerWidth : 1280;
        const noteMaxWidth = initialVw <= 480 ? 100 : initialVw <= 768 ? 120 : 150;
        const noteFontSize = initialVw <= 480 ? 9 : initialVw <= 768 ? 10 : 12;
        const subNoteFontSize = initialVw <= 480 ? 6 : initialVw <= 768 ? 7 : 8;
        return (
        <div
          key={`note-${d.id}`}
          ref={(el) => {
            noteRefs.current[i] = el;
          }}
          aria-hidden="true"
          className="gf-sym-note"
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: 0,
            zIndex: 5,
            pointerEvents: 'none',
            textAlign: 'center',
            maxWidth: `${noteMaxWidth}px`,
            willChange: 'opacity, left, top',
            lineHeight: 1.4,
          }}
        >
          <div
            style={{
              fontFamily: "'Noto Serif SC', serif",
              fontSize: `${noteFontSize}px`,
              letterSpacing: initialVw <= 480 ? '0.08em' : initialVw <= 768 ? '0.1em' : '0.12em',
              color: initialVw <= 480 ? 'rgba(245,240,232,0.9)' : 'rgba(245,240,232,0.8)',
              fontWeight: 400,
              textShadow: '0 0 10px rgba(10,13,20,0.9)',
              opacity: 'var(--note-opacity, 1)',
              transition: 'opacity 0.4s ease-out',
            }}
          >
            {d.note}
          </div>
          <div
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: `${subNoteFontSize}px`,
              letterSpacing: initialVw <= 480 ? '0.18em' : initialVw <= 768 ? '0.2em' : '0.22em',
              color: 'var(--gf-gold)',
              opacity: 0.7,
              marginTop: '4px',
            }}
          >
            {d.en} · CANTONESE EXTRACTION
          </div>
        </div>
        );
      })}

      {/* 树根底部总结文字：视觉锚点 / 点睛之笔，作为树形结构的根基注解。
           随树描边一同显现（progress 驱动），位于树干主轴根部正下方。 */}
       <div
        ref={(el) => {
          labelRefs.current[2] = el;
        }}
        aria-hidden="true"
        style={{
          position: 'absolute',
          right: 'max(20px, 4vw)',
          bottom: 'max(30px, 6vh)',
          textAlign: 'right',
          zIndex: 6,
          pointerEvents: 'none',
          opacity: 0,
        }}
      >
        <div
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 'clamp(8px, 1.2vw, 11px)',
            letterSpacing: '0.35em',
            color: 'var(--gf-gold)',
            opacity: 0.8,
            marginBottom: '6px',
          }}
        >
          ROOT OF CULTURAL GENES
        </div>
      </div>

       {/* 底部维度标签：四维英文 + 分隔点，向左对齐避免重叠 */}
      <div
        ref={(el) => {
          labelRefs.current[3] = el;
        }}
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 'max(20px, 4vw)',
          bottom: 'max(16px, 3vh)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '4px',
          zIndex: 6,
          pointerEvents: 'none',
          opacity: 0,
        }}
      >
        <div
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 'clamp(7px, 1vw, 9px)',
            letterSpacing: '0.35em',
            color: 'var(--gf-gold)',
            opacity: 0.7,
            marginBottom: '6px',
          }}
        >
          ROOT OF CULTURAL GENES
        </div>

      </div>

       {/* 底部维度标签：四维英文 + 分隔点，向左对齐避免重叠 */}
      <div
        ref={(el) => {
          labelRefs.current[3] = el;
        }}
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 'max(40px, 6vw)', // 向左移动，避免与中心内容重叠
          bottom: 'max(36px, 6vh)',
          display: 'flex',
          flexDirection: 'column', // 改为垂直排列
          alignItems: 'flex-start', // 左对齐
          gap: '6px', // 减小间距
          zIndex: 6,
          pointerEvents: 'none',
          opacity: 0,
        }}
      >
        {['FORM', 'COLOR', 'TEXTURE', 'SOUND'].map((w, idx) => (
          <div
            key={w}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: '8px', // 减小字号
                letterSpacing: '0.3em',
                color: 'rgba(201,168,76,0.6)',
                fontWeight: 300,
              }}
            >
              {w}
            </span>
            {idx < 3 && (
              <span
                style={{
                  width: '2px',
                  height: '2px',
                  borderRadius: '50%',
                  background: 'rgba(201,168,76,0.3)',
                  display: 'inline-block',
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* 左上角章节标签 */}
      <div
        ref={(el) => {
          labelRefs.current[0] = el;
        }}
        aria-hidden="true"
        data-chapter-label
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
          maxWidth: '55vw',
          flexWrap: 'wrap',
        }}
      >
        <span
          data-chapter-label
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
          data-chapter-label
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 'clamp(26px, 3.5vw, 36px)',
            color: 'var(--gf-gold)',
            lineHeight: 1,
          }}
        >
          04
        </span>
        <span
          data-chapter-label
          style={{
            fontFamily: "'Noto Serif SC', serif",
            fontSize: 'clamp(10px, 1.4vw, 13px)',
            letterSpacing: '0.25em',
            color: 'rgba(245,240,232,0.45)',
            marginLeft: '6px',
          }}
        >
          符号提取
        </span>
      </div>

      {/* 右上角英文副标题 */}
      <div
        ref={(el) => {
          labelRefs.current[1] = el;
        }}
        aria-hidden="true"
        data-chapter-label
        style={{
          position: 'absolute',
          top: 'max(140px, 16vh)',
          right: 'max(20px, 5vw)',
          textAlign: 'right',
          zIndex: 6,
          pointerEvents: 'none',
          opacity: 0,
          maxWidth: '45vw',
        }}
      >
        <div
          data-chapter-label
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 'clamp(9px, 1.3vw, 12px)',
            letterSpacing: '0.35em',
            color: 'var(--gf-cold-accent)',
            opacity: 0.8,
          }}
        >
          SYMBOL EXTRACTION
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
          形色质声 · 四维公转
        </div>
      </div>
    </section>
  );
}
