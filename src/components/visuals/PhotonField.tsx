import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';

interface PhotonFieldProps {
  className?: string;
  /** Wave / emission origin in normalized [0..1] coords of the canvas box */
  originX?: number;
  originY?: number;
}

/**
 * Photon field — the signature hero effect.
 *
 *  - A drift of blue "light points" that float ambiently, and
 *  - Gather + orbit toward the pointer (聚合), then disperse when it leaves (离散).
 *  - Concentric "waves" pulse outward from the PHOTEX fold, extending the blue
 *    arcs baked into the fabric photo.
 *
 * Everything is drawn additively on one canvas (cheap, glows nicely) and the
 * element is set to mix-blend:screen by the parent so it layers over the photo.
 * Respects prefers-reduced-motion (renders a single calm frame, no loop).
 */
export default function PhotonField({ className, originX = 0.6, originY = 0.42 }: PhotonFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;

    // Pointer in canvas-local CSS px. active=false → particles disperse.
    const pointer = { x: -9999, y: -9999, px: -9999, py: -9999, active: false };

    type Particle = {
      x: number; y: number; vx: number; vy: number;
      baseR: number; tw: number; twSpeed: number; hue: number; drift: number;
    };
    let particles: Particle[] = [];

    type Ring = { age: number };
    let rings: Ring[] = [];
    let ringTimer = 1200; // emit first ring shortly after mount

    // Pre-rendered glow sprite — drawImage is far cheaper than per-particle gradients.
    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 64;
    const sctx = sprite.getContext('2d')!;
    const grad = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(225,243,255,1)');
    grad.addColorStop(0.22, 'rgba(120,200,255,0.85)');
    grad.addColorStop(0.55, 'rgba(56,140,255,0.35)');
    grad.addColorStop(1, 'rgba(40,120,255,0)');
    sctx.fillStyle = grad;
    sctx.beginPath();
    sctx.arc(32, 32, 32, 0, Math.PI * 2);
    sctx.fill();

    function spawn(seedNearOrigin = false): Particle {
      let x: number;
      let y: number;
      if (seedNearOrigin) {
        const a = Math.random() * Math.PI * 2;
        const d = Math.random() * Math.min(width, height) * 0.4;
        x = originX * width + Math.cos(a) * d;
        y = originY * height + Math.sin(a) * d;
      } else {
        x = Math.random() * width;
        y = Math.random() * height;
      }
      return {
        x, y,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        baseR: 0.6 + Math.random() * 1.9,
        tw: Math.random() * Math.PI * 2,
        twSpeed: 0.6 + Math.random() * 1.6,
        hue: 198 + Math.random() * 34,
        drift: 0.2 + Math.random() * 0.5
      };
    }

    function initParticles() {
      const target = Math.round(Math.min(120, Math.max(40, (width * height) / 13000)));
      particles = Array.from({ length: target }, (_, i) => spawn(i % 2 === 0));
    }

    function resize() {
      const rect = parent!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas!.width = Math.floor(width * dpr);
      canvas!.height = Math.floor(height * dpr);
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      initParticles();
    }

    function drawScene(animate: boolean, dt: number, time: number) {
      const ox = originX * width;
      const oy = originY * height;

      ctx!.clearRect(0, 0, width, height);
      ctx!.globalCompositeOperation = 'lighter';

      // ── Emitted waves ──
      if (animate) {
        ringTimer += dt;
        if (ringTimer > 1700) { ringTimer = 0; rings.push({ age: 0 }); }
        for (const r of rings) r.age += dt;
        rings = rings.filter((r) => r.age < 4400);
      } else if (rings.length === 0) {
        rings = [{ age: 1400 }, { age: 2900 }];
      }
      const maxRadius = Math.hypot(width, height) * 0.62;
      ctx!.lineWidth = 1.4;
      ctx!.shadowColor = 'rgba(90,170,255,0.9)';
      ctx!.shadowBlur = 14;
      for (const r of rings) {
        const p = r.age / 4400;
        const radius = 26 + p * maxRadius;
        const alpha = Math.sin(Math.min(p, 1) * Math.PI) * 0.26;
        if (alpha <= 0.002) continue;
        ctx!.beginPath();
        // Arc faces up + left, mirroring the photo's radiating waves.
        ctx!.arc(ox, oy, radius, Math.PI * 0.52, Math.PI * 1.92);
        ctx!.strokeStyle = `rgba(140,200,255,${alpha})`;
        ctx!.stroke();
      }
      ctx!.shadowBlur = 0;

      // ── Photon particles ──
      const R = 250;          // pointer influence radius
      const R2 = R * R;
      for (const pt of particles) {
        if (animate) {
          // Ambient meander
          pt.vx += Math.cos(time * 0.0004 * pt.twSpeed + pt.tw) * 0.006 * pt.drift;
          pt.vy += Math.sin(time * 0.0005 * pt.twSpeed + pt.tw * 1.3) * 0.006 * pt.drift;

          if (pointer.active) {
            const dx = pointer.x - pt.x;
            const dy = pointer.y - pt.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < R2) {
              const d = Math.sqrt(d2) || 1;
              const f = (1 - d / R);
              if (d > 46) {
                // Pull toward cursor (aggregate)
                pt.vx += (dx / d) * f * 0.55;
                pt.vy += (dy / d) * f * 0.55;
              } else {
                // Soft core — orbit instead of collapsing to a dot
                pt.vx -= (dx / d) * 0.18;
                pt.vy -= (dy / d) * 0.18;
              }
              // Tangential swirl → the cluster rotates, feels alive
              pt.vx += (-dy / d) * f * 0.28;
              pt.vy += (dx / d) * f * 0.28;
              pt.vx *= 0.9;
              pt.vy *= 0.9;
            } else {
              pt.vx *= 0.97; pt.vy *= 0.97;
            }
          } else {
            // Disperse — ease back to gentle drift
            pt.vx *= 0.985; pt.vy *= 0.985;
          }

          // Clamp speed so nothing rockets across the screen
          const sp = Math.hypot(pt.vx, pt.vy);
          const max = 3.4;
          if (sp > max) { pt.vx = (pt.vx / sp) * max; pt.vy = (pt.vy / sp) * max; }

          pt.x += pt.vx;
          pt.y += pt.vy;
          pt.tw += 0.02 * pt.twSpeed;

          // Wrap around edges for an endless field
          const m = 40;
          if (pt.x < -m) pt.x = width + m; else if (pt.x > width + m) pt.x = -m;
          if (pt.y < -m) pt.y = height + m; else if (pt.y > height + m) pt.y = -m;
        }

        // Brighten + enlarge particles that have gathered near the cursor
        let boost = 1;
        if (pointer.active) {
          const d2 = (pointer.x - pt.x) ** 2 + (pointer.y - pt.y) ** 2;
          if (d2 < R2) boost = 1 + (1 - Math.sqrt(d2) / R) * 1.6;
        }
        const twinkle = 0.45 + 0.55 * Math.sin(pt.tw);
        const size = pt.baseR * 6 * boost;
        ctx!.globalAlpha = Math.min(1, twinkle * 0.5 * boost);
        ctx!.drawImage(sprite, pt.x - size / 2, pt.y - size / 2, size, size);
      }

      ctx!.globalAlpha = 1;
      ctx!.globalCompositeOperation = 'source-over';
    }

    resize();

    let ro: ResizeObserver | null = null;
    if ('ResizeObserver' in window) {
      ro = new ResizeObserver(() => resize());
      ro.observe(parent);
    }

    const toLocal = (clientX: number, clientY: number) => {
      const rect = canvas!.getBoundingClientRect();
      pointer.x = clientX - rect.left;
      pointer.y = clientY - rect.top;
      pointer.active = true;
    };
    const onMouseMove = (e: MouseEvent) => toLocal(e.clientX, e.clientY);
    const onLeave = () => { pointer.active = false; };
    const onTouch = (e: TouchEvent) => {
      if (e.touches[0]) toLocal(e.touches[0].clientX, e.touches[0].clientY);
    };

    if (reduce) {
      drawScene(false, 0, 0);
      return () => { ro?.disconnect(); };
    }

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('touchmove', onTouch, { passive: true });
    parent.addEventListener('mouseleave', onLeave);
    window.addEventListener('touchend', onLeave, { passive: true });

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(48, now - last);
      last = now;
      if (!document.hidden) drawScene(true, dt, now);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouch);
      parent.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('touchend', onLeave);
    };
  }, [reduce, originX, originY]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
