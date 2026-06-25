import { useEffect, useRef } from 'react';
import { useScrubProgress } from '@/lib/useScrubProgress';
import { useChapterReveal } from '@/lib/useChapterReveal';
import GfAmbientParticles from '@/components/GfAmbientParticles';
import kangLePortrait from '@/assets/portraits/kang-le.png';
import xieYongkangPortrait from '@/assets/portraits/xie-yongkang.png';
import tanNaifuPortrait from '@/assets/portraits/tan-naifu.png';
import productDesignLogo from '@/assets/product-design-logo.png';

/**
 * Chapter 08 — 团队介绍 (Team Introduction)
 *
 * Poster-style portrait composition. The advisor stands centered and
 * slightly forward (larger, higher z-index), two student designers flank
 * him — smaller, set back, with a slight inward yaw so the trio reads as
 * a cohesive group rather than three independent cutouts. A soft ellipti-
 * cal shadow under each figure grounds them; no gothic frame, no card
 * chrome. Names sit beside the figures in gold serif, matching the
 * page's Cantonese-gilt tone.
 *
 * Scroll behaviour (Apple-style, scroll-driven only):
 *   0% – 18% : department line types in
 *   5% – 30% : three figures push in from depth (staggered), settle
 *   30% – 88%: composition FREEZES — figures hold perfectly still
 *   88% –100%: gentle scroll-away fade hands off to the next chapter
 */

type Person = {
  id: string;
  name: string;
  roleEn: string;
  roleCn: string;
  badge: string;
  portrait: string;
  /** 'left' | 'center' | 'right' — slot in the poster layout. */
  slot: 'left' | 'center' | 'right';
};

const DEPT_TEXT = '广东白云学院 · 设计团队';

const PEOPLE: Person[] = [
  {
    id: 'xie-yongkang',
    name: '谢永康',
    roleEn: 'STUDENT DESIGNER',
    roleCn: '学生主创',
    badge: 'STUDENT · 01',
    portrait: xieYongkangPortrait,
    slot: 'left',
  },
  {
    id: 'kang-le',
    name: '康乐',
    roleEn: 'ADVISOR',
    roleCn: '指导老师',
    badge: 'ADVISOR · ★',
    portrait: kangLePortrait,
    slot: 'center',
  },
  {
    id: 'tan-naifu',
    name: '谭乃福',
    roleEn: 'STUDENT DESIGNER',
    roleCn: '学生主创',
    badge: 'STUDENT · 02',
    portrait: tanNaifuPortrait,
    slot: 'right',
  },
];

function seg(p: number, s: number, e: number) {
  if (e <= s) return p <= s ? 0 : 1;
  return Math.max(0, Math.min(1, (p - s) / (e - s)));
}
function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export default function TeamSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const typingRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const figureRefs = useRef<Array<HTMLElement | null>>([]);
  const bgRef = useRef<HTMLDivElement>(null);
  const liftRef = useRef<HTMLDivElement>(null);
  const starRef = useRef<HTMLCanvasElement>(null);
  const deptRevealRef = useRef<HTMLDivElement>(null);
  const stickyInnerRef = useRef<HTMLDivElement>(null);

  const pointerRef = useRef({ x: 0.5, y: 0.5, active: false });

  const { progress } = useScrubProgress(sectionRef, { range: 'full', lead: 1, initial: 0.12 });

  // Whole-chapter scroll-driven fade + scale envelope.
  useChapterReveal(sectionRef, innerRef);

  // Starfield canvas — extremely subtle, only visible in the dark tail.
  useEffect(() => {
    const canvas = starRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    const stars: { x: number; y: number; r: number; phase: number }[] = [];
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (stars.length === 0) {
        for (let i = 0; i < 80; i++) {
          stars.push({
            x: Math.random() * w,
            y: Math.random() * h,
            r: Math.random() * 1.1 + 0.2,
            phase: Math.random() * Math.PI * 2,
          });
        }
      }
    };
    resize();
    window.addEventListener('resize', resize);

    let lastP = 0;
    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      const dim = seg(lastP, 0.7, 0.95);
      if (dim > 0.01) {
        const t = performance.now() * 0.001;
        for (const s of stars) {
          const alpha = (0.3 + 0.7 * Math.sin(t + s.phase)) * dim * 0.4;
          ctx.fillStyle = `rgba(220, 230, 255, ${alpha})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fill();
        }
        for (const s of stars) {
          s.y += 0.04 * dim;
          if (s.y > h) s.y = 0;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const interval = setInterval(() => { lastP = progress; }, 80);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf);
      clearInterval(interval);
    };
  }, [progress]);

  // Pointer over stage → subtle group tilt.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const onMove = (e: globalThis.MouseEvent) => {
      const rect = stage.getBoundingClientRect();
      pointerRef.current.x = (e.clientX - rect.left) / rect.width;
      pointerRef.current.y = (e.clientY - rect.top) / rect.height;
      pointerRef.current.active = true;
    };
    const onLeave = () => {
      pointerRef.current.active = false;
    };
    stage.addEventListener('mousemove', onMove);
    stage.addEventListener('mouseleave', onLeave);
    return () => {
      stage.removeEventListener('mousemove', onMove);
      stage.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  // Main scrub driver. Entrance compressed into 0–30%; after that the
  // poster holds perfectly still until the scroll-away fade at the end.
  useEffect(() => {
    let raf = 0;
    const apply = () => {
      const p = progress;
      const pType = seg(p, 0, 0.18);
      const pHold = seg(p, 0.3, 0.45);
      const pOut = seg(p, 0.88, 1);

      // Department typing text.
      if (typingRef.current) {
        const chars = Math.floor(pType * DEPT_TEXT.length);
        typingRef.current.textContent = DEPT_TEXT.slice(0, chars);
        typingRef.current.style.opacity = String(Math.min(1, pType * 1.5) * (1 - pOut * 0.6));
        typingRef.current.style.textShadow =
          pType > 0.95 ? `0 0 18px rgba(201,168,76,0.55)` : 'none';
      }

      // Each figure pushes in from depth with a small stagger.
      const pointer = pointerRef.current;
      figureRefs.current.forEach((el, i) => {
        if (!el) return;
        const person = PEOPLE[i];
        const enterStart = 0.05 + i * 0.05;
        const enterEnd = enterStart + 0.2;
        const local = seg(p, enterStart, enterEnd);
        const t = easeOutCubic(local);

        // Depth push: from far (scale 0.85, z -240px, opacity 0) to settled.
        const baseScale = person.slot === 'center' ? 1.06 : 0.92;
        const scale = (0.85 + t * 0.15) * baseScale;
        const tz = -240 * (1 - t);
        const ty = 50 * (1 - t);
        const opacity = local;

        // Subtle parallax tilt driven by cursor — only after entrance.
        const tiltStrength = Math.min(1, local) * (0.3 + pHold * 0.5);
        const cx = pointer.active ? pointer.x - 0.5 : 0;
        const cy = pointer.active ? pointer.y - 0.5 : 0;
        const groupRotY = cx * 6 * tiltStrength;
        const groupRotX = -cy * 4 * tiltStrength;

        // Per-slot inward yaw so flankers face the advisor.
        const slotYaw = person.slot === 'left' ? 8 : person.slot === 'right' ? -8 : 0;

        // 末段淡出交给 useChapterReveal 整层处理。这里若也对 figure 单独
        // 叠加 opacity 衰减，人物会在深色背景上变半透明，视觉上呈现
        // "发白发灰"的过曝假象（88%~100% 中间态最明显）。所以 figure 自身
        // opacity 在入场后保持 1，不再随 pOut 衰减。
        const fade = 1;

        el.style.transform =
          `translateY(${ty.toFixed(2)}px) ` +
          `translateZ(${tz.toFixed(2)}px) ` +
          `rotateY(${(groupRotY + slotYaw).toFixed(2)}deg) ` +
          `rotateX(${groupRotX.toFixed(2)}deg) ` +
          `scale(${scale.toFixed(3)})`;
        el.style.opacity = String(opacity * fade);
      });

      // lift wrapper opacity now controlled entirely by the chapter reveal
      // envelope (useChapterReveal) on the sticky-inner — kept at 1 here
      // so the two systems don't compound their opacity fade.
      if (liftRef.current) {
        liftRef.current.style.opacity = '1';
      }
      if (bgRef.current) {
        bgRef.current.style.background = 'transparent';
      }

      raf = requestAnimationFrame(apply);
    };
    raf = requestAnimationFrame(apply);
    return () => cancelAnimationFrame(raf);
  }, [progress]);

  // Lightweight scroll-reveal for the appended department intro section.
  // Fades in opacity + a small upward drift when it scrolls into view.
  // No scale/rotation — keeps the appended block feeling like a natural
  // continuation of the chapter rather than a new chapter entrance.
  useEffect(() => {
    const el = deptRevealRef.current;
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(28px)';
    el.style.transition = 'opacity 1.1s ease, transform 1.1s cubic-bezier(0.22, 1, 0.36, 1)';
    el.style.willChange = 'opacity, transform';

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // In-chapter arrow-key jump: while the team trio poster is on screen
  // (sticky inner pinned, dept intro not yet visible), pressing ↓ / PageDown
  // scrolls down to the department intro block instead of skipping to the
  // next chapter (which is what the page-level keydown handler would do).
  // Once the user is already past the trio (dept intro visible or scrolled
  // beyond), no interception — the page-level handler owns navigation.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const isDown = e.key === 'ArrowDown' || e.key === 'PageDown';
      const isUp = e.key === 'ArrowUp' || e.key === 'PageUp';
      if (!isDown && !isUp) return;

      const sticky = stickyInnerRef.current;
      const dept = deptRevealRef.current;
      if (!sticky || !dept) return;

      const vh = window.innerHeight;
      const stickyRect = sticky.getBoundingClientRect();
      const deptRect = dept.getBoundingClientRect();

      // "Team trio on screen" = the sticky poster is still pinned in view
      // AND the department block hasn't entered the viewport yet.
      const trioInView =
        stickyRect.top <= vh * 0.25 && stickyRect.bottom >= vh * 0.5;
      const deptNotEntered = deptRect.top >= vh;

      // "Department block on screen" = the dept intro has scrolled up into
      // view but the trio has fully left — pressing ↑ here jumps back up
      // to the team trio instead of going to the previous chapter.
      const deptInView =
        deptRect.top < vh * 0.75 && deptRect.bottom > vh * 0.25;
      const trioFullyLeft = stickyRect.bottom <= 0;

      if (isDown && trioInView && deptNotEntered) {
        e.preventDefault();
        e.stopImmediatePropagation();
        const top = deptRect.top + window.scrollY;
        window.scrollTo({ top, behavior: 'smooth' });
      } else if (isUp && deptInView && trioFullyLeft) {
        e.preventDefault();
        e.stopImmediatePropagation();
        // Land a hair above the section top so the trio poster pins nicely.
        const section = sectionRef.current;
        const target =
          (section ? section.getBoundingClientRect().top + window.scrollY : 0) +
          Math.max(0, vh * 0.02);
        window.scrollTo({ top: target, behavior: 'smooth' });
      }
    };
    // Capture phase + stopImmediatePropagation so the page-level keydown
    // handler (also on window, but in bubble phase) doesn't ALSO fire and
    // fight us by jumping a whole chapter.
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, []);

  return (
    <section
      ref={sectionRef}
      id="chapter-08"
      data-chapter="08"
      data-title="团队介绍"
      className="gf-chapter"
      style={{ position: 'relative', height: '240vh', width: '100%', background: 'transparent' }}
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
        ref={stickyInnerRef}
        className="gf-chapter-inner"
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          width: '100%',
          overflow: 'hidden',
        }}
      >
        {/* Background — transparent; page-level .gf-flow gradient shows through. */}
        <div
          ref={bgRef}
          style={{ position: 'absolute', inset: 0, background: 'transparent' }}
        />

        {/* Starfield */}
        <canvas
          ref={starRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />

        {/* Content lift wrapper */}
        <div
          ref={liftRef}
          style={{ position: 'absolute', inset: 0, zIndex: 2, willChange: 'opacity' }}
        >
          {/* Department typing text — 落款标题，置于页面最底部（三位人物
              脱像下方的空白区域），作为整章的收尾落款呈现。底部安全区
              在地面阴影(bottom 10vh)之下，故用 bottom 定位避开脚部/衣摆。 */}
          <div
            ref={typingRef}
            style={{
              position: 'absolute',
              bottom: 'max(34px, 4vh)',
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: "'Noto Serif SC', serif",
              fontSize: 'clamp(20px, 2.7vw, 32px)',
              letterSpacing: '0.18em',
              color: 'var(--gf-ivory)',
              whiteSpace: 'nowrap',
              opacity: 0,
              zIndex: 5,
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              bottom: 'calc(max(34px, 4vh) + clamp(30px, 3.4vh, 44px))',
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: "'Cinzel', serif",
              fontSize: '9px',
              letterSpacing: '0.32em',
              color: 'var(--gf-gold)',
              opacity: seg(progress, 0.15, 0.22) * (1 - seg(progress, 0.72, 0.88)),
              zIndex: 5,
            }}
          >
            DEPARTMENT · 所属院校
          </div>

          {/* Poster-style trio stage */}
          <div ref={stageRef} className="gf-team-poster">
            {/* Ground shadows — separate layer beneath the figures so the
                blur doesn't get clipped by the figure's transform. */}
            <div className="gf-team-ground" aria-hidden="true">
              {PEOPLE.map((person) => (
                <span
                  key={`shadow-${person.id}`}
                  className={`gf-team-shadow is-${person.slot}`}
                />
              ))}
            </div>

            {PEOPLE.map((person, i) => (
              <figure
                key={person.id}
                ref={(el) => { figureRefs.current[i] = el; }}
                className={`gf-team-figure is-${person.slot}`}
              >
                {/* Portrait image — masked at the bottom so it dissolves
                    into the ground shadow instead of cutting off hard.
                    不再叠加任何方向性聚光斑 / 人造光晕，保持原始 PNG 的
                    真实光影质感。 */}
                <div className="gf-team-portrait-wrap">
                  <img
                    src={person.portrait}
                    alt={person.name}
                    draggable={false}
                    className="gf-team-portrait-img"
                  />
                </div>

                {/* Name plate beside the figure */}
                <figcaption className={`gf-team-caption is-${person.slot}`}>
                  <span className="gf-team-badge">{person.badge}</span>
                  <span className="gf-team-name">{person.name}</span>
                  <span className="gf-team-role-en">{person.roleEn}</span>
                  <span className="gf-team-role-cn">{person.roleCn}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>

        {/* Ambient dust */}
        <GfAmbientParticles
          count={50}
          opacity={0.35}
          minSize={0.4}
          maxSize={1.6}
          color={[201, 168, 76]}
          driftX={12}
          driftY={16}
          style={{ zIndex: 1 }}
        />

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
            zIndex: 20,
            pointerEvents: 'none',
          }}
        >
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: '11px', letterSpacing: '0.4em', color: 'var(--gf-gold)', opacity: 0.7 }}>CHAPTER</span>
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: '32px', color: 'var(--gf-gold)', lineHeight: 1 }}>08</span>
          <span style={{ fontFamily: "'Noto Serif SC', serif", fontSize: '12px', letterSpacing: '0.25em', color: 'rgba(245,240,232,0.45)', marginLeft: '6px' }}>团队介绍</span>
        </div>

        <div
          style={{
            position: 'absolute',
            top: 'max(80px, 12vh)',
            right: 'max(28px, 4vw)',
            textAlign: 'right',
            zIndex: 20,
            pointerEvents: 'none',
            opacity: Math.max(0, 1 - progress * 3),
            transition: 'opacity 0.3s linear',
          }}
        >
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: '10px', letterSpacing: '0.32em', color: 'var(--gf-cold-accent)', opacity: 0.7 }}>TEAM & CREDITS</div>
          <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: '14px', letterSpacing: '0.18em', color: 'rgba(245,240,232,0.55)', marginTop: '4px' }}>致谢 · 归途</div>
        </div>
      </div>

        {/* Department intro extension — appended WITHIN the same Chapter 08
            reveal-wrap, as a normal-flow block right after the sticky team
            poster. The reveal-wrap (absolute, inset:0) shares the section's
            full 240vh height; the sticky inner occupies the first 100vh of
            normal flow (pinning the team trio while the section scrolls),
            and THIS block sits in the remaining flow space below it.

            Consequence (the fix):
              • While the team poster is pinned (section scrolling through
                its upper ~140vh), this block is still far below the
                viewport — invisible. No overlap with the trio.
              • Only once the user scrolls far enough that the sticky
                poster releases (its 100vh flow slot has passed) does this
                block rise into view from below. By then the trio has
                already scrolled out the top.
              • At no scroll position do both blocks share the viewport.

            No new section, no new nav anchor or progress-dot entry — the
            whole region remains a single Chapter 08. */}
        <div
          ref={deptRevealRef}
          style={{
            position: 'relative',
            width: '100%',
            minHeight: '120vh',
            padding: 'clamp(72px, 10vh, 140px) max(24px, 6vw) clamp(96px, 14vh, 180px)',
            background:
              'linear-gradient(to bottom, rgba(8,10,18,0) 0%, rgba(8,10,18,0.6) 18%, rgba(8,10,18,0.92) 50%, #08080f 100%)',
            color: 'var(--gf-ivory)',
            zIndex: 3,
          }}
        >
        {/* Thin gold divider — visual handoff from team poster to dept intro */}
        <div
          aria-hidden="true"
          style={{
            width: 'min(220px, 32vw)',
            height: '1px',
            margin: '0 auto clamp(40px, 6vh, 72px)',
            background:
              'linear-gradient(to right, transparent, var(--gf-gold) 30%, var(--gf-gold-light) 50%, var(--gf-gold) 70%, transparent)',
            opacity: 0.85,
            boxShadow: '0 0 12px rgba(201,168,76,0.35)',
          }}
        />

        {/* Department logo — kept within 200–300px wide, centered */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 'clamp(32px, 5vh, 56px)',
          }}
        >
          <img
            src={productDesignLogo}
            alt="广东白云学院 产品设计系"
            draggable={false}
            style={{
              width: 'min(280px, 42vw)',
              height: 'auto',
              objectFit: 'contain',
              filter: 'drop-shadow(0 4px 24px rgba(201,168,76,0.18))',
            }}
          />
        </div>

        {/* Eyebrow line */}
        <div
          style={{
            textAlign: 'center',
            fontFamily: "'Cinzel', serif",
            fontSize: '11px',
            letterSpacing: '0.36em',
            color: 'var(--gf-gold)',
            opacity: 0.85,
            marginBottom: '8px',
          }}
        >
          PRODUCT DESIGN · 产品设计系
        </div>
        <div
          style={{
            textAlign: 'center',
            fontFamily: "'Noto Serif SC', serif",
            fontSize: 'clamp(16px, 1.6vw, 20px)',
            letterSpacing: '0.22em',
            color: 'rgba(245,240,232,0.78)',
            marginBottom: 'clamp(36px, 5vh, 56px)',
          }}
        >
          系部介绍
        </div>

        {/* Intro paragraphs — selectable text, gold serif headings, relaxed leading */}
        <div
          style={{
            maxWidth: '780px',
            margin: '0 auto',
            fontFamily: "'Noto Serif SC', serif",
            fontSize: 'clamp(15px, 1.05vw, 18px)',
            lineHeight: 2.05,
            letterSpacing: '0.02em',
            color: 'rgba(245,240,232,0.86)',
            textAlign: 'justify',
          }}
        >
          <p style={{ margin: '0 0 1.4em' }}>
            广东白云学院产品设计系立足粤港澳大湾区智能制造与文化创意产业需求，依托省级一流本科专业建设基础，形成了"AI赋能设计、工程验证支撑、产教协同落地"的专业特色。系部拥有覆盖产品策划、造型设计、用户体验、智能硬件、CMF材料工艺、数字建模与原型验证的综合设计能力，能够为企业提供产品创新研究、概念方案开发、用户体验优化、文创产品转化、品牌衍生设计及人才共育等多层次合作服务。
          </p>
          <p style={{ margin: '0 0 1.4em' }}>
            我们坚持"真题真做"的项目化合作模式，推动企业真实需求进入课堂与工作室，通过师生共创、原型测试、设计迭代和成果转化，帮助企业提升产品创新力、市场识别度与品牌竞争力。
          </p>
          <p style={{ margin: 0 }}>
            构建校企共创、资源共享、成果共赢的长期合作关系。
          </p>
        </div>
        </div>
      </div>
    </section>
  );
}
