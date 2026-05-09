'use client';

import { useEffect, useState } from 'react';
import AnimatedBarbell from '@/components/kinetic/AnimatedBarbell';

type Feature = {
  code: string;
  accent: string;
  plates: number;
  eyebrow: string;
  title: string;
  desc: string;
  metrics: { k: string; v: string }[];
  bullets: string[];
};

const FEATURES: Feature[] = [
  {
    code: '01',
    accent: '#00D1FF',
    plates: 4,
    eyebrow: 'KINETIC VISION',
    title: 'AI FORM COACH',
    desc:
      'Real-time pose estimation reads 33 body landmarks at 30fps. Catches knee valgus, elbow flare, and depth cuts before they cost you a rep.',
    metrics: [
      { k: '33', v: 'JOINTS TRACKED' },
      { k: '30', v: 'FPS' },
      { k: '<80', v: 'MS LATENCY' },
    ],
    bullets: ['Squat · Bench · Deadlift', 'Webcam or phone camera', 'Auto-rep counter'],
  },
  {
    code: '02',
    accent: '#CCFF00',
    plates: 3,
    eyebrow: 'MEAL VISION',
    title: 'PHOTO → MACROS',
    desc:
      'Snap your plate. Vision model breaks it into ingredients, portions, and macros in under two seconds. No barcodes, no guesswork.',
    metrics: [
      { k: '2.1', v: 'SEC TO LOG' },
      { k: '94%', v: 'ACCURACY' },
      { k: '180+', v: 'CUISINES' },
    ],
    bullets: ['Multi-item recognition', 'Portion estimation', 'Save as template'],
  },
  {
    code: '03',
    accent: '#00D1FF',
    plates: 5,
    eyebrow: 'ADAPTIVE PROGRAMMING',
    title: 'PROGRAMS THAT LEARN',
    desc:
      "Routines that auto-tune to fatigue, RPE feedback, and PR velocity. Push when you're ready, deload when you aren't.",
    metrics: [
      { k: '12wk', v: 'BLOCKS' },
      { k: 'auto', v: 'DELOAD' },
      { k: '∞', v: 'PROGRESSION' },
    ],
    bullets: ['Hypertrophy · Strength · Hybrid', 'Equipment-aware', 'AI substitutions'],
  },
  {
    code: '04',
    accent: '#CCFF00',
    plates: 6,
    eyebrow: 'COMPLETE TRACKING',
    title: 'EVERY METRIC, ONE HUD',
    desc:
      'Volume, intensity, streaks, body comp. PRs detected automatically and surfaced as weekly briefings.',
    metrics: [
      { k: '40+', v: 'METRICS' },
      { k: 'live', v: 'STREAK' },
      { k: 'PR', v: 'WATCHER' },
    ],
    bullets: ['Custom dashboards', 'Weekly briefing email', 'Apple Health · Garmin'],
  },
];

export default function KineticFeatureSlides() {
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => setActive(a => (a + 1) % FEATURES.length), 6500);
    return () => clearInterval(id);
  }, [auto]);

  const f = FEATURES[active];

  return (
    <section className="kx-features" id="features">
      <div className="kx-features__head">
        <div className="kx-eyebrow">[ §02 · CAPABILITIES ]</div>
        <h2 className="kx-h2">
          ENGINEERED FOR <span style={{ color: f.accent }}>PERFORMANCE</span>
        </h2>
      </div>

      <div className="kx-features__stage">
        <div className="kx-features__tabs">
          {FEATURES.map((ft, i) => (
            <button
              key={ft.code}
              className={`kx-features__tab ${i === active ? 'is-active' : ''}`}
              onClick={() => {
                setActive(i);
                setAuto(false);
              }}
              aria-current={i === active}
            >
              <span className="kx-features__tab-code">{ft.code}</span>
              <span className="kx-features__tab-title">{ft.title}</span>
              <span className="kx-features__tab-bar">
                <span
                  className="kx-features__tab-fill"
                  style={{
                    background: ft.accent,
                    animation: i === active && auto ? 'kxTabFill 6.5s linear forwards' : 'none',
                    width: i === active ? undefined : '0%',
                  }}
                />
              </span>
            </button>
          ))}
        </div>

        <div className="kx-features__body">
          <div className="kx-features__copy" key={f.code}>
            <div className="kx-features__code" style={{ color: f.accent }}>
              {f.code}
            </div>
            <div className="kx-features__sub-eyebrow">{f.eyebrow}</div>
            <h3 className="kx-features__h">{f.title}</h3>
            <p className="kx-features__desc">{f.desc}</p>

            <div className="kx-features__metrics">
              {f.metrics.map((m, i) => (
                <div key={i}>
                  <div className="kx-features__metric-k" style={{ color: f.accent }}>
                    {m.k}
                  </div>
                  <div className="kx-features__metric-v">{m.v}</div>
                </div>
              ))}
            </div>

            <ul className="kx-features__bullets">
              {f.bullets.map((b, i) => (
                <li key={i} style={{ animationDelay: `${0.15 + i * 0.08}s` }}>
                  <span className="kx-features__bullet-dot" style={{ background: f.accent }} />
                  {b}
                </li>
              ))}
            </ul>
          </div>

          <div className="kx-features__visual">
            <div className="kx-features__visual-frame">
              <div className="kx-features__visual-corners">
                <span /><span /><span /><span />
              </div>
              <div key={`bb-${f.code}`} className="kx-features__barbell">
                <AnimatedBarbell width={620} plates={f.plates} accent={f.accent} />
              </div>
              <div className="kx-features__loadlbl">
                <span>LOAD CONFIG</span>
                <strong style={{ color: f.accent }}>
                  {f.plates}
                  <span style={{ opacity: 0.4 }}>×PLATES</span>
                </strong>
              </div>

              <div className="kx-features__readout" aria-hidden="true">
                {Array.from({ length: 40 }).map((_, i) => (
                  <span
                    key={i}
                    style={{
                      height: `${20 + Math.abs(Math.sin(i * 0.5 + active)) * 60}%`,
                      background: i % 6 === 0 ? f.accent : '#3a3a3c',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
