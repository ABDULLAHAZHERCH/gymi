'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { getUserProfile } from '@/lib/auth';
import { getDashboardStats } from '@/lib/stats';
import { UserProfile } from '@/lib/types/firestore';
import AppLayout from '@/components/layout/AppLayout';
import RecentActivity from '@/components/features/RecentActivity';
import {
  Flame,
  Dumbbell,
  Utensils,
  Target,
  TrendingUp,
  ChevronRight,
  CalendarDays,
} from 'lucide-react';
import { triggerDashboardNotifications } from '@/lib/notificationTriggers';

export default function Home() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const [userProfile, dashboardStats] = await Promise.all([
          getUserProfile(user.uid),
          getDashboardStats(user.uid),
        ]);
        setProfile(userProfile);
        setStats(dashboardStats);

        // Trigger dashboard notifications (streak warnings, weekly summary, etc.)
        triggerDashboardNotifications(user.uid).catch(() => {});
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <AppLayout title="Home">
      <section className="space-y-6">
        {/* Greeting */}
        <div>
          <p className="text-sm text-[color:var(--muted-foreground)]">
            {greeting()},
          </p>
          <h2 className="text-2xl font-bold text-[color:var(--foreground)]">
            {profile?.name || 'Athlete'}
          </h2>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800"
              />
            ))}
          </div>
        ) : stats ? (
          <div className="space-y-5">
            {/* Top stats row */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-zinc-200 bg-[color:var(--background)] p-4 dark:border-zinc-800">
                <div className="flex items-center gap-2 text-[color:var(--muted-foreground)]">
                  <Flame className="h-3.5 w-3.5" />
                  <span className="text-[11px] font-medium uppercase tracking-wider">Streak</span>
                </div>
                <p className="mt-2 text-2xl font-bold text-[color:var(--foreground)]">
                  {stats.workoutStreak}
                  <span className="ml-1 text-sm font-normal text-[color:var(--muted-foreground)]">days</span>
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-[color:var(--background)] p-4 dark:border-zinc-800">
                <div className="flex items-center gap-2 text-[color:var(--muted-foreground)]">
                  <Dumbbell className="h-3.5 w-3.5" />
                  <span className="text-[11px] font-medium uppercase tracking-wider">This Week</span>
                </div>
                <p className="mt-2 text-2xl font-bold text-[color:var(--foreground)]">
                  {stats.weeklyWorkouts}
                  <span className="ml-1 text-sm font-normal text-[color:var(--muted-foreground)]">workouts</span>
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-[color:var(--background)] p-4 dark:border-zinc-800">
                <div className="flex items-center gap-2 text-[color:var(--muted-foreground)]">
                  <Utensils className="h-3.5 w-3.5" />
                  <span className="text-[11px] font-medium uppercase tracking-wider">Today</span>
                </div>
                <p className="mt-2 text-2xl font-bold text-[color:var(--foreground)]">
                  {stats.todayCalories}
                  <span className="ml-1 text-sm font-normal text-[color:var(--muted-foreground)]">kcal</span>
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-[color:var(--background)] p-4 dark:border-zinc-800">
                <div className="flex items-center gap-2 text-[color:var(--muted-foreground)]">
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span className="text-[11px] font-medium uppercase tracking-wider">Month</span>
                </div>
                <p className="mt-2 text-2xl font-bold text-[color:var(--foreground)]">
                  {stats.monthlyStats?.totalWorkouts ?? 0}
                  <span className="ml-1 text-sm font-normal text-[color:var(--muted-foreground)]">workouts</span>
                </p>
              </div>
            </div>

            {/* Macros */}
            {stats.todayMacros && stats.todayMacros.calories > 0 && (
              <div className="rounded-2xl border border-zinc-200 bg-[color:var(--background)] p-4 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
                    Today&apos;s Macros
                  </p>
                  <Link
                    href="/nutrition"
                    className="flex items-center gap-1 text-xs font-medium text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors"
                  >
                    Details
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-blue-50 dark:bg-blue-950/40 p-3 text-center">
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {stats.todayMacros.protein.toFixed(0)}g
                    </p>
                    <p className="text-[11px] text-blue-500 dark:text-blue-500">
                      Protein
                    </p>
                  </div>
                  <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 p-3 text-center">
                    <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                      {stats.todayMacros.carbs.toFixed(0)}g
                    </p>
                    <p className="text-[11px] text-amber-500 dark:text-amber-500">
                      Carbs
                    </p>
                  </div>
                  <div className="rounded-xl bg-red-50 dark:bg-red-950/40 p-3 text-center">
                    <p className="text-lg font-bold text-red-600 dark:text-red-400">
                      {stats.todayMacros.fat.toFixed(0)}g
                    </p>
                    <p className="text-[11px] text-red-500 dark:text-red-500">
                      Fat
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Top Exercises */}
            {stats.favoriteExercises?.length > 0 && (
              <div className="rounded-2xl border border-zinc-200 bg-[color:var(--background)] p-4 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
                    Top Exercises
                  </p>
                  <Link
                    href="/workouts"
                    className="flex items-center gap-1 text-xs font-medium text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors"
                  >
                    View all
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
                <div className="space-y-2">
                  {stats.favoriteExercises.slice(0, 4).map((ex: any) => (
                    <div
                      key={ex.exercise}
                      className="flex items-center justify-between py-2"
                    >
                      <span className="text-sm text-[color:var(--foreground)]">
                        {ex.exercise}
                      </span>
                      <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-[color:var(--muted-foreground)] dark:bg-zinc-800">
                        {ex.count}×
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Activity */}
            {stats.recentEntries?.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
                    Recent Activity
                  </p>
                </div>
                <RecentActivity entries={stats.recentEntries} />
              </div>
            )}
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 py-16 dark:border-zinc-800">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 mb-4">
              <TrendingUp className="h-6 w-6 text-[color:var(--muted-foreground)]" />
            </div>
            <p className="text-sm font-medium text-[color:var(--foreground)]">
              No data yet
            </p>
            <p className="mt-1 text-xs text-[color:var(--muted-foreground)] text-center max-w-xs">
              Start logging workouts and meals to see your dashboard come alive
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
