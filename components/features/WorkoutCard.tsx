'use client';

import { Dumbbell, Edit2, Trash2 } from 'lucide-react';
import { Workout } from '@/lib/types/firestore';
import { useUnits } from '@/components/providers/UnitProvider';
import { displayWeight } from '@/lib/utils/units';

interface WorkoutCardProps {
  workout: Workout;
  onEdit: (workout: Workout) => void;
  onDelete: (workoutId: string) => void;
}

export default function WorkoutCard({ workout, onEdit, onDelete }: WorkoutCardProps) {
  const { unitSystem } = useUnits();
  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-[color:var(--background)] p-4 shadow-sm dark:border-zinc-800">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-zinc-100 p-2 dark:bg-zinc-800">
            <Dumbbell className="h-5 w-5 text-[color:var(--foreground)]" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-[color:var(--foreground)]">{workout.exercise}</h3>
            <p className="text-sm text-[color:var(--muted-foreground)]">
              {workout.sets} sets × {workout.reps} reps
              {workout.weight > 0 && ` • ${displayWeight(workout.weight, unitSystem)}`}
            </p>
            {workout.duration && (
              <p className="text-xs text-[color:var(--muted-foreground)]">
                Duration: {workout.duration} min
              </p>
            )}
            <p className="text-xs text-[color:var(--muted-foreground)]">{formatDate(workout.date)}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onEdit(workout)}
            className="rounded-full p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Edit workout"
          >
            <Edit2 className="h-4 w-4 text-[color:var(--muted-foreground)]" />
          </button>
          <button
            onClick={() => onDelete(workout.id)}
            className="rounded-full p-2 hover:bg-red-50 dark:hover:bg-red-900/20"
            aria-label="Delete workout"
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </button>
        </div>
      </div>

      {workout.notes && (
        <div className="mt-3 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
          <p className="text-sm text-[color:var(--muted-foreground)]">{workout.notes}</p>
        </div>
      )}
    </div>
  );
}
