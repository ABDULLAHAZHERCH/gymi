'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { WorkoutSession } from '@/lib/types/firestore';
import { ChevronDown } from 'lucide-react';

interface ProgramSessionCardProps {
  session: WorkoutSession;
}

export default function ProgramSessionCard({ session }: ProgramSessionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const intensityColors = {
    light: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200',
    moderate: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200',
    high: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200',
  };

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
      {/* Session Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-4 py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
      >
        <div className="flex items-center gap-3 flex-1 text-left">
          <div>
            <h4 className="font-semibold text-[color:var(--foreground)]">{session.name}</h4>
            <div className="flex gap-2 mt-1 text-sm">
              <span className="text-[color:var(--muted-foreground)]">{session.exercises?.length || 0} ex</span>
              <span className="text-[color:var(--muted-foreground)]">•</span>
              <span className="text-[color:var(--muted-foreground)]">{session.estimatedDuration}m</span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${intensityColors[session.intensity]}`}>
                {session.intensity}
              </span>
            </div>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 flex-shrink-0 text-[color:var(--muted-foreground)] transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Session Details */}
      {isExpanded && (
        <div className="space-y-4 border-t border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
          {/* Exercises */}
          <div className="space-y-3">
            {session.exercises && session.exercises.length > 0 ? (
              session.exercises.map((exercise, index) => (
                <div key={index} className="space-y-2 rounded bg-[color:var(--background)] p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-medium text-[color:var(--foreground)]">{exercise.name}</h5>
                      <p className="text-xs text-[color:var(--muted-foreground)]">
                        {exercise.muscleGroups?.join(', ')}
                      </p>
                    </div>
                  </div>

                  {/* Sets, Reps, Weight */}
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-[color:var(--muted-foreground)]">Sets</span>
                      <p className="font-semibold text-[color:var(--foreground)]">{exercise.sets}</p>
                    </div>
                    <div>
                      <span className="text-[color:var(--muted-foreground)]">Reps</span>
                      <p className="font-semibold text-[color:var(--foreground)]">
                        {typeof exercise.reps === 'string' ? exercise.reps : `${exercise.reps}x`}
                      </p>
                    </div>
                    <div>
                      <span className="text-[color:var(--muted-foreground)]">Weight</span>
                      <p className="text-xs font-semibold text-[color:var(--foreground)]">
                        {exercise.weight || '-'}
                      </p>
                    </div>
                  </div>

                  {/* Additional Details */}
                  {exercise.restSeconds && (
                    <div className="text-xs text-[color:var(--muted-foreground)]">
                      Rest: {exercise.restSeconds}s
                    </div>
                  )}

                  {/* Notes */}
                  {exercise.notes && (
                    <div className="text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded p-2">
                      💡 {exercise.notes}
                    </div>
                  )}

                  {/* Progression Notes */}
                  {exercise.progressionNotes && (
                    <div className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded p-2">
                      📈 {exercise.progressionNotes}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-sm text-[color:var(--muted-foreground)]">No exercises added</div>
            )}
          </div>

          {/* Session Notes */}
          {session.notes && (
            <div className="rounded bg-[color:var(--background)] p-3 text-sm">
              <p className="text-[color:var(--foreground)]">{session.notes}</p>
            </div>
          )}

          {/* Log Button */}
          <Link
            href="/workouts"
            className="block w-full rounded-lg bg-[color:var(--foreground)] px-4 py-2 text-center text-sm font-semibold text-[color:var(--background)]"
          >
            Log This Workout
          </Link>
        </div>
      )}
    </div>
  );
}
