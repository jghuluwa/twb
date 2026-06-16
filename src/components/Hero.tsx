import { useEffect, useRef, ReactNode, MouseEvent as ReactMouseEvent } from 'react';
import { ArrowRight, ChevronDown, Activity, ShieldCheck, Waves } from 'lucide-react';
import {
  motion, useMotionValue, useSpring, useTransform, useMotionTemplate, useReducedMotion
} from 'motion/react';
import { Language } from '../types';
import { translations } from '../data/translations';
import Reveal from './visuals/Reveal';
import PhotonField from './visuals/PhotonField';
import { useSiteContent } from '../hooks/useSiteContent';

interface HeroProps {
  currentLang: Language;
  onExplore: () => void;
  onScience: () => void;
}

const EASE = [0.22, 1, 0.36, 1] as const;

export default function Hero({ currentLang, onExplore, onScience }: HeroProps) {
  const t = translations[currentLang];
  const siteContent = useSiteContent();
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement | null>(null);

  // Pointer (-0.5 .. 0.5) drives the material tilt, parallax + specular sheen.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const spring = { stiffness: 70, damping: 20, mass: 0.6 };
  const sx = useSpring(mx, spring);
  const sy = useSpring(my, spring);

  // Pronounced rotation so the material visibly pivots in 3D (no lateral slide).
  const rotateY = useTransform(sx, [-0.5, 0.5], [18, -18]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [-12, 12]);

  // Specular highlight that tracks the cursor across the weave.
  const sheenX = useTransform(sx, [-0.5, 0.5], [22, 78]);
  const sheenY = useTransform(sy, [-0.5, 0.5], [24, 70]);
  const sheen = useMotionTemplate`radial-gradient(40% 55% at ${sheenX}% ${sheenY}%, rgba(150,205,255,0.30), rgba(120,180,255,0.05) 45%, transparent 70%)`;

  useEffect(() => {
    const reset = () => { mx.set(0); my.set(0); };
    window.addEventListener('blur', reset);
    return () => window.removeEventListener('blur', reset);
  }, [mx, my]);

  const handleMove = (e: ReactMouseEvent) => {
    if (reduce) return;
    const el = sectionRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const handleLeave = () => { mx.set(0); my.set(0); };

  const headline = siteContent.hero.headline[currentLang] || t.heroHeadingFirst;
  const badge = siteContent.hero.badge[currentLang] || t.heroBadge;
  const subheading = siteContent.hero.subheading[currentLang] || t.heroSubheading;

  return (
    <section
      id="hero"
      ref={sectionRef}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="relative min-h-[92vh] flex items-center overflow-hidden bg-[#04060d] text-white"
      style={{ perspective: 1000 }}
    >
      {/* ── Fabric backdrop — full-bleed, rotates in 3D with the cursor ── */}
      <motion.div
        className="absolute inset-0 z-0 will-change-transform"
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d', transformOrigin: '60% 50%' }}
      >
        <img
          src="/photex-fabric-hero.jpg"
          alt={currentLang === 'en'
            ? 'PHOTEX intelligent terahertz fabric emitting blue bio-resonance waves'
            : 'PHOTEX 智能太赫兹功能面料释放蓝色生物共振波'}
          className="absolute inset-0 h-full w-full object-cover object-[72%_center] scale-[1.22]"
          fetchPriority="high"
          decoding="async"
        />
        {/* Specular sheen — light catching the weave at different angles */}
        <motion.div
          className="absolute inset-0 mix-blend-screen pointer-events-none"
          style={{ background: reduce ? 'none' : sheen }}
        />
      </motion.div>

      {/* Legibility scrim — fades the left side to solid ink for the copy */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, #04060d 0%, rgba(4,6,13,0.92) 26%, rgba(4,6,13,0.55) 48%, rgba(4,6,13,0.12) 66%, transparent 80%)'
        }}
      />
      {/* Top + bottom blends so the section melts into the header / next section */}
      <div className="absolute inset-x-0 top-0 h-28 z-[1] pointer-events-none bg-gradient-to-b from-[#04060d] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-32 z-[1] pointer-events-none bg-gradient-to-t from-[#04060d] to-transparent" />

      {/* ── Photon field — drifting blue light points, gather/disperse on cursor ── */}
      <PhotonField className="absolute inset-0 z-[2] mix-blend-screen pointer-events-none" originX={0.6} originY={0.4} />

      {/* ── Floating telemetry chips over the fabric ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.7, ease: EASE }}
        className="hidden md:flex absolute z-[3] right-6 lg:right-12 top-[20%] flex-col gap-3 pointer-events-none"
      >
        <TelemetryChip
          icon={<Waves className="w-3.5 h-3.5" />}
          label="PHOTEX RESONANCE"
          value="25–43 THz"
          tone="cyan"
        />
        <TelemetryChip
          icon={<Activity className="w-3.5 h-3.5" />}
          label={currentLang === 'en' ? 'LIVE · NO EMISSION' : '实时 · 一氧化氮释放'}
          value="2.7× baseline"
          tone="sky"
          live
        />
      </motion.div>

      {/* ── Copy ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-[4] w-full">
        <div
          className="max-w-2xl space-y-7 py-24"
          style={{ textShadow: '0 2px 22px rgba(4,6,13,0.75)' }}
        >

          <Reveal>
            <div className="inline-flex items-center gap-2.5 rounded-full border border-cyan-300/25 bg-cyan-400/[0.06] px-4 py-1.5 text-[11px] font-bold tracking-wide text-cyan-100 backdrop-blur-sm">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-cyan-300 opacity-75" style={{ animation: 'molecule-pulse 2s ease-in-out infinite' }} />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-200" />
              </span>
              <span>{badge}</span>
            </div>
          </Reveal>

          <h1 className="font-sans text-4xl sm:text-5xl lg:text-[4.1rem] font-extrabold leading-[1.05] tracking-tighter">
            <span className="block text-white/95">
              <SplitReveal text={headline} />
            </span>
            <span
              className="block bg-clip-text text-transparent"
              style={{
                backgroundImage: 'linear-gradient(108deg, #E0F2FE 0%, #38BDF8 42%, #22D3EE 100%)',
                textShadow: '0 0 38px rgba(56,189,248,0.30)'
              }}
            >
              <SplitReveal text={t.heroHeadingHighlight} delayBase={0.3} />
            </span>
            <span className="block text-2xl sm:text-3xl lg:text-[2.4rem] font-bold text-slate-300/90 mt-3 tracking-tight">
              <SplitReveal text={t.heroHeadingSecond} delayBase={0.55} />
            </span>
          </h1>

          <Reveal delay={0.75}>
            <p className="max-w-lg text-base sm:text-lg leading-relaxed font-medium text-slate-200/95">
              {subheading}
            </p>
          </Reveal>

          {/* Feature row */}
          <Reveal delay={0.9}>
            <div className="flex flex-wrap gap-x-6 gap-y-3 pt-1">
              <Feature icon={<Waves className="w-4 h-4" />} text={currentLang === 'en' ? 'Stimulates endogenous Nitric Oxide' : '激发自体内源性一氧化氮'} />
              <Feature icon={<ShieldCheck className="w-4 h-4" />} text={currentLang === 'en' ? 'Pure physics — zero medication' : '纯物理共振 · 无药性副作用'} />
            </div>
          </Reveal>

          {/* CTAs */}
          <Reveal delay={1.05}>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-3">
              <motion.button
                onClick={onExplore}
                whileHover={reduce ? undefined : { scale: 1.025 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-xl px-8 py-4 font-bold text-[#04060d] cursor-pointer"
                style={{
                  background: 'linear-gradient(120deg, #BAE6FD 0%, #38BDF8 50%, #22D3EE 100%)',
                  boxShadow: '0 16px 44px -12px rgba(34,211,238,0.65), inset 0 0 0 1px rgba(255,255,255,0.25)'
                }}
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/45 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <span className="relative">{t.heroCtaBuy}</span>
                <ArrowRight className="relative w-4.5 h-4.5 transition-transform group-hover:translate-x-1" />
              </motion.button>
              <motion.button
                onClick={onScience}
                whileHover={reduce ? undefined : { scale: 1.025 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-8 py-4 font-bold text-white/90 backdrop-blur-sm transition-colors hover:bg-white/10 hover:border-white/25 cursor-pointer"
              >
                <span>{t.heroCtaScience}</span>
              </motion.button>
            </div>
          </Reveal>

          {/* Trust stats */}
          <Reveal delay={1.2}>
            <div className="grid grid-cols-3 gap-6 max-w-md border-t border-white/10 pt-6">
              <Stat value="200%+" label={currentLang === 'en' ? 'NO after 1 hr' : '理疗后 NO 提升'} />
              <Stat value="25–43" label="THz resonance" />
              <Stat value="ISO" label={currentLang === 'en' ? 'Certified lab' : '国家级实验室'} />
            </div>
          </Reveal>
        </div>
      </div>

      {/* Scroll cue */}
      <motion.button
        onClick={onScience}
        aria-label={currentLang === 'en' ? 'Scroll to learn more' : '向下滚动了解更多'}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 0.8 }}
        className="absolute bottom-6 left-1/2 z-[4] -translate-x-1/2 flex flex-col items-center gap-1.5 text-cyan-200/70 hover:text-cyan-100 transition-colors cursor-pointer"
      >
        <span className="text-[10px] font-mono font-bold tracking-[0.3em] uppercase">Scroll</span>
        <motion.span
          animate={reduce ? undefined : { y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.span>
      </motion.button>
    </section>
  );
}

function Feature({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-7 w-7 place-items-center rounded-lg border border-cyan-400/25 bg-cyan-400/10 text-cyan-300">
        {icon}
      </span>
      <span className="text-sm font-semibold text-slate-200">{text}</span>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-mono text-2xl font-black text-white" style={{ textShadow: '0 0 18px rgba(56,189,248,0.35)' }}>
        {value}
      </div>
      <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
    </div>
  );
}

function TelemetryChip({
  icon, label, value, tone, live
}: {
  icon: ReactNode; label: string; value: string; tone: 'cyan' | 'sky'; live?: boolean;
}) {
  const toneClass = tone === 'cyan' ? 'text-cyan-300' : 'text-sky-300';
  return (
    <div className="rounded-2xl border border-white/12 bg-white/[0.06] px-3.5 py-2.5 backdrop-blur-md shadow-2xl min-w-[176px]">
      <div className="flex items-center gap-2">
        {live ? (
          <span className="h-2 w-2 rounded-full bg-emerald-400" style={{ animation: 'molecule-pulse 1.6s ease-in-out infinite', boxShadow: '0 0 8px #34d399' }} />
        ) : (
          <span className={toneClass}>{icon}</span>
        )}
        <span className={`text-[10px] font-mono font-bold uppercase tracking-widest ${live ? 'text-emerald-300' : toneClass}`}>
          {label}
        </span>
      </div>
      <div className="mt-1 font-mono text-lg font-black text-white">{value}</div>
    </div>
  );
}

/**
 * Splits text into words and fades each up sequentially. CJK is split per
 * character so Chinese also benefits from the staggered reveal.
 */
function SplitReveal({ text, delayBase = 0 }: { text: string; delayBase?: number }) {
  const reduce = useReducedMotion();
  const tokens: string[] = [];
  let buf = '';
  for (const ch of text) {
    if (/[　-鿿＀-￯]/.test(ch)) {
      if (buf) { tokens.push(buf); buf = ''; }
      tokens.push(ch);
    } else if (ch === ' ') {
      if (buf) { tokens.push(buf); buf = ''; }
      tokens.push(' ');
    } else {
      buf += ch;
    }
  }
  if (buf) tokens.push(buf);

  return (
    <>
      {tokens.map((tok, i) =>
        tok === ' ' ? (
          ' '
        ) : (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: reduce ? 0 : 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: delayBase + i * 0.04, ease: EASE }}
            className="inline-block"
          >
            {tok}
          </motion.span>
        )
      )}
    </>
  );
}
