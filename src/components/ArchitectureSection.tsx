import { MapPin, Calendar } from 'lucide-react';
import { architectureItems } from '../data/content';

export default function ArchitectureSection() {
  return (
    <section id="architecture" className="py-20 bg-qingzhuan-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-gold/20 text-gold text-sm font-hei rounded-full mb-4">
            传统建筑
          </span>
          <h2 className="font-song text-4xl md:text-5xl font-bold text-white mb-4">
            岭南建筑 · 匠心独运
          </h2>
          <p className="font-hei text-gray-300 max-w-2xl mx-auto">
            广府建筑融合了中原文化、岭南特色和西方元素，形成了独特的建筑风格
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {architectureItems.map((item, index) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl overflow-hidden shadow-xl card-hover group"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="flex flex-col md:flex-row">
                <div className="md:w-2/5 aspect-square md:aspect-auto overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="md:w-3/5 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-song text-xl font-bold text-gray-800">
                        {item.name}
                      </h3>
                      <span className="px-2 py-0.5 bg-lingnan-red/10 text-lingnan-red text-xs font-hei rounded">
                        {item.year}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500 text-sm font-hei mb-3">
                      <MapPin className="w-4 h-4" />
                      <span>{item.location}</span>
                    </div>
                    <p className="font-hei text-gray-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-1 text-gray-400 text-sm">
                      <Calendar className="w-4 h-4" />
                      <span>历史建筑</span>
                    </div>
                    <button className="ml-auto text-lingnan-red font-hei text-sm font-medium hover:text-red-700">
                      了解更多
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
