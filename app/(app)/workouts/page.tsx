'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/lib/contexts/ToastContext';
import { getErrorMessage } from '@/lib/utils/errorMessages';
import { getWorkouts, addWorkout, updateWorkout, deleteWorkout } from '@/lib/workouts';
import {
  addWorkoutOffline,
  getWorkoutsOffline,
  updateWorkoutOffline,
  deleteWorkoutOffline,
  addToSyncQueue,
} from '@/lib/offline/offlineStore';
import { useOffline } from '@/lib/hooks/useOffline';
import { Workout } from '@/lib/types/firestore';
import AppLayout from '@/components/layout/AppLayout';
import WorkoutList from '@/components/features/WorkoutList';
import WorkoutForm from '@/components/features/WorkoutForm';
import Modal from '@/components/ui/Modal';
import SearchBar from '@/components/ui/SearchBar';
import FilterPanel, { FilterOptions } from '@/components/features/FilterPanel';
import { searchAndFilterWorkouts } from '@/lib/utils/search';
import { triggerWorkoutNotifications } from '@/lib/notificationTriggers';
import { useUnits } from '@/components/providers/UnitProvider';
import { useCachedData } from '@/lib/hooks/useCachedData';
import { getActivePrograms, logProgramSession } from '@/lib/workoutPrograms';
import { WorkoutProgram } from '@/lib/types/firestore';

type WorkoutViewMode = 'today' | 'day' | 'all';

const getLocalDayKey = (value: Date | string): string => {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

type ProgramSessionOption = {
  key: string;
  label: string;
  programSessionId: string;
  sessionName: string;
  exercises: Array<{
    name: string;
    sets?: number;
    reps?: number;
  }>;
  firstExerciseName?: string;
  firstExerciseSets?: number;
  firstExerciseReps?: number;
};

const parseRepsToNumber = (reps: string | number): number | undefined => {
  if (typeof reps === 'number') {
    return reps;
  }

  const match = reps.match(/\d+/);
  return match ? Number(match[0]) : undefined;
};

const getSessionOptions = (program: WorkoutProgram | null): ProgramSessionOption[] => {
  if (!program) {
    return [];
  }

  const options: ProgramSessionOption[] = [];
  const days =
    (program.plan?.days && program.plan.days.length > 0
      ? program.plan.days
      : (program.plan?.weeks || []).flatMap((week) => week.days || [])) || [];

  for (const day of days) {
    for (const session of day.sessions || []) {
      const firstExercise = session.exercises?.[0];
      const exercises = (session.exercises || []).map((exercise) => ({
        name: exercise.name,
        sets: exercise.sets,
        reps: parseRepsToNumber(exercise.reps),
      }));

      options.push({
        key: `${day.dayNumber}-${session.sessionId}`,
        label: `${day.dayName} • ${session.name}`,
        programSessionId: session.sessionId,
        sessionName: session.name,
        exercises,
        firstExerciseName: firstExercise?.name,
        firstExerciseSets: firstExercise?.sets,
        firstExerciseReps: firstExercise ? parseRepsToNumber(firstExercise.reps) : undefined,
      });
    }
  }

  return options;
};

export default function WorkoutsPage() {
  const { user } = useAuth();
  const { unitSystem } = useUnits();
  const { showToast } = useToast();
  const { isOnline, setUid } = useOffline();

  // Cached data fetching — instant on revisit
  const {
    data: workouts = [],
    loading: workoutLoading,
    setData: setWorkouts,
  } = useCachedData<Workout[]>({
    key: `workouts:${user?.uid}`,
    fetcher: useCallback(async () => {
      if (isOnline) {
        return getWorkouts(user!.uid);
      } else {
        return getWorkoutsOffline(user!.uid);
      }
    }, [user, isOnline]),
    enabled: !!user,
  });

  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({});
  const [viewMode, setViewMode] = useState<WorkoutViewMode>('today');
  const [selectedDay, setSelectedDay] = useState(getLocalDayKey(new Date()));
  const [programsExpanded, setProgramsExpanded] = useState(false);
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [selectedSessionKey, setSelectedSessionKey] = useState('');
  const [selectedProgramContext, setSelectedProgramContext] = useState<{
    programId: string;
    programSessionId: string;
    programName: string;
    programSessionName: string;
  } | null>(null);
  const [prefillData, setPrefillData] = useState<
    Partial<Pick<Workout, 'exercise' | 'sets' | 'reps' | 'notes'>> | undefined
  >(undefined);

  const {
    data: activePrograms = [],
    loading: programsLoading,
  } = useCachedData<WorkoutProgram[]>({
    key: `programs:${user?.uid}:active`,
    fetcher: useCallback(() => getActivePrograms(user!.uid), [user]),
    enabled: !!user,
  });

  // Set UID for sync manager
  useEffect(() => {
    if (user) setUid(user.uid);
  }, [user, setUid]);

  // Filter and search workouts
  const filteredWorkouts = useMemo(() => {
    const base = searchAndFilterWorkouts(workouts, searchQuery, filters);

    if (viewMode === 'all') {
      return base;
    }

    const targetDay = viewMode === 'today' ? getLocalDayKey(new Date()) : selectedDay;
    return base.filter((workout) => getLocalDayKey(workout.date) === targetDay);
  }, [workouts, searchQuery, filters, viewMode, selectedDay]);

  useEffect(() => {
    if (!activePrograms.length) {
      setSelectedProgramId('');
      setSelectedSessionKey('');
      return;
    }

    if (!selectedProgramId || !activePrograms.some((p) => p.id === selectedProgramId)) {
      setSelectedProgramId(activePrograms[0].id);
      setSelectedSessionKey('');
    }
  }, [activePrograms, selectedProgramId]);

  const selectedProgram = useMemo(
    () => activePrograms.find((program) => program.id === selectedProgramId) || null,
    [activePrograms, selectedProgramId]
  );

  const sessionOptions = useMemo(
    () => getSessionOptions(selectedProgram),
    [selectedProgram]
  );

  useEffect(() => {
    if (!sessionOptions.length) {
      setSelectedSessionKey('');
      return;
    }

    if (!selectedSessionKey || !sessionOptions.some((session) => session.key === selectedSessionKey)) {
      setSelectedSessionKey(sessionOptions[0].key);
    }
  }, [sessionOptions, selectedSessionKey]);

  const selectedSession = useMemo(
    () => sessionOptions.find((session) => session.key === selectedSessionKey) || null,
    [sessionOptions, selectedSessionKey]
  );

  const handleClearFilters = () => {
    setFilters({});
    setSearchQuery('');
  };

  const handleAddWorkout = async (
    data: Omit<Workout, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!user) return;

    setFormLoading(true);
    try {
      let id: string;

      if (isOnline) {
        id = await addWorkout(user.uid, data);
      } else {
        // Save locally and queue for sync
        id = await addWorkoutOffline(user.uid, data);
        await addToSyncQueue(user.uid, 'create', 'workouts', id, { ...data, id });
        showToast('Saved offline — will sync when online', 'info');
      }

      const newWorkout: Workout = {
        ...data,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (isOnline && data.programId) {
        try {
          await logProgramSession(user.uid, data.programId);
        } catch {
          // Non-blocking: workout log is successful even if adherence update fails.
        }
      }

      setWorkouts((prev = []) => [newWorkout, ...prev]);
      setIsModalOpen(false);
      if (isOnline) {
        showToast('Workout added successfully!', 'success');
        triggerWorkoutNotifications(user.uid, unitSystem).catch(() => {});
      }
    } catch (error: any) {
      console.error('Error adding workout:', error);
      showToast(getErrorMessage(error, 'Failed to add workout'), 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateWorkout = async (
    data: Omit<Workout, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!user || !editingWorkout) return;

    setFormLoading(true);
    try {
      if (isOnline) {
        await updateWorkout(user.uid, editingWorkout.id, data);
      } else {
        await updateWorkoutOffline(user.uid, editingWorkout.id, data);
        await addToSyncQueue(user.uid, 'update', 'workouts', editingWorkout.id, data);
        showToast('Updated offline — will sync when online', 'info');
      }

      setWorkouts((prev = []) =>
        prev.map((w) =>
          w.id === editingWorkout.id
            ? { ...w, ...data, updatedAt: new Date() }
            : w
        )
      );
      setIsModalOpen(false);
      setEditingWorkout(null);
      if (isOnline) showToast('Workout updated successfully!', 'success');
    } catch (error: any) {
      console.error('Error updating workout:', error);
      showToast(getErrorMessage(error, 'Failed to update workout'), 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    if (!user) return;

    if (!confirm('Are you sure you want to delete this workout?')) {
      return;
    }

    try {
      if (isOnline) {
        await deleteWorkout(user.uid, workoutId);
      } else {
        await deleteWorkoutOffline(user.uid, workoutId);
        await addToSyncQueue(user.uid, 'delete', 'workouts', workoutId, null);
        showToast('Deleted offline — will sync when online', 'info');
      }

      setWorkouts((prev = []) => prev.filter((w) => w.id !== workoutId));
      if (isOnline) showToast('Workout deleted successfully!', 'success');
    } catch (error: any) {
      console.error('Error deleting workout:', error);
      showToast(getErrorMessage(error, 'Failed to delete workout'), 'error');
    }
  };

  const handleEditWorkout = (workout: Workout) => {
    setEditingWorkout(workout);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingWorkout(null);
  };

  const handleOpenAddModal = () => {
    setEditingWorkout(null);
    setIsModalOpen(true);
  };

  const handleUseProgramSession = () => {
    if (!selectedProgram || !selectedSession) {
      return;
    }

    setSelectedProgramContext({
      programId: selectedProgram.id,
      programSessionId: selectedSession.programSessionId,
      programName: selectedProgram.programName,
      programSessionName: selectedSession.sessionName,
    });

    setPrefillData({
      exercise: selectedSession.exercises[0]?.name || selectedSession.firstExerciseName,
      sets: selectedSession.exercises[0]?.sets || selectedSession.firstExerciseSets,
      reps: selectedSession.exercises[0]?.reps || selectedSession.firstExerciseReps,
      notes: selectedSession.firstExerciseName
        ? `From ${selectedProgram.programName} • ${selectedSession.sessionName}`
        : undefined,
    });

    setEditingWorkout(null);
    setIsModalOpen(true);
  };

  const handleClearProgramContext = () => {
    setSelectedProgramContext(null);
    setPrefillData(undefined);
  };

  return (
    <AppLayout title="Workouts">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-[color:var(--foreground)]">
              Workouts
            </h2>
            <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
              Track your exercise sessions
            </p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="flex h-12 items-center gap-2 rounded-full bg-[color:var(--foreground)] px-6 text-sm font-semibold text-[color:var(--background)]"
          >
            <Plus className="h-5 w-5" />
            Add
          </button>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-[color:var(--background)] p-4 shadow-sm dark:border-zinc-800">
          <button
            onClick={() => setProgramsExpanded((prev) => !prev)}
            className="flex w-full items-center justify-between text-left"
          >
            <div>
              <h3 className="text-sm font-semibold text-[color:var(--foreground)]">
                Follow a Program (Optional)
              </h3>
              <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">
                Select a program session and prefill your workout log.
              </p>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-[color:var(--muted-foreground)] transition-transform ${
                programsExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>

          {programsExpanded && (
            <div className="mt-4 space-y-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
              {programsLoading ? (
                <p className="text-sm text-[color:var(--muted-foreground)]">Loading programs...</p>
              ) : activePrograms.length === 0 ? (
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="text-sm text-[color:var(--muted-foreground)]">
                    No active programs found yet.
                  </p>
                  <Link
                    href="/programs"
                    className="mt-3 inline-flex rounded-full border border-zinc-200 px-4 py-1.5 text-xs font-semibold text-[color:var(--foreground)] dark:border-zinc-800"
                  >
                    Open Template Library
                  </Link>
                </div>
              ) : (
                <>
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="block text-xs font-medium text-[color:var(--foreground)]">
                      Program
                      <select
                        value={selectedProgramId}
                        onChange={(e) => setSelectedProgramId(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-zinc-200 bg-[color:var(--background)] px-3 py-2 text-sm outline-none focus:border-black dark:border-zinc-800 dark:focus:border-white"
                      >
                        {activePrograms.map((program) => (
                          <option key={program.id} value={program.id}>
                            {program.programName}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block text-xs font-medium text-[color:var(--foreground)]">
                      Session
                      <select
                        value={selectedSessionKey}
                        onChange={(e) => setSelectedSessionKey(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-zinc-200 bg-[color:var(--background)] px-3 py-2 text-sm outline-none focus:border-black dark:border-zinc-800 dark:focus:border-white"
                      >
                        {sessionOptions.map((session) => (
                          <option key={session.key} value={session.key}>
                            {session.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {selectedProgramContext && (
                    <p className="text-xs text-[color:var(--muted-foreground)]">
                      Current linked session: {selectedProgramContext.programName} ({selectedProgramContext.programSessionName})
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleUseProgramSession}
                      disabled={!selectedSession}
                      className="rounded-full bg-[color:var(--foreground)] px-4 py-2 text-xs font-semibold text-[color:var(--background)] disabled:opacity-50"
                    >
                      Use Session in Log Form
                    </button>
                    {selectedProgramContext && (
                      <button
                        onClick={handleClearProgramContext}
                        className="rounded-full border border-zinc-200 px-4 py-2 text-xs font-semibold text-[color:var(--foreground)] dark:border-zinc-800"
                      >
                        Clear Linked Session
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Search & Filters */}
        <div className="space-y-3">
          <div className="rounded-2xl border border-zinc-200 bg-[color:var(--background)] p-3 dark:border-zinc-800">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setViewMode('today')}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  viewMode === 'today'
                    ? 'bg-[color:var(--foreground)] text-[color:var(--background)]'
                    : 'border border-zinc-200 text-[color:var(--foreground)] dark:border-zinc-800'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setViewMode('day')}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  viewMode === 'day'
                    ? 'bg-[color:var(--foreground)] text-[color:var(--background)]'
                    : 'border border-zinc-200 text-[color:var(--foreground)] dark:border-zinc-800'
                }`}
              >
                By Day
              </button>
              <button
                onClick={() => setViewMode('all')}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  viewMode === 'all'
                    ? 'bg-[color:var(--foreground)] text-[color:var(--background)]'
                    : 'border border-zinc-200 text-[color:var(--foreground)] dark:border-zinc-800'
                }`}
              >
                All
              </button>

              {viewMode === 'day' && (
                <input
                  type="date"
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="ml-auto rounded-lg border border-zinc-200 bg-[color:var(--background)] px-3 py-1.5 text-xs outline-none focus:border-black dark:border-zinc-800 dark:focus:border-white"
                />
              )}
            </div>
          </div>

          <SearchBar
            placeholder="Search workouts..."
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={() => setSearchQuery('')}
          />
          <FilterPanel
            type="workout"
            filters={filters}
            onFilterChange={setFilters}
            onClear={handleClearFilters}
          />
        </div>

        {/* Result count */}
        {(searchQuery || Object.keys(filters).length > 0) && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {filteredWorkouts.length} workout{filteredWorkouts.length !== 1 ? 's' : ''} found
          </p>
        )}

        {/* Workouts List */}
        <WorkoutList
          workouts={filteredWorkouts}
          onEdit={handleEditWorkout}
          onDelete={handleDeleteWorkout}
          isLoading={workoutLoading}
        />
      </section>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
        <WorkoutForm
          onSubmit={editingWorkout ? handleUpdateWorkout : handleAddWorkout}
          onCancel={handleCloseModal}
          initialData={editingWorkout || undefined}
          isLoading={formLoading}
          programContext={editingWorkout ? null : selectedProgramContext}
          prefillData={editingWorkout ? undefined : prefillData}
          suggestedExercises={editingWorkout ? undefined : selectedSession?.exercises}
          onClearProgramContext={editingWorkout ? undefined : handleClearProgramContext}
        />
      </Modal>
    </AppLayout>
  );
}
