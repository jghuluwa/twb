import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';
import Molecule from './visuals/Molecule';

/**
 * Site-wide ambient layer:
 *  - Three slow-morphing SVG waves (gradient: rose → amber → sky)
 *  - 6 free-floating NO molecules that drift, AND
 *  - Lean gently toward the pointer (parallax-with-attraction)
 *  - Wave amplitude pulses subtly with scroll position
 *
 * Pointer-events: none so the rest of the page is unaffected.
 */
export default function WaveBackground() {
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [pointer, setPointer] = useState({ x: 0.5, y: 0.5 });
  const reduce = useReducedMotion();

  // Wave amplitude tied to scroll progress
  const { scrollYProgress } = useScroll();
  const waveAmp = useTransform(scrollYProgress, [0, 1], [1, 1.25]);

  useEffect(() => {
    setMounted(true);
    if (reduce) return;

    // Throttle to ~30Hz — enough to feel alive, cheap on CPU
    let raf = 0;
    let pending = false;
    const onMove = (e: MouseEvent) => {
      if (pending) return;
      pending = true;
      raf = requestAnimationFrame(() => {
        pending = false;
        setPointer({
          x: e.clientX / window.innerWidth,
          y: e.clientY / window.innerHeight
        });
      });
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
    };
  }, [reduce]);

  if (!mounted) return null;

  const molecules = [
    { id: 1, size: 90,  top: '15%', left: '8%',  delay: '0s',   duration: '28s', speedX: 0.15,  speedY: -0.05, lean: 16 },
    { id: 2, size: 75,  top: '45%', left: '88%', delay: '3s',   duration: '34s', speedX: -0.10, speedY: 0.08,  lean: 22 },
    { id: 3, size: 110, top: '75%', left: '12%', delay: '1.5s', duration: '40s', speedX: 0.08,  speedY: -0.12, lean: 14 },
    { id: 4, size: 80,  top: '30%', left: '78%', delay: '5s',   duration: '30s', speedX: -0.15, speedY: -0.05, lean: 20 },
    { id: 5, size: 95,  top: '60%', left: '25%', delay: '2s',   duration: '36s', speedX: 0.12,  speedY: 0.10,  lean: 18 },
    { id: 6, size: 100, top: '85%', left: '70%', delay: '4s',   duration: '32s', speedX: -0.08, speedY: -0.14, lean: 24 }
  ];

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {/* Waves */}
      <motion.div className="absolute inset-0 opacity-[0.08] sm:opacity-[0.12]" style={{ scale: waveAmp }}>
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <defs>
            <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22D3EE" />
              <stop offset="50%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#0EA5E9" />
            </linearGradient>
          </defs>

          <path d="M-100,200 Q150,120 400,200 T900,200 T1400,200 T1900,200 L1900,1200 L-100,1200 Z" fill="url(#waveGrad)">
            <animate attributeName="d" dur="25s" repeatCount="indefinite" values="
              M-100,200 Q150,120 400,200 T900,200 T1400,200 T1900,200 L1900,1200 L-100,1200 Z;
              M-100,220 Q150,180 400,160 T900,240 T1400,180 T1900,220 L1900,1200 L-100,1200 Z;
              M-100,200 Q150,120 400,200 T900,200 T1400,200 T1900,200 L1900,1200 L-100,1200 Z
            " />
          </path>

          <path d="M-100,280 Q200,320 500,240 T1100,280 T1700,240 T2300,280 L2300,1200 L-100,1200 Z" fill="url(#waveGrad)" opacity="0.6">
            <animate attributeName="d" dur="20s" repeatCount="indefinite" values="
              M-100,280 Q200,320 500,240 T1100,280 T1700,240 T2300,280 L2300,1200 L-100,1200 Z;
              M-100,260 Q200,240 500,280 T1100,240 T1700,280 T2300,260 L2300,1200 L-100,1200 Z;
              M-100,280 Q200,320 500,240 T1100,280 T1700,240 T2300,280 L2300,1200 L-100,1200 Z
            " />
          </path>

          <path d="M-50,80 Q250,130 550,60 T1150,120 T1750,60 L1750,1200 L-50,1200 Z" fill="none" stroke="url(#waveGrad)" strokeWidth="3" strokeDasharray="15 10" opacity="0.3">
            <animate attributeName="d" dur="18s" repeatCount="indefinite" values="
              M-50,80 Q250,130 550,60 T1150,120 T1750,60 L1750,1200 L-50,1200 Z;
              M-50,105 Q250,80 550,110 T1150,70 T1750,110 L1750,1200 L-50,1200 Z;
              M-50,80 Q250,130 550,60 T1150,120 T1750,60 L1750,1200 L-50,1200 Z
            " />
          </path>
        </svg>
      </motion.div>

      {/* Drifting NO molecules — react to pointer with a tiny lean */}
      {molecules.map((m) => {
        const leanX = (pointer.x - 0.5) * m.lean;
        const leanY = (pointer.y - 0.5) * m.lean;
        return (
          <div
            key={m.id}
            className="absolute"
            style={{
              top: m.top,
              left: m.left,
              width: `${m.size}px`,
              height: `${m.size / 1.5}px`,
              animation: `float-bg-${m.id} ${m.duration} infinite linear`,
              animationDelay: m.delay,
              opacity: 0.28,
              transform: `translate3d(${leanX}px, ${leanY}px, 0)`,
              transition: 'transform 800ms cubic-bezier(0.22, 1, 0.36, 1)'
            }}
          >
            <Molecule size={m.size} glow="cyan" opacity={0.9} />
          </div>
        );
      })}

      {/* Pre-computed translate paths per molecule */}
      <style>{`
        ${molecules.map(m => `
          @keyframes float-bg-${m.id} {
            0%   { translate: 0 0; }
            25%  { translate: ${m.speedX * 220}px ${m.speedY * 260}px; }
            50%  { translate: ${m.speedX * 450}px ${m.speedY * -100}px; }
            75%  { translate: ${m.speedX * 180}px ${m.speedY * 340}px; }
            100% { translate: 0 0; }
          }
        `).join('\n')}
      `}</style>
    </div>
  );
}
