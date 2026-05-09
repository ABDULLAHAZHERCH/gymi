'use client';

import Link from 'next/link';
import ShaderBg from '@/components/kinetic/ShaderBg';
import AnimatedDumbbell from '@/components/kinetic/AnimatedDumbbell';

type HeroCardProps = {
  greeting: string;
  name: string;
  streak: number;
  todayWorkouts: number;
  weeklyWorkouts: number;
};

export default function KineticHeroCard({
  greeting,
  name,
  streak,
  todayWorkouts,
  weeklyWorkouts,
}: HeroCardProps) {
  const eyebrow = streak > 0
    ? `[ DAY ${streak} · KINETIC STREAK ]`
    : `[ ${weeklyWorkouts} OF 7 · THIS WEEK ]`;

  const message = todayWorkouts > 0
    ? `You've already logged ${todayWorkouts} session${todayWorkouts === 1 ? '' : 's'} today. Keep the streak hot — your next lift is ready when you are.`
    : `No session logged today yet. Pick a program or start a free workout — Form Coach is warmed up and ready.`;

  return (
    <div className="kx-dash-hero">
      <ShaderBg className="kx-dash-hero__shader" intensity={0.85} />
      <div className="kx-dash-hero__inner">
        <div>
          <div className="kx-eyebrow" style={{ color: '#CCFF00', marginBottom: 8 }}>{eyebrow}</div>
          <h2 className="kx-dash-hero__h">
            {greeting},<br />
            <span style={{ color: '#00D1FF' }}>{(name || 'ATHLETE').toUpperCase()}.</span>
          </h2>
          <p className="kx-dash-hero__p">{message}</p>
          <div className="kx-dash-hero__cta">
            <Link href="/coach" className="kx-btn kx-btn--primary">
              <span>START COACH</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" />
              </svg>
            </Link>
            <Link href="/workouts" className="kx-btn kx-btn--ghost kx-btn--sm">
              LOG WORKOUT
            </Link>
          </div>
        </div>
        <div className="kx-dash-hero__visual">
          <AnimatedDumbbell size={240} />
        </div>
      </div>
      <span className="kx-dash-hero__bracket kx-dash-hero__bracket--tl" />
      <span className="kx-dash-hero__bracket kx-dash-hero__bracket--tr" />
      <span className="kx-dash-hero__bracket kx-dash-hero__bracket--bl" />
      <span className="kx-dash-hero__bracket kx-dash-hero__bracket--br" />
    </div>
  );
}
