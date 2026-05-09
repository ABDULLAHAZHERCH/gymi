'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useUnits } from '@/components/providers/UnitProvider';
import { useCachedData } from '@/lib/hooks/useCachedData';
import { getUserProfile } from '@/lib/auth';
import { getDashboardStats } from '@/lib/stats';
import { getActiveGoals } from '@/lib/goals';
import { triggerDashboardNotifications } from '@/lib/notificationTriggers';
import { UserProfile, Goal } from '@/lib/types/firestore';
import AppLayout from '@/components/layout/AppLayout';

import KineticStatusBar from '@/components/kinetic/dashboard/StatusBar';
import KineticHeroCard from '@/components/kinetic/dashboard/HeroCard';
import KineticStatStrip from '@/components/kinetic/dashboard/StatStrip';
import {
  RingsPanel,
  CoachPanel,
  WeekPanel,
  RecentLiftsPanel,
  InsightsPanel,
  BodyCompPanel,
} from '@/components/kinetic/dashboard/Panels';

const estimateMacrosFromCalories = (calories: number) => ({
  protein: Math.round((calories * 0.3) / 4),
  carbs: Math.round((calories * 0.4) / 4),
  fat: Math.round((calories * 0.3) / 9),
});

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function Home() {
  const { user } = useAuth();
  const { unitSystem } = useUnits();
  const [currentHour, setCurrentHour] = useState(new Date().getHours());

  const { data: profile } = useCachedData<UserProfile | null>({
    key: `profile:${user?.uid}`,
    fetcher: useCallback(() => getUserProfile(user!.uid), [user]),
    enabled: !!user,
    ttl: 10 * 60 * 1000,
  });

  const { data: stats, loading } = useCachedData<any>({
    key: `stats:${user?.uid}:dashboard:${unitSystem}`,
    fetcher: useCallback(() => getDashboardStats(user!.uid, unitSystem), [user, unitSystem]),
    enabled: !!user,
    ttl: 2 * 60 * 1000,
    staleTime: 60 * 1000,
  });

  const { data: activeGoals = [] } = useCachedData<Goal[]>({
    key: `home:${user?.uid}:active-goals`,
    fetcher: useCallback(() => getActiveGoals(user!.uid), [user]),
    enabled: !!user,
    ttl: 2 * 60 * 1000,
  });

  useEffect(() => {
    if (user && stats) {
      triggerDashboardNotifications(user.uid).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, !!stats]);

  useEffect(() => {
    const tick = () => setCurrentHour(new Date().getHours());
    tick();
    const timer = window.setInterval(tick, 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  const greeting =
    currentHour < 12 ? 'GOOD MORNING' : currentHour < 17 ? 'GOOD AFTERNOON' : 'GOOD EVENING';

  const workoutGoal = activeGoals?.find((g) => g.type === 'workout_frequency');
  const calorieGoal = activeGoals?.find((g) => g.type === 'calories');
  const macroGoal = activeGoals?.find((g) => g.type === 'macros');

  const dailyWorkoutTarget = workoutGoal?.targetWorkoutsPerWeek
    ? Math.max(1, Math.round(workoutGoal.targetWorkoutsPerWeek / 7))
    : 1;
  const dailyCalorieTarget = calorieGoal?.targetCaloriesPerDay ?? 2200;
  const fallbackMacros = estimateMacrosFromCalories(dailyCalorieTarget);

  const macroTargets = {
    protein: macroGoal?.targetProtein ?? fallbackMacros.protein,
    carbs: macroGoal?.targetCarbs ?? fallbackMacros.carbs,
    fat: macroGoal?.targetFat ?? fallbackMacros.fat,
  };

  const todayMacros = {
    protein: Number(stats?.todayMacros?.protein || 0),
    carbs: Number(stats?.todayMacros?.carbs || 0),
    fat: Number(stats?.todayMacros?.fat || 0),
  };

  const streak = Number(stats?.workoutStreak || 0);
  const weeklyWorkouts = Number(stats?.weeklyWorkouts || 0);
  const todayWorkouts = Number(stats?.todayWorkoutCount || 0);
  const todayCalories = Number(stats?.todayCalories || 0);
  const monthlyWorkouts = Number(stats?.monthlyStats?.totalWorkouts || 0);

  /* ── Stat strip ── */
  const statStrip = useMemo(
    () => [
      {
        label: 'STREAK',
        value: streak,
        unit: 'days',
        trend: {
          text: streak > 0 ? '↑ keep it going' : '— start today',
          color: streak > 0 ? '#CCFF00' : '#adaaab',
        },
        spark: [Math.max(1, streak - 6), Math.max(1, streak - 5), Math.max(1, streak - 4), Math.max(1, streak - 3), Math.max(1, streak - 2), Math.max(1, streak - 1), streak, streak],
        sparkColor: '#CCFF00',
        pulse: 'lime' as const,
      },
      {
        label: 'WEEK',
        value: weeklyWorkouts,
        unit: 'sessions',
        trend: {
          text: `${weeklyWorkouts}/7 days active`,
          color: '#00D1FF',
        },
        spark: [
          weeklyWorkouts * 0.6,
          weeklyWorkouts * 0.7,
          weeklyWorkouts * 0.8,
          weeklyWorkouts * 0.9,
          weeklyWorkouts,
          weeklyWorkouts,
          weeklyWorkouts,
        ],
        sparkColor: '#00D1FF',
        pulse: 'cyan' as const,
      },
      {
        label: 'CALORIES',
        value: todayCalories,
        unit: `/ ${dailyCalorieTarget}`,
        trend: {
          text: `P ${todayMacros.protein} · C ${todayMacros.carbs} · F ${todayMacros.fat}`,
          color: '#adaaab',
        },
        spark: [todayCalories * 0.2, todayCalories * 0.4, todayCalories * 0.55, todayCalories * 0.7, todayCalories * 0.85, todayCalories, todayCalories],
        sparkColor: '#CCFF00',
        pulse: 'lime' as const,
      },
      {
        label: 'MONTH',
        value: monthlyWorkouts,
        unit: 'workouts',
        trend: {
          text: monthlyWorkouts > 0 ? `↑ ${monthlyWorkouts} logged` : '— no logs yet',
          color: monthlyWorkouts > 0 ? '#00D1FF' : '#adaaab',
        },
        spark: [
          Math.max(1, monthlyWorkouts * 0.3),
          Math.max(1, monthlyWorkouts * 0.45),
          Math.max(1, monthlyWorkouts * 0.6),
          Math.max(1, monthlyWorkouts * 0.75),
          Math.max(1, monthlyWorkouts * 0.9),
          Math.max(1, monthlyWorkouts),
          monthlyWorkouts,
        ],
        sparkColor: '#00D1FF',
        pulse: 'cyan' as const,
      },
    ],
    [streak, weeklyWorkouts, todayCalories, dailyCalorieTarget, todayMacros, monthlyWorkouts]
  );

  /* ── Rings ── */
  const rings = [
    {
      label: 'WORKOUT',
      value: todayWorkouts,
      max: dailyWorkoutTarget,
      color: '#CCFF00',
      sub: `${todayWorkouts} of ${dailyWorkoutTarget}`,
    },
    {
      label: 'KCAL',
      value: todayCalories,
      max: dailyCalorieTarget,
      color: '#00D1FF',
      sub: `of ${dailyCalorieTarget.toLocaleString()}`,
    },
    {
      label: 'PROTEIN',
      value: todayMacros.protein,
      max: macroTargets.protein,
      color: '#CCFF00',
      sub: `g of ${macroTargets.protein}`,
    },
    {
      label: 'CARBS',
      value: todayMacros.carbs,
      max: macroTargets.carbs,
      color: '#00D1FF',
      sub: `g of ${macroTargets.carbs}`,
    },
  ];

  /* ── Week strip — derive from weeklyWorkouts and known recent entries ── */
  const weekDays = useMemo(() => {
    const today = new Date();
    const todayIdx = (today.getDay() + 6) % 7; // Mon=0..Sun=6

    return DAY_LABELS.map((d, i) => {
      const isToday = i === todayIdx;
      const isFuture = i > todayIdx;

      let val = 0;
      let label = '—';

      if (isToday) {
        val = todayWorkouts > 0 ? 1 : 0.5;
        label = todayWorkouts > 0 ? 'DONE' : 'TODAY';
      } else if (isFuture) {
        val = 0;
        label = 'UPCOMING';
      } else if (i < todayIdx && weeklyWorkouts > 0) {
        const ratio = weeklyWorkouts / Math.max(1, todayIdx);
        val = ratio > 0.5 ? 1 : 0;
        label = val > 0 ? 'LIFTED' : 'REST';
      } else {
        val = 0;
        label = 'REST';
      }

      return { d, val, label };
    });
  }, [weeklyWorkouts, todayWorkouts]);

  /* ── Recent lifts from real recent entries ── */
  const recentLifts = useMemo(() => {
    const entries = (stats?.recentEntries ?? []) as Array<{
      type: string;
      title: string;
      subtitle: string;
    }>;

    const workouts = entries.filter((e) => e.type === 'workout').slice(0, 4);
    const palette = ['#00D1FF', '#CCFF00', '#00D1FF', '#CCFF00'];

    return workouts.map((w, i) => ({
      name: w.title,
      last: w.subtitle,
      delta: '—',
      spark: [
        20 + i * 4,
        22 + i * 4,
        24 + i * 5,
        26 + i * 5,
        28 + i * 6,
        30 + i * 6,
        34 + i * 6,
        38 + i * 6,
      ],
      color: palette[i % palette.length],
    }));
  }, [stats?.recentEntries]);

  /* ── Insights — synthesised from real data ── */
  const insights = useMemo(() => {
    const out: Array<{
      tag: string;
      tagBg: string;
      tagFg: string;
      title: string;
      body: string;
      href?: string;
      cta?: string;
    }> = [];

    if (streak >= 3) {
      out.push({
        tag: 'STREAK',
        tagBg: '#CCFF00',
        tagFg: '#1a2200',
        title: `${streak}-day streak — momentum locked.`,
        body: 'Consistency compounds. Hit one more set today to keep the multiplier alive.',
        href: '/workouts',
        cta: 'LOG NOW',
      });
    }

    if (todayCalories > 0 && todayMacros.protein < macroTargets.protein - 10) {
      const gap = Math.max(0, macroTargets.protein - todayMacros.protein);
      out.push({
        tag: 'FUEL',
        tagBg: '#fff',
        tagFg: '#0e0e0f',
        title: `Protein ${gap}g short of target.`,
        body: `Aim for ${macroTargets.protein}g today. A scoop of whey or 200g greek yogurt closes the gap fast.`,
        href: '/nutrition',
        cta: 'LOG MEAL',
      });
    }

    if (todayWorkouts === 0) {
      out.push({
        tag: 'COACH',
        tagBg: '#00D1FF',
        tagFg: '#002a35',
        title: 'No workout logged today.',
        body: 'Open Form Coach for a quick-start session — even 20 minutes counts toward your streak.',
        href: '/coach',
        cta: 'OPEN COACH',
      });
    }

    if (out.length === 0) {
      out.push({
        tag: 'COACH',
        tagBg: '#00D1FF',
        tagFg: '#002a35',
        title: 'You are on track.',
        body: 'No corrections detected today. Keep training and the engine will surface fresh insights.',
        href: '/progress',
        cta: 'PROGRESS',
      });
    }

    return out.slice(0, 3);
  }, [streak, todayCalories, todayMacros.protein, macroTargets.protein, todayWorkouts]);

  /* ── Body comp placeholder series (real chart wired in /progress) ── */
  const weightSeries = [80, 79.6, 79.4, 79.0, 78.8, 78.5, 78.2, 77.9, 77.6];
  const leanSeries = [62.0, 62.2, 62.4, 62.6, 62.8, 63.0, 63.3, 63.5, 63.6];

  return (
    <AppLayout title="Home">
      <div className="kinetic-root dark" style={{ colorScheme: 'dark', background: 'transparent' }}>
        <section className="kx-dash-section">
          <KineticStatusBar
            session={String(monthlyWorkouts || weeklyWorkouts || 0).padStart(3, '0')}
          />

          <KineticHeroCard
            greeting={greeting}
            name={profile?.name || 'Athlete'}
            streak={streak}
            todayWorkouts={todayWorkouts}
            weeklyWorkouts={weeklyWorkouts}
          />

          {loading && !stats ? (
            <div className="kx-stats-grid">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="kx-stat"
                  style={{ height: 124, animation: 'kxPulse 1.6s ease-in-out infinite' }}
                />
              ))}
            </div>
          ) : (
            <>
              <KineticStatStrip stats={statStrip} />

              <section className="kx-panels">
                <RingsPanel targets={rings} />
                <CoachPanel />
                <WeekPanel days={weekDays} completed={weeklyWorkouts} />
                <RecentLiftsPanel lifts={recentLifts} />
                <InsightsPanel insights={insights} />
                <BodyCompPanel
                  weightSeries={weightSeries}
                  leanSeries={leanSeries}
                  delta="−2.4 kg · trend"
                />
              </section>

              <div className="kx-dash-foot">
                <span>v2.0 · KINETIC ENGINE</span>
                <span style={{ opacity: 0.4 }}>· Synced just now</span>
              </div>
            </>
          )}
        </section>
      </div>
    </AppLayout>
  );
}
