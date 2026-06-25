import { useEffect, useRef } from 'react';
import { useChapterReveal } from '@/lib/useChapterReveal';

export default function FooterSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useChapterReveal(sectionRef, innerRef);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
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
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="chapter-11"
      data-chapter="11"
      data-title="致谢"
      className="gf-chapter"
      style={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        background: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 0',
        marginTop: '10vh',
      }}
    >
      <div
        ref={innerRef}
        className="gf-chapter-reveal-wrap"
        style={{
          width: '100%',
          maxWidth: '800px',
          padding: '40px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: '40px',
        }}
      >
        <div
          style={{
            opacity: 0,
            animation: 'fadeInUp 0.8s ease 0.2s forwards',
          }}
        >
          <h2
            style={{
              fontSize: '36px',
              fontWeight: '300',
              color: '#fffef8',
              letterSpacing: '0.1em',
              marginBottom: '20px',
              fontFamily: 'Georgia, serif',
            }}
          >
            广府雅韵 · 空间叙事
          </h2>
          <div
            style={{
              width: '60px',
              height: '1px',
              background: 'rgba(201, 168, 76, 0.5)',
              margin: '0 auto',
            }}
          />
        </div>

        <div
          style={{
            opacity: 0,
            animation: 'fadeInUp 0.8s ease 0.4s forwards',
          }}
        >
          <p
            style={{
              fontSize: '15px',
              lineHeight: '2',
              color: 'rgba(245, 240, 232, 0.7)',
              maxWidth: '500px',
              margin: '0 auto',
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
            }}
          >
            本作品通过对广府文化的深度调研与挖掘，
            将传统岭南建筑元素与现代空间设计理念相融合，
            打造出一个沉浸式的文化体验空间，
            让观者在光影与材质的对话中，感受广府文化的独特魅力。
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '30px',
            opacity: 0,
            animation: 'fadeInUp 0.8s ease 0.6s forwards',
          }}
        >
          <div>
            <h3
              style={{
                fontSize: '12px',
                color: 'rgba(201, 168, 76, 0.6)',
                letterSpacing: '0.2em',
                marginBottom: '12px',
                textTransform: 'uppercase',
              }}
            >
              Design Team
            </h3>
            <p
              style={{
                fontSize: '18px',
                color: '#fffef8',
                fontFamily: 'Georgia, serif',
              }}
            >
              谢永康 · 谭乃福
            </p>
          </div>

          <div>
            <h3
              style={{
                fontSize: '12px',
                color: 'rgba(201, 168, 76, 0.6)',
                letterSpacing: '0.2em',
                marginBottom: '12px',
                textTransform: 'uppercase',
              }}
            >
              Advisor
            </h3>
            <p
              style={{
                fontSize: '18px',
                color: '#fffef8',
                fontFamily: 'Georgia, serif',
              }}
            >
              康乐
            </p>
          </div>

          <div>
            <h3
              style={{
                fontSize: '12px',
                color: 'rgba(201, 168, 76, 0.6)',
                letterSpacing: '0.2em',
                marginBottom: '12px',
                textTransform: 'uppercase',
              }}
            >
              Contact
            </h3>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                fontSize: '14px',
                color: 'rgba(245, 240, 232, 0.7)',
              }}
            >
              <p>herclab@163.com</p>
              <p>13922203900 — 康乐</p>
            </div>
          </div>
        </div>

        <div
          style={{
            paddingTop: '30px',
            borderTop: '1px solid rgba(245, 240, 232, 0.1)',
            opacity: 0,
            animation: 'fadeInUp 0.8s ease 0.8s forwards',
          }}
        >
          <p
            style={{
              fontSize: '11px',
              color: 'rgba(245, 240, 232, 0.3)',
              letterSpacing: '0.15em',
            }}
          >
            © 2026 GUANGFU CULTURAL EXHIBITION
          </p>
        </div>
      </div>
    </section>
  );
}
