import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent } from 'react';
import kangLePortrait from '@/assets/portraits/kang-le.png';
import xieYongkangPortrait from '@/assets/portraits/xie-yongkang.png';
import tanNaifuPortrait from '@/assets/portraits/tan-naifu.png';
import './portraits.css';

type Member = {
  id: string;
  index: string;
  name: string;
  roleEn: string;
  roleCn: string;
  portrait: string;
  bio: string;
  tags: string[];
};

const MEMBERS: Member[] = [
  {
    id: 'kang-le',
    index: '01',
    name: '康乐',
    roleEn: 'ADVISOR',
    roleCn: '指导老师',
    portrait: kangLePortrait,
    bio:
      '康乐老师为本项目全程指导。在设计推演、空间叙事与文化转译的每一个关键节点，皆以严谨的学术视野与细腻的设计直觉为团队导航，让广府文化的现代表达得以精准落地。',
    tags: ['设计指导', '学术顾问', '空间叙事'],
  },
  {
    id: 'xie-yongkang',
    index: '02',
    name: '谢永康',
    roleEn: 'STUDENT DESIGNER',
    roleCn: '学生主创',
    portrait: xieYongkangPortrait,
    bio:
      '广东白云学院学生主创之一。负责展馆的整体空间构思、视觉系统搭建与交互体验设计，将广府文化的光、影、形、韵转译为可被感知的现代展陈语言。',
    tags: ['空间设计', '视觉系统', '交互体验'],
  },
  {
    id: 'tan-naifu',
    index: '03',
    name: '谭乃福',
    roleEn: 'STUDENT DESIGNER',
    roleCn: '学生主创',
    portrait: tanNaifuPortrait,
    bio:
      '广东白云学院学生主创之一。专注于文化调研、材料推演与氛围营造，让岭南的木、水、光在展馆中以最具温度的方式被重新组织与呈现。',
    tags: ['文化调研', '材料推演', '氛围营造'],
  },
];

type PortraitCardProps = {
  member: Member;
  onOpen: (m: Member) => void;
};

function PortraitCard({ member, onOpen }: PortraitCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // 3D tilt + glow halo tracking on pointer move.
  const handleMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rotY = (px - 0.5) * 10;
    const rotX = (0.5 - py) * 10;
    el.style.transform = `perspective(1000px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translateZ(0)`;
    el.style.setProperty('--mx', `${(px * 100).toFixed(2)}%`);
    el.style.setProperty('--my', `${(py * 100).toFixed(2)}%`);
  }, []);

  const handleLeave = useCallback(() => {
    const el = cardRef.current;
    if (!el) return;
    el.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
  }, []);

  const handleKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen(member);
    }
  };

  return (
    <div
      ref={cardRef}
      className="ps-card ps-reveal"
      role="button"
      tabIndex={0}
      aria-label={`查看 ${member.name} 的详细介绍`}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onClick={() => onOpen(member)}
      onKeyDown={handleKey}
    >
      <div className="ps-card-index">{member.index}</div>
      <div className="ps-card-frame" />
      <div className="ps-portrait-wrap">
        <img
          src={member.portrait}
          alt={`${member.name} 肖像`}
          className="ps-portrait"
          loading="lazy"
          draggable={false}
        />
      </div>
      <div className="ps-card-shine" />
      <div className="ps-card-info">
        <div className="ps-card-eyebrow">{member.roleEn}</div>
        <h3 className="ps-card-name">{member.name}</h3>
        <p className="ps-card-role">{member.roleCn}</p>
        <div className="ps-card-meta">
          <span className="ps-card-cta">VIEW PROFILE</span>
          <span className="ps-card-arrow" />
        </div>
      </div>
    </div>
  );
}

type DetailDialogProps = {
  member: Member | null;
  onClose: () => void;
};

function DetailDialog({ member, onClose }: DetailDialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  // Trigger enter transition when a member is provided.
  useEffect(() => {
    if (member) {
      // small delay so the transition registers
      const id = requestAnimationFrame(() => setOpen(true));
      return () => cancelAnimationFrame(id);
    }
    setOpen(false);
  }, [member]);

  // Esc + body scroll lock.
  useEffect(() => {
    if (!member) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [member, onClose]);

  const handleOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  if (!member) return null;

  return (
    <div
      ref={overlayRef}
      className="ps-dialog-overlay"
      data-open={open}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={`${member.name} 详细介绍`}
    >
      <div className="ps-dialog">
        <button
          type="button"
          className="ps-dialog-close"
          onClick={onClose}
          aria-label="关闭"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path
              d="M1 1L13 13M13 1L1 13"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <div className="ps-dialog-portrait">
          <img src={member.portrait} alt={`${member.name} 肖像`} />
        </div>
        <div className="ps-dialog-body">
          <div className="ps-dialog-eyebrow">
            {member.roleEn} · {member.index}
          </div>
          <h2 className="ps-dialog-name">{member.name}</h2>
          <p className="ps-dialog-role">{member.roleCn}</p>
          <div className="ps-dialog-divider" />
          <p className="ps-dialog-bio">{member.bio}</p>
          <div className="ps-dialog-tags">
            {member.tags.map((t) => (
              <span key={t} className="ps-tag">
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PortraitShowcasePage() {
  const [active, setActive] = useState<Member | null>(null);

  // Scroll reveal for hero + cards.
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('.ps-reveal'));
    if (els.length === 0) return;

    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('ps-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const delay = el.dataset.delay ? Number(el.dataset.delay) : i * 80;
            window.setTimeout(() => el.classList.add('ps-visible'), delay);
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleBack = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.hash = '#/';
    }
  };

  return (
    <div className="ps-page">
      <header className="ps-topbar">
        <a href="#/" className="ps-brand" onClick={(e) => e.preventDefault()}>
          <span className="ps-brand-mark" />
          <span className="ps-brand-title">团队肖像 · 广府展馆</span>
        </a>
        <a href="#/" className="ps-back-link" onClick={handleBack}>
          ← BACK
        </a>
      </header>

      <section className="ps-hero">
        <div className="ps-hero-eyebrow ps-reveal">TEAM PORTRAITS · 团队肖像</div>
        <h1 className="ps-hero-title ps-reveal" data-delay="120">
          来自广东白云学院
        </h1>
        <p className="ps-hero-subtitle ps-reveal" data-delay="240">
          他们以光为笔、以文化为墨，让岭南的木与水，在展馆里重新生长。
          <br />
          指导老师康乐，学生主创谢永康、谭乃福——三人共绘这一卷广府新章。
        </p>
        <div className="ps-hero-divider ps-reveal" data-delay="320" />
      </section>

      <section className="ps-grid">
        {MEMBERS.map((m) => (
          <PortraitCard key={m.id} member={m} onOpen={setActive} />
        ))}
      </section>

      <footer className="ps-footer">
        <p className="ps-footer-line">广州白云 · 岭南新生</p>
        <p className="ps-footer-sub">GUANGZHOU BAIYUN UNIVERSITY · 2026</p>
      </footer>

      <DetailDialog member={active} onClose={() => setActive(null)} />
    </div>
  );
}
