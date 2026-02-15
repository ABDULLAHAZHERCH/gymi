'use client';

import { useState, FormEvent } from 'react';
import { X } from 'lucide-react';
import { Workout } from '@/lib/types/firestore';
import { getErrorMessage } from '@/lib/utils/errorMessages';
import { validateField, ValidationErrors } from '@/lib/utils/validation';
import { useFormShortcuts } from '@/lib/hooks/useKeyboardShortcut';
import { useUnits } from '@/components/providers/UnitProvider';
import { weightUnit, weightToKg, getWeightInUnit } from '@/lib/utils/units';

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
}

export default function WorkoutForm({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
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
    setFormData({ ...formData, [fieldName]: value });
    
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

      <div className="space-y-3">
        <label className="block text-xs font-medium">
          Exercise Name *
          <input
            type="text"
            placeholder="e.g., Bench Press"
            value={formData.exercise}
            onChange={(e) => handleChange('exercise', e.target.value)}
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
