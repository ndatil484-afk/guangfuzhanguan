import { useEffect, useRef, useState } from 'react';
import { useChapterReveal } from '@/lib/useChapterReveal';
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
    description: '粗糙而温暖的触感，仿佛能感受到时光的沉淀。指尖划过砖面的纹理，如同触摸历史的年轮。',
    image: brickImg,
    particles: { color: [74, 85, 104], count: 30 },
    temperature: '微凉',
    weight: '厚重',
  },
  {
    id: 'wood',
    name: '酸枝木',
    en: 'ROSEWOOD',
    description: '细腻温润的木纹，散发着淡淡的木香。光滑的表面随着岁月流逝愈发光亮，触摸时如轻抚丝绸。',
    image: woodImg,
    particles: { color: [92, 61, 46], count: 20 },
    temperature: '温润',
    weight: '坚实',
  },
  {
    id: 'ceramic',
    name: '广彩瓷',
    en: 'GUANGCAI PORCELAIN',
    description: '光滑如玉的釉面，细腻而清凉。彩釉在指尖滑过，仿佛触摸到岭南夏日的清风。',
    image: ceramicImg,
    particles: { color: [200, 200, 210], count: 25 },
    temperature: '清凉',
    weight: '轻盈',
  },
  {
    id: 'silk',
    name: '香云纱',
    en: 'GAMUZA SILK',
    description: '柔软而有光泽的触感，丝滑如流水。独特的薯莨染工艺赋予它时光沉淀的质感，凉爽透气。',
    image: silkImg,
    particles: { color: [139, 90, 43], count: 35 },
    temperature: '凉爽',
    weight: '轻柔',
  },
  {
    id: 'stone',
    name: '麻石',
    en: 'GRANITE',
    description: '坚硬而粗粝的表面，蕴含着山的沉稳。冰凉的触感让人感受到自然的力量，厚重而可靠。',
    image: stoneImg,
    particles: { color: [107, 114, 128], count: 15 },
    temperature: '冰凉',
    weight: '厚重',
  },
  {
    id: 'paper',
    name: '宣纸',
    en: 'RICE PAPER',
    description: '轻薄而坚韧的触感，纤维交织的纹理在指尖留下温柔的记忆。水墨渗透的瞬间，文化的温度传递开来。',
    image: paperImg,
    particles: { color: [254, 243, 199], count: 40 },
    temperature: '温暖',
    weight: '轻薄',
  },
];

function MaterialCard({ material, index }: { material: typeof MATERIALS[0]; index: number }) {
  const [isHovered, setIsHovered] = useState(false);
  const [particles, setParticles] = useState<{ x: number; y: number; opacity: number; size: number }[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isHovered) {
      setParticles([]);
      return;
    }

    const interval = setInterval(() => {
      setParticles(prev => {
        const newParticle = {
          x: Math.random() * 100,
          y: Math.random() * 100,
          opacity: Math.random() * 0.5 + 0.2,
          size: Math.random() * 4 + 2,
        };
        return [...prev.slice(-15), newParticle];
      });
    }, 200);

    return () => clearInterval(interval);
  }, [isHovered]);

  return (
    <div
      ref={cardRef}
      className="gf-tactile-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '4/3',
        borderRadius: '12px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s ease',
        transform: isHovered ? 'scale(1.03)' : 'scale(1)',
        boxShadow: isHovered ? '0 20px 60px rgba(0,0,0,0.4)' : '0 8px 30px rgba(0,0,0,0.2)',
        opacity: 0,
        animation: `fadeInUp 0.6s ease ${index * 0.1}s forwards`,
      }}
    >
      <img
        src={material.image}
        alt={material.name}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: isHovered ? 'scale(1.1)' : 'scale(1)',
        }}
      />

      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            borderRadius: '50%',
            background: `rgba(${material.particles.color.join(',')}, ${p.opacity})`,
            transform: 'translate(-50%, -50%)',
            animation: 'particleFloat 2s ease-out forwards',
            zIndex: 2,
          }}
        />
      ))}

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: isHovered
            ? 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)'
            : 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)',
          transition: 'background 0.4s ease',
        }}
      />

      <div
        style={{
          position: 'absolute',
          bottom: '0',
          left: '0',
          right: '0',
          padding: '24px',
          transform: isHovered ? 'translateY(0)' : 'translateY(10px)',
          opacity: isHovered ? 1 : 0.9,
          transition: 'transform 0.4s ease, opacity 0.4s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <span
            style={{
              fontSize: '11px',
              letterSpacing: '2px',
              color: 'rgba(201, 168, 76, 0.7)',
              textTransform: 'uppercase',
            }}
          >
            {material.en}
          </span>
          <div
            style={{
              flex: 1,
              height: '1px',
              background: 'linear-gradient(to right, rgba(201, 168, 76, 0.3), transparent)',
            }}
          />
        </div>

        <h3
          style={{
            fontSize: '28px',
            fontWeight: '500',
            color: '#fffef8',
            marginBottom: '8px',
            textShadow: '0 2px 10px rgba(0,0,0,0.3)',
          }}
        >
          {material.name}
        </h3>

        <p
          style={{
            fontSize: '14px',
            lineHeight: '1.6',
            color: 'rgba(245, 240, 232, 0.85)',
            marginBottom: '12px',
            maxHeight: isHovered ? '120px' : '60px',
            overflow: 'hidden',
            transition: 'max-height 0.4s ease',
          }}
        >
          {material.description}
        </p>

        <div style={{ display: 'flex', gap: '16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: 'rgba(201, 168, 76, 0.8)',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: material.temperature === '清凉' || material.temperature === '冰凉' ? '#60a5fa' : '#f97316',
              }}
            />
            {material.temperature}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: 'rgba(201, 168, 76, 0.8)',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: material.weight === '厚重' || material.weight === '坚实' ? '#9ca3af' : '#4ade80',
              }}
            />
            {material.weight}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowPreview(true)}
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: '1px solid rgba(245, 240, 232, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isHovered ? 1 : 0.6,
          transition: 'opacity 0.3s ease, transform 0.2s ease',
          background: 'rgba(0,0,0,0.3)',
          cursor: 'pointer',
          animation: 'bouncePointer 1.5s ease-in-out infinite',
          animationDelay: `${index * 0.2}s`,
        }}
        aria-label="放大查看材质"
      >
        <span
          style={{
            fontSize: '18px',
            color: 'rgba(245, 240, 232, 0.8)',
          }}
        >
          ☝
        </span>
      </button>

      {showPreview && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0,
            animation: 'fadeInUp 0.3s ease forwards',
            cursor: 'pointer',
          }}
          onClick={() => setShowPreview(false)}
        >
          <img
            src={material.image}
            alt={material.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            onClick={(e) => {
              e.stopPropagation();
              setShowPreview(false);
            }}
          />
        </div>
      )}
    </div>
  );
}

export default function TactileExperienceSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useChapterReveal(sectionRef, innerRef);

  return (
    <section
      ref={sectionRef}
      className="gf-chapter"
      style={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        background: 'linear-gradient(to bottom, #0d0b12 0%, #1a1622 50%, #0d0b12 100%)',
        padding: '60px 40px',
        boxSizing: 'border-box',
      }}
    >
      <div
        ref={innerRef}
        className="gf-chapter-reveal-wrap"
        style={{
          position: 'relative',
          maxWidth: '1400px',
          margin: '0 auto',
        }}
      >
        <div
          className="gf-tactile-header"
          style={{
            textAlign: 'center',
            marginBottom: '80px',
            opacity: 0,
            animation: 'fadeInUp 0.8s ease 0.2s forwards',
          }}
        >
          <span
            className="gf-tactile-subtitle"
            style={{
              fontSize: '12px',
              letterSpacing: '4px',
              color: 'rgba(201, 168, 76, 0.6)',
              textTransform: 'uppercase',
            }}
          >
            TACTILE EXPERIENCE
          </span>
          <h2
            className="gf-tactile-title"
            style={{
              fontSize: 'clamp(32px, 5vw, 56px)',
              fontWeight: '300',
              color: '#fffef8',
              marginTop: '16px',
              marginBottom: '24px',
              letterSpacing: '2px',
            }}
          >
            建筑与身体对话
          </h2>
          <p
            className="gf-tactile-desc"
            style={{
              fontSize: 'clamp(14px, 2vw, 18px)',
              lineHeight: '1.8',
              color: 'rgba(245, 240, 232, 0.65)',
              maxWidth: '600px',
              margin: '0 auto',
            }}
          >
            通过不同的材质，不同的触觉内容，让触觉看得见。每一种材质都承载着广府文化的记忆，
            在指尖与建筑的对话中，感受时光的温度。
          </p>
        </div>

        <div
          className="gf-tactile-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
          }}
        >
          {MATERIALS.map((material, index) => (
            <MaterialCard key={material.id} material={material} index={index} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes particleFloat {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0;
          }
          20% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
          100% {
            transform: translate(-50%, -150%) scale(0);
            opacity: 0;
          }
        }

        @keyframes bouncePointer {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        .gf-tactile-card {
          perspective: 1000px;
        }

        .gf-tactile-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%);
          pointer-events: none;
          z-index: 1;
        }
      `}</style>
    </section>
  );
}