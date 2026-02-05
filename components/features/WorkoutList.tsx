'use client';

import { Dumbbell } from 'lucide-react';
import { Workout } from '@/lib/types/firestore';
import WorkoutCard from './WorkoutCard';
import { ListSkeleton } from '../ui/Skeleton';

interface WorkoutListProps {
  workouts: Workout[];
  onEdit: (workout: Workout) => void;
  onDelete: (workoutId: string) => void;
  isLoading?: boolean;
}

export default function WorkoutList({
  workouts,
  onEdit,
  onDelete,
  isLoading = false,
}: WorkoutListProps) {
  if (isLoading) {
    return <ListSkeleton count={3} type="workout" />;
  }

  if (workouts.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
        <div className="rounded-full bg-zinc-100 p-6 dark:bg-zinc-800">
          <Dumbbell className="h-12 w-12 text-[color:var(--muted-foreground)]" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-[color:var(--foreground)]">
            No workouts logged yet
          </h3>
          <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
            Start tracking your progress by adding your first workout.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {workouts.map((workout) => (
        <WorkoutCard
          key={workout.id}
          workout={workout}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
