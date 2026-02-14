'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { getUserProfile } from '@/lib/auth';
import { getDashboardStats } from '@/lib/stats';
import { UserProfile } from '@/lib/types/firestore';
import AppLayout from "@/components/layout/AppLayout";
import StatCard from '@/components/features/StatCard';
import RecentActivity from '@/components/features/RecentActivity';
import { Plus, TrendingUp } from 'lucide-react';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
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
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleLogWorkout = () => {
    router.push('/logs?tab=workouts');
  };

  const handleLogMeal = () => {
    router.push('/logs?tab=meals');
  };

  return (
    <AppLayout title="Home">
      <section className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted-foreground)]">
            Welcome back
          </p>
          <h2 className="text-2xl font-semibold text-[color:var(--foreground)]">
            {profile?.name || 'Athlete'}
          </h2>
          <p className="text-sm leading-6 text-[color:var(--muted-foreground)]">
            {profile?.goal || 'Track your fitness journey'}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <button
            onClick={handleLogWorkout}
            className="flex flex-col items-center gap-2 rounded-2xl border border-zinc-200 bg-[color:var(--background)] p-4 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            <div className="text-2xl">💪</div>
            <span className="text-xs font-semibold text-[color:var(--foreground)]">Log Workout</span>
          </button>

          <button
            onClick={handleLogMeal}
            className="flex flex-col items-center gap-2 rounded-2xl border border-zinc-200 bg-[color:var(--background)] p-4 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            <div className="text-2xl">🍽️</div>
            <span className="text-xs font-semibold text-[color:var(--foreground)]">Log Meal</span>
          </button>

          <button
            className="flex flex-col items-center gap-2 rounded-2xl border border-zinc-200 bg-[color:var(--background)] p-4 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
            disabled
          >
            <div className="text-2xl opacity-50">📸</div>
            <span className="text-xs font-semibold text-[color:var(--foreground)] opacity-50">Coach</span>
          </button>

          <button
            onClick={() => router.push('/progress')}
            className="flex flex-col items-center gap-2 rounded-2xl border border-zinc-200 bg-[color:var(--background)] p-4 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            <div className="text-2xl">👤</div>
            <span className="text-xs font-semibold text-[color:var(--foreground)]">Profile</span>
          </button>
        </div>

        {/* Stats Grid */}
        {stats && !loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatCard
                icon="💪"
                title="This Week"
                value={stats.weeklyWorkouts}
                subtitle="workouts"
              />
              <StatCard
                icon="🔥"
                title="Today"
                value={stats.todayCalories}
                subtitle="calories"
              />
              <StatCard
                icon="🎯"
                title="Streak"
                value={stats.workoutStreak}
                subtitle="days"
                trend={stats.workoutStreak > 0 ? 'up' : 'neutral'}
              />
              <StatCard
                icon="⭐"
                title="This Month"
                value={stats.monthlyStats.totalWorkouts}
                subtitle="workouts"
              />
            </div>

            {/* Macros Breakdown */}
            {stats.todayMacros && (
              <StatCard
                title="Today's Macros"
                value={`${stats.todayMacros.calories} kcal`}
                icon="📊"
              >
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-900/30">
                    <p className="font-semibold text-blue-700 dark:text-blue-300">
                      {stats.todayMacros.protein.toFixed(0)}g
                    </p>
                    <p className="text-blue-600 dark:text-blue-400">Protein</p>
                  </div>
                  <div className="rounded-lg bg-amber-50 p-2 dark:bg-amber-900/30">
                    <p className="font-semibold text-amber-700 dark:text-amber-300">
                      {stats.todayMacros.carbs.toFixed(0)}g
                    </p>
                    <p className="text-amber-600 dark:text-amber-400">Carbs</p>
                  </div>
                  <div className="rounded-lg bg-red-50 p-2 dark:bg-red-900/30">
                    <p className="font-semibold text-red-700 dark:text-red-300">
                      {stats.todayMacros.fat.toFixed(0)}g
                    </p>
                    <p className="text-red-600 dark:text-red-400">Fat</p>
                  </div>
                </div>
              </StatCard>
            )}

            {/* Favorite Exercises */}
            {stats.favoriteExercises.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-[color:var(--foreground)]">
                  Top Exercises
                </h3>
                <div className="grid gap-2">
                  {stats.favoriteExercises.map((ex: any, idx: number) => (
                    <div
                      key={ex.exercise}
                      className="flex items-center justify-between rounded-lg border border-zinc-200 bg-[color:var(--background)] p-3 dark:border-zinc-800"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[color:var(--foreground)]">
                          {ex.exercise}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-semibold dark:bg-zinc-800">
                          {ex.count}x
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-[color:var(--foreground)]">
                Recent Activity
              </h3>
              <RecentActivity entries={stats.recentEntries} />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-700"
              />
            ))}
          </div>
        )}
      </section>
    </AppLayout>
  );
}
