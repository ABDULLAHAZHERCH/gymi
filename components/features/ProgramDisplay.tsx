'use client';

import React from 'react';
import { WorkoutProgram } from '@/lib/types/firestore';
import { TrendingUp } from 'lucide-react';
import ProgramDayView from './ProgramDayView';

interface ProgramDisplayProps {
  program: WorkoutProgram;
  onArchive?: () => void;
  onComplete?: () => void;
}

export default function ProgramDisplay({
  program,
  onArchive,
  onComplete,
}: ProgramDisplayProps) {
  const days =
    (program.plan?.days && program.plan.days.length > 0
      ? program.plan.days
      : (program.plan?.weeks || []).flatMap((week) => week.days || [])) || [];

  if (days.length === 0) {
    return (
      <div className="py-8 text-center text-[color:var(--muted-foreground)]">
        No program days available
      </div>
    );
  }

  // Calculate adherence percentage
  const adherencePercent = program.adherenceStats?.adherencePercent || 0;

  return (
    <div className="space-y-6">
      {/* Program Header */}
      <div className="rounded-2xl border border-zinc-200 bg-[color:var(--background)] p-6 shadow-sm dark:border-zinc-800">
        <h1 className="mb-2 text-2xl font-semibold text-[color:var(--foreground)]">
          {program.programName}
        </h1>
        <p className="mb-4 text-sm text-[color:var(--muted-foreground)]">{program.description}</p>

        {/* Program Stats */}
        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-900">
            <div className="text-xs uppercase tracking-wide text-[color:var(--muted-foreground)]">Goal</div>
            <div className="text-base font-semibold capitalize text-[color:var(--foreground)]">
              {program.metadata.goal.replace(/_/g, ' ')}
            </div>
          </div>

          <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-900">
            <div className="text-xs uppercase tracking-wide text-[color:var(--muted-foreground)]">Experience</div>
            <div className="text-base font-semibold capitalize text-[color:var(--foreground)]">
              {program.metadata.experienceLevel}
            </div>
          </div>

          <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-900">
            <div className="text-xs uppercase tracking-wide text-[color:var(--muted-foreground)]">Plan Days</div>
            <div className="text-base font-semibold text-[color:var(--foreground)]">
              {days.length} days
            </div>
          </div>

          <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-900">
            <div className="flex items-center gap-1 text-xs uppercase tracking-wide text-[color:var(--muted-foreground)]">
              <TrendingUp className="w-4 h-4" />
              Adherence
            </div>
            <div className="text-base font-semibold text-[color:var(--foreground)]">
              {adherencePercent}%
            </div>
          </div>
        </div>

        {/* Additional Metadata */}
        <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-3">
          <div>
            <span className="text-[color:var(--muted-foreground)]">Location:</span>{' '}
            <span className="capitalize text-[color:var(--foreground)]">
              {program.metadata.location}
            </span>
          </div>
          <div>
            <span className="text-[color:var(--muted-foreground)]">Days/Week:</span>{' '}
            <span className="text-[color:var(--foreground)]">{program.metadata.daysPerWeek}</span>
          </div>
          <div>
            <span className="text-[color:var(--muted-foreground)]">Session Length:</span>{' '}
            <span className="text-[color:var(--foreground)]">{program.metadata.sessionLengthMin}m</span>
          </div>
          {program.metadata.injuries && (
            <div className="col-span-2 md:col-span-3">
              <span className="text-[color:var(--muted-foreground)]">Constraints:</span>{' '}
              <span className="text-[color:var(--foreground)]">{program.metadata.injuries}</span>
            </div>
          )}
        </div>
      </div>

      {/* Day/Session Plan */}
      <div className="rounded-2xl border border-zinc-200 bg-[color:var(--background)] p-6 shadow-sm dark:border-zinc-800">
        <div className="mb-6">
          <div>
            <h2 className="text-xl font-semibold text-[color:var(--foreground)]">
              Sessions & Days
            </h2>
            <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
              This plan is organized directly by days and sessions.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {days.map((day) => (
            <ProgramDayView key={`${day.dayNumber}-${day.dayName}`} day={day} />
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      {program.status === 'active' && (
        <div className="flex gap-3">
          {onComplete && (
            <button
              onClick={onComplete}
              className="flex-1 rounded-lg bg-[color:var(--foreground)] px-4 py-2 text-sm font-semibold text-[color:var(--background)]"
            >
              Mark Program Complete
            </button>
          )}
          {onArchive && (
            <button
              onClick={onArchive}
              className="flex-1 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-semibold text-[color:var(--foreground)] dark:border-zinc-800"
            >
              Archive Program
            </button>
          )}
        </div>
      )}
    </div>
  );
}
