'use client';

import { Flame, Dumbbell, Trophy } from 'lucide-react';

interface StreakIndicatorProps {
  currentStreak: number;
  longestStreak: number;
  totalWorkouts: number;
}

/**
 * Shows current workout streak and quick stats
 */
export default function StreakIndicator({
  currentStreak,
  longestStreak,
  totalWorkouts,
}: StreakIndicatorProps) {
  return (
    <div className="flex items-center gap-4">
      {/* Current Streak */}
      <div className="flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 px-3 py-2">
        <Flame
          className={`w-5 h-5 ${
            currentStreak > 0
              ? 'text-orange-500'
              : 'text-zinc-400 dark:text-zinc-600'
          }`}
        />
        <div>
          <p className="text-sm font-bold text-[color:var(--foreground)] leading-tight">
            {currentStreak}
          </p>
          <p className="text-[10px] text-[color:var(--muted-foreground)] leading-tight">
            Streak
          </p>
        </div>
      </div>

      {/* Longest Streak */}
      <div className="flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 px-3 py-2">
        <Trophy className="w-5 h-5 text-amber-500" />
        <div>
          <p className="text-sm font-bold text-[color:var(--foreground)] leading-tight">
            {longestStreak}
          </p>
          <p className="text-[10px] text-[color:var(--muted-foreground)] leading-tight">
            Best
          </p>
        </div>
      </div>

      {/* Total Workouts */}
      <div className="flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 px-3 py-2">
        <Dumbbell className="w-5 h-5 text-blue-500" />
        <div>
          <p className="text-sm font-bold text-[color:var(--foreground)] leading-tight">
            {totalWorkouts}
          </p>
          <p className="text-[10px] text-[color:var(--muted-foreground)] leading-tight">
            Total
          </p>
        </div>
      </div>
    </div>
  );
}
