import { ChevronDown, Play } from 'lucide-react';

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      <div className="absolute inset-0">
        <img
          src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Guangzhou%20cityscape%20with%20traditional%20Lingnan%20architecture%20and%20modern%20skyline%20at%20sunset%20golden%20hour%20Chinese%20style&image_size=landscape_16_9"
          alt="广府风光"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        <div className="absolute inset-0 bg-pattern opacity-30" />
      </div>

      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        <div className="mb-6 animate-fade-in">
          <span className="inline-block px-4 py-2 bg-lingnan-red/80 backdrop-blur-sm text-white text-sm font-hei rounded-full border border-gold/30">
            岭南文化 · 千年传承
          </span>
        </div>

        <h1 className="font-song text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 animate-fade-in-up">
          <span className="block">广府文化</span>
          <span className="block text-gold mt-2">体验之旅</span>
        </h1>

        <p className="font-hei text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10 animate-fade-in-up delay-200">
          探索广州及珠三角地区的传统文化精髓，品味独特的岭南风情
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up delay-300">
          <a
            href="#overview"
            className="px-8 py-4 bg-lingnan-red text-white font-hei font-medium rounded-full hover:bg-red-900 transition-all duration-300 hover:shadow-lg hover:shadow-lingnan-red/30 hover:-translate-y-1"
          >
            开始探索
          </a>
          <button className="flex items-center gap-2 px-8 py-4 border-2 border-white/50 text-white font-hei font-medium rounded-full hover:bg-white/10 transition-all duration-300 backdrop-blur-sm">
            <Play className="w-5 h-5" />
            观看视频
          </button>
        </div>
      </div>

      <a href="#overview" className="scroll-indicator">
        <ChevronDown className="w-8 h-8 text-white/60" />
      </a>
    </section>
  );
}
