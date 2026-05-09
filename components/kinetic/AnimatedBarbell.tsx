'use client';

import { useMemo } from 'react';

type AnimatedBarbellProps = {
  width?: number;
  plates?: number;
  accent?: string;
};

const PLATE_SIZES = [60, 52, 44, 36, 30, 26];

export default function AnimatedBarbell({
  width = 720,
  plates = 4,
  accent = '#00D1FF',
}: AnimatedBarbellProps) {
  const plateRadii = useMemo(
    () => PLATE_SIZES.slice(0, Math.max(1, Math.min(plates, PLATE_SIZES.length))),
    [plates]
  );
  const id = accent.replace('#', '');

  return (
    <svg
      viewBox="0 0 800 200"
      width={width}
      style={{ display: 'block', filter: `drop-shadow(0 0 40px ${accent}55)`, maxWidth: '100%' }}
    >
      <defs>
        <linearGradient id={`kx-bb-bar-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#dfe9ef" />
          <stop offset="0.5" stopColor="#5a6670" />
          <stop offset="1" stopColor="#1d2026" />
        </linearGradient>
        <linearGradient id={`kx-bb-plate-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3d4148" />
          <stop offset="0.5" stopColor="#1a1c20" />
          <stop offset="1" stopColor="#0a0a0c" />
        </linearGradient>
        <radialGradient id={`kx-bb-glow-${id}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={accent} stopOpacity="0.6" />
          <stop offset="1" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="400" cy="100" rx="380" ry="40" fill={`url(#kx-bb-glow-${id})`} opacity="0.7" />

      <rect x="20" y="92" width="60" height="16" rx="2" fill={`url(#kx-bb-bar-${id})`} />
      <rect x="720" y="92" width="60" height="16" rx="2" fill={`url(#kx-bb-bar-${id})`} />
      <rect x="80" y="96" width="640" height="8" rx="2" fill={`url(#kx-bb-bar-${id})`} />

      {[120, 580].map((x, i) => (
        <g key={i}>
          {Array.from({ length: 20 }).map((_, j) => (
            <rect key={j} x={x + j * 5} y="97" width="1" height="6" fill="#0a0a0a" />
          ))}
        </g>
      ))}

      <rect x="82" y="99.5" width="636" height="1" fill={accent} opacity="0.8">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="1.4s" repeatCount="indefinite" />
      </rect>

      {plateRadii.map((r, i) => {
        const x = 78 - i * 14;
        return (
          <g key={`L${i}`}>
            <ellipse
              cx={x}
              cy="100"
              rx="6"
              ry={r}
              fill={`url(#kx-bb-plate-${id})`}
              stroke={accent}
              strokeWidth="1.2"
              opacity="0.95"
            >
              <animate attributeName="ry" from="0" to={r} dur="0.6s" begin={`${i * 0.08}s`} fill="freeze" />
            </ellipse>
            <ellipse cx={x} cy="100" rx="5" ry={r * 0.85} fill="none" stroke={accent} strokeWidth="0.6" opacity="0.4" />
          </g>
        );
      })}

      {plateRadii.map((r, i) => {
        const x = 722 + i * 14;
        return (
          <g key={`R${i}`}>
            <ellipse
              cx={x}
              cy="100"
              rx="6"
              ry={r}
              fill={`url(#kx-bb-plate-${id})`}
              stroke={accent}
              strokeWidth="1.2"
              opacity="0.95"
            >
              <animate attributeName="ry" from="0" to={r} dur="0.6s" begin={`${i * 0.08}s`} fill="freeze" />
            </ellipse>
            <ellipse cx={x} cy="100" rx="5" ry={r * 0.85} fill="none" stroke={accent} strokeWidth="0.6" opacity="0.4" />
          </g>
        );
      })}

      <circle r="2.5" fill="#CCFF00">
        <animate attributeName="cx" values="100;700;100" dur="3s" repeatCount="indefinite" />
        <animate attributeName="cy" values="100;100;100" dur="3s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;1;0" dur="3s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}
