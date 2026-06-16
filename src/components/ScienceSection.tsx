import { lazy, Suspense, useState, useEffect, ReactNode } from 'react';
import {
  Award, Zap, Ban, Activity, Skull, ShieldCheck, AlertTriangle, Sparkles,
  MousePointerClick, CheckCircle2
} from 'lucide-react';
import {
  motion, useMotionValue, useSpring, useTransform, animate, useInView
} from 'motion/react';
import { useRef } from 'react';
import { Language } from '../types';
import { translations } from '../data/translations';
import MoleculeField from './visuals/MoleculeField';
import Reveal from './visuals/Reveal';

const BloodVesselViz = lazy(() => import('./visuals/BloodVesselViz'));

interface ScienceSectionProps {
  currentLang: Language;
}

const EASE = [0.22, 1, 0.36, 1] as const;

export default function ScienceSection({ currentLang }: ScienceSectionProps) {
  const [userAge, setUserAge] = useState<number>(45);
  const [therapyActive, setTherapyActive] = useState<boolean>(false);
  const t = translations[currentLang];

  // Resetting the slider always returns to baseline (no therapy)
  const updateAge = (n: number) => { setUserAge(n); setTherapyActive(false); };

  const calculateNOValue = (age: number) => {
    if (age <= 20) return 100;
    if (age <= 45) {
      const ratio = (age - 20) / 25;
      return Math.round(100 - ratio * 50);
    }
    if (age <= 80) {
      const ratio = (age - 45) / 35;
      return Math.round(50 - ratio * 40);
    }
    return Math.max(5, Math.round(10 - ((age - 80) / 20) * 5));
  };
  const currentNOValue = calculateNOValue(userAge);

  const getRiskInfo = (age: number) => {
    if (age <= 30) {
      return {
        level: currentLang === 'en' ? 'Optimal Health Window' : '黄金气血期',
        color: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
        barColor: 'from-emerald-400 to-emerald-500',
        accent: 'rose' as const,
        risks: currentLang === 'en'
          ? ['Minor sports fatigue', 'Late-night recovery takes slightly longer']
          : ['运动后轻微乳酸堆积', '偶发性熬夜后的轻度气色差'],
        desc: currentLang === 'en'
          ? 'Your body maintains robust nitric oxide synthesis, preserving clean arterial walls and fast microcirculation.'
          : '人体自身一氧化氮工厂全负荷运转，毛细血管泵动有力，免疫防御处于巅峰常态。'
      };
    } else if (age <= 45) {
      return {
        level: currentLang === 'en' ? 'Sub-Health / Micro-stagnation' : '亚健康微滞期',
        color: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
        barColor: 'from-amber-400 to-amber-500',
        accent: 'rose' as const,
        risks: currentLang === 'en'
          ? ['Increased lumbar muscle soreness', 'Early arterial plaque deposits', 'Slower fat metabolism / belly fat', 'Frequent computer neck stiffness']
          : ['久坐引起的腰部肌肉酸软', '初期血液流速减缓，轻度高血脂隐患', '内脏脂肪积蓄、腹部发凉', '低头伏案颈椎僵直酸重'],
        desc: currentLang === 'en'
          ? 'Nitric oxide capacity is declining. Minor artery pathways start to narrow or stiffen, initiating fatigue cycles.'
          : '一氧化氮产量开始走下坡路。日常久坐或寒气入侵容易在腰、颈关节造成局部的毛细血管循环滞阻。'
      };
    } else if (age <= 60) {
      return {
        level: currentLang === 'en' ? 'High Deficit / Metabolic Challenge' : '高危严重流失期',
        color: 'text-orange-300 bg-orange-500/10 border-orange-500/30',
        barColor: 'from-orange-400 to-orange-500',
        accent: 'rose' as const,
        risks: currentLang === 'en'
          ? ['High blood pressure risks', 'Nocturnal urination frequency', 'Cold extremities / dry limb skin', 'Insomnia & mental stress']
          : ['原发性高血压与血栓危险攀升', '盆腔微血管淤阻，频繁夜尿起夜', '四肢末端冰凉发木，脚跟皮肤开裂', '交感神经过度兴奋引发失眠、记忆力减退'],
        desc: currentLang === 'en'
          ? 'Severe NO deficiency. Endogenous production drops to half. Deep vascular vessels lose elasticity, demanding active physical intervention.'
          : '一氧化氮产量流失过半。全身极为关键的微循环动力几乎停摆，严重阻碍内脏细胞排毒与微小动静脉回流。'
      };
    } else {
      return {
        level: currentLang === 'en' ? 'Critical Deficit / Degenerative Phase' : '极高危衰退蜕变期',
        color: 'text-rose-300 bg-rose-500/10 border-rose-500/30',
        barColor: 'from-rose-400 to-rose-600',
        accent: 'rose' as const,
        risks: currentLang === 'en'
          ? ['Cardiovascular and stroke vulnerability', 'Severe joint degeneration/swelling', 'Varicose veins & lymphatic block', 'Senile organic challenges']
          : ['极高突发性脑卒中及动脉粥样硬化风险', '重度膝关节骨质增生与滑膜炎酸痛', '下肢严重静脉曲张，毒素沉积酸痛', '细胞重度老化，多系统代谢功能衰退'],
        desc: currentLang === 'en'
          ? 'Only 10% natural capacity remains. Physical assistance via PHOTEX wearable technology is crucial to reverse localized cellular stasis.'
          : '体内仅剩不足10%的自然一氧化氮合成分子。此时必须依靠PHOTEX非药物生物技术强制进行局部线粒体充能，才能逆转气血衰竭。'
      };
    }
  };
  const riskInfo = getRiskInfo(userAge);

  return (
    <section
      id="science"
      className="relative py-24 overflow-hidden text-white"
      style={{ background: 'linear-gradient(180deg, #050912 0%, #0B1120 50%, #0F172A 100%)' }}
    >
      <div className="absolute inset-0 dot-grid-dark opacity-30" />
      <div className="absolute top-0 left-0 right-0 h-px flow-stream-bar opacity-80" />
      <div className="absolute bottom-0 left-0 right-0 h-px flow-stream-bar opacity-80" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Section Header */}
        <Reveal>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 bg-cyan-500/10 text-cyan-300 px-3.5 py-1 rounded-full text-xs font-bold tracking-wider mb-4 uppercase border border-cyan-500/30">
              <Award className="w-3.5 h-3.5" />
              <span>{t.nobleTitle}</span>
            </div>
            <h2 className="font-sans text-3xl sm:text-4xl font-extrabold tracking-tighter leading-tight">
              {t.scienceTitle}
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mt-3 font-semibold">
              {t.scienceSub}
            </p>
          </div>
        </Reveal>

        {/* Nobel Card */}
        <Reveal>
          <div className="relative bg-white/[0.03] backdrop-blur-md rounded-3xl p-6 sm:p-10 border border-white/10 mb-16 grid grid-cols-1 md:grid-cols-12 gap-8 items-center overflow-hidden">
            <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-30 pointer-events-none"
                 style={{ background: 'radial-gradient(closest-side, rgba(251, 191, 36, 0.4), transparent 70%)', animation: 'blob-morph 20s ease-in-out infinite' }} />
            <div className="md:col-span-4 flex justify-center">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                className="relative w-40 h-40 rounded-full p-0.5 flex items-center justify-center"
                style={{
                  background: 'conic-gradient(from 0deg, #FDE68A, #F59E0B, #FCD34D, #FDE68A)',
                  boxShadow: '0 0 40px rgba(251, 191, 36, 0.4)'
                }}
              >
                <div className="absolute inset-2 rounded-full border border-amber-400/40 border-dashed animate-[spin-slow_30s_linear_infinite]" />
                <div className="absolute inset-0 rounded-full" style={{ background: 'radial-gradient(closest-side, transparent 60%, rgba(0,0,0,0.6))' }} />
                <div className="flex flex-col items-center justify-center text-center px-4 relative z-10">
                  <span className="font-serif text-amber-200 text-[10px] font-bold tracking-widest uppercase">ALFR NOBEL</span>
                  <span className="text-amber-100 font-serif text-sm font-black italic my-1">Physiology</span>
                  <span className="text-amber-200 font-serif text-[11px] font-bold leading-none">1998 AWARD</span>
                </div>
              </motion.div>
            </div>
            <div className="md:col-span-8 space-y-4">
              <h3 className="font-sans text-xl font-extrabold text-white">{t.nobleTitle}</h3>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-semibold">
                {t.nobleDesc}
              </p>
              <div className="text-xs text-slate-500 font-mono flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>Robert F. Furchgott | Louis J. Ignarro | Ferid Murad</span>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Interactive Calculator */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch mb-16">

          {/* Slider + viz */}
          <Reveal as="div" className="lg:col-span-7">
            <div className="relative bg-white/[0.03] backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-white/10 h-full flex flex-col overflow-hidden">
              <div className="space-y-4">
                <h3 className="font-sans text-xl font-extrabold flex items-center gap-2.5">
                  <Activity className="w-5.5 h-5.5 text-cyan-400" />
                  <span>{t.ageCalcTitle}</span>
                </h3>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed font-semibold">
                  {t.ageCalcDesc}
                </p>
              </div>

              {/* Slider */}
              <div className="my-8 space-y-4">
                <div className="grid gap-3 bg-white/5 py-3.5 px-5 rounded-2xl border border-white/10 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                  <span className="font-sans text-sm font-bold text-slate-300">{t.ageLabel}</span>
                  <div className="rounded-xl border border-cyan-500/25 bg-cyan-500/10 px-4 py-2 text-center">
                    <span className="block text-[9px] font-bold uppercase tracking-widest text-cyan-300">{currentLang === 'en' ? 'Current NO level' : '当前一氧化氮含量'}</span>
                    <strong className="font-mono text-2xl font-black text-cyan-200">{currentNOValue}%</strong>
                  </div>
                  <motion.span
                    key={userAge}
                    initial={{ scale: 0.85, opacity: 0.6 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                    className="font-mono text-3xl font-black text-cyan-300 bg-cyan-500/10 px-4 py-1.5 rounded-xl border border-cyan-500/30"
                    style={{ textShadow: '0 0 14px rgba(34,211,238,0.5)' }}
                  >
                    {userAge} <span className="text-xs font-sans font-bold text-cyan-400/80">{currentLang === 'en' ? 'yrs' : '岁'}</span>
                  </motion.span>
                </div>

                <input
                  type="range"
                  min="20"
                  max="100"
                  step="1"
                  value={userAge}
                  onChange={(e) => updateAge(Number(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500 focus:outline-none"
                />
                <div className="flex justify-between text-[10px] font-bold text-slate-500 font-mono px-1">
                  <span>Age 20</span><span>Age 40</span><span>Age 60</span><span>Age 80</span><span>Age 100</span>
                </div>
              </div>

              {/* Blood-vessel narrative viz — THz waves → NO emission → dilation → RBC flow */}
              <div className="relative mx-auto w-full max-w-xl aspect-[12/7] rounded-2xl bg-white/[0.02] border border-white/5 overflow-hidden">
                <div className="absolute inset-0 dot-grid-dark opacity-40" />
                <div className="absolute inset-0 flex items-center justify-center px-2">
                  <BloodVesselStage noValue={currentNOValue} therapyActive={therapyActive} />
                </div>
                <div className="absolute top-2 left-3 text-[10px] font-mono font-bold tracking-widest uppercase flex items-center gap-1.5">
                  <span className={therapyActive ? 'text-cyan-300' : 'text-slate-400'}>
                    {therapyActive
                      ? (currentLang === 'en' ? 'AFTER · PHOTEX therapy' : '理疗后 · PHOTEX 激活')
                      : (currentLang === 'en' ? 'BEFORE · natural state' : '理疗前 · 自然衰退态')}
                  </span>
                  {therapyActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" style={{ animation: 'molecule-pulse 1.4s ease-in-out infinite' }} />
                  )}
                </div>
                <div className="absolute bottom-2 right-3 text-[10px] font-mono font-black tracking-widest">
                  <span className={therapyActive ? 'text-cyan-300' : 'text-rose-300'}>
                    NO {therapyActive ? '200%+' : `${currentNOValue}%`}
                  </span>
                  <span className="text-slate-500"> · </span>
                  <span className="text-slate-400">{currentLang === 'en' ? 'dilation' : '舒张度'}</span>
                </div>
              </div>
              <p className="mx-auto mt-2 w-full max-w-xl text-[9px] leading-relaxed text-slate-500">
                {currentLang === 'en'
                  ? '* 3D motion is a mechanism illustration. Yellow material represents circulatory deposits and does not claim that arterial plaque is removed in one hour.'
                  : '* 3D 动态为机制示意。黄色代表循环沉积示意，不代表理疗 1 小时可清除真实动脉斑块。'}
              </p>

              {/* Comparison row — two mutually-exclusive togglable cards */}
              <div className="space-y-2 mt-6 pt-6 border-t border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
                    {currentLang === 'en' ? '◇ Compare · click either card' : '◇ 对比模式 · 点击左右切换'}
                  </span>
                  <span className="text-[10px] font-mono font-bold tracking-widest text-slate-500">
                    {currentLang === 'en'
                      ? (therapyActive ? 'showing: AFTER' : 'showing: BEFORE')
                      : (therapyActive ? '当前: 理疗后' : '当前: 理疗前')}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-stretch">

                  {/* LEFT — BEFORE (no product) */}
                  <motion.button
                    type="button"
                    onClick={() => setTherapyActive(false)}
                    whileHover={{ scale: therapyActive ? 1.015 : 1 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                    aria-pressed={!therapyActive}
                    className={`sm:col-span-6 text-left space-y-3 rounded-2xl p-4 pt-12 border transition-colors cursor-pointer relative overflow-hidden ${
                      !therapyActive
                        ? 'bg-rose-500/10 border-rose-500/50 ring-2 ring-rose-500/30'
                        : 'bg-white/[0.03] border-white/10 hover:border-rose-500/40 hover:bg-rose-500/5 opacity-70 hover:opacity-100'
                    }`}
                    style={!therapyActive ? { boxShadow: '0 0 24px rgba(244,63,94,0.25)' } : undefined}
                  >
                    {/* Selection chip */}
                    <span className={`absolute top-2 right-2 inline-flex items-center gap-1 text-[9px] font-bold rounded-full px-2 py-0.5 pointer-events-none ${
                      !therapyActive
                        ? 'text-rose-100 bg-rose-500/30 border border-rose-400/50'
                        : 'text-slate-400 bg-white/5 border border-white/15'
                    }`}
                      style={!therapyActive ? undefined : { animation: 'molecule-pulse 2.6s ease-in-out infinite' }}
                    >
                      {!therapyActive
                        ? <><CheckCircle2 className="w-2.5 h-2.5" />{currentLang === 'en' ? 'showing' : '已选中'}</>
                        : <><MousePointerClick className="w-2.5 h-2.5" />{currentLang === 'en' ? 'click' : '点击对比'}</>}
                    </span>

                    <div className="flex items-end justify-between gap-3">
                      <span className={`min-w-0 text-xs font-bold uppercase tracking-wider ${!therapyActive ? 'text-rose-200' : 'text-slate-400'}`}>
                        {t.noLevelLabel}
                      </span>
                      <CountUp
                        value={currentNOValue}
                        suffix="%"
                        className={`shrink-0 text-xl font-mono font-black ${!therapyActive ? 'text-white' : 'text-slate-300'}`}
                      />
                    </div>

                    <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/10">
                      <motion.div
                        className={`h-full rounded-full bg-gradient-to-r ${riskInfo.barColor}`}
                        initial={false}
                        animate={{ width: `${currentNOValue}%` }}
                        transition={{ duration: 0.5, ease: EASE }}
                        style={{ boxShadow: '0 0 14px rgba(244,63,94,0.4)' }}
                      />
                    </div>

                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border inline-block ${riskInfo.color}`}>
                      {riskInfo.level}
                    </span>

                    <div className={`flex items-center gap-1.5 text-[10px] font-bold pt-1 ${!therapyActive ? 'text-rose-200' : 'text-slate-500'}`}>
                      <AlertTriangle className="w-3 h-3" />
                      <span>{currentLang === 'en' ? 'Natural decline (no product)' : '不使用产品 · 自然衰退态'}</span>
                    </div>
                  </motion.button>

                  {/* RIGHT — AFTER (PHOTEX therapy) */}
                  <motion.button
                    type="button"
                    onClick={() => setTherapyActive(true)}
                    whileHover={{ scale: therapyActive ? 1 : 1.015 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                    aria-pressed={therapyActive}
                    className={`sm:col-span-6 text-left space-y-3 rounded-2xl p-4 pt-12 border transition-colors cursor-pointer relative overflow-hidden ${
                      therapyActive
                        ? 'bg-cyan-500/10 border-cyan-500/50 ring-2 ring-cyan-500/30'
                        : 'bg-white/[0.03] border-white/10 hover:border-cyan-500/40 hover:bg-cyan-500/5 opacity-70 hover:opacity-100'
                    }`}
                    style={therapyActive ? { boxShadow: '0 0 24px rgba(34,211,238,0.35)' } : undefined}
                  >
                    {/* Selection chip */}
                    <span className={`absolute top-2 right-2 inline-flex items-center gap-1 text-[9px] font-bold rounded-full px-2 py-0.5 pointer-events-none ${
                      therapyActive
                        ? 'text-cyan-100 bg-cyan-500/30 border border-cyan-400/50'
                        : 'text-slate-400 bg-white/5 border border-white/15'
                    }`}
                      style={therapyActive ? undefined : { animation: 'molecule-pulse 2.6s ease-in-out infinite' }}
                    >
                      {therapyActive
                        ? <><CheckCircle2 className="w-2.5 h-2.5" />{currentLang === 'en' ? 'showing' : '已激活'}</>
                        : <><MousePointerClick className="w-2.5 h-2.5" />{currentLang === 'en' ? 'click to apply' : '点击试用'}</>}
                    </span>

                    <div className="flex items-end justify-between gap-3">
                      <span className={`min-w-0 text-xs font-bold uppercase tracking-wider ${therapyActive ? 'text-cyan-200' : 'text-slate-400'}`}>
                        {currentLang === 'en' ? 'After 1 hour of Therabo therapy' : '通微宝理疗 1 小时后'}
                      </span>
                      <motion.span
                        key={therapyActive ? 'on' : 'off'}
                        initial={{ scale: 0.7, opacity: 0.5 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                        className={`shrink-0 font-mono font-black text-xl ${therapyActive ? 'text-cyan-300' : 'text-slate-300'}`}
                        style={therapyActive ? { textShadow: '0 0 14px rgba(34,211,238,0.7)' } : undefined}
                      >
                        200%+
                      </motion.span>
                    </div>

                    <div className={`w-full h-3 rounded-full overflow-hidden p-0.5 border ${therapyActive ? 'bg-cyan-500/15 border-cyan-500/30' : 'bg-white/5 border-white/10'}`}>
                      <motion.div
                        key={therapyActive ? 'bar-on' : 'bar-off'}
                        className={`h-full rounded-full bg-gradient-to-r ${therapyActive ? 'from-cyan-400 to-cyan-500' : 'from-cyan-700/50 to-cyan-600/40'}`}
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 1.0, ease: EASE }}
                        style={therapyActive ? { boxShadow: '0 0 16px rgba(34,211,238,0.8)' } : undefined}
                      />
                    </div>

                    <div className={`flex items-center gap-1.5 text-[10px] font-bold pt-1 ${therapyActive ? 'text-cyan-200' : 'text-slate-500'}`}>
                      <ShieldCheck className="w-3 h-3" />
                      <span>
                        {therapyActive
                          ? (currentLang === 'en' ? 'NO surges · vessel dilates · deposits flushed' : 'NO 大量涌入 · 血管舒张 · 沉积冲刷')
                          : (currentLang === 'en' ? 'Click to visualize the one-hour response' : '点击查看理疗 1 小时后的机制示意')}
                      </span>
                    </div>
                  </motion.button>

                </div>
              </div>
            </div>
          </Reveal>

          {/* Risk forecast */}
          <Reveal as="div" className="lg:col-span-5" delay={0.1}>
            <div className="relative bg-gradient-to-b from-rose-950/40 to-slate-950 rounded-3xl p-6 sm:p-8 flex flex-col justify-between border border-rose-500/20 h-full overflow-hidden">
              <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-40 pointer-events-none"
                   style={{ background: 'radial-gradient(closest-side, rgba(225,29,72,0.6), transparent 70%)', animation: 'molecule-pulse 4s ease-in-out infinite' }} />
              <div className="relative space-y-4">
                <span className="text-[10px] font-mono tracking-widest text-rose-300 font-bold bg-rose-500/15 py-1 px-2.5 rounded-full uppercase border border-rose-500/20">
                  Deficit Danger Forecast / 危机预测
                </span>
                <h4 className="font-sans text-lg font-extrabold flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                  {t.healthRiskLabel}
                </h4>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-medium">{riskInfo.desc}</p>
              </div>

              <div className="my-6 space-y-2.5 relative">
                {riskInfo.risks.map((risk, index) => (
                  <motion.div
                    key={`${userAge}-${index}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08, duration: 0.4, ease: EASE }}
                    className="flex items-start gap-3 bg-white/5 p-3 rounded-xl border border-white/10 hover:border-rose-500/40 transition-colors"
                  >
                    <div className="p-1 bg-rose-500/15 text-rose-300 rounded-lg mt-0.5 shrink-0 border border-rose-500/20">
                      <Skull className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-slate-200 leading-snug">{risk}</span>
                  </motion.div>
                ))}
              </div>

              <div className="bg-rose-500/10 rounded-2xl p-4 border border-rose-500/30 flex items-center gap-3 relative">
                <div
                  className="w-9 h-9 rounded-full bg-rose-600 flex items-center justify-center text-white text-xs font-black"
                  style={{ animation: 'glow-pulse 2s ease-in-out infinite' }}
                >
                  NO
                </div>
                <div className="flex-1">
                  <span className="text-[10px] font-bold text-rose-300 block tracking-wider uppercase font-mono">SOLUTION AT HAND</span>
                  <span className="text-xs font-bold text-slate-200 leading-tight block">
                    {currentLang === 'en' ? 'Wear Therabo to recover cellular microdots.' : '佩戴通微宝系列，深度打通微细阻滞'}
                  </span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Tech route comparison — molecules dissipate vs aggregate */}
        <Reveal>
          <h3 className="font-sans text-xl font-extrabold text-white text-center mb-8 tracking-tight">
            {t.techRouteTitle}
          </h3>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Traditional */}
          <Reveal>
            <RouteCard
              variant="traditional"
              icon={<Ban className="w-5 h-5" />}
              label="TRADITIONAL ROUTE"
              title={t.techRouteTraditional}
              desc={t.techRouteTraditionalDesc}
              bullets={currentLang === 'en'
                ? ['Hard for intestinal absorption', 'Spike curves cause safety threats', 'High organ toxicity on long cycles']
                : ['口服易流失，吸收率及靶向极低', '外源剧烈浓度变化存在安全起伏风险', '依赖度高，加重肝肾及胃肠代谢负荷']
              }
            />
          </Reveal>

          {/* Therabo */}
          <Reveal delay={0.1}>
            <RouteCard
              variant="therabo"
              icon={<Zap className="w-5 h-5" />}
              label="THE BIOLOGICAL ROUTE"
              title={t.techRouteTherabo}
              desc={t.techRouteTheraboDesc}
              bullets={currentLang === 'en'
                ? ['Natural endogenous synthesis', 'Targets specific local pain zones', 'Never decays with repeated use']
                : ['激发自体细胞量能，安全温和生发', '无缝贴合所需部位，定向起效', '纯物理穿戴，反复水洗不损物理疗力']
              }
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function BloodVesselStage({ noValue, therapyActive }: { noValue: number; therapyActive: boolean }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const shouldLoad = useInView(ref, { once: true, margin: '300px 0px' });
  const fallback = (
    <div className="relative h-full w-full overflow-hidden">
      <div className="absolute inset-[28%_6%] rounded-full bg-gradient-to-b from-rose-300/30 via-rose-800/45 to-rose-950/50 blur-sm" />
      <div className="absolute inset-0 animate-pulse bg-[radial-gradient(ellipse_at_center,rgba(244,63,94,0.14),transparent_62%)]" />
    </div>
  );

  return (
    <div ref={ref} className="h-full w-full">
      {shouldLoad ? (
        <Suspense fallback={fallback}>
          <BloodVesselViz noValue={noValue} therapyActive={therapyActive} />
        </Suspense>
      ) : fallback}
    </div>
  );
}

function RouteCard({
  variant, icon, label, title, desc, bullets
}: {
  variant: 'traditional' | 'therabo';
  icon: ReactNode;
  label: string;
  title: string;
  desc: string;
  bullets: string[];
}) {
  const isTherabo = variant === 'therabo';
  return (
    <div
      className={`relative rounded-2xl p-6 border overflow-hidden h-full ${
        isTherabo
          ? 'bg-gradient-to-br from-cyan-500/10 to-white/[0.02] border-cyan-500/30'
          : 'bg-white/[0.02] border-white/10'
      }`}
    >
      {isTherabo && (
        <div className="absolute top-0 right-0 p-2.5 text-[10px] font-mono font-black text-cyan-300 bg-cyan-500/15 rounded-bl-xl border-l border-b border-cyan-500/30 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          RECOMMENDED
        </div>
      )}

      {/* Molecule mini-viz: dissipate vs aggregate */}
      <div className="absolute right-2 bottom-2 w-28 h-28 pointer-events-none opacity-80">
        <MoleculeField
          mode={isTherabo ? 'aggregate' : 'scatter'}
          count={isTherabo ? 4 : 3}
          size={112}
          moleculeSize={22}
          glow={isTherabo ? 'cyan' : 'none'}
          dim={!isTherabo}
        />
      </div>

      <div className="relative flex items-center gap-3 mb-4">
        <div className={`p-2.5 rounded-xl ${isTherabo ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30' : 'bg-white/5 text-slate-400 border border-white/10'}`}>
          {icon}
        </div>
        <div>
          <h4 className={`text-[10px] font-bold uppercase tracking-widest leading-none ${isTherabo ? 'text-cyan-300' : 'text-slate-400'}`}>
            {label}
          </h4>
          <span className="text-base font-black text-white">{title}</span>
        </div>
      </div>
      <p className="relative text-slate-300 text-xs sm:text-sm leading-relaxed mb-4 font-semibold">
        {desc}
      </p>
      <div className="relative border-t border-white/10 pt-4 space-y-2 text-xs font-bold text-slate-200">
        {bullets.map((b, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${isTherabo ? 'bg-cyan-400' : 'bg-slate-500'}`} style={isTherabo ? { boxShadow: '0 0 8px rgba(34,211,238,0.7)' } : undefined} />
            <span>{b}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CountUp({ value, suffix = '', className = '' }: { value: number; suffix?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: false, amount: 0.5 });
  const mv = useMotionValue(0);
  const display = useTransform(mv, (n) => `${Math.round(n)}${suffix}`);
  const spring = useSpring(mv, { stiffness: 120, damping: 20 });
  useTransform(spring, (n) => n); // keep spring active

  useEffect(() => {
    if (!inView) return;
    const controls = animate(mv, value, { duration: 0.6, ease: EASE });
    return () => controls.stop();
  }, [value, inView, mv]);

  return <motion.span ref={ref} className={className}>{display}</motion.span>;
}
