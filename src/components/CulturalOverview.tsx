import { Clock, Award, UtensilsCrossed, Building } from 'lucide-react';
import { culturalStats } from '../data/content';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Clock,
  Award,
  UtensilsCrossed,
  Building,
};

export default function CulturalOverview() {
  return (
    <section id="overview" className="py-20 bg-rice-yellow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-lingnan-red/10 text-lingnan-red text-sm font-hei rounded-full mb-4">
            文化概览
          </span>
          <h2 className="font-song text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            千年岭南 · 文化瑰宝
          </h2>
          <p className="font-hei text-gray-600 max-w-2xl mx-auto">
            广府文化是岭南文化的核心组成部分，以广州为中心，辐射珠三角地区，
            拥有悠久的历史和丰富的文化遗产
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <div className="relative group">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Traditional%20Cantonese%20cultural%20scene%20with%20tea%20house%20and%20traditional%20Chinese%20architecture%20warm%20lighting&image_size=landscape_4_3"
                alt="广府文化"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-gold rounded-full flex items-center justify-center shadow-xl animate-float">
              <span className="font-song text-3xl font-bold text-lingnan-red">2000+</span>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="font-song text-2xl font-bold text-gray-800">
              广府文化的历史渊源
            </h3>
            <p className="font-hei text-gray-600 leading-relaxed">
              广府文化起源于南越国时期，历经两千多年的发展，形成了独特的地域文化特色。
              作为海上丝绸之路的起点，广州自古便是中西文化交流的重要枢纽，
              这种开放包容的特质深深影响了广府文化的形成与发展。
            </p>
            <p className="font-hei text-gray-600 leading-relaxed">
              广府文化以其独特的语言、饮食、建筑、民俗等方面的特色，
              成为中华文化中一颗璀璨的明珠，展现了岭南人民的智慧和创造力。
            </p>
            <div className="flex flex-wrap gap-3">
              {['开放包容', '务实创新', '兼容并蓄', '海纳百川'].map((tag) => (
                <span
                  key={tag}
                  className="px-4 py-1.5 bg-qingzhuan-gray/10 text-qingzhuan-gray text-sm font-hei rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {culturalStats.map((stat, index) => {
            const Icon = iconMap[stat.icon];
            return (
              <div
                key={stat.label}
                className="bg-white rounded-2xl p-6 text-center shadow-lg card-hover"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-14 h-14 mx-auto mb-4 bg-lingnan-red/10 rounded-full flex items-center justify-center">
                  <Icon className="w-7 h-7 text-lingnan-red" />
                </div>
                <div className="font-song text-3xl font-bold text-gray-800 mb-1">
                  {stat.value}
                </div>
                <div className="font-hei text-sm text-gray-500">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
