'use client';

import { MiniSpark, Tick } from '@/components/kinetic/primitives';

type Stat = {
  label: string;
  value: number;
  unit?: string;
  trend: { text: string; color: string };
  spark: number[];
  sparkColor: string;
  pulse?: 'cyan' | 'lime';
};

export default function KineticStatStrip({ stats }: { stats: Stat[] }) {
  return (
    <section className="kx-stats-grid">
      {stats.map((s) => (
        <div key={s.label} className="kx-stat">
          <div className="kx-stat__top">
            <span className="kx-stat__lbl">{s.label}</span>
            <span className={`kx-stat__pulse ${s.pulse === 'lime' ? 'kx-stat__pulse--lime' : ''}`} />
          </div>
          <div className="kx-stat__val">
            <Tick value={s.value} />
            {s.unit ? <span className="kx-stat__unit">{s.unit}</span> : null}
          </div>
          <div className="kx-stat__trend">
            <span style={{ color: s.trend.color }}>{s.trend.text}</span>
          </div>
          <MiniSpark data={s.spark} color={s.sparkColor} />
        </div>
      ))}
    </section>
  );
}
