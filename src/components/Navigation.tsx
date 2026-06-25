import { useState, useEffect } from 'react';
import { Menu, X, MapPin } from 'lucide-react';

const navItems = [
  { label: '首页', href: '#hero' },
  { label: '文化概览', href: '#overview' },
  { label: '特色美食', href: '#food' },
  { label: '传统建筑', href: '#architecture' },
  { label: '民俗风情', href: '#folk' },
  { label: '非遗传承', href: '#heritage' },
];

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-lg py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <a href="#hero" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-full bg-lingnan-red flex items-center justify-center transition-transform group-hover:scale-110">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <span
              className={`font-song font-bold text-xl transition-colors ${
                isScrolled ? 'text-lingnan-red' : 'text-white'
              }`}
            >
              广府文化
            </span>
          </a>

          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={`font-hei text-sm font-medium transition-colors hover:text-gold ${
                  isScrolled ? 'text-gray-700' : 'text-white/90'
                }`}
              >
                {item.label}
              </a>
            ))}
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2"
          >
            {isMobileMenuOpen ? (
              <X
                className={`w-6 h-6 ${isScrolled ? 'text-gray-700' : 'text-white'}`}
              />
            ) : (
              <Menu
                className={`w-6 h-6 ${isScrolled ? 'text-gray-700' : 'text-white'}`}
              />
            )}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-200/50 pt-4 animate-fade-in">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={handleNavClick}
                className={`block py-2 font-hei text-sm ${
                  isScrolled ? 'text-gray-700' : 'text-white'
                }`}
              >
                {item.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
