export default function FooterSection() {
  return (
    <footer className="py-[80px] px-6 md:px-12 pt-12 flex flex-col md:flex-row items-start md:items-end justify-between gap-8" style={{ borderTop: '1px solid rgba(201,168,76,0.1)' }}>
      <div className="max-w-[500px]">
        <div className="font-['Noto_Serif_SC'] text-2xl font-light tracking-[0.12em] mb-2" style={{ color: 'var(--gf-gold)' }}>
          广府文化体验建筑馆
        </div>
        <div className="text-[12px] leading-[1.8] tracking-[0.1em]" style={{ color: 'rgba(245,240,232,0.3)' }}>
          模型设计与实验课程 · 产品设计专业<br />
          项目类别：第三类理念性模型项目<br />
          项目成员：谢永康、谭乃福<br />
          指导老师：康乐 13922203900<br />
          联系邮箱：herclab@163.com
        </div>
      </div>
      <div className="text-[11px] tracking-[0.1em] text-right leading-[2]" style={{ color: 'rgba(245,240,232,0.2)' }}>
        「广府雅韵」<br />
        岭南民俗文化意境模型设计<br />
        <br />
        光随人至 · 声香俱生 · 刚柔共融
      </div>
    </footer>
  );
}
