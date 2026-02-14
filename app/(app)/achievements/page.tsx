'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/lib/contexts/ToastContext';
import {
  getMilestoneProgress,
  gatherAchievementStats,
  type AchievementDefinition,
  type UserAchievementStats,
} from '@/lib/achievements';
import AppLayout from '@/components/layout/AppLayout';
import AchievementCard from '@/components/features/AchievementCard';
import StreakIndicator from '@/components/features/StreakIndicator';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { Award, Filter } from 'lucide-react';

type FilterType = 'all' | 'unlocked' | 'locked' | 'streak' | 'workout_count' | 'weight_milestone' | 'personal_record';

export default function AchievementsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [milestones, setMilestones] = useState<
    Array<AchievementDefinition & { unlocked: boolean; unlockedAt?: Date; progress: number }>
  >([]);
  const [stats, setStats] = useState<UserAchievementStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');

  // Fetch achievement data
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const [milestoneData, statsData] = await Promise.all([
          getMilestoneProgress(user.uid),
          gatherAchievementStats(user.uid),
        ]);
        setMilestones(milestoneData);
        setStats(statsData);
      } catch (error) {
        console.error('Error fetching achievements:', error);
        showToast('Failed to load achievements', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, showToast]);

  // Filtered milestones
  const filteredMilestones = useMemo(() => {
    switch (filter) {
      case 'unlocked':
        return milestones.filter((m) => m.unlocked);
      case 'locked':
        return milestones.filter((m) => !m.unlocked);
      case 'streak':
      case 'workout_count':
      case 'weight_milestone':
      case 'personal_record':
        return milestones.filter((m) => m.type === filter);
      default:
        return milestones;
    }
  }, [milestones, filter]);

  const unlockedCount = milestones.filter((m) => m.unlocked).length;
  const totalCount = milestones.length;

  const filters: { label: string; value: FilterType }[] = [
    { label: 'All', value: 'all' },
    { label: 'Unlocked', value: 'unlocked' },
    { label: 'Locked', value: 'locked' },
    { label: 'Streaks', value: 'streak' },
    { label: 'Workouts', value: 'workout_count' },
    { label: 'Weight', value: 'weight_milestone' },
    { label: 'Records', value: 'personal_record' },
  ];

  return (
    <AppLayout title="Achievements">
      <section className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3">
            <Award className="w-7 h-7 text-[color:var(--foreground)]" />
            <div>
              <h2 className="text-2xl font-semibold text-[color:var(--foreground)]">
                Achievements
              </h2>
              <p className="text-sm text-[color:var(--muted-foreground)]">
                Track your fitness milestones
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            <ListSkeleton count={1} type="stat" />
            <ListSkeleton count={4} type="workout" />
          </div>
        ) : (
          <>
            {/* Streak Indicator */}
            {stats && (
              <StreakIndicator
                currentStreak={stats.currentStreak}
                longestStreak={stats.longestStreak}
                totalWorkouts={stats.totalWorkouts}
              />
            )}

            {/* Overall progress */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-[color:var(--foreground)]">
                  Overall Progress
                </span>
                <span className="text-sm font-bold text-[color:var(--foreground)]">
                  {unlockedCount}/{totalCount}
                </span>
              </div>
              <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[color:var(--foreground)] rounded-full transition-all duration-700"
                  style={{
                    width: `${totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Filter chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <Filter className="w-4 h-4 text-[color:var(--muted-foreground)] shrink-0" />
              {filters.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    filter === f.value
                      ? 'bg-[color:var(--foreground)] text-[color:var(--background)]'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-[color:var(--muted-foreground)] hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Achievement grid */}
            {filteredMilestones.length === 0 ? (
              <div className="text-center py-12">
                <Award className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
                <p className="text-sm text-[color:var(--muted-foreground)]">
                  No achievements match this filter
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredMilestones.map((milestone, index) => (
                  <AchievementCard key={index} achievement={milestone} />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </AppLayout>
  );
}
