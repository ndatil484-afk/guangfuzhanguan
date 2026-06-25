import { Calendar, Flower2, Anchor, Music, Moon } from 'lucide-react';
import { folkCustoms } from '../data/content';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  '迎春花市': Flower2,
  '龙舟竞渡': Anchor,
  '粤剧表演': Music,
  '中秋赏月': Moon,
};

export default function FolkCustoms() {
  return (
    <section id="folk" className="py-20 bg-rice-yellow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-lingnan-red/10 text-lingnan-red text-sm font-hei rounded-full mb-4">
            民俗风情
          </span>
          <h2 className="font-song text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            岭南民俗 · 多姿多彩
          </h2>
          <p className="font-hei text-gray-600 max-w-2xl mx-auto">
            广府地区有着丰富多样的传统节日和民俗活动，展现了独特的地域文化魅力
          </p>
        </div>

        <div className="relative">
          <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-lingnan-red via-gold to-lingnan-red hidden md:block" />

          <div className="space-y-12">
            {folkCustoms.map((item, index) => {
              const Icon = iconMap[item.name] || Calendar;
              const isEven = index % 2 === 0;
              return (
                <div
                  key={item.id}
                  className={`relative flex items-center gap-8 ${
                    isEven ? 'md:flex-row' : 'md:flex-row-reverse'
                  }`}
                >
                  <div
                    className={`w-full md:w-1/2 ${
                      isEven ? 'md:pr-16 md:text-right' : 'md:pl-16'
                    }`}
                  >
                    <div className="bg-white rounded-2xl p-8 shadow-lg card-hover">
                      <div className={`flex items-center gap-3 mb-4 ${isEven ? 'md:justify-end' : ''}`}>
                        <div className="w-12 h-12 bg-lingnan-red/10 rounded-full flex items-center justify-center">
                          <Icon className="w-6 h-6 text-lingnan-red" />
                        </div>
                        <div>
                          <h3 className="font-song text-xl font-bold text-gray-800">
                            {item.name}
                          </h3>
                          <div className="flex items-center gap-1 text-gray-500 text-sm font-hei">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{item.date}</span>
                          </div>
                        </div>
                      </div>
                      <p className="font-hei text-gray-600 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-gold rounded-full border-4 border-rice-yellow shadow-lg hidden md:block" />

                  <div className="w-full md:w-1/2 hidden md:block" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
