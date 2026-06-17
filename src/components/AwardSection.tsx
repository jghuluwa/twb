import { useRef, useEffect } from 'react';
import { Award, TrendingUp, BarChart4, FileText, Trophy, Star } from 'lucide-react';
import { motion, useInView, useMotionValue, useTransform, animate } from 'motion/react';
import { Language } from '../types';
import { translations } from '../data/translations';
import Reveal from './visuals/Reveal';

interface AwardSectionProps {
  currentLang: Language;
}

export default function AwardSection({ currentLang }: AwardSectionProps) {
  const t = translations[currentLang];

  return (
    <section id="awards" className="relative py-24 text-white overflow-hidden">
      <div className="absolute inset-0 dot-grid-dark opacity-20 pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Section Header */}
        <Reveal>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 bg-amber-400/10 text-amber-300 px-3.5 py-1 rounded-full text-xs font-bold tracking-wider mb-4 uppercase border border-amber-400/30">
              <Award className="w-3.5 h-3.5 text-amber-300" />
              <span>{t.awardsTitle}</span>
            </div>
            <h2 className="font-sans text-3xl sm:text-4xl font-extrabold text-white tracking-tighter leading-tight">
              {t.awardsTitle}
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mt-2 font-semibold">
              {t.awardsSub}
            </p>
          </div>
        </Reveal>

        {/* Dual grid: Lab test metrics & Certificate award list */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          
          {/* Lab Test Results Side - Page 12 style */}
          <div className="lg:col-span-6 bg-white/[0.03] rounded-3xl p-6 sm:p-8 border border-white/10 flex flex-col justify-between backdrop-blur-sm">
            <div className="space-y-4">
              <div className="flex items-center space-x-2.5">
                <BarChart4 className="w-5.5 h-5.5 text-cyan-400" />
                <h3 className="font-sans text-xl font-extrabold text-white">{t.labTitle}</h3>
              </div>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed font-semibold">
                {t.labSub}
              </p>
            </div>

            {/* Custom SVG Dual-column bar graph for Group Efficacy */}
            <div className="my-8 p-6 bg-black/30 rounded-2xl border border-white/10 relative overflow-hidden">

              {/* Grid guide labels */}
              <div className="absolute top-4 right-4 text-[10px] font-mono text-slate-400 font-bold bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                JL · 12
              </div>

              <div className="h-44 w-full flex items-end justify-center space-x-16 sm:space-x-24 relative z-10 pt-6">

                {/* Y-axis metrics guide line */}
                <div className="absolute left-6 inset-y-6 flex flex-col justify-between text-[9px] font-mono font-bold text-slate-500 border-r border-white/10 pr-2">
                  <span>20 µmol/L</span>
                  <span>15 µmol/L</span>
                  <span>10 µmol/L</span>
                  <span>5 µmol/L</span>
                  <span>0 µmol/L</span>
                </div>

                {/* Column Before Wear */}
                <div className="flex flex-col items-center space-y-2 relative">
                  <CountUpLabel value={5.2} fixed={1} suffix=" µmol/L" className="font-mono text-xs font-black text-slate-300" />
                  <AnimatedBar height={35} from="from-slate-500" to="to-slate-400" />
                  <span className="text-[10px] font-bold text-slate-400 leading-tight">
                    {currentLang === 'en' ? 'A. Before Wear' : 'A. 使用前'}
                  </span>
                </div>

                {/* Column After Wear */}
                <div className="flex flex-col items-center space-y-2 relative">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="flex items-center gap-0.5 text-cyan-300 leading-none">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Star key={i} className="w-2.5 h-2.5 fill-current" />
                      ))}
                    </span>
                    <span className="font-mono text-xs font-black text-cyan-300 flex items-center gap-0.5 whitespace-nowrap">
                      <CountUpLabel value={14.1} fixed={1} suffix=" µmol/L" />
                      <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                    </span>
                  </div>
                  <AnimatedBar height={95} from="from-cyan-400" to="to-sky-500" glow />
                  <span className="text-[10px] font-bold text-cyan-300 leading-tight">
                    {currentLang === 'en' ? 'B. After 1H Wear' : 'B. 使用后'}
                  </span>
                </div>

              </div>

              {/* Verified Badge text */}
              <div className="border-t border-white/10 pt-4 text-center mt-2">
                <span className="inline-flex items-center justify-center gap-1.5 text-[10px] font-bold text-cyan-300 font-sans tracking-tight">
                  <Star className="w-3 h-3 fill-current shrink-0" />
                  {currentLang === 'en' ? 'Test result: average NO Concentration ascended by 2.7x +' : '第三方检测结论：使用一小时，群体受试者一氧化氮平均提升约 2.7 倍'}
                </span>
              </div>

            </div>

            {/* lab reports content block */}
            <div className="bg-cyan-500/[0.07] p-4 rounded-2xl border border-cyan-500/20">
              <span className="text-[10px] font-mono tracking-widest text-cyan-300 font-bold block mb-1">{t.labTitle}</span>
              <p className="text-slate-300 text-xs sm:text-sm font-semibold leading-relaxed">
                {t.labConclusion}
              </p>
            </div>

          </div>

          {/* Certificates & Achievements Side - Page 13 style */}
          <div className="lg:col-span-6 bg-white/[0.03] text-white rounded-3xl p-6 sm:p-8 flex flex-col justify-between border border-white/10 shadow-2xl backdrop-blur-sm">
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2.5">
                <FileText className="w-5.5 h-5.5 text-amber-500" />
                <h3 className="font-sans text-xl font-bold text-white">
                  {currentLang === 'en' ? 'Innovation Cup Winner' : '行业奖项与资质证书'}
                </h3>
              </div>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed font-semibold">
                {currentLang === 'en' 
                  ? 'Therabo won major awards in successive national elite medical device competitions, demonstrating safe physiological technology transformation.'
                  : '通微宝高科技一氧化氮可穿戴产品，连续两届在全国高规格的医疗器械创智大赛中，斩获总决赛优胜大奖。'}
              </p>
            </div>

            {/* List of competition wins */}
            <div className="my-6 space-y-4">
              
              {/* Winner 2022 block */}
              <motion.div whileHover={{ rotateX: -3, rotateY: 4, scale: 1.015 }} transition={{ type: 'spring', stiffness: 200, damping: 18 }} style={{ perspective: 800 }} className="relative scanline overflow-hidden bg-white/[0.04] p-4 rounded-2xl border border-white/10 flex gap-4 items-start hover:border-amber-400/40 transition-colors duration-300">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                  <Trophy className="w-5 h-5" />
                </div>
                <div className="text-left space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono font-black text-amber-500 tracking-wider">2022</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-100 leading-snug">
                    {t.awardWin2022}
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    {currentLang === 'en' ? 'Category: Active Wearable Nitric Oxide Medical Device' : '段位：第五届中国医疗器械创新创业大赛 初创组 · 优胜奖'}
                  </p>
                </div>
              </motion.div>

              {/* Winner 2023 block */}
              <motion.div whileHover={{ rotateX: -3, rotateY: 4, scale: 1.015 }} transition={{ type: 'spring', stiffness: 200, damping: 18 }} style={{ perspective: 800 }} className="relative scanline overflow-hidden bg-white/[0.04] p-4 rounded-2xl border border-white/10 flex gap-4 items-start hover:border-amber-400/40 transition-colors duration-300">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                  <Trophy className="w-5 h-5" />
                </div>
                <div className="text-left space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono font-black text-amber-500 tracking-wider">2023</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-100 leading-snug">
                    {t.awardWin2023}
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    {currentLang === 'en' ? 'Category: Active Thermally Conductive Breast Patch System' : '段位：第六届中国医疗器械创新创业大赛 可穿戴与便携式产品 · 优胜奖'}
                  </p>
                </div>
              </motion.div>

            </div>

            {/* Foot endorsement banner */}
            <div className="border-t border-white/10 pt-3 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 font-sans tracking-wide">
                北京中科医用材料有限公司
              </span>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}

function AnimatedBar({
  height, from, to, glow = false
}: {
  height: number; from: string; to: string; glow?: boolean;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  return (
    <div ref={ref} className="relative w-14 flex items-end" style={{ height: `${height}px` }}>
      <motion.div
        className={`w-full bg-gradient-to-t ${from} ${to} rounded-t-lg shadow-md`}
        initial={{ height: 0 }}
        animate={inView ? { height: `${height}px` } : { height: 0 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        style={glow ? { boxShadow: '0 0 24px rgba(34,211,238,0.55), inset 0 0 8px rgba(255,255,255,0.18)', filter: 'url(#tb-bloom)' } : undefined}
      />
    </div>
  );
}

function CountUpLabel({
  value, fixed = 0, suffix = '', className = ''
}: { value: number; fixed?: number; suffix?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const mv = useMotionValue(0);
  const display = useTransform(mv, (n) => `${n.toFixed(fixed)}${suffix}`);

  useEffect(() => {
    if (!inView) return;
    const c = animate(mv, value, { duration: 1.1, ease: [0.22, 1, 0.36, 1] });
    return () => c.stop();
  }, [inView, value, mv]);

  return <motion.span ref={ref} className={className}>{display}</motion.span>;
}
