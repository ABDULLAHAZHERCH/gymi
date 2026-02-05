'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import ExerciseLibrary from '@/components/features/ExerciseLibrary';
import { Exercise } from '@/lib/data/exercises';

export default function ExercisesPage() {
  const router = useRouter();

  const handleSelectExercise = (exercise: Exercise) => {
    // Navigate to logs page and pass exercise name
    router.push(`/logs?exercise=${encodeURIComponent(exercise.name)}`);
  };

  return (
    <AppLayout title="Exercise Library">
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-[color:var(--foreground)]">
            Exercise Library
          </h2>
          <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
            Browse exercises and learn proper form
          </p>
        </div>

        <ExerciseLibrary onSelectExercise={handleSelectExercise} selectionMode={true} />
      </section>
    </AppLayout>
  );
}
