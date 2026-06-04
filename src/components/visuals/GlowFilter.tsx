/**
 * Shared SVG <defs> library — mount once at the top of the app.
 * Reference these filters/gradients elsewhere with filter="url(#tb-neon)" etc.
 *
 * The host <svg> is absolutely positioned & invisible; defs are valid even when
 * the parent svg has zero size.
 */
export default function GlowFilter() {
  return (
    <svg
      aria-hidden
      width="0"
      height="0"
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
    >
      <defs>
        {/* Neon bloom — soft halo around a shape */}
        <filter id="tb-neon" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Heavier bloom — for accent dots / data viz */}
        <filter id="tb-bloom" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="7" result="blur" />
          <feColorMatrix in="blur" type="matrix" values="
            1 0 0 0 0
            0 1 0 0 0
            0 0 1 0 0
            0 0 0 1.3 0
          " result="boosted" />
          <feMerge>
            <feMergeNode in="boosted" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Tint to rose — colour-shift a monochrome icon */}
        <filter id="tb-tint-rose">
          <feColorMatrix type="matrix" values="
            0.93 0    0    0 0
            0.11 0.18 0.28 0 0
            0.28 0.18 0.28 0 0
            0    0    0    1 0
          " />
          <feGaussianBlur stdDeviation="0.4" />
        </filter>

        {/* Tint to cyan */}
        <filter id="tb-tint-cyan">
          <feColorMatrix type="matrix" values="
            0.13 0.18 0.28 0 0
            0.82 0.93 1.00 0 0
            0.93 1.00 1.00 0 0
            0    0    0    1 0
          " />
          <feGaussianBlur stdDeviation="0.4" />
        </filter>

        {/* Shared radial gradients (atom-style) */}
        <radialGradient id="tb-nitrogen" cx="30%" cy="30%" r="70%">
          <stop offset="0%"  stopColor="#7DD3FC" />
          <stop offset="35%" stopColor="#0EA5E9" />
          <stop offset="75%" stopColor="#0284C7" />
          <stop offset="100%" stopColor="#0C4A6E" />
        </radialGradient>

        <radialGradient id="tb-oxygen" cx="30%" cy="30%" r="70%">
          <stop offset="0%"  stopColor="#FDA4AF" />
          <stop offset="35%" stopColor="#F43F5E" />
          <stop offset="75%" stopColor="#E11D48" />
          <stop offset="100%" stopColor="#881337" />
        </radialGradient>

        <linearGradient id="tb-bond" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#334155" />
          <stop offset="25%"  stopColor="#F8FAFC" />
          <stop offset="50%"  stopColor="#E2E8F0" />
          <stop offset="75%"  stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#1E293B" />
        </linearGradient>

        {/* Flow-stream gradient used inline as <rect fill> */}
        <linearGradient id="tb-flow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#22D3EE" stopOpacity="0" />
          <stop offset="35%"  stopColor="#22D3EE" stopOpacity="0.9" />
          <stop offset="50%"  stopColor="#E11D48" stopOpacity="1" />
          <stop offset="65%"  stopColor="#A78BFA" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#A78BFA" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}
