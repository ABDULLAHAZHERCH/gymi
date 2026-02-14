'use client';

import { Achievement } from '@/lib/types/firestore';

interface AchievementCardProps {
  achievement: {
    type: Achievement['type'];
    title: string;
    description: string;
    icon: string;
    milestone: number;
    unlocked: boolean;
    unlockedAt?: Date;
    progress: number;
  };
}

/**
 * Display a single achievement card (locked or unlocked)
 */
export default function AchievementCard({ achievement }: AchievementCardProps) {
  const { title, description, icon, unlocked, unlockedAt, progress } = achievement;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-4 transition-all ${
        unlocked
          ? 'border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900'
          : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 opacity-60'
      }`}
    >
      {/* Icon */}
      <div className="flex items-start gap-3">
        <div
          className={`text-3xl flex-shrink-0 ${
            unlocked ? '' : 'grayscale'
          }`}
        >
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-[color:var(--foreground)] truncate">
            {title}
          </h3>
          <p className="text-xs text-[color:var(--muted-foreground)] mt-0.5">
            {description}
          </p>

          {/* Progress bar (for locked achievements) */}
          {!unlocked && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[color:var(--muted-foreground)]">
                  {progress}%
                </span>
              </div>
              <div className="h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-zinc-500 dark:bg-zinc-400 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Unlocked date */}
          {unlocked && unlockedAt && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1.5 font-medium">
              ✓ Earned{' '}
              {new Date(unlockedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          )}
        </div>
      </div>

      {/* Unlocked glow effect */}
      {unlocked && (
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-transparent to-zinc-100/20 dark:to-zinc-700/10" />
      )}
    </div>
  );
}
