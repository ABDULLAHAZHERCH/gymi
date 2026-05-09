'use client';

import Link from 'next/link';
import { Ring, Waveform, MiniSpark } from '@/components/kinetic/primitives';

/* ────────── Targets / Rings panel ────────── */
type RingTarget = {
  label: string;
  value: number;
  max: number;
  color: string;
  sub?: string;
};

export function RingsPanel({ targets }: { targets: RingTarget[] }) {
  return (
    <div className="kx-panel kx-panel--rings">
      <div className="kx-panel__head">
        <h3 className="kx-panel__title">TODAY · TARGETS</h3>
        <span className="kx-panel__sub">live</span>
      </div>
      <div className="kx-panel__rings">
        {targets.map((t) => (
          <Ring
            key={t.label}
            value={t.value}
            max={t.max}
            color={t.color}
            label={t.label}
            sub={t.sub}
            size={132}
          />
        ))}
      </div>
    </div>
  );
}

/* ────────── Form Coach preview panel ────────── */
export function CoachPanel() {
  return (
    <div className="kx-panel kx-panel--coach">
      <div className="kx-panel__head">
        <h3 className="kx-panel__title">FORM COACH · LIVE</h3>
        <Link href="/coach" className="kx-panel__sub" style={{ color: '#CCFF00' }}>
          ● OPEN
        </Link>
      </div>
      <div className="kx-coach__cam">
        <div className="kx-coach__skeleton">
          <svg viewBox="0 0 200 240" className="kx-coach__svg" preserveAspectRatio="xMidYMid meet">
            <circle cx="100" cy="40" r="14" fill="none" stroke="#00D1FF" strokeWidth="1.5" />
            <line x1="100" y1="54" x2="100" y2="130" stroke="#00D1FF" strokeWidth="2" />
            <line x1="100" y1="80" x2="60" y2="110" stroke="#CCFF00" strokeWidth="2" />
            <line x1="100" y1="80" x2="140" y2="110" stroke="#CCFF00" strokeWidth="2" />
            <line x1="60" y1="110" x2="50" y2="150" stroke="#00D1FF" strokeWidth="2" />
            <line x1="140" y1="110" x2="150" y2="150" stroke="#00D1FF" strokeWidth="2" />
            <line x1="100" y1="130" x2="80" y2="180" stroke="#00D1FF" strokeWidth="2" />
            <line x1="100" y1="130" x2="120" y2="180" stroke="#00D1FF" strokeWidth="2" />
            <line x1="80" y1="180" x2="78" y2="220" stroke="#00D1FF" strokeWidth="2" />
            <line x1="120" y1="180" x2="122" y2="220" stroke="#00D1FF" strokeWidth="2" />
            {[
              [100, 80], [60, 110], [140, 110], [50, 150], [150, 150],
              [100, 130], [80, 180], [120, 180], [78, 220], [122, 220],
            ].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="3" fill="#00D1FF">
                <animate
                  attributeName="r"
                  values="3;5;3"
                  dur="1.5s"
                  begin={`${i * 0.1}s`}
                  repeatCount="indefinite"
                />
              </circle>
            ))}
          </svg>
          <div className="kx-coach__targeting">
            <span /><span /><span /><span />
          </div>
        </div>
        <div className="kx-coach__readouts">
          <div className="kx-coach__readout">
            <span className="kx-coach__r-lbl">DEPTH</span>
            <span className="kx-coach__r-val" style={{ color: '#CCFF00' }}>READY</span>
          </div>
          <div className="kx-coach__readout">
            <span className="kx-coach__r-lbl">JOINTS</span>
            <span className="kx-coach__r-val" style={{ color: '#00D1FF' }}>33</span>
          </div>
          <div className="kx-coach__readout">
            <span className="kx-coach__r-lbl">FRAME</span>
            <span className="kx-coach__r-val" style={{ color: '#CCFF00' }}>30 FPS</span>
          </div>
          <div className="kx-coach__readout">
            <span className="kx-coach__r-lbl">LATENCY</span>
            <span className="kx-coach__r-val">&lt;80 MS</span>
          </div>
        </div>
      </div>
      <Waveform color="#00D1FF" height={50} />
    </div>
  );
}

/* ────────── Weekly bars ────────── */
type WeekDay = { d: string; val: number; label: string };

export function WeekPanel({
  days,
  completed,
}: {
  days: WeekDay[];
  completed: number;
}) {
  return (
    <div className="kx-panel kx-panel--week">
      <div className="kx-panel__head">
        <h3 className="kx-panel__title">THIS WEEK</h3>
        <span className="kx-panel__sub">{completed} of 7</span>
      </div>
      <div className="kx-week">
        {days.map((d, i) => (
          <div
            key={i}
            className={`kx-week__day ${d.val > 0 ? 'is-done' : ''} ${d.val === 0.5 ? 'is-today' : ''}`}
          >
            <div className="kx-week__bar-wrap">
              <div
                className="kx-week__bar"
                style={{
                  height: `${Math.max(10, d.val * 100)}%`,
                  background:
                    d.val === 0.5 ? '#CCFF00' : d.val > 0 ? '#00D1FF' : 'transparent',
                  border: d.val === 0 ? '1px dashed #2c2c2d' : 'none',
                  color: d.val === 0.5 ? '#CCFF00' : '#00D1FF',
                }}
              />
            </div>
            <div className="kx-week__d">{d.d}</div>
            <div className="kx-week__lbl">{d.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ────────── Recent lifts ────────── */
type Lift = { name: string; last: string; delta: string; spark: number[]; color: string };

export function RecentLiftsPanel({ lifts }: { lifts: Lift[] }) {
  return (
    <div className="kx-panel kx-panel--lifts">
      <div className="kx-panel__head">
        <h3 className="kx-panel__title">RECENT ENTRIES</h3>
        <Link href="/workouts" className="kx-panel__sub" style={{ color: '#00D1FF' }}>
          ALL ›
        </Link>
      </div>
      <div className="kx-lifts">
        {lifts.length === 0 ? (
          <div style={{ padding: '24px 8px', fontSize: 13, color: 'var(--kx-fg-3)' }}>
            No lifts logged yet.{' '}
            <Link href="/workouts" style={{ color: '#00D1FF' }}>
              Start your first session
            </Link>
            .
          </div>
        ) : (
          lifts.map((l, i) => (
            <div key={i} className="kx-lift">
              <div className="kx-lift__name">{l.name}</div>
              <div className="kx-lift__last">{l.last}</div>
              <div className="kx-lift__spark">
                <MiniSpark data={l.spark} color={l.color} height={26} />
              </div>
              <div className="kx-lift__delta" style={{ color: l.color }}>
                {l.delta}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ────────── Insights ────────── */
type Insight = {
  tag: string;
  tagBg: string;
  tagFg: string;
  title: string;
  body: string;
  href?: string;
  cta?: string;
};

export function InsightsPanel({ insights }: { insights: Insight[] }) {
  return (
    <div className="kx-panel kx-panel--ai">
      <div className="kx-panel__head">
        <h3 className="kx-panel__title">COACH INSIGHTS</h3>
        <span className="kx-panel__sub" style={{ color: '#CCFF00' }}>
          {insights.length} NEW
        </span>
      </div>
      <div className="kx-insights">
        {insights.map((it, i) => (
          <div key={i} className="kx-insight">
            <div
              className="kx-insight__tag"
              style={{ background: it.tagBg, color: it.tagFg }}
            >
              {it.tag}
            </div>
            <div className="kx-insight__body">
              <strong>{it.title}</strong>
              {it.body}
            </div>
            {it.href && it.cta ? (
              <Link href={it.href} className="kx-insight__cta">
                {it.cta} ›
              </Link>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ────────── Body composition trend ────────── */
export function BodyCompPanel({
  weightSeries,
  leanSeries,
  delta,
}: {
  weightSeries: number[];
  leanSeries: number[];
  delta: string;
}) {
  const w = 320;
  const h = 140;

  const toPath = (series: number[], yScale: (n: number) => number) => {
    if (!series.length) return '';
    return series
      .map((v, i) => `${(i / Math.max(1, series.length - 1)) * w},${yScale(v)}`)
      .join(' ');
  };

  const allValues = [...weightSeries, ...leanSeries];
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const range = max - min || 1;
  const yScale = (v: number) => h - ((v - min) / range) * (h - 20) - 10;

  const weightPts = toPath(weightSeries, yScale);
  const leanPts = toPath(leanSeries, yScale);

  return (
    <div className="kx-panel kx-panel--body">
      <div className="kx-panel__head">
        <h3 className="kx-panel__title">BODY COMP · 90D</h3>
        <span className="kx-panel__sub">{delta}</span>
      </div>
      <div className="kx-bodychart">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          preserveAspectRatio="none"
          style={{ width: '100%', height: 140 }}
        >
          <defs>
            <linearGradient id="kx-bcg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#00D1FF" stopOpacity="0.5" />
              <stop offset="1" stopColor="#00D1FF" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 35, 70, 105, 140].map((y) => (
            <line key={y} x1="0" y1={y} x2={w} y2={y} stroke="#1d1d1f" strokeWidth="0.5" />
          ))}
          {weightSeries.length > 1 && (
            <>
              <polyline fill="none" stroke="#00D1FF" strokeWidth="2" points={weightPts} />
              <polygon fill="url(#kx-bcg)" points={`0,${h} ${weightPts} ${w},${h}`} />
            </>
          )}
          {leanSeries.length > 1 && (
            <polyline
              fill="none"
              stroke="#CCFF00"
              strokeWidth="2"
              strokeDasharray="3 3"
              points={leanPts}
            />
          )}
        </svg>
        <div className="kx-bodychart__legend">
          <span>
            <span className="kx-bodychart__sw" style={{ background: '#00D1FF' }} />
            Body weight
          </span>
          <span>
            <span className="kx-bodychart__sw" style={{ background: '#CCFF00' }} />
            Lean mass
          </span>
        </div>
      </div>
    </div>
  );
}
