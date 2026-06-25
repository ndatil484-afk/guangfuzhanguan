import { foodItems } from '../data/content';

export default function FoodSection() {
  return (
    <section id="food" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-lingnan-red/10 text-lingnan-red text-sm font-hei rounded-full mb-4">
            特色美食
          </span>
          <h2 className="font-song text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            食在广州 · 美味传承
          </h2>
          <p className="font-hei text-gray-600 max-w-2xl mx-auto">
            广州素有"食在广州"的美誉，粤菜是中国八大菜系之一，以其清淡鲜美、选料精细而闻名
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {foodItems.map((item, index) => (
            <div
              key={item.id}
              className="bg-light-yellow rounded-2xl overflow-hidden shadow-lg card-hover group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="aspect-[4/3] overflow-hidden relative">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute top-3 left-3">
                  <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-hei rounded-full">
                    {item.category}
                  </span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-song text-lg font-bold text-gray-800 mb-2">
                  {item.name}
                </h3>
                <p className="font-hei text-sm text-gray-600 line-clamp-3">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <a
            href="#"
            className="inline-flex items-center gap-2 px-8 py-3 border-2 border-lingnan-red text-lingnan-red font-hei font-medium rounded-full hover:bg-lingnan-red hover:text-white transition-all duration-300"
          >
            探索更多美食
          </a>
        </div>
      </div>
    </section>
  );
}
