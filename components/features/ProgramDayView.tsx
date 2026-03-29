'use client';

import React, { useState } from 'react';
import { WorkoutDay } from '@/lib/types/firestore';
import { ChevronDown, Dumbbell } from 'lucide-react';
import ProgramSessionCard from './ProgramSessionCard';

interface ProgramDayViewProps {
  day: WorkoutDay;
}

export default function ProgramDayView({ day }: ProgramDayViewProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!day.sessions || day.sessions.length === 0) {
    return (
      <div className="py-2 text-sm text-[color:var(--muted-foreground)]">
        {day.dayName}: Rest day
      </div>
    );
  }

  const totalExercises = day.sessions.reduce((sum, session) => sum + (session.exercises?.length || 0), 0);
  const estimatedDuration = day.sessions.reduce((sum, session) => sum + (session.estimatedDuration || 0), 0);

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
      {/* Day Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between bg-zinc-50 px-4 py-3 transition-colors hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-900"
      >
        <div className="flex items-center gap-3 flex-1 text-left">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span className="font-semibold text-[color:var(--foreground)]">{day.dayName}</span>
          </div>
          <span className="text-sm text-[color:var(--muted-foreground)]">
            {totalExercises} exercises • {estimatedDuration}m
          </span>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-[color:var(--muted-foreground)] transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Day Content */}
      {isExpanded && (
        <div className="space-y-3 bg-[color:var(--background)] p-4">
          {day.sessions.map((session, index) => (
            <ProgramSessionCard
              key={`${day.dayNumber}-${index}`}
              session={session}
            />
          ))}
        </div>
      )}
    </div>
  );
}
