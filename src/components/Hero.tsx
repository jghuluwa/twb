import { useEffect, useRef, MouseEvent as ReactMouseEvent } from 'react';
import { ArrowRight, Sparkles, ShieldCheck, Heart, Activity } from 'lucide-react';
import {
  motion, useMotionValue, useSpring, useTransform, useReducedMotion
} from 'motion/react';
import { Language } from '../types';
import { translations } from '../data/translations';
import MoleculeField from './visuals/MoleculeField';
import Reveal from './visuals/Reveal';
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
  const rightRef = useRef<HTMLDivElement | null>(null);

  // Pointer-attraction for the molecule orbit
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 80, damping: 22, mass: 0.5 });
  const sy = useSpring(my, { stiffness: 80, damping: 22, mass: 0.5 });
  const fieldX = useTransform(sx, (v) => v * 18);
  const fieldY = useTransform(sy, (v) => v * 18);

  const handleMove = (e: ReactMouseEvent) => {
    if (reduce) return;
    const el = rightRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width  - 0.5);
    my.set((e.clientY - rect.top)  / rect.height - 0.5);
  };
  const handleLeave = () => { mx.set(0); my.set(0); };

  // Split headline into characters for per-char reveal
  const managedHeadline = siteContent.hero.headline[currentLang];
  const headline = managedHeadline || t.heroHeadingFirst;
  const highlight = t.heroHeadingHighlight;
  const second   = t.heroHeadingSecond;

  return (
    <section
      id="hero"
      className="relative min-h-[88vh] flex items-center overflow-hidden py-20 text-white"
      style={{
        background: 'radial-gradient(120% 80% at 30% 10%, #1B2540 0%, #0B1120 55%, #050912 100%)'
      }}
    >
      {/* Flow-stream top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
        <div className="absolute inset-0 flow-stream-bar opacity-90" />
      </div>

      {/* Dotted grid texture */}
      <div className="absolute inset-0 dot-grid-dark opacity-40" />

      {/* Twin morphing blobs (rose + cyan) */}
      <div
        className="absolute -top-32 -left-16 w-[520px] h-[520px] opacity-40 blur-3xl pointer-events-none"
        style={{
          background: 'radial-gradient(closest-side, rgba(225,29,72,0.65), transparent 70%)',
          animation: 'blob-morph 18s ease-in-out infinite'
        }}
      />
      <div
        className="absolute -bottom-40 -right-16 w-[600px] h-[600px] opacity-35 blur-3xl pointer-events-none"
        style={{
          background: 'radial-gradient(closest-side, rgba(34,211,238,0.55), transparent 70%)',
          animation: 'blob-morph 22s ease-in-out infinite reverse'
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

          {/* Left — copy */}
          <div className="lg:col-span-7 flex flex-col justify-center text-left space-y-7">

            {/* Tagline / Badge */}
            <Reveal>
              <div className="inline-flex self-start items-center gap-2 bg-white/5 border border-white/10 text-rose-200 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" style={{ animation: 'molecule-pulse 2s ease-in-out infinite' }} />
                <Sparkles className="w-3.5 h-3.5 text-rose-300" />
                <span>{siteContent.hero.badge[currentLang] || t.heroBadge}</span>
              </div>
            </Reveal>

            {/* Headline — per-word reveal */}
            <h1 className="font-sans text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tighter">
              {managedHeadline ? (
                <span
                  className="bg-clip-text text-transparent inline-block"
                  style={{
                    backgroundImage: 'linear-gradient(120deg, #FFFFFF 0%, #FCA5A5 52%, #22D3EE 100%)',
                    textShadow: '0 0 32px rgba(244,63,94,0.25)'
                  }}
                >
                  <SplitReveal text={headline} />
                </span>
              ) : (
                <>
                  <SplitReveal text={headline} />{' '}
                  <span
                    className="bg-clip-text text-transparent inline-block align-baseline"
                    style={{
                      backgroundImage: 'linear-gradient(120deg, #FCA5A5 0%, #F43F5E 40%, #22D3EE 100%)',
                      textShadow: '0 0 32px rgba(244,63,94,0.35)'
                    }}
                  >
                    <SplitReveal text={highlight} delayBase={0.35} />
                  </span>
                  <span className="block text-white/90 text-3xl sm:text-4xl lg:text-5xl font-extrabold mt-3 tracking-tight">
                    <SplitReveal text={second} delayBase={0.7} />
                  </span>
                </>
              )}
            </h1>

            {/* Subheading */}
            <Reveal delay={0.85}>
              <p className="text-slate-300 text-base sm:text-lg max-w-2xl leading-relaxed font-semibold">
                {siteContent.hero.subheading[currentLang] || t.heroSubheading}
              </p>
            </Reveal>

            {/* Feature grid */}
            <Reveal delay={1.0} stagger={0.08}>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <Reveal as="div">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-rose-500/15 text-rose-300 rounded-lg border border-rose-500/30">
                      <Heart className="w-4 h-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-slate-200">
                      {currentLang === 'en' ? 'Stimulates Nitric Oxide' : '刺激自体生成一氧化氮'}
                    </span>
                  </div>
                </Reveal>
                <Reveal as="div">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-cyan-500/15 text-cyan-300 rounded-lg border border-cyan-500/30">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-slate-200">
                      {currentLang === 'en' ? 'Zero Medication Side-effects' : '100% 纯物理安全无药性'}
                    </span>
                  </div>
                </Reveal>
              </div>
            </Reveal>

            {/* CTAs — 3D tilt on hover */}
            <Reveal delay={1.2}>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-4" style={{ perspective: 1000 }}>
                <motion.button
                  onClick={onExplore}
                  whileHover={reduce ? undefined : { rotateX: -6, rotateY: 4, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                  className="relative group flex items-center justify-center gap-2 px-8 py-4 bg-rose-600 text-white rounded-xl font-bold cursor-pointer overflow-hidden"
                  style={{ boxShadow: '0 14px 40px -10px rgba(225,29,72,0.65), inset 0 0 0 1px rgba(255,255,255,0.15)' }}
                >
                  <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{ background: 'linear-gradient(120deg, rgba(34,211,238,0.35) 0%, transparent 70%)' }} />
                  <span className="relative">{t.heroCtaBuy}</span>
                  <ArrowRight className="relative w-4.5 h-4.5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
                <motion.button
                  onClick={onScience}
                  whileHover={reduce ? undefined : { rotateX: -4, rotateY: -3, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-white/5 border border-white/15 text-white/90 rounded-xl font-bold hover:bg-white/10 backdrop-blur-sm cursor-pointer"
                >
                  <span>{t.heroCtaScience}</span>
                </motion.button>
              </div>
            </Reveal>

            {/* Trust indicators */}
            <Reveal delay={1.35}>
              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/10 max-w-md">
                <Stat value="98%"  label="Absorption Rate" />
                <Stat value="2.4x" label="Vasodilation" />
                <Stat value="ISO"  label="Certified Lab" />
              </div>
            </Reveal>
          </div>

          {/* Right — molecule orbit + live NO panel */}
          <div
            ref={rightRef}
            onMouseMove={handleMove}
            onMouseLeave={handleLeave}
            className="lg:col-span-5 relative flex justify-center items-center min-h-[420px]"
            style={{ perspective: 1200 }}
          >
            {/* Outer glow ring */}
            <div
              className="absolute w-[460px] h-[460px] rounded-full opacity-50 pointer-events-none"
              style={{
                background: 'radial-gradient(closest-side, rgba(225,29,72,0.45), transparent 70%)',
                filter: 'blur(40px)',
                animation: 'molecule-pulse 4s ease-in-out infinite'
              }}
            />

            {/* Orbiting molecules — attracted to pointer */}
            <motion.div style={{ x: fieldX, y: fieldY }} className="absolute">
              <MoleculeField mode="orbit" count={6} size={420} moleculeSize={48} glow="rose" />
            </motion.div>

            {/* Central NO badge */}
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.9, delay: 0.3, ease: EASE }}
              className="relative z-10 flex flex-col items-center justify-center w-44 h-44 rounded-full"
              style={{
                background: 'radial-gradient(closest-side, rgba(225,29,72,0.95), rgba(136,19,55,0.9))',
                boxShadow: '0 0 60px rgba(225,29,72,0.55), inset 0 0 30px rgba(255,255,255,0.12)'
              }}
            >
              <span className="text-[10px] font-mono font-bold tracking-[0.25em] text-rose-100/80">NITRIC OXIDE</span>
              <span className="font-mono text-6xl font-black text-white leading-none mt-1" style={{ textShadow: '0 0 18px rgba(255,255,255,0.4)' }}>
                NO
              </span>
              <span className="text-[10px] font-mono font-bold tracking-[0.25em] text-rose-100/80 mt-1">N≡O · 1998 NOBEL</span>
            </motion.div>

            {/* Live emission gauge — bottom-left card */}
            <motion.div
              initial={{ y: 18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.7, ease: EASE }}
              className="absolute -bottom-2 left-4 sm:left-0 backdrop-blur-md bg-white/8 border border-white/15 rounded-2xl p-3.5 shadow-2xl min-w-[200px]"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400" style={{ animation: 'molecule-pulse 1.6s ease-in-out infinite', boxShadow: '0 0 8px #34d399' }} />
                <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-300 uppercase">LIVE · NO EMISSION</span>
              </div>
              <div className="flex items-end gap-2 mt-2">
                <DataTick base={2.7} jitter={0.18} />
                <span className="text-[11px] font-mono font-bold text-slate-300/80 mb-1">× baseline</span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 mt-1">25 THz · PHOTEX resonance</p>
            </motion.div>

            {/* Tech callout — top-right card */}
            <motion.div
              initial={{ y: -18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.35, duration: 0.7, ease: EASE }}
              className="absolute -top-2 right-2 sm:right-0 backdrop-blur-md bg-white/8 border border-white/15 rounded-2xl p-3 shadow-2xl"
            >
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-cyan-300" />
                <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-300 uppercase">25–43 THz</span>
              </div>
              <p className="text-[10px] font-bold text-slate-300 mt-1">
                {currentLang === 'en' ? 'Bio-resonance Active' : '太赫兹生物共振激活'}
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Bottom flow-stream divider hint */}
      <div className="absolute bottom-0 left-0 right-0 h-px overflow-hidden opacity-70">
        <div className="absolute inset-0 flow-stream-bar" />
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-2xl font-black text-white" style={{ textShadow: '0 0 18px rgba(225,29,72,0.35)' }}>
        {value}
      </div>
      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mt-0.5">{label}</div>
    </div>
  );
}

/**
 * Splits text into words, fades each word up sequentially. CJK is treated as
 * one "word" per character so Chinese also benefits from the staggered reveal.
 */
function SplitReveal({ text, delayBase = 0 }: { text: string; delayBase?: number }) {
  const reduce = useReducedMotion();
  // Split: ASCII words preserved as units; CJK split per-char
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

/**
 * Tiny "live" number that jitters every 1.2s within a band — cosmetic only,
 * gives the gauge a "real telemetry" feel without any network.
 */
function DataTick({ base, jitter }: { base: number; jitter: number }) {
  const v = useMotionValue(base);
  const spring = useSpring(v, { stiffness: 70, damping: 20 });
  const text = useTransform(spring, (n) => n.toFixed(2));

  useEffect(() => {
    const id = window.setInterval(
      () => v.set(base + (Math.random() - 0.5) * 2 * jitter),
      1200
    );
    return () => window.clearInterval(id);
  }, [base, jitter, v]);

  return (
    <motion.span
      className="font-mono text-3xl font-black text-white leading-none"
      style={{ textShadow: '0 0 18px rgba(225,29,72,0.5)' }}
    >
      {text}
    </motion.span>
  );
}
