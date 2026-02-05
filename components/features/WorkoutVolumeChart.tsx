'use client';

import { Workout } from '@/lib/types/firestore';

interface WorkoutVolumeChartProps {
  workouts: Workout[];
  days?: number; // Number of days to show
}

export function WorkoutVolumeChart({ workouts, days = 30 }: WorkoutVolumeChartProps) {
  if (workouts.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-center">
        <p className="text-sm text-[color:var(--muted-foreground)]">
          No workout data available.
        </p>
      </div>
    );
  }

  // Group workouts by date and calculate total volume (sets * reps * weight)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const dailyVolume: Record<string, number> = {};
  
  // Initialize all dates with 0
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateKey = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    dailyVolume[dateKey] = 0;
  }

  // Calculate volume for each workout
  workouts.forEach((workout) => {
    const workoutDate = new Date(workout.date);
    if (workoutDate >= startDate && workoutDate <= endDate) {
      const dateKey = workoutDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
      const volume = (workout.sets || 0) * (workout.reps || 0) * (workout.weight || 0);
      dailyVolume[dateKey] = (dailyVolume[dateKey] || 0) + volume;
    }
  });

  const dates = Object.keys(dailyVolume);
  const volumes = Object.values(dailyVolume);
  const maxVolume = Math.max(...volumes) || 1;

  // Calculate stats
  const totalVolume = volumes.reduce((sum, v) => sum + v, 0);
  const avgVolume = totalVolume / dates.length;
  const workoutDays = volumes.filter(v => v > 0).length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <p className="text-xs text-[color:var(--muted-foreground)]">Total Volume</p>
          <p className="text-lg font-semibold text-[color:var(--foreground)]">
            {(totalVolume / 1000).toFixed(1)}k
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-[color:var(--muted-foreground)]">Workout Days</p>
          <p className="text-lg font-semibold text-[color:var(--foreground)]">{workoutDays}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-[color:var(--muted-foreground)]">Avg/Day</p>
          <p className="text-lg font-semibold text-[color:var(--foreground)]">
            {(avgVolume / 1000).toFixed(1)}k
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-48 flex items-end gap-1">
        {dates.slice(-14).map((date, index) => {
          const volume = dailyVolume[date];
          const height = (volume / maxVolume) * 100 || 0;
          
          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-1 group">
              <div
                className={`w-full rounded-t transition-all ${
                  volume > 0
                    ? 'bg-purple-600 dark:bg-purple-500 hover:bg-purple-700 dark:hover:bg-purple-600'
                    : 'bg-zinc-200 dark:bg-zinc-800'
                } relative`}
                style={{ height: height > 0 ? `${height}%` : '2px' }}
              >
                {/* Tooltip */}
                {volume > 0 && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-2 py-1 rounded text-xs whitespace-nowrap">
                      {(volume / 1000).toFixed(1)}k
                      <div className="text-zinc-400 dark:text-zinc-600 text-[10px]">{date}</div>
                    </div>
                  </div>
                )}
              </div>
              {index % 3 === 0 && (
                <p className="text-[10px] text-[color:var(--muted-foreground)] -rotate-45 origin-top-left mt-1">
                  {date.split(' ')[1]}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-center text-[color:var(--muted-foreground)]">
        Last {Math.min(days, 14)} days • Volume = Sets × Reps × Weight
      </p>
    </div>
  );
}
