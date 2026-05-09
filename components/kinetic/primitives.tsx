'use client';

import { useEffect, useRef, useState } from 'react';

/* ─────────────────────────────────────────────
   Animated number ticker
   ───────────────────────────────────────────── */
export function Tick({
  value,
  suffix = '',
  duration = 1200,
  format = (n: number) => n.toLocaleString(),
}: {
  value: number;
  suffix?: string;
  duration?: number;
  format?: (n: number) => string;
}) {
  const [n, setN] = useState(0);

  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return (
    <span>
      {format(n)}
      {suffix}
    </span>
  );
}

/* ─────────────────────────────────────────────
   Conic ring with animated stroke
   ───────────────────────────────────────────── */
export function Ring({
  value,
  max,
  color = '#00D1FF',
  label,
  sub,
  size = 132,
}: {
  value: number;
  max: number;
  color?: string;
  label: string;
  sub?: string;
  size?: number;
}) {
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  const r = (size - 16) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - pct);
  const gradId = `kx-ring-${label.replace(/\s+/g, '-')}-${color.replace('#', '')}`;
  const altColor = color === '#00D1FF' ? '#CCFF00' : '#00D1FF';

  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={color} />
            <stop offset="1" stopColor={altColor} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="6"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{
            transition: 'stroke-dashoffset 1.4s cubic-bezier(.2,.7,.2,1)',
            filter: `drop-shadow(0 0 6px ${color})`,
          }}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r - 12}
          fill="none"
          stroke={color}
          strokeWidth="0.5"
          opacity="0.2"
          strokeDasharray="2 4"
        />
      </svg>
      <div className="ring__center">
        <div className="ring__val" style={{ color }}>
          <Tick value={Math.round(value)} />
        </div>
        <div className="ring__lbl">{label}</div>
        {sub ? <div className="ring__sub">{sub}</div> : null}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Live audio-style waveform
   ───────────────────────────────────────────── */
export function Waveform({
  color = '#00D1FF',
  height = 50,
}: {
  color?: string;
  height?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0;
    let t = 0;

    const resize = () => {
      c.width = c.clientWidth * dpr;
      c.height = c.clientHeight * dpr;
    };
    resize();
    window.addEventListener('resize', resize);

    const data = Array.from({ length: 80 }, () => Math.random());

    const draw = () => {
      const w = c.width;
      const h = c.height;
      ctx.clearRect(0, 0, w, h);
      data.shift();
      data.push(0.3 + Math.abs(Math.sin(t * 0.06) + Math.sin(t * 0.13)) * 0.4 + Math.random() * 0.2);

      const barW = w / data.length;
      data.forEach((v, i) => {
        const bh = v * h * 0.9;
        const grad = ctx.createLinearGradient(0, h - bh, 0, h);
        grad.addColorStop(0, color);
        grad.addColorStop(1, color + '22');
        ctx.fillStyle = grad;
        ctx.fillRect(i * barW + 1, h - bh, Math.max(1, barW - 2), bh);
      });
      t++;
      if (!reduce) raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [color]);

  return <canvas ref={ref} style={{ width: '100%', height, display: 'block' }} />;
}

/* ─────────────────────────────────────────────
   Mini sparkline
   ───────────────────────────────────────────── */
export function MiniSpark({
  data,
  color = '#00D1FF',
  height = 30,
}: {
  data: number[];
  color?: string;
  height?: number;
}) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const w = 100;
  const h = 30;
  const pts = data.map((d, i) => `${(i / Math.max(1, data.length - 1)) * w},${h - (d / max) * h}`).join(' ');
  const id = `kx-spark-${color.replace('#', '')}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mini-spark" style={{ height }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.4" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline fill="none" stroke={color} strokeWidth="1.4" points={pts} />
      <polygon fill={`url(#${id})`} points={`0,${h} ${pts} ${w},${h}`} />
    </svg>
  );
}

/* ─────────────────────────────────────────────
   Live UTC clock readout for status bars
   ───────────────────────────────────────────── */
export function LiveClock() {
  const [t, setT] = useState<Date | null>(null);
  useEffect(() => {
    setT(new Date());
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!t) return <span suppressHydrationWarning>— —:— —</span>;
  const hh = String(t.getHours()).padStart(2, '0');
  const mm = String(t.getMinutes()).padStart(2, '0');
  const ss = String(t.getSeconds()).padStart(2, '0');
  return (
    <span suppressHydrationWarning>
      {hh}:{mm}
      <span style={{ opacity: 0.5 }}>:{ss}</span>
    </span>
  );
}
