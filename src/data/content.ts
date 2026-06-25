export interface FoodItem {
  id: string;
  name: string;
  description: string;
  image: string;
  category: string;
}

export interface ArchitectureItem {
  id: string;
  name: string;
  location: string;
  description: string;
  image: string;
  year: string;
}

export interface FolkCustom {
  id: string;
  name: string;
  date: string;
  description: string;
}

export interface HeritageItem {
  id: string;
  name: string;
  type: string;
  description: string;
  image: string;
  inheritor: string;
}

export const culturalStats = [
  { label: '历史悠久', value: '2000+年', icon: 'Clock' },
  { label: '非遗项目', value: '100+项', icon: 'Award' },
  { label: '特色美食', value: '200+种', icon: 'UtensilsCrossed' },
  { label: '传统建筑', value: '50+处', icon: 'Building' },
];

export const foodItems: FoodItem[] = [
  {
    id: '1',
    name: '广式早茶',
    description: '早茶是广府文化的重要组成部分，"一盅两件"是广州人的生活态度。精致的点心如虾饺、烧卖、叉烧包等闻名遐迩。',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Cantonese%20morning%20tea%20dim%20sum%20with%20shrimp%20dumplings%20siu%20mai%20on%20traditional%20bamboo%20steamer%20Chinese%20style&image_size=landscape_4_3',
    category: '点心',
  },
  {
    id: '2',
    name: '烤乳猪',
    description: '广式烧腊的代表，皮脆肉嫩，色泽金黄，是宴席上不可或缺的佳肴，尤其在喜庆节日更为常见。',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Roasted%20suckling%20pig%20crispy%20skin%20golden%20color%20Cantonese%20style%20on%20white%20plate&image_size=landscape_4_3',
    category: '烧腊',
  },
  {
    id: '3',
    name: '白切鸡',
    description: '粤菜经典，讲究皮爽肉滑，保持鸡肉的原汁原味，蘸上姜葱酱，鲜美无比。',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Cantonese%20white%20cut%20chicken%20with%20ginger%20scallion%20sauce%20Chinese%20traditional%20dish&image_size=landscape_4_3',
    category: '粤菜',
  },
  {
    id: '4',
    name: '艇仔粥',
    description: '源自广州荔枝湾，以新鲜鱼虾为料，粥底绵密，配料丰富，是夏日消暑佳品。',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Cantonese%20congee%20with%20seafood%20boat%20porridge%20in%20traditional%20bowl%20Chinese%20style&image_size=landscape_4_3',
    category: '粥品',
  },
];

export const architectureItems: ArchitectureItem[] = [
  {
    id: '1',
    name: '陈家祠',
    location: '广州市荔湾区',
    description: '广东现存规模最大、保存最完整、装饰最精美的中国清代宗祠建筑，被誉为"岭南建筑艺术明珠"。',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chen%20Family%20Ancestral%20Hall%20Guangzhou%20traditional%20Lingnan%20architecture%20with%20intricate%20carvings&image_size=landscape_4_3',
    year: '1894年',
  },
  {
    id: '2',
    name: '广州骑楼',
    location: '广州市老城区',
    description: '岭南特色建筑，楼下行人，楼上居住，遮阳避雨，形成独特的城市风景线。',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Cantonese%20arcade%20buildings%20traditional%20Qilou%20architecture%20in%20Guangzhou%20old%20town&image_size=landscape_4_3',
    year: '清末民初',
  },
  {
    id: '3',
    name: '光孝寺',
    location: '广州市越秀区',
    description: '岭南历史最悠久的佛教寺院，始建于三国时期，是广州佛教活动的重要场所。',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Guangxiao%20Temple%20Guangzhou%20ancient%20Buddhist%20temple%20traditional%20Chinese%20architecture&image_size=landscape_4_3',
    year: '220年',
  },
  {
    id: '4',
    name: '余荫山房',
    location: '广州市番禺区',
    description: '清代广东四大名园之一，布局精巧，亭台楼阁、小桥流水，尽显岭南园林之美。',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Yu%20Yin%20Garden%20Lingnan%20style%20traditional%20Chinese%20garden%20with%20pavilions%20and%20ponds&image_size=landscape_4_3',
    year: '1867年',
  },
];

export const folkCustoms: FolkCustom[] = [
  {
    id: '1',
    name: '迎春花市',
    date: '农历新年前',
    description: '广州花市历史悠久，每年春节前各大公园摆满鲜花，市民逛花街、买年花，洋溢着浓厚的节日气氛。',
  },
  {
    id: '2',
    name: '龙舟竞渡',
    date: '农历五月初五',
    description: '端午节龙舟赛是岭南传统，鼓声震天，龙舟飞驰，展现团结拼搏的精神。',
  },
  {
    id: '3',
    name: '粤剧表演',
    date: '全年',
    description: '粤剧是岭南文化瑰宝，唱做念打，服饰华丽，2009年列入世界非物质文化遗产。',
  },
  {
    id: '4',
    name: '中秋赏月',
    date: '农历八月十五',
    description: '广州人中秋喜爱赏月、吃月饼、提灯笼，白云山、珠江边是赏月的好去处。',
  },
];

export const heritageItems: HeritageItem[] = [
  {
    id: '1',
    name: '广绣',
    type: '传统刺绣',
    description: '广绣是中国四大名绣之一，针法多样，色彩鲜艳，图案精美，具有浓厚的地方特色。',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Cantonese%20embroidery%20Guangxiu%20traditional%20Chinese%20needlework%20colorful%20silk%20art&image_size=landscape_4_3',
    inheritor: '陈少芳',
  },
  {
    id: '2',
    name: '象牙雕刻',
    type: '传统工艺',
    description: '广州牙雕历史悠久，工艺精湛，题材广泛，被誉为"东方艺术明珠"。',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Ivory%20carving%20traditional%20Chinese%20art%20intricate%20sculpture%20Guangzhou%20style&image_size=landscape_4_3',
    inheritor: '李定宁',
  },
  {
    id: '3',
    name: '石湾陶瓷',
    type: '传统陶瓷',
    description: '佛山石湾陶塑始于唐代，造型生动，釉色丰富，是岭南陶瓷艺术的代表。',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Shiwan%20ceramics%20traditional%20Chinese%20pottery%20colorful%20glaze%20sculptures&image_size=landscape_4_3',
    inheritor: '刘泽棉',
  },
  {
    id: '4',
    name: '醒狮表演',
    type: '传统舞蹈',
    description: '醒狮是岭南民俗文化的重要组成部分，狮头造型精美，舞狮动作刚劲有力，寓意吉祥如意。',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20lion%20dance%20performance%20traditional%20Cantonese%20lion%20costume%20festive&image_size=landscape_4_3',
    inheritor: '黄飞鸿',
  },
];
