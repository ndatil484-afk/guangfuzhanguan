import { Award, User } from 'lucide-react';
import { heritageItems } from '../data/content';

export default function IntangibleHeritage() {
  return (
    <section id="heritage" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-gold/20 text-gold text-sm font-hei rounded-full mb-4">
            非遗传承
          </span>
          <h2 className="font-song text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            匠心传承 · 技艺瑰宝
          </h2>
          <p className="font-hei text-gray-600 max-w-2xl mx-auto">
            广府地区拥有众多国家级非物质文化遗产项目，承载着岭南人民的智慧与创造力
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {heritageItems.map((item, index) => (
            <div
              key={item.id}
              className="relative bg-gradient-to-br from-light-yellow to-white rounded-2xl overflow-hidden shadow-lg card-hover group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="aspect-square overflow-hidden">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute top-4 right-4">
                  <div className="px-3 py-1.5 bg-lingnan-red/90 backdrop-blur-sm text-white text-xs font-hei rounded-full flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" />
                    非遗
                  </div>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-song text-lg font-bold text-gray-800">
                    {item.name}
                  </h3>
                  <span className="px-2 py-0.5 bg-qingzhuan-gray/10 text-qingzhuan-gray text-xs font-hei rounded">
                    {item.type}
                  </span>
                </div>
                <p className="font-hei text-sm text-gray-600 line-clamp-2 mb-3">
                  {item.description}
                </p>
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="font-hei text-sm text-gray-500">
                    传承人: {item.inheritor}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-gradient-to-r from-lingnan-red to-red-800 rounded-3xl p-8 md:p-12 text-center">
          <h3 className="font-song text-2xl md:text-3xl font-bold text-white mb-4">
            保护非遗 · 传承文化
          </h3>
          <p className="font-hei text-white/80 max-w-2xl mx-auto mb-6">
            每一项非物质文化遗产都是中华民族的瑰宝，让我们共同努力，保护和传承这些珍贵的文化遗产
          </p>
          <button className="px-8 py-3 bg-white text-lingnan-red font-hei font-medium rounded-full hover:bg-light-yellow transition-all duration-300 hover:shadow-lg">
            了解更多非遗项目
          </button>
        </div>
      </div>
    </section>
  );
}
