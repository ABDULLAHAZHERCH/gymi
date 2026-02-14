'use client';

import { WeightLog } from '@/lib/types/firestore';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { useState, useRef } from 'react';

interface WeightChartProps {
  data: WeightLog[];
  targetWeight?: number;
}

export function WeightChart({ data, targetWeight }: WeightChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const chartRef = useRef<SVGSVGElement>(null);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-center">
        <p className="text-sm text-[color:var(--muted-foreground)]">
          No weight data available. Start logging your weight!
        </p>
      </div>
    );
  }

  // Sort by date ascending
  const sortedData = [...data].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const weights = sortedData.map((d) => d.weight);
  const allValues = [...weights];
  if (targetWeight) allValues.push(targetWeight);

  const dataMax = Math.max(...allValues);
  const dataMin = Math.min(...allValues);
  const padding = (dataMax - dataMin) * 0.2 || 2;
  const maxWeight = dataMax + padding;
  const minWeight = Math.max(0, dataMin - padding);
  const range = maxWeight - minWeight;

  // Calculate trend
  const firstWeight = sortedData[0].weight;
  const lastWeight = sortedData[sortedData.length - 1].weight;
  const change = lastWeight - firstWeight;

  const getTrendIcon = () => {
    if (change > 0.5) return <TrendingUp className="w-4 h-4 text-red-500" />;
    if (change < -0.5) return <TrendingDown className="w-4 h-4 text-emerald-500" />;
    return <Minus className="w-4 h-4 text-zinc-400" />;
  };

  const getTrendColor = () => {
    if (change > 0.5) return 'text-red-500';
    if (change < -0.5) return 'text-emerald-500';
    return 'text-zinc-400';
  };

  // SVG chart dimensions (viewBox coordinates)
  const vbWidth = 300;
  const vbHeight = 150;
  const mx = 4;    // margin x
  const mt = 12;   // margin top (for tooltip)
  const mb = 4;    // margin bottom
  const plotW = vbWidth - mx * 2;
  const plotH = vbHeight - mt - mb;

  // Map data to SVG coordinates
  const points = sortedData.map((log, i) => {
    const x = mx + (i / Math.max(sortedData.length - 1, 1)) * plotW;
    const y = mt + plotH - ((log.weight - minWeight) / range) * plotH;
    return { x, y, log };
  });

  // Build smooth line path using Catmull-Rom → Cubic Bezier
  const buildLinePath = () => {
    if (points.length === 1) {
      return `M ${points[0].x} ${points[0].y}`;
    }
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];
      const t = 0.3;
      const cp1x = p1.x + (p2.x - p0.x) * t;
      const cp1y = p1.y + (p2.y - p0.y) * t;
      const cp2x = p2.x - (p3.x - p1.x) * t;
      const cp2y = p2.y - (p3.y - p1.y) * t;
      path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    return path;
  };

  const buildAreaPath = () => {
    const line = buildLinePath();
    const last = points[points.length - 1];
    const first = points[0];
    return `${line} L ${last.x},${mt + plotH} L ${first.x},${mt + plotH} Z`;
  };

  const linePath = buildLinePath();
  const areaPath = buildAreaPath();

  const targetY =
    targetWeight != null
      ? mt + plotH - ((targetWeight - minWeight) / range) * plotH
      : null;

  // Grid lines (4 horizontal)
  const gridCount = 4;
  const gridLines = Array.from({ length: gridCount }, (_, i) => {
    const frac = i / (gridCount - 1);
    const val = minWeight + frac * range;
    const y = mt + plotH - frac * plotH;
    return { val, y };
  });

  const handleChartInteraction = (clientX: number) => {
    if (!chartRef.current) return;
    const rect = chartRef.current.getBoundingClientRect();
    const relX = ((clientX - rect.left) / rect.width) * vbWidth;
    let closest = 0;
    let minDist = Infinity;
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - relX);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    });
    setHoveredIndex(closest);
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-zinc-50 dark:bg-zinc-900 p-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-[color:var(--muted-foreground)] mb-1">
            Current
          </p>
          <p className="text-lg font-bold text-[color:var(--foreground)]">
            {lastWeight}
            <span className="text-xs font-normal ml-0.5">kg</span>
          </p>
        </div>
        <div className="rounded-xl bg-zinc-50 dark:bg-zinc-900 p-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-[color:var(--muted-foreground)] mb-1">
            Change
          </p>
          <p className={`text-lg font-bold flex items-center justify-center gap-1 ${getTrendColor()}`}>
            {getTrendIcon()}
            {change > 0 ? '+' : ''}
            {change.toFixed(1)}
            <span className="text-xs font-normal">kg</span>
          </p>
        </div>
        <div className="rounded-xl bg-zinc-50 dark:bg-zinc-900 p-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-[color:var(--muted-foreground)] mb-1">
            Target
          </p>
          <p className="text-lg font-bold text-[color:var(--foreground)]">
            {targetWeight ? (
              <>
                {targetWeight}
                <span className="text-xs font-normal ml-0.5">kg</span>
              </>
            ) : (
              <span className="text-sm text-[color:var(--muted-foreground)]">—</span>
            )}
          </p>
        </div>
      </div>

      {/* Chart container */}
      <div className="relative">
        <svg
          ref={chartRef}
          viewBox={`0 0 ${vbWidth} ${vbHeight}`}
          className="w-full h-44 sm:h-52"
          preserveAspectRatio="xMidYMid meet"
          onMouseMove={(e) => handleChartInteraction(e.clientX)}
          onTouchMove={(e) => handleChartInteraction(e.touches[0].clientX)}
          onMouseLeave={() => setHoveredIndex(null)}
          onTouchEnd={() => setHoveredIndex(null)}
        >
          <defs>
            <linearGradient id="weightAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {gridLines.map((g, i) => (
            <g key={i}>
              <line
                x1={mx}
                y1={g.y}
                x2={vbWidth - mx}
                y2={g.y}
                stroke="currentColor"
                strokeOpacity="0.07"
                strokeWidth="0.5"
                className="text-zinc-400"
              />
              <text
                x={mx}
                y={g.y - 1.5}
                fontSize="5"
                fill="currentColor"
                fillOpacity="0.35"
                className="text-zinc-500"
              >
                {g.val.toFixed(0)}
              </text>
            </g>
          ))}

          {/* Target line */}
          {targetY !== null && targetY >= mt && targetY <= mt + plotH && (
            <>
              <line
                x1={mx}
                y1={targetY}
                x2={vbWidth - mx}
                y2={targetY}
                stroke="#22c55e"
                strokeWidth="0.6"
                strokeDasharray="3 2"
                opacity="0.5"
              />
              <rect
                x={vbWidth - mx - 24}
                y={targetY - 5}
                width="23"
                height="7"
                rx="2"
                fill="#22c55e"
                opacity="0.15"
              />
              <text
                x={vbWidth - mx - 12.5}
                y={targetY - 0.5}
                textAnchor="middle"
                fontSize="4.5"
                fill="#22c55e"
                fontWeight="600"
              >
                Target
              </text>
            </>
          )}

          {/* Area fill */}
          <path d={areaPath} fill="url(#weightAreaGrad)" />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={hoveredIndex === i ? 3 : 1.8}
              fill={hoveredIndex === i ? '#3b82f6' : 'var(--background)'}
              stroke="#3b82f6"
              strokeWidth="1"
            />
          ))}

          {/* Hover vertical line */}
          {hoveredIndex !== null && points[hoveredIndex] && (
            <line
              x1={points[hoveredIndex].x}
              y1={mt}
              x2={points[hoveredIndex].x}
              y2={mt + plotH}
              stroke="#3b82f6"
              strokeOpacity="0.2"
              strokeWidth="0.5"
              strokeDasharray="2 2"
            />
          )}
        </svg>

        {/* Tooltip */}
        {hoveredIndex !== null && points[hoveredIndex] && (
          <div
            className="absolute pointer-events-none z-10"
            style={{
              left: `${(points[hoveredIndex].x / vbWidth) * 100}%`,
              top: '0',
              transform: 'translateX(-50%)',
            }}
          >
            <div className="rounded-lg bg-zinc-900 dark:bg-zinc-100 px-2.5 py-1.5 shadow-lg">
              <p className="text-xs font-bold text-white dark:text-zinc-900">
                {points[hoveredIndex].log.weight}kg
              </p>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                {new Date(points[hoveredIndex].log.date).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        )}

        {/* X-axis date labels */}
        <div className="flex justify-between px-1 mt-1">
          {sortedData.length <= 7
            ? sortedData.map((log, i) => (
                <span key={i} className="text-[10px] text-[color:var(--muted-foreground)]">
                  {new Date(log.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </span>
              ))
            : [0, Math.floor(sortedData.length / 2), sortedData.length - 1].map((idx) => (
                <span key={idx} className="text-[10px] text-[color:var(--muted-foreground)]">
                  {new Date(sortedData[idx].date).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              ))}
        </div>
      </div>
    </div>
  );
}
