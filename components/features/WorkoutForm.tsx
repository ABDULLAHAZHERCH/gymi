'use client';

import { useEffect, useState, FormEvent } from 'react';
import { Link2, X } from 'lucide-react';
import { Workout } from '@/lib/types/firestore';
import { getErrorMessage } from '@/lib/utils/errorMessages';
import { validateField, ValidationErrors } from '@/lib/utils/validation';
import { useFormShortcuts } from '@/lib/hooks/useKeyboardShortcut';
import { useUnits } from '@/components/providers/UnitProvider';
import { weightUnit, weightToKg, getWeightInUnit } from '@/lib/utils/units';
import { EXERCISE_DATABASE } from '@/lib/data/exercises';

// Helper to format Date to datetime-local string in user's local timezone
const formatDateToLocalString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

interface WorkoutFormProps {
  onSubmit: (data: Omit<Workout, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
  initialData?: Workout;
  isLoading?: boolean;
  programContext?: {
    programId: string;
    programSessionId: string;
    programName: string;
    programSessionName: string;
  } | null;
  prefillData?: Partial<Pick<Workout, 'exercise' | 'sets' | 'reps' | 'notes'>>;
  suggestedExercises?: Array<{
    name: string;
    sets?: number;
    reps?: number;
  }>;
  onClearProgramContext?: () => void;
}

export default function WorkoutForm({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
  programContext,
  prefillData,
  suggestedExercises,
  onClearProgramContext,
}: WorkoutFormProps) {
  const { unitSystem } = useUnits();
  const wu = weightUnit(unitSystem);
  const [formData, setFormData] = useState({
    exercise: initialData?.exercise || '',
    sets: initialData?.sets?.toString() || '',
    reps: initialData?.reps?.toString() || '',
    weight: initialData?.weight ? getWeightInUnit(initialData.weight, unitSystem).toString() : '',
    duration: initialData?.duration?.toString() || '',
    notes: initialData?.notes || '',
    date: initialData?.date
      ? formatDateToLocalString(new Date(initialData.date))
      : formatDateToLocalString(new Date()),
  });

  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [selectedExerciseName, setSelectedExerciseName] = useState(
    initialData?.exercise || prefillData?.exercise || ''
  );

  const exerciseOptions = EXERCISE_DATABASE
    .map((exercise) => exercise.name)
    .sort((a, b) => a.localeCompare(b));

  useEffect(() => {
    if (initialData || !prefillData) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      exercise: prefillData.exercise ?? prev.exercise,
      sets: prefillData.sets !== undefined ? String(prefillData.sets) : prev.sets,
      reps: prefillData.reps !== undefined ? String(prefillData.reps) : prev.reps,
      notes: prefillData.notes ?? prev.notes,
    }));
    if (prefillData.exercise) {
      setSelectedExerciseName(prefillData.exercise);
    }
  }, [initialData, prefillData]);

  const validationRules = {
    exercise: { required: true, minLength: 2 },
    sets: { required: true, min: 1 },
    reps: { required: true, min: 1 },
    weight: { min: 0 },
    duration: { min: 0 },
  };

  const handleBlur = (fieldName: string) => {
    setTouched({ ...touched, [fieldName]: true });
    
    const rule = validationRules[fieldName as keyof typeof validationRules];
    if (rule) {
      const error = validateField(fieldName, formData[fieldName as keyof typeof formData], rule);
      if (error) {
        setFieldErrors({ ...fieldErrors, [fieldName]: error });
      } else {
        const { [fieldName]: _, ...rest } = fieldErrors;
        setFieldErrors(rest);
      }
    }
  };

  const handleChange = (fieldName: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
    
    // Clear error on change if field was touched
    if (touched[fieldName] && fieldErrors[fieldName]) {
      const { [fieldName]: _, ...rest } = fieldErrors;
      setFieldErrors(rest);
    }
  };

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    // Validation
    if (!formData.exercise || !formData.sets || !formData.reps) {
      setError('Exercise, sets, and reps are required');
      return;
    }

    if (parseInt(formData.sets) <= 0 || parseInt(formData.reps) <= 0) {
      setError('Sets and reps must be positive numbers');
      return;
    }

    try {
      // Parse date from datetime-local format
      // datetime-local returns local time, we need to preserve it correctly
      const [datePart, timePart] = formData.date.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hour, minute] = timePart.split(':').map(Number);
      
      // Create date in local timezone (not UTC)
      const dateObj = new Date(year, month - 1, day, hour, minute, 0, 0);
      
      // Ensure valid date
      if (isNaN(dateObj.getTime())) {
        setError('Invalid date/time');
        return;
      }

      await onSubmit({
        exercise: formData.exercise.trim(),
        sets: parseInt(formData.sets),
        reps: parseInt(formData.reps),
        weight: formData.weight ? weightToKg(parseFloat(formData.weight), unitSystem) : 0,
        duration: formData.duration ? parseInt(formData.duration) : undefined,
        notes: formData.notes?.trim() || undefined,
        date: dateObj,
        programId: programContext?.programId,
        programSessionId: programContext?.programSessionId,
        programName: programContext?.programName,
        programSessionName: programContext?.programSessionName,
      });
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save workout'));
    }
  };

  // Keyboard shortcuts: Ctrl+Enter to submit, Escape to cancel
  useFormShortcuts({
    onSubmit: () => {
      if (!isLoading && Object.keys(fieldErrors).length === 0) {
        handleSubmit();
      }
    },
    onCancel: !isLoading ? onCancel : undefined,
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-[color:var(--foreground)]">
          {initialData ? 'Edit Workout' : 'Add Workout'}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {error && (
        <p className="rounded-lg bg-red-100 p-2 text-xs text-red-700 dark:bg-red-900 dark:text-red-100">
          {error}
        </p>
      )}

      {programContext && !initialData && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2 text-xs">
              <Link2 className="h-3.5 w-3.5 text-[color:var(--muted-foreground)]" />
              <p className="truncate text-[color:var(--muted-foreground)]">
                Linked to <span className="font-semibold text-[color:var(--foreground)]">{programContext.programName}</span>
                {' '}({programContext.programSessionName})
              </p>
            </div>
            {onClearProgramContext && (
              <button
                type="button"
                onClick={onClearProgramContext}
                className="text-xs font-medium text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {programContext && !initialData && suggestedExercises && suggestedExercises.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-[color:var(--background)] px-3 py-3 dark:border-zinc-800">
          <p className="text-xs font-medium text-[color:var(--foreground)]">Session Exercises</p>
          <p className="mt-1 text-[11px] text-[color:var(--muted-foreground)]">
            Tap an exercise to auto-fill name, sets, and reps.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestedExercises.map((exercise, index) => (
              <button
                key={`${exercise.name}-${index}`}
                type="button"
                onClick={() => {
                  handleChange('exercise', exercise.name);
                  setSelectedExerciseName(exercise.name);
                  if (exercise.sets !== undefined) {
                    handleChange('sets', String(exercise.sets));
                  }
                  if (exercise.reps !== undefined) {
                    handleChange('reps', String(exercise.reps));
                  }
                  if (programContext) {
                    setFormData((prev) => ({
                      ...prev,
                      notes: prev.notes || `From ${programContext.programName} • ${programContext.programSessionName}`,
                    }));
                  }
                }}
                className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-[color:var(--foreground)] hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
              >
                {exercise.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <label className="block text-xs font-medium">
          Choose Existing Exercise (Optional)
          <select
            value={selectedExerciseName}
            onChange={(e) => {
              const value = e.target.value;
              setSelectedExerciseName(value);
              if (value) {
                handleChange('exercise', value);
              }
            }}
            disabled={isLoading}
            className="mt-1 w-full rounded-lg border border-zinc-200 bg-[color:var(--background)] px-3 py-2 text-sm shadow-sm outline-none focus:border-black dark:border-zinc-800 dark:focus:border-white disabled:opacity-50"
          >
            <option value="">Type exercise manually</option>
            {exerciseOptions.map((exerciseName) => (
              <option key={exerciseName} value={exerciseName}>
                {exerciseName}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs font-medium">
          Exercise Name *
          <input
            type="text"
            placeholder="e.g., Bench Press"
            value={formData.exercise}
            onChange={(e) => {
              const value = e.target.value;
              handleChange('exercise', value);
              setSelectedExerciseName(value);
            }}
            onBlur={() => handleBlur('exercise')}
            disabled={isLoading}
            className={`mt-1 w-full rounded-lg border ${
              fieldErrors.exercise && touched.exercise
                ? 'border-red-500 dark:border-red-500'
                : 'border-zinc-200 dark:border-zinc-800'
            } bg-[color:var(--background)] px-3 py-2 text-sm shadow-sm outline-none focus:border-black dark:focus:border-white disabled:opacity-50`}
          />
          {fieldErrors.exercise && touched.exercise && (
            <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">
              {fieldErrors.exercise}
            </p>
          )}
          <p className="mt-0.5 text-[11px] text-[color:var(--muted-foreground)]">
            Select from the exercise library above or type any custom exercise name manually.
          </p>
        </label>

        <div className="grid grid-cols-3 gap-2">
          <label className="block text-xs font-medium">
            Sets *
            <input
              type="number"
              placeholder="3"
              min="1"
              value={formData.sets}
              onChange={(e) => handleChange('sets', e.target.value)}
              onBlur={() => handleBlur('sets')}
              disabled={isLoading}
              className={`mt-1 w-full rounded-lg border ${
                fieldErrors.sets && touched.sets
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-zinc-200 dark:border-zinc-800'
              } bg-[color:var(--background)] px-2 py-2 text-sm shadow-sm outline-none focus:border-black dark:focus:border-white disabled:opacity-50`}
            />
            {fieldErrors.sets && touched.sets && (
              <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">
                {fieldErrors.sets}
              </p>
            )}
          </label>

          <label className="block text-xs font-medium">
            Reps *
            <input
              type="number"
              placeholder="10"
              min="1"
              value={formData.reps}
              onChange={(e) => handleChange('reps', e.target.value)}
              onBlur={() => handleBlur('reps')}
              disabled={isLoading}
              className={`mt-1 w-full rounded-lg border ${
                fieldErrors.reps && touched.reps
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-zinc-200 dark:border-zinc-800'
              } bg-[color:var(--background)] px-2 py-2 text-sm shadow-sm outline-none focus:border-black dark:focus:border-white disabled:opacity-50`}
            />
            {fieldErrors.reps && touched.reps && (
              <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">
                {fieldErrors.reps}
              </p>
            )}
          </label>

          <label className="block text-xs font-medium">
            Weight ({wu})
            <input
              type="number"
              placeholder="60"
              min="0"
              step="0.5"
              value={formData.weight}
              onChange={(e) => handleChange('weight', e.target.value)}
              onBlur={() => handleBlur('weight')}
              disabled={isLoading}
              className={`mt-1 w-full rounded-lg border ${
                fieldErrors.weight && touched.weight
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-zinc-200 dark:border-zinc-800'
              } bg-[color:var(--background)] px-2 py-2 text-sm shadow-sm outline-none focus:border-black dark:focus:border-white disabled:opacity-50`}
            />
            {fieldErrors.weight && touched.weight && (
              <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">
                {fieldErrors.weight}
              </p>
            )}
          </label>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="block text-xs font-medium">
            Duration (min)
            <input
              type="number"
              placeholder="30"
              min="0"
              value={formData.duration}
              onChange={(e) => handleChange('duration', e.target.value)}
              onBlur={() => handleBlur('duration')}
              disabled={isLoading}
              className={`mt-1 w-full rounded-lg border ${
                fieldErrors.duration && touched.duration
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-zinc-200 dark:border-zinc-800'
              } bg-[color:var(--background)] px-3 py-2 text-sm shadow-sm outline-none focus:border-black dark:focus:border-white disabled:opacity-50`}
            />
          </label>

          <label className="block text-xs font-medium">
            Date & Time *
            <input
              type="datetime-local"
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              disabled={isLoading}
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-[color:var(--background)] px-3 py-2 text-sm shadow-sm outline-none focus:border-black dark:border-zinc-800 dark:focus:border-white disabled:opacity-50"
            />
          </label>
        </div>

        <label className="block text-xs font-medium">
          Notes
          <textarea
            placeholder="Add any notes..."
            rows={2}
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            disabled={isLoading}
            className="mt-1 w-full rounded-lg border border-zinc-200 bg-[color:var(--background)] px-3 py-2 text-sm shadow-sm outline-none focus:border-black dark:border-zinc-800 dark:focus:border-white disabled:opacity-50"
          />
        </label>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex h-10 flex-1 items-center justify-center rounded-lg border border-zinc-200 text-sm font-medium dark:border-zinc-800 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex h-10 flex-1 items-center justify-center rounded-lg bg-[color:var(--foreground)] text-sm font-medium text-[color:var(--background)] disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : initialData ? 'Update' : 'Add'}
        </button>
      </div>
    </form>
  );
}
