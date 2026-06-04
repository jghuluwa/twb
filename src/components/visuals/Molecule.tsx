import { CSSProperties } from 'react';

interface MoleculeProps {
  /** Width in px; height is auto (~2/3 of width) */
  size?: number;
  /** Pulse / orbit / float / none */
  animation?: 'none' | 'pulse' | 'float' | 'flicker';
  /** Accent tint of the halo */
  glow?: 'rose' | 'cyan' | 'violet' | 'none';
  /** Rotation of the whole molecule (deg) */
  rotate?: number;
  /** Extra opacity */
  opacity?: number;
  className?: string;
  style?: CSSProperties;
}

const GLOW: Record<NonNullable<MoleculeProps['glow']>, string> = {
  rose:   'drop-shadow(0 0 14px rgba(225, 29, 72, 0.55))',
  cyan:   'drop-shadow(0 0 14px rgba(34, 211, 238, 0.55))',
  violet: 'drop-shadow(0 0 14px rgba(167, 139, 250, 0.55))',
  none:   'none'
};

const ANIM: Record<NonNullable<MoleculeProps['animation']>, string> = {
  none:    '',
  pulse:   'molecule-pulse 2.6s ease-in-out infinite',
  float:   'float-y 5s ease-in-out infinite',
  flicker: 'neon-flicker 5s linear infinite'
};

/**
 * NO molecule — nitrogen (cyan/blue sphere) + double bond + oxygen (rose sphere).
 * Uses shared <defs> from <GlowFilter /> so callers don't duplicate gradients.
 */
export default function Molecule({
  size = 80,
  animation = 'none',
  glow = 'rose',
  rotate = 0,
  opacity = 1,
  className = '',
  style
}: MoleculeProps) {
  const height = (size * 2) / 3;
  return (
    <div
      className={className}
      style={{
        width:  `${size}px`,
        height: `${height}px`,
        opacity,
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
        filter: GLOW[glow],
        animation: ANIM[animation],
        willChange: 'transform, opacity, filter',
        ...style
      }}
    >
      <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Covalent double bond — two stacked tubes */}
        <g>
          <rect x="34" y="32" width="52" height="6" rx="2" fill="url(#tb-bond)" />
          <rect x="34" y="42" width="52" height="6" rx="2" fill="url(#tb-bond)" />
        </g>

        {/* Nitrogen (left) */}
        <circle cx="32" cy="40" r="22" fill="url(#tb-nitrogen)" />
        <circle cx="32" cy="40" r="22" stroke="#FFF" strokeWidth="1" strokeOpacity="0.25" />
        <circle cx="24" cy="32" r="5" fill="#FFF" opacity="0.5" />
        <ellipse cx="27" cy="28" rx="8" ry="4" fill="#FFF" opacity="0.3" transform="rotate(-30 27 28)" />

        {/* Oxygen (right) */}
        <circle cx="88" cy="40" r="22" fill="url(#tb-oxygen)" />
        <circle cx="88" cy="40" r="22" stroke="#FFF" strokeWidth="1" strokeOpacity="0.25" />
        <circle cx="80" cy="32" r="5" fill="#FFF" opacity="0.5" />
        <ellipse cx="83" cy="28" rx="8" ry="4" fill="#FFF" opacity="0.3" transform="rotate(-30 83 28)" />
      </svg>
    </div>
  );
}
