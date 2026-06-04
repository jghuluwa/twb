import { useMemo } from 'react';
import { motion } from 'motion/react';
import Molecule from './Molecule';

type Mode = 'orbit' | 'flow' | 'aggregate' | 'scatter';

interface MoleculeFieldProps {
  mode?: Mode;
  /** How many molecules to render (clamped 0..12) */
  count?: number;
  /** Container size in px (square). The field positions absolutely inside. */
  size?: number;
  /** Per-molecule base size in px */
  moleculeSize?: number;
  /** Accent glow tint */
  glow?: 'rose' | 'cyan' | 'violet' | 'none';
  /** Make the surrounding box dimmer (background variant) */
  dim?: boolean;
  className?: string;
}

/**
 * A choreographed group of NO molecules.
 *
 *  - orbit:     molecules revolve on staggered radii around the centre
 *  - flow:      molecules sink/rise vertically; count controls density
 *  - aggregate: molecules drift toward the centre and pulse
 *  - scatter:   molecules drift outward on independent paths
 *
 * All motion is GPU-only (transform/opacity). Respects prefers-reduced-motion
 * via the global CSS guard in index.css.
 */
export default function MoleculeField({
  mode = 'orbit',
  count = 5,
  size = 360,
  moleculeSize = 56,
  glow = 'rose',
  dim = false,
  className = ''
}: MoleculeFieldProps) {
  const n = Math.max(0, Math.min(12, Math.floor(count)));

  // Stable per-instance offsets so re-renders don't reshuffle
  const seeds = useMemo(
    () => Array.from({ length: n }, (_, i) => ({
      seed: i,
      angle: (360 / Math.max(n, 1)) * i,
      radius: 0.30 + (i % 3) * 0.10,       // 0.30, 0.40, 0.50 of half-size
      duration: 9 + (i % 4) * 2.5,         // 9–16.5s
      reverse: i % 2 === 0,
      delay: i * 0.4,
      jitterX: ((i * 37) % 60) - 30,
      jitterY: ((i * 53) % 60) - 30
    })),
    [n]
  );

  return (
    <div
      className={`relative ${className}`}
      style={{
        width:  `${size}px`,
        height: `${size}px`,
        opacity: dim ? 0.55 : 1,
        pointerEvents: 'none'
      }}
    >
      {seeds.map((s) => {
        const half = size / 2;
        const orbitRadius = half * s.radius;

        if (mode === 'orbit') {
          return (
            <div
              key={s.seed}
              className="absolute top-1/2 left-1/2"
              style={{
                width: 0, height: 0,
                animation: `${s.reverse ? 'molecule-orbit-rev' : 'molecule-orbit'} ${s.duration}s linear infinite`,
                animationDelay: `${s.delay}s`,
                ['--orbit-radius' as string]: `${orbitRadius}px`
              }}
            >
              <div style={{ transform: `translate(-50%, -50%)` }}>
                <Molecule size={moleculeSize} glow={glow} animation="pulse" />
              </div>
            </div>
          );
        }

        if (mode === 'aggregate') {
          // Molecules float from random outer positions toward the centre on loop
          const startX = s.jitterX * 4;
          const startY = s.jitterY * 4;
          return (
            <motion.div
              key={s.seed}
              className="absolute top-1/2 left-1/2"
              initial={{ x: startX, y: startY, opacity: 0, scale: 0.6 }}
              animate={{
                x:       [startX, 0,    startX],
                y:       [startY, 0,    startY],
                opacity: [0,      0.95, 0],
                scale:   [0.6,    1.08, 0.6]
              }}
              transition={{
                duration: s.duration,
                delay: s.delay,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              style={{ translateX: '-50%', translateY: '-50%' }}
            >
              <Molecule size={moleculeSize} glow={glow} />
            </motion.div>
          );
        }

        if (mode === 'flow') {
          // Vertical sinking/rising stream — handy for the NO-deficit visual
          return (
            <motion.div
              key={s.seed}
              className="absolute left-1/2"
              initial={{ y: -size * 0.55, opacity: 0 }}
              animate={{
                y:       [-size * 0.55, size * 0.55],
                opacity: [0, 1, 1, 0]
              }}
              transition={{
                duration: s.duration * 0.9,
                delay: s.delay,
                repeat: Infinity,
                ease: 'linear'
              }}
              style={{
                translateX: '-50%',
                left: `${30 + ((s.seed * 13) % 40)}%`
              }}
            >
              <Molecule size={moleculeSize} glow={glow} rotate={s.seed * 28} />
            </motion.div>
          );
        }

        // scatter — slow random drift, independent
        return (
          <motion.div
            key={s.seed}
            className="absolute top-1/2 left-1/2"
            animate={{
              x: [s.jitterX, -s.jitterX, s.jitterX],
              y: [s.jitterY, -s.jitterY, s.jitterY],
              rotate: [0, 360]
            }}
            transition={{
              duration: s.duration * 1.5,
              delay: s.delay,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            style={{ translateX: '-50%', translateY: '-50%' }}
          >
            <Molecule size={moleculeSize} glow={glow} animation="float" />
          </motion.div>
        );
      })}
    </div>
  );
}
