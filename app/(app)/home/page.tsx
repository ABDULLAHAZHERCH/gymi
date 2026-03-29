'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { getUserProfile } from '@/lib/auth';
import { getDashboardStats } from '@/lib/stats';
import { getActiveGoals } from '@/lib/goals';
import { UserProfile, Goal } from '@/lib/types/firestore';
import AppLayout from '@/components/layout/AppLayout';
import SemicircleTargetCard from '@/components/features/SemicircleTargetCard';
import {
  Flame,
  Dumbbell,
  Utensils,
  CalendarDays,
  ArrowUpRight,
  ChevronRight,
  TrendingUp,
  Target,
} from 'lucide-react';
import { triggerDashboardNotifications } from '@/lib/notificationTriggers';
import { useUnits } from '@/components/providers/UnitProvider';
import { useCachedData } from '@/lib/hooks/useCachedData';

const estimateMacrosFromCalories = (calories: number) => ({
  protein: Math.round((calories * 0.3) / 4),
  carbs: Math.round((calories * 0.4) / 4),
  fat: Math.round((calories * 0.3) / 9),
});

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
  }, [user, !!stats]);

  useEffect(() => {
    const tick = () => setCurrentHour(new Date().getHours());
    tick();
    const timer = window.setInterval(tick, 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening';

  const monthlyWorkouts = stats?.monthlyStats?.totalWorkouts ?? 0;
  const workoutGoal = activeGoals.find((goal) => goal.type === 'workout_frequency');
  const calorieGoal = activeGoals.find((goal) => goal.type === 'calories');
  const macroGoal = activeGoals.find((goal) => goal.type === 'macros');

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

  const targetCards = [
    {
      name: 'Workout',
      current: Number(stats?.todayWorkoutCount || 0),
      target: dailyWorkoutTarget,
      unit: '',
      tone: 'text-emerald-500',
    },
    {
      name: 'Calories',
      current: Number(stats?.todayCalories || 0),
      target: dailyCalorieTarget,
      unit: ' kcal',
      tone: 'text-amber-500',
    },
    {
      name: 'Protein',
      current: todayMacros.protein,
      target: macroTargets.protein,
      unit: ' g',
      tone: 'text-sky-500',
    },
    {
      name: 'Carbs',
      current: todayMacros.carbs,
      target: macroTargets.carbs,
      unit: ' g',
      tone: 'text-violet-500',
    },
  ];

  return (
    <AppLayout title="Home">
      <section className="space-y-4">
        <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.18),transparent_45%),radial-gradient(circle_at_85%_20%,rgba(59,130,246,0.14),transparent_40%),var(--background)] p-5 shadow-sm dark:border-zinc-800">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--muted-foreground)]">
            {greeting}
          </p>
          <h2 className="mt-2 text-3xl font-semibold leading-tight text-[color:var(--foreground)]">
            {profile?.name || 'Athlete'}
          </h2>
          <p className="mt-2 max-w-xl text-sm text-[color:var(--muted-foreground)]">
            Keep tracking daily so your progress compounds over time.
          </p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
            ))}
          </div>
        ) : stats ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-emerald-50 to-[color:var(--background)] p-4 dark:border-zinc-800 dark:from-emerald-950/30">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                  <Flame className="h-3.5 w-3.5" />
                  <span className="text-[11px] font-medium uppercase tracking-wider">Streak</span>
                </div>
                <p className="mt-2 text-2xl font-bold text-[color:var(--foreground)]">
                  {stats.workoutStreak}
                  <span className="ml-1 text-sm font-normal text-[color:var(--muted-foreground)]">days</span>
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-blue-50 to-[color:var(--background)] p-4 dark:border-zinc-800 dark:from-blue-950/30">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <Dumbbell className="h-3.5 w-3.5" />
                  <span className="text-[11px] font-medium uppercase tracking-wider">This Week</span>
                </div>
                <p className="mt-2 text-2xl font-bold text-[color:var(--foreground)]">
                  {stats.weeklyWorkouts}
                  <span className="ml-1 text-sm font-normal text-[color:var(--muted-foreground)]">workouts</span>
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-amber-50 to-[color:var(--background)] p-4 dark:border-zinc-800 dark:from-amber-950/30">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                  <Utensils className="h-3.5 w-3.5" />
                  <span className="text-[11px] font-medium uppercase tracking-wider">Today</span>
                </div>
                <p className="mt-2 text-2xl font-bold text-[color:var(--foreground)]">
                  {stats.todayCalories}
                  <span className="ml-1 text-sm font-normal text-[color:var(--muted-foreground)]">kcal</span>
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-violet-50 to-[color:var(--background)] p-4 dark:border-zinc-800 dark:from-violet-950/30">
                <div className="flex items-center gap-2 text-violet-700 dark:text-violet-300">
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span className="text-[11px] font-medium uppercase tracking-wider">Month</span>
                </div>
                <p className="mt-2 text-2xl font-bold text-[color:var(--foreground)]">
                  {monthlyWorkouts}
                  <span className="ml-1 text-sm font-normal text-[color:var(--muted-foreground)]">workouts</span>
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-[color:var(--background)] p-4 dark:border-zinc-800">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
                  Daily Targets
                </p>
                <Target className="h-4 w-4 text-[color:var(--muted-foreground)]" />
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {targetCards.map((target) => {
                  return (
                    <SemicircleTargetCard
                      key={target.name}
                      label={target.name}
                      current={target.current}
                      target={target.target}
                      unit={target.unit}
                      colorClassName={target.tone}
                    />
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-[color:var(--background)] p-4 dark:border-zinc-800">
              <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
                Weekly Trend
              </p>
              <p className="mt-2 flex items-center gap-1 text-lg font-semibold text-[color:var(--foreground)]">
                <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                {stats?.weeklyWorkouts ?? 0} workouts completed this week
              </p>
              <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">
                Daily consistency is the fastest path to long-term progress.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-[color:var(--background)] p-4 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
                  Continue Your Plan
                </p>
                <Link
                  href="/programs"
                  className="flex items-center gap-1 text-xs font-medium text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors"
                >
                  Open programs
                  <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
              <p className="mt-2 text-sm text-[color:var(--foreground)]">
                {stats.todayWorkoutCount || 0} workout{(stats.todayWorkoutCount || 0) === 1 ? '' : 's'} logged today.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 py-16 dark:border-zinc-800">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
              <TrendingUp className="h-6 w-6 text-[color:var(--muted-foreground)]" />
            </div>
            <p className="text-sm font-medium text-[color:var(--foreground)]">No data yet</p>
            <p className="mt-1 max-w-xs text-center text-xs text-[color:var(--muted-foreground)]">
              Start logging workouts and meals to see your dashboard come alive.
            </p>
            <div className="mt-6 flex gap-3">
              <Link
                href="/workouts"
                className="rounded-full bg-[color:var(--foreground)] px-5 py-2 text-xs font-semibold text-[color:var(--background)]"
              >
                Log Workout
              </Link>
              <Link
                href="/nutrition"
                className="rounded-full border border-zinc-200 px-5 py-2 text-xs font-semibold text-[color:var(--foreground)] dark:border-zinc-800"
              >
                Log Meal
              </Link>
            </div>
          </div>
        )}
      </section>
    </AppLayout>
  );
}
