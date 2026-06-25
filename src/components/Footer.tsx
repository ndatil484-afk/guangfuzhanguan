import { MapPin, Phone, Mail, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-qingzhuan-gray text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-lingnan-red flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <span className="font-song font-bold text-xl">广府文化体验</span>
            </div>
            <p className="font-hei text-gray-300 mb-6 max-w-md">
              探索广府文化的魅力，感受岭南风情的独特韵味。我们致力于传承和弘扬广府文化，
              让更多人了解和喜爱这片土地的历史与文化。
            </p>
            <div className="flex items-center gap-4">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-lingnan-red transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-lingnan-red transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-lingnan-red transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-lingnan-red transition-colors"
              >
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-song font-bold text-lg mb-4">快速链接</h4>
            <ul className="space-y-3">
              {['文化概览', '特色美食', '传统建筑', '民俗风情', '非遗传承'].map((link) => (
                <li key={link}>
                  <a
                    href={`#${link}`}
                    className="font-hei text-gray-300 hover:text-gold transition-colors"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-song font-bold text-lg mb-4">联系我们</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gold" />
                <span className="font-hei text-gray-300">广州市越秀区北京路</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gold" />
                <span className="font-hei text-gray-300">020-12345678</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gold" />
                <span className="font-hei text-gray-300">contact@guangfu.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-hei text-gray-400 text-sm">
            © 2024 广府文化体验. 保留所有权利.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="font-hei text-gray-400 text-sm hover:text-white transition-colors">
              隐私政策
            </a>
            <a href="#" className="font-hei text-gray-400 text-sm hover:text-white transition-colors">
              使用条款
            </a>
            <a href="#" className="font-hei text-gray-400 text-sm hover:text-white transition-colors">
              网站地图
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
