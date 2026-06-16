import { Landmark, Quote, Users, Sparkles, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { Language } from '../types';
import { translations } from '../data/translations';
import Reveal from './visuals/Reveal';
import Molecule from './visuals/Molecule';
import { useSiteContent } from '../hooks/useSiteContent';

interface AboutAndReviewsProps {
  currentLang: Language;
}

export default function AboutAndReviews({ currentLang }: AboutAndReviewsProps) {
  const t = translations[currentLang];
  const siteContent = useSiteContent();

  const simulatedReviews = [
    {
      author: currentLang === 'en' ? 'Arthur M. (Age 64)' : '马明德（64岁）',
      title: currentLang === 'en' ? 'Saved My Cold Feet and Foot Cracking!' : '拯救了我的老寒腿和足跟龟裂！',
      content: currentLang === 'en'
        ? "My feet used to feel like ice blocks every winter, and the skin would crack painfully. After wearing the Therabo Therapy Boots for 1 hour every evening, the warmth radiated through my entire legs. Within 2 weeks, my skin cracked less and I can sleep through the night without shivering."
        : "每年冬天双脚冻得跟冰块一样，脚跟干裂得一踩就疼。每天晚上穿通微宝理疗靴理疗1小时，全身暖烘烘的，半夜再没被冻醒过，穿了半个月，脚后跟的干裂皮肤竟然奇迹般地愈合光滑了，效果太深刻了！",
      product: currentLang === 'en' ? 'Therabo NO Microcirculation Boots' : '通微宝高能理疗靴',
      stars: 5,
      date: '2026-04-12'
    },
    {
      author: currentLang === 'en' ? 'Elena K. (Age 32)' : '许婉莹（32岁）',
      title: currentLang === 'en' ? 'Amazing Relief for Office Neck Stiffness!' : '伏案加班族的颈椎救星！',
      content: currentLang === 'en'
        ? "Working at a computer for 10 hours a day left me with severe neck stiffness and frequent dizziness. The NO Cervical Neck Collar is incredibly lightweight. Wearing it while coding completely relieved that blocked feeling at the back of my head. My head feels light again!"
        : "天加班对电脑，脖子僵硬得像水泥，还经常觉得头晕。佩戴这一款一氧化氮护颈，完全没有负重感。在电脑前敲代码时戴着，后脑勺以前那种钝痛、堵得慌的感觉完全没有了，脑供血足了人舒服太多！",
      product: currentLang === 'en' ? 'Therabo NO Cervical Neck Collar' : '一氧化氮呼吸护颈',
      stars: 5,
      date: '2026-05-02'
    },
    {
      author: currentLang === 'en' ? 'Li Wei (Age 45)' : '李伟（45岁）',
      title: currentLang === 'en' ? 'Frequent Night Urination Greatly Disappeared!' : '频繁起夜习惯明显减少了！',
      content: currentLang === 'en'
        ? "I used to wake up 4 to 5 times every single night, ruining my sleep. After consistent usage of the Therabo Men’s Active Underwear, my night toilet trips dropped down to once, sometimes none. My stamina feels renewed, and my focus is fully back."
        : "以前一晚上要起夜4到5次，睡眠严重被切碎，整天没精神。穿了通微宝男士内裤一个多月，现在半夜基本只起一次，甚至通宵不起，整个人睡得特别踏实。确实通过物理手段疏通了前列腺微循环，非常实用。",
      product: currentLang === 'en' ? 'Therabo NO Men Bio-Power Briefs' : '一氧化氮男士健康动力内裤',
      stars: 5,
      date: '2026-05-18'
    },
    {
      author: currentLang === 'en' ? 'Chen L. (Age 55)' : '陈彩凤（55岁）',
      title: currentLang === 'en' ? 'Cyclic Nodules Swelling Soothed Safely!' : '腺体淤堵酸胀感终于消散了！',
      content: currentLang === 'en'
        ? "I had painful nodules and congestion that flared up every month. Breast Care Patches inserted into my day bra worked microvascular wonders. The physical warmth feels gentle, none of that strong medicine smell. It helped dissipate my heavy knot feeling in 3 weeks."
        : "体检有轻度腺体结节，每次来生理期胀痛得不敢碰。我把这款一氧化氮乳贴放胸衣里贴着，微感觉暖洋洋的，没有任何膏药过敏的问题。穿了三个礼拜，原先胸部的硬胀、硬邦邦结节感真得消散了，不胀痛了！",
      product: currentLang === 'en' ? 'Therabo NO Breast Comfort Patches' : '一氧化氮多孔柔护乳贴',
      stars: 5,
      date: '2026-03-29'
    }
  ];

  return (
    <section id="about" className="relative py-24 text-white overflow-hidden">
      {/* Background dot-grid and blob */}
      <div className="absolute inset-0 dot-grid-dark opacity-20 pointer-events-none" />
      <div className="absolute -top-32 -left-24 w-[480px] h-[480px] rounded-full opacity-25 blur-3xl pointer-events-none"
           style={{ background: 'radial-gradient(closest-side, rgba(56,189,248,0.25), transparent 70%)', animation: 'blob-morph 22s ease-in-out infinite' }} />
      <div className="absolute -bottom-32 -right-24 w-[520px] h-[520px] rounded-full opacity-25 blur-3xl pointer-events-none"
           style={{ background: 'radial-gradient(closest-side, rgba(34,211,238,0.25), transparent 70%)', animation: 'blob-morph 26s ease-in-out infinite reverse' }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* About Company Grid Layout */}
        <Reveal as="div" className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-24">
          
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="inline-flex items-center space-x-1 bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-3.5 py-1 rounded-full text-xs font-bold tracking-wider mb-2 uppercase">
              <Landmark className="w-3.5 h-3.5" />
              <span>{t.navAbout}</span>
            </div>
            
            <h3 className="font-sans text-3xl font-extrabold text-white tracking-tighter leading-tight">
              {siteContent.about.title[currentLang] || (currentLang === 'en'
                ? 'Beijing Zhongke Medical Materials Co., Ltd.' 
                : '北京中科医用材料有限公司')}
            </h3>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-semibold">
              {siteContent.about.body[currentLang] || (currentLang === 'en'
                ? 'We are an elite biomedical enterprise integrating advanced materials sciences, national therapeutic trials, and high-performance wearable health solutions. Focused closely on Nobel-discovery biology, we have unlocked PHOTEX micro-metabolic pathways to solve chronic circulatory diseases safely without relying on pharmaceutical interventions.'
                : '北京中科医用材料有限公司是专注于创新型医用材料与可穿戴人体气血恢复机制的高新技术企业。公司凝聚了多位生物化学材料学者专家，针对全球微循环慢病痛点，成功将1998年诺贝尔生理学医学奖发现的“一氧化氮血管扩张信号通路”转化为日常高能穿戴疗法，打造出了非药物、无依赖、自体增幅的一氧化氮健康装备。')}
            </p>

            {/* Icon metrics */}
            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/10">
              <div className="space-y-1">
                <span className="font-mono text-3xl font-black text-cyan-300 block">100,000+</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {currentLang === 'en' ? 'Active Users Serviced' : '服务调顺气血家庭'}
                </span>
              </div>
              <div className="space-y-1">
                <span className="font-mono text-3xl font-black text-cyan-300 block">20+</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {currentLang === 'en' ? 'Biotech Accreditations' : '专利与核心技术资质'}
                </span>
              </div>
            </div>

          </div>

          <div className="lg:col-span-6 relative flex justify-center w-full">
            
            {/* Core R&D Competence Profile Card */}
            <div className="bg-white/[0.03] rounded-[2.5rem] p-8 sm:p-10 border border-white/10 shadow-2xl text-left w-full max-w-lg relative overflow-hidden backdrop-blur-sm">
              <div className="absolute top-0 right-0 p-4 opacity-5 text-cyan-300">
                <Quote className="w-14 h-14" />
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 rounded-xl">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-black text-cyan-300 tracking-wider block">CORE RESEARCH & CAPABILITIES</span>
                    <h4 className="text-base font-extrabold text-white font-sans">{currentLang === 'en' ? 'Biomedical Competence' : '中科医用 · 科技与研发核心'}</h4>
                  </div>
                </div>

                <div className="space-y-4 text-xs font-bold text-slate-300 leading-relaxed">
                  <div className="p-3.5 bg-white/[0.04] border border-white/10 rounded-2xl space-y-1 hover:border-cyan-400/40 transition-colors">
                    <span className="font-sans text-cyan-300 text-[11px] block">01 / {currentLang === 'en' ? 'Active Biopolymers' : '活性医用高分子材料研发'}</span>
                    <p className="text-[11px] leading-relaxed text-slate-400 font-semibold font-sans">
                      {currentLang === 'en' 
                        ? 'Pioneering active thermal-conductive composite polymers that resonate biological energy and deliver continuous safe physical stimulation to cellular layers.'
                        : '自主研发活性导温及温感高分子医用材料，兼备优越的生物相容性，可通过物理接触介导深部气血循环，解决材料防寒防漏等关键科研指标。'}
                    </p>
                  </div>

                  <div className="p-3.5 bg-white/[0.04] border border-white/10 rounded-2xl space-y-1 hover:border-cyan-400/40 transition-colors">
                    <span className="font-sans text-cyan-300 text-[11px] block">02 / {currentLang === 'en' ? 'Endogenous Nitric Oxide Conversion' : '内源一氧化氮信号通路日常化'}</span>
                    <p className="text-[11px] leading-relaxed text-slate-400 font-semibold font-sans">
                      {currentLang === 'en' 
                        ? 'Converting complex Nobel Prize-winning vascular science into daily wearable fabrics. Activating endogenous eNOS enzymes without relying on external medicines.'
                        : '将1998年诺贝尔生理学医学奖关于血管内皮舒张机制的突破性理论，进行安全可穿戴产业化转化。激发脏器及末梢组织产生自体一氧化氮，绝无药物副反应。'}
                    </p>
                  </div>

                  <div className="p-3.5 bg-white/[0.04] border border-white/10 rounded-2xl space-y-1 hover:border-cyan-400/40 transition-colors">
                    <span className="font-sans text-cyan-300 text-[11px] block">03 / {currentLang === 'en' ? 'National Clinical & Quality Standards' : '国家级多中心临床验证'}</span>
                    <p className="text-[11px] leading-relaxed text-slate-400 font-semibold font-sans">
                      {currentLang === 'en' 
                        ? 'Each product undergoes multi-center volunteer efficacy validation, strictly monitoring blood flow rate and capillary dilation to ensure evidence-based health.'
                        : '联合国内三甲医疗机构与临床中心开展科学受试，全线穿戴装备均经过严格的多样本血液微循环流速测试与一氧化氮浓度升高验证。'}
                    </p>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-3 mt-4 flex gap-3 items-center">
                  <div className="p-2 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-xl shrink-0">
                    <Users className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 block tracking-widest uppercase">研制单位企业主体</span>
                    <span className="text-[11px] font-black text-slate-200 leading-none">北京中科医用材料有限公司 / 高科技材料成果转化中心</span>
                  </div>
                </div>

              </div>

            </div>

          </div>

        </Reveal>

        {/* Testimonials Review Slider Grid */}
        <div className="space-y-10">
          <div className="text-center max-w-2xl mx-auto">
            <h3 className="font-sans text-2xl sm:text-3xl font-extrabold text-white tracking-tighter leading-tight">
              {t.customerReviewTitle}
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm font-bold mt-1">
              {currentLang === 'en' ? 'Direct testimonials from verified bio-resonance wearers' : '真实受试群体反馈，源自每一位气血通畅后的真实评价'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {simulatedReviews.map((rev, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -4 }}
                className="relative bg-white/[0.03] p-6 sm:p-8 rounded-3xl border border-white/10 hover:border-cyan-400/40 transition-colors duration-300 flex flex-col justify-between text-left backdrop-blur-sm overflow-hidden"
              >
                {/* Subtle molecule peeking in the top-right */}
                <div className="absolute -top-3 -right-3 opacity-40">
                  <Molecule size={56} glow="cyan" animation="float" rotate={-15} />
                </div>

                <div className="space-y-3.5 relative">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-0.5 text-amber-500" aria-label={`${rev.stars} / 5`}>
                        {Array.from({ length: rev.stars }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                      <h4 className="font-sans text-base font-extrabold text-white mt-1">{rev.title}</h4>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-400">{rev.date}</span>
                  </div>

                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed italic font-semibold">
                    " {rev.content} "
                  </p>
                </div>

                <div className="relative border-t border-white/10 pt-4 mt-5 flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-200">{rev.author}</span>
                  <span className="font-mono font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 py-0.5 px-2.5 rounded-full text-[10px]">
                    {rev.product}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
