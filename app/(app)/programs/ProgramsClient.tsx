'use client';

import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { Calendar, CheckCircle2, ChevronDown, Clock3, Edit3, Play, Save, Trash2, X } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/components/providers/AuthProvider';
import { useCachedData } from '@/lib/hooks/useCachedData';
import {
  activateProgram,
  archiveProgram,
  completeProgram,
  createProgram,
  deleteProgram,
  getPrograms,
  updateProgram,
} from '@/lib/workoutPrograms';
import { ProgramMetadata, WorkoutProgram } from '@/lib/types/firestore';
import { useToast } from '@/lib/contexts/ToastContext';
import { getErrorMessage } from '@/lib/utils/errorMessages';
import { formatGoalLabel, PROGRAM_TEMPLATE_GOALS } from '@/lib/data/programTemplates';

type GeneratedProgramData = Omit<WorkoutProgram, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

const formatDate = (value?: Date): string => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getStatusClasses = (status: WorkoutProgram['status']) => {
  if (status === 'active') {
    return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
  }
  if (status === 'completed') {
    return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
  }
  return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300';
};

function isGeneratedProgramData(value: unknown): value is GeneratedProgramData {
  if (!value || typeof value !== 'object') return false;

  const program = value as Partial<GeneratedProgramData>;
  const hasPlanDays = !!program.plan && Array.isArray(program.plan.days);
  const hasPlanWeeks = !!program.plan && Array.isArray(program.plan.weeks);
  return (
    typeof program.programName === 'string' &&
    typeof program.description === 'string' &&
    !!program.metadata &&
    !!program.plan &&
    (hasPlanDays || hasPlanWeeks) &&
    typeof program.status === 'string'
  );
}

export default function ProgramsClient() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [templateDays, setTemplateDays] = useState(4);
  const [templateExpanded, setTemplateExpanded] = useState(false);
  const [templateLoadingGoal, setTemplateLoadingGoal] = useState<ProgramMetadata['goal'] | null>(null);
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);
  const [editingDays, setEditingDays] = useState(4);

  const {
    data: programs = [],
    loading,
    setData: setPrograms,
  } = useCachedData<WorkoutProgram[]>({
    key: `programs:${user?.uid}:all`,
    fetcher: useCallback(() => getPrograms(user!.uid), [user]),
    enabled: !!user,
  });

  const activeProgramId = useMemo(
    () => programs.find((program) => program.status === 'active')?.id,
    [programs]
  );

  const requestTemplateProgram = async (metadata: ProgramMetadata): Promise<GeneratedProgramData> => {
    const response = await fetch('/api/workout-program', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionnaire: metadata,
      }),
    });

    const rawBody = await response.text();
    let data: { success?: boolean; data?: unknown; error?: string };

    try {
      data = JSON.parse(rawBody) as { success?: boolean; data?: unknown; error?: string };
    } catch {
      throw new Error(`Program generation failed (${response.status})`);
    }

    if (!response.ok) {
      throw new Error(data.error || `Program generation failed (${response.status})`);
    }

    if (!data.success || !isGeneratedProgramData(data.data)) {
      throw new Error('Invalid generated template payload');
    }

    return data.data;
  };

  const buildMetadata = (
    goal: ProgramMetadata['goal'],
    daysPerWeek: number,
    existing?: ProgramMetadata
  ): ProgramMetadata => {
    if (existing) {
      return {
        ...existing,
        goal,
        daysPerWeek,
      };
    }

    return {
      goal,
      experienceLevel: 'intermediate',
      equipmentAccess: 'full_gym',
      location: 'gym',
      daysPerWeek,
      sessionLengthMin: 60,
    };
  };

  const activateTemplate = async (goal: ProgramMetadata['goal']) => {
    if (!user) return;
    setTemplateLoadingGoal(goal);

    try {
      const metadata = buildMetadata(goal, templateDays);
      const generated = await requestTemplateProgram(metadata);

      // Keep one active program at a time for a predictable logging flow.
      const currentlyActive = programs.filter((program) => program.status === 'active');
      for (const active of currentlyActive) {
        await archiveProgram(user.uid, active.id);
      }

      const newProgramId = await createProgram(user.uid, {
        ...generated,
        userId: user.uid,
        status: 'active',
      });

      const now = new Date();
      setPrograms((prev = []) => {
        const archived = prev.map((program) =>
          program.status === 'active'
            ? { ...program, status: 'archived' as const, updatedAt: now }
            : program
        );

        return [
          {
            ...generated,
            id: newProgramId,
            userId: user.uid,
            status: 'active',
            createdAt: now,
            updatedAt: now,
            startedAt: now,
          },
          ...archived,
        ];
      });

      showToast(`${formatGoalLabel(goal)} template activated`, 'success');
    } catch (error) {
      showToast(getErrorMessage(error, 'Failed to activate template'), 'error');
    } finally {
      setTemplateLoadingGoal(null);
    }
  };

  const startEditDays = (program: WorkoutProgram) => {
    setEditingProgramId(program.id);
    setEditingDays(Math.max(3, Math.min(7, program.metadata.daysPerWeek || 4)));
  };

  const cancelEditDays = () => {
    setEditingProgramId(null);
  };

  const saveEditDays = async (program: WorkoutProgram) => {
    if (!user) return;

    try {
      const metadata = buildMetadata(program.metadata.goal, editingDays, program.metadata);
      const generated = await requestTemplateProgram(metadata);

      await updateProgram(user.uid, program.id, {
        metadata,
        plan: generated.plan,
      });

      setPrograms((prev = []) =>
        prev.map((item) =>
          item.id === program.id
            ? {
                ...item,
                metadata,
                plan: generated.plan,
                updatedAt: new Date(),
              }
            : item
        )
      );

      setEditingProgramId(null);
      showToast('Program days updated', 'success');
    } catch (error) {
      showToast(getErrorMessage(error, 'Failed to update program days'), 'error');
    }
  };

  const handleDelete = async (programId: string) => {
    if (!user) return;
    if (!confirm('Delete this program? This action cannot be undone.')) return;

    try {
      await deleteProgram(user.uid, programId);
      setPrograms((prev = []) => prev.filter((program) => program.id !== programId));
      showToast('Program deleted', 'success');
    } catch (error) {
      showToast(getErrorMessage(error, 'Failed to delete program'), 'error');
    }
  };

  const handleStatus = async (
    programId: string,
    status: WorkoutProgram['status']
  ) => {
    if (!user) return;

    try {
      if (status === 'active') {
        await activateProgram(user.uid, programId);
      } else if (status === 'completed') {
        await completeProgram(user.uid, programId);
      } else {
        await archiveProgram(user.uid, programId);
      }

      setPrograms((prev = []) =>
        prev.map((program) =>
          program.id === programId
            ? {
                ...program,
                status,
                updatedAt: new Date(),
                completedAt: status === 'completed' ? new Date() : program.completedAt,
                startedAt: status === 'active' ? new Date() : program.startedAt,
              }
            : program
        )
      );

      showToast(`Program marked ${status}`, 'success');
    } catch (error) {
      showToast(getErrorMessage(error, 'Failed to update program status'), 'error');
    }
  };

  return (
    <AppLayout title="Programs">
      <section className="space-y-4">
        <div>
          <div>
            <h2 className="text-2xl font-semibold text-[color:var(--foreground)]">Programs</h2>
            <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
              Select a template and activate it. You can edit days later.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-[color:var(--background)] p-4 shadow-sm dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setTemplateExpanded((prev) => !prev)}
            className="flex w-full items-center justify-between text-left"
          >
            <div>
              <h3 className="text-sm font-semibold text-[color:var(--foreground)]">Template Library</h3>
              <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">
                Activate a goal template when needed.
              </p>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-[color:var(--muted-foreground)] transition-transform ${
                templateExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>

          {templateExpanded && (
            <div className="mt-4 space-y-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
              <label className="flex items-center gap-2 text-xs text-[color:var(--muted-foreground)]">
                Days
                <input
                  type="range"
                  min="3"
                  max="7"
                  value={templateDays}
                  onChange={(e) => setTemplateDays(parseInt(e.target.value, 10))}
                  className="w-24"
                />
                <span className="min-w-4 text-right font-semibold text-[color:var(--foreground)]">{templateDays}</span>
              </label>

              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {PROGRAM_TEMPLATE_GOALS.map((goal) => {
                  const isLoading = templateLoadingGoal === goal;

                  return (
                    <div
                      key={goal}
                      className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800"
                    >
                      <p className="text-sm font-semibold text-[color:var(--foreground)]">{formatGoalLabel(goal)}</p>
                      <button
                        onClick={() => activateTemplate(goal)}
                        disabled={isLoading}
                        className="mt-3 inline-flex items-center gap-1 rounded-full bg-[color:var(--foreground)] px-3 py-1.5 text-xs font-semibold text-[color:var(--background)] disabled:opacity-60"
                      >
                        <Play className="h-3.5 w-3.5" />
                        {isLoading ? 'Activating...' : 'Activate'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-[color:var(--background)] p-4 shadow-sm dark:border-zinc-800">
          <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
            Better Logging Flow
          </p>
          <p className="mt-2 text-sm text-[color:var(--foreground)]">
            Program session logging happens in the Workouts page so you can pick a program and log in one place.
          </p>
          <Link
            href="/workouts"
            className="mt-3 inline-flex rounded-full border border-zinc-200 px-4 py-1.5 text-xs font-semibold text-[color:var(--foreground)] dark:border-zinc-800"
          >
            Open Workouts
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-28 animate-pulse rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900" />
            ))}
          </div>
        ) : programs.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-[color:var(--background)] p-6 text-center shadow-sm dark:border-zinc-800">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
              <Calendar className="h-5 w-5 text-[color:var(--muted-foreground)]" />
            </div>
            <p className="text-sm font-semibold text-[color:var(--foreground)]">No programs yet</p>
            <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
              Activate a template above to start logging from the Workouts page.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {programs.map((program) => {
              const adherence = program.adherenceStats?.adherencePercent ?? 0;

              return (
                <article
                  key={program.id}
                  className="rounded-2xl border border-zinc-200 bg-[color:var(--background)] p-4 shadow-sm dark:border-zinc-800"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/programs/${program.id}`}
                        className="text-base font-semibold text-[color:var(--foreground)] hover:underline"
                      >
                        {program.programName}
                      </Link>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <span className={`rounded-full px-2 py-0.5 font-medium ${getStatusClasses(program.status)}`}>
                          {program.status}
                        </span>
                        {activeProgramId === program.id && (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                            current
                          </span>
                        )}
                        <span className="text-[color:var(--muted-foreground)]">
                          Created {formatDate(program.createdAt)}
                        </span>
                        <span className="text-[color:var(--muted-foreground)]">Adherence {adherence}%</span>
                        <span className="text-[color:var(--muted-foreground)]">{program.metadata.daysPerWeek} days</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/programs/${program.id}`}
                        className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-[color:var(--foreground)] dark:border-zinc-800"
                      >
                        Open
                      </Link>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {editingProgramId === program.id ? (
                      <>
                        <label className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1.5 text-xs dark:border-zinc-800">
                          Days
                          <input
                            type="range"
                            min="3"
                            max="7"
                            value={editingDays}
                            onChange={(e) => setEditingDays(parseInt(e.target.value, 10))}
                            className="w-20"
                          />
                          <span className="font-semibold">{editingDays}</span>
                        </label>
                        <button
                          onClick={() => saveEditDays(program)}
                          className="inline-flex items-center gap-1 rounded-full bg-[color:var(--foreground)] px-3 py-1.5 text-xs font-semibold text-[color:var(--background)]"
                        >
                          <Save className="h-3.5 w-3.5" />
                          Save Days
                        </button>
                        <button
                          onClick={cancelEditDays}
                          className="inline-flex items-center gap-1 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-[color:var(--foreground)] dark:border-zinc-800"
                        >
                          <X className="h-3.5 w-3.5" />
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => startEditDays(program)}
                        className="inline-flex items-center gap-1 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-[color:var(--foreground)] dark:border-zinc-800"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Edit Days
                      </button>
                    )}

                    {program.status !== 'completed' && (
                      <button
                        onClick={() => handleStatus(program.id, 'completed')}
                        className="inline-flex items-center gap-1 rounded-full bg-[color:var(--foreground)] px-3 py-1.5 text-xs font-semibold text-[color:var(--background)]"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Complete
                      </button>
                    )}

                    {program.status !== 'archived' && (
                      <button
                        onClick={() => handleStatus(program.id, 'archived')}
                        className="inline-flex items-center gap-1 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-[color:var(--foreground)] dark:border-zinc-800"
                      >
                        <Clock3 className="h-3.5 w-3.5" />
                        Archive
                      </button>
                    )}

                    {program.status !== 'active' && (
                      <button
                        onClick={() => handleStatus(program.id, 'active')}
                        className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-[color:var(--foreground)] dark:border-zinc-800"
                      >
                        Activate
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(program.id)}
                      className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 dark:border-red-900 dark:text-red-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </AppLayout>
  );
}
