'use client';

import { useEffect, useRef } from 'react';

type AnimatedDumbbellProps = {
  size?: number;
  speed?: number;
  glow?: boolean;
  className?: string;
};

export default function AnimatedDumbbell({
  size = 360,
  speed = 1,
  glow = true,
  className,
}: AnimatedDumbbellProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    const tick = () => {
      const t = ((performance.now() - t0) / 1000) * speed;
      if (ref.current) {
        const rotY = Math.sin(t * 0.6) * 18;
        const rotX = Math.cos(t * 0.4) * 8;
        const float = Math.sin(t * 1.2) * 6;
        ref.current.style.transform = `translateY(${float}px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [speed]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        width: size,
        height: size,
        transformStyle: 'preserve-3d',
        perspective: 1200,
        filter: glow
          ? 'drop-shadow(0 0 60px rgba(0,209,255,0.45)) drop-shadow(0 0 20px rgba(0,209,255,0.6))'
          : 'none',
      }}
    >
      <svg viewBox="0 0 400 400" width={size} height={size}>
        <defs>
          <linearGradient id="kx-ad-metal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#dfe9ef" />
            <stop offset="0.45" stopColor="#8a96a0" />
            <stop offset="0.55" stopColor="#5a6670" />
            <stop offset="1" stopColor="#1d2026" />
          </linearGradient>
          <linearGradient id="kx-ad-cap" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#0e0e0f" />
            <stop offset="0.45" stopColor="#3d4148" />
            <stop offset="0.55" stopColor="#cfd6dc" />
            <stop offset="1" stopColor="#5a6670" />
          </linearGradient>
          <linearGradient id="kx-ad-cyan" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#00D1FF" stopOpacity="0" />
            <stop offset="0.5" stopColor="#00D1FF" />
            <stop offset="1" stopColor="#00D1FF" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="kx-ad-glow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#00D1FF" stopOpacity="0.8" />
            <stop offset="0.7" stopColor="#00D1FF" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx="80" cy="200" r="100" fill="url(#kx-ad-glow)" opacity="0.6">
          <animate attributeName="opacity" values="0.4;0.9;0.4" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="320" cy="200" r="100" fill="url(#kx-ad-glow)" opacity="0.6">
          <animate attributeName="opacity" values="0.9;0.4;0.9" dur="3s" repeatCount="indefinite" />
        </circle>

        <rect x="100" y="195" width="200" height="14" rx="3" fill="#000" opacity="0.5" />
        <rect x="100" y="190" width="200" height="20" rx="4" fill="url(#kx-ad-metal)" stroke="#0e0e0f" strokeWidth="1" />
        {Array.from({ length: 20 }).map((_, i) => (
          <rect key={i} x={110 + i * 9} y="193" width="1.5" height="14" fill="#0e0e0f" opacity="0.6" />
        ))}
        <rect x="105" y="198" width="190" height="3" fill="url(#kx-ad-cyan)" opacity="0.9">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="1.6s" repeatCount="indefinite" />
        </rect>

        <ellipse cx="78" cy="200" rx="22" ry="78" fill="url(#kx-ad-cap)" stroke="#0e0e0f" strokeWidth="1.5" />
        <ellipse cx="62" cy="200" rx="14" ry="92" fill="#1d2026" stroke="#0a0a0a" strokeWidth="1.5" />
        <ellipse cx="55" cy="200" rx="10" ry="92" fill="url(#kx-ad-cap)" stroke="#0e0e0f" strokeWidth="1" />
        <ellipse cx="62" cy="200" rx="14" ry="92" fill="none" stroke="#00D1FF" strokeWidth="1.5" opacity="0.8" />
        <ellipse cx="62" cy="200" rx="9" ry="76" fill="none" stroke="#00D1FF" strokeWidth="0.8" opacity="0.5" />

        <ellipse cx="322" cy="200" rx="22" ry="78" fill="url(#kx-ad-cap)" stroke="#0e0e0f" strokeWidth="1.5" />
        <ellipse cx="338" cy="200" rx="14" ry="92" fill="#1d2026" stroke="#0a0a0a" strokeWidth="1.5" />
        <ellipse cx="345" cy="200" rx="10" ry="92" fill="url(#kx-ad-cap)" stroke="#0e0e0f" strokeWidth="1" />
        <ellipse cx="338" cy="200" rx="14" ry="92" fill="none" stroke="#00D1FF" strokeWidth="1.5" opacity="0.8" />
        <ellipse cx="338" cy="200" rx="9" ry="76" fill="none" stroke="#00D1FF" strokeWidth="0.8" opacity="0.5" />

        <circle r="3" fill="#CCFF00">
          <animate attributeName="cx" values="105;295;105" dur="2.4s" repeatCount="indefinite" />
          <animate attributeName="cy" values="200;200;200" dur="2.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;1;0" dur="2.4s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
}
