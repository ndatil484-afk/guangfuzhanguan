import { useEffect, useRef, useState, useCallback, type MouseEvent } from 'react';
import baiyunLogo from '@/assets/baiyun-logo.png';

type NavLink = {
  id: string;
  label: string;
};

const navLinks: NavLink[] = [
  { id: 'chapter-01', label: '广府雅韵' },
  { id: 'chapter-02', label: '文化背景' },
  { id: 'chapter-03', label: '调研背景' },
  { id: 'chapter-04', label: '符号提取' },
  { id: 'chapter-05', label: '设计转译' },
  { id: 'chapter-06', label: '材料' },
  { id: 'chapter-07', label: '空间体验' },
  { id: 'chapter-08', label: '团队介绍' },
];

export default function GfNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [activeId, setActiveId] = useState<string>('');
  const navRef = useRef<HTMLElement>(null);

  // Scroll listener — toggle glass effect after 100px
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Active-section tracking — MUST stay in sync with the right-side
  // progress rail (GfPageDots, driven from GuangfuPage). Both use the
  // same "topmost section whose top edge has crossed into the upper
  // portion of the viewport" rule.
  //
  // Why not IntersectionObserver: IO picks the section with the largest
  // visible ratio. Chapter 08 (TeamSection) is 240vh tall, so its
  // intersection ratio is diluted and the rail/navbar would desync —
  // the rail (top-cross) could show "08 团队介绍" while the navbar
  // (IO ratio) still highlighted "07 空间体验". Top-cross on both
  // sides keeps them identical at every scroll position.
  useEffect(() => {
    const sections = navLinks
      .map((l) => document.getElementById(l.id))
      .filter((el): el is HTMLElement => Boolean(el));

    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      const threshold = vh * 0.4; // same 40% line as GuangfuPage
      let bestId = navLinks[0]?.id ?? '';
      for (const sec of sections) {
        const rect = sec.getBoundingClientRect();
        if (rect.top <= threshold) {
          bestId = sec.id;
        }
      }
      setActiveId(bestId);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const handleClick = useCallback((e: MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Magnetic hover — translate text up by 2px when pointer is near
  const handleItemMove = useCallback((e: MouseEvent<HTMLAnchorElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const dist = Math.hypot(dx, dy);
    // Magnetic pull only within 60px of the label center
    const radius = 60;
    if (dist < radius) {
      const pull = (1 - dist / radius) * 6; // max 6px horizontal pull
      el.style.transform = `translateY(-2px) translateX(${(dx / radius) * pull}px)`;
    } else {
      el.style.transform = 'translateY(-2px)';
    }
  }, []);

  const handleItemLeave = useCallback((e: MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.transform = '';
  }, []);

  return (
    <nav
      ref={navRef}
      className="gf-nav fixed top-0 left-0 right-0 z-[100] transition-all duration-300"
      style={{
        padding: scrolled ? '14px 48px' : '20px 48px',
        background: scrolled ? 'rgba(20, 17, 13, 0.55)' : 'transparent',
        backdropFilter: scrolled ? 'blur(10px)' : 'blur(0px)',
        WebkitBackdropFilter: scrolled ? 'blur(10px)' : 'blur(0px)',
        borderBottom: scrolled
          ? '1px solid rgba(201, 168, 76, 0.18)'
          : '1px solid transparent',
        boxShadow: scrolled ? '0 8px 32px rgba(0, 0, 0, 0.25)' : 'none',
      }}
    >
      <div className="max-w-[1400px] mx-auto flex items-center justify-between">
        {/* Logo */}
        <a
          href="#chapter-01"
          onClick={(e) => handleClick(e, 'chapter-01')}
          className="group flex items-center gap-3 no-underline"
        >
          <img
            src={baiyunLogo}
            alt="广东白云学院"
            draggable={false}
            className="h-[34px] w-auto object-contain transition-all duration-300 group-hover:opacity-90"
            style={{
              filter: 'drop-shadow(0 1px 6px rgba(201, 168, 76, 0.18))',
            }}
          />
          <span
            className="inline-block w-[6px] h-[18px] transition-all duration-500"
            style={{
              background: 'linear-gradient(180deg, var(--gf-gold-light), var(--gf-gold))',
            }}
          />
          <span
            className="font-['Noto_Serif_SC'] text-[17px] tracking-[0.18em] font-medium transition-colors duration-300"
            style={{ color: 'var(--gf-gold)' }}
          >
            广府文化展馆
          </span>
        </a>

        {/* Menu items */}
        <div className="hidden md:flex items-center gap-10">
          {navLinks.map((link) => {
            const isActive = activeId === link.id;
            return (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={(e) => handleClick(e, link.id)}
                onMouseMove={handleItemMove}
                onMouseLeave={handleItemLeave}
                className="gf-nav-link relative text-[12px] tracking-[0.16em] font-light no-underline inline-block transition-[transform,color] duration-300"
                style={{
                  color: isActive ? 'var(--gf-gold)' : 'rgba(245, 240, 232, 0.7)',
                  paddingBottom: '6px',
                  willChange: 'transform',
                }}
                data-active={isActive ? 'true' : 'false'}
              >
                {link.label}
                {/* Flowing underline */}
                <span
                  className="gf-nav-line pointer-events-none absolute left-0 bottom-0 h-[1px] overflow-hidden"
                  style={{ width: '100%' }}
                >
                  <span
                    className="gf-nav-line-fill block h-full"
                    style={{
                      width: '100%',
                      background:
                        'linear-gradient(90deg, transparent 0%, var(--gf-gold-light) 50%, var(--gf-gold) 100%)',
                      transform: isActive ? 'scaleX(1)' : 'scaleX(0)',
                      transformOrigin: 'left center',
                      transition: 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
                    }}
                  />
                </span>
              </a>
            );
          })}
        </div>

        {/* CTA button removed — 预约参观 entrypoint no longer shown */}
      </div>

      <style>{`
        .gf-nav-link:hover { color: var(--gf-gold) !important; }
        .gf-nav-link:hover .gf-nav-line-fill { transform: scaleX(1) !important; }

        @media (max-width: 768px) {
          .gf-nav { padding-left: 24px !important; padding-right: 24px !important; }
        }
      `}</style>
    </nav>
  );
}
