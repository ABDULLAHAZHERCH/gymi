'use client';

import { useState, FormEvent } from 'react';
import { X } from 'lucide-react';
import { Goal } from '@/lib/types/firestore';
import { getErrorMessage } from '@/lib/utils/errorMessages';
import { useFormShortcuts } from '@/lib/hooks/useKeyboardShortcut';

const formatDateToInputString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface GoalFormProps {
  onSubmit: (data: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
  initialData?: Goal;
  isLoading?: boolean;
}

export default function GoalForm({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
}: GoalFormProps) {
  const [formData, setFormData] = useState({
    type: (initialData?.type || 'weight') as Goal['type'],
    title: initialData?.title || '',
    description: initialData?.description || '',
    targetWeight: initialData?.targetWeight?.toString() || '',
    targetWorkoutsPerWeek: initialData?.targetWorkoutsPerWeek?.toString() || '',
    targetCaloriesPerDay: initialData?.targetCaloriesPerDay?.toString() || '',
    targetProtein: initialData?.targetProtein?.toString() || '',
    targetCarbs: initialData?.targetCarbs?.toString() || '',
    targetFat: initialData?.targetFat?.toString() || '',
    startDate: initialData?.startDate
      ? formatDateToInputString(new Date(initialData.startDate))
      : formatDateToInputString(new Date()),
    targetDate: initialData?.targetDate
      ? formatDateToInputString(new Date(initialData.targetDate))
      : formatDateToInputString(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // 30 days from now
    status: (initialData?.status || 'active') as Goal['status'],
    currentValue: initialData?.currentValue?.toString() || '',
  });

  const [error, setError] = useState('');

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    // Validation
    if (!formData.title) {
      setError('Goal title is required');
      return;
    }

    // Type-specific validation
    if (formData.type === 'weight' && !formData.targetWeight) {
      setError('Target weight is required for weight goals');
      return;
    }
    if (formData.type === 'workout_frequency' && !formData.targetWorkoutsPerWeek) {
      setError('Target workouts per week is required');
      return;
    }
    if (formData.type === 'calories' && !formData.targetCaloriesPerDay) {
      setError('Target calories per day is required');
      return;
    }
    if (formData.type === 'macros' && !formData.targetProtein && !formData.targetCarbs && !formData.targetFat) {
      setError('At least one macro target is required');
      return;
    }

    try {
      const goalData: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'> = {
        type: formData.type,
        title: formData.title.trim(),
        description: formData.description?.trim() || undefined,
        startDate: new Date(formData.startDate),
        targetDate: new Date(formData.targetDate),
        status: formData.status,
        currentValue: formData.currentValue ? parseFloat(formData.currentValue) : undefined,
      };

      // Add type-specific fields
      if (formData.type === 'weight' && formData.targetWeight) {
        goalData.targetWeight = parseFloat(formData.targetWeight);
      }
      if (formData.type === 'workout_frequency' && formData.targetWorkoutsPerWeek) {
        goalData.targetWorkoutsPerWeek = parseInt(formData.targetWorkoutsPerWeek);
      }
      if (formData.type === 'calories' && formData.targetCaloriesPerDay) {
        goalData.targetCaloriesPerDay = parseInt(formData.targetCaloriesPerDay);
      }
      if (formData.type === 'macros') {
        if (formData.targetProtein) goalData.targetProtein = parseInt(formData.targetProtein);
        if (formData.targetCarbs) goalData.targetCarbs = parseInt(formData.targetCarbs);
        if (formData.targetFat) goalData.targetFat = parseInt(formData.targetFat);
      }

      await onSubmit(goalData);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save goal'));
    }
  };

  useFormShortcuts({
    onSubmit: () => !isLoading && handleSubmit(),
    onCancel: !isLoading ? onCancel : undefined,
  });

  const goalTypeLabels = {
    weight: 'Weight Goal',
    workout_frequency: 'Workout Frequency',
    calories: 'Daily Calories',
    macros: 'Macro Targets',
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[color:var(--foreground)]">
          {initialData ? 'Edit Goal' : 'Create New Goal'}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {error && (
        <p className="rounded-lg bg-red-100 p-3 text-sm text-red-700 dark:bg-red-900 dark:text-red-100">
          {error}
        </p>
      )}

      <div className="space-y-4">
        {/* Goal Type */}
        <label className="block text-sm font-medium">
          Goal Type *
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as Goal['type'] })}
            disabled={isLoading}
            className="mt-2 w-full rounded-2xl border border-zinc-200 bg-[color:var(--background)] px-4 py-3 text-sm shadow-sm outline-none focus:border-black dark:border-zinc-800 dark:focus:border-white disabled:opacity-50"
          >
            {Object.entries(goalTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        {/* Title */}
        <label className="block text-sm font-medium">
          Goal Title *
          <input
            type="text"
            placeholder="e.g., Lose 5kg by summer"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            disabled={isLoading}
            className="mt-2 w-full rounded-2xl border border-zinc-200 bg-[color:var(--background)] px-4 py-3 text-sm shadow-sm outline-none focus:border-black dark:border-zinc-800 dark:focus:border-white disabled:opacity-50"
          />
        </label>

        {/* Description */}
        <label className="block text-sm font-medium">
          Description
          <textarea
            placeholder="Add details about your goal..."
            rows={2}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            disabled={isLoading}
            className="mt-2 w-full rounded-2xl border border-zinc-200 bg-[color:var(--background)] px-4 py-3 text-sm shadow-sm outline-none focus:border-black dark:border-zinc-800 dark:focus:border-white disabled:opacity-50"
          />
        </label>

        {/* Type-specific fields */}
        {formData.type === 'weight' && (
          <label className="block text-sm font-medium">
            Target Weight (kg) *
            <input
              type="number"
              placeholder="70"
              min="0"
              step="0.1"
              value={formData.targetWeight}
              onChange={(e) => setFormData({ ...formData, targetWeight: e.target.value })}
              disabled={isLoading}
              className="mt-2 w-full rounded-2xl border border-zinc-200 bg-[color:var(--background)] px-4 py-3 text-sm shadow-sm outline-none focus:border-black dark:border-zinc-800 dark:focus:border-white disabled:opacity-50"
            />
          </label>
        )}

        {formData.type === 'workout_frequency' && (
          <label className="block text-sm font-medium">
            Workouts Per Week *
            <input
              type="number"
              placeholder="5"
              min="1"
              max="7"
              value={formData.targetWorkoutsPerWeek}
              onChange={(e) => setFormData({ ...formData, targetWorkoutsPerWeek: e.target.value })}
              disabled={isLoading}
              className="mt-2 w-full rounded-2xl border border-zinc-200 bg-[color:var(--background)] px-4 py-3 text-sm shadow-sm outline-none focus:border-black dark:border-zinc-800 dark:focus:border-white disabled:opacity-50"
            />
          </label>
        )}

        {formData.type === 'calories' && (
          <label className="block text-sm font-medium">
            Target Calories Per Day *
            <input
              type="number"
              placeholder="2000"
              min="0"
              value={formData.targetCaloriesPerDay}
              onChange={(e) => setFormData({ ...formData, targetCaloriesPerDay: e.target.value })}
              disabled={isLoading}
              className="mt-2 w-full rounded-2xl border border-zinc-200 bg-[color:var(--background)] px-4 py-3 text-sm shadow-sm outline-none focus:border-black dark:border-zinc-800 dark:focus:border-white disabled:opacity-50"
            />
          </label>
        )}

        {formData.type === 'macros' && (
          <div className="grid grid-cols-3 gap-4">
            <label className="block text-sm font-medium">
              Protein (g)
              <input
                type="number"
                placeholder="150"
                min="0"
                value={formData.targetProtein}
                onChange={(e) => setFormData({ ...formData, targetProtein: e.target.value })}
                disabled={isLoading}
                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-[color:var(--background)] px-4 py-3 text-sm shadow-sm outline-none focus:border-black dark:border-zinc-800 dark:focus:border-white disabled:opacity-50"
              />
            </label>
            <label className="block text-sm font-medium">
              Carbs (g)
              <input
                type="number"
                placeholder="200"
                min="0"
                value={formData.targetCarbs}
                onChange={(e) => setFormData({ ...formData, targetCarbs: e.target.value })}
                disabled={isLoading}
                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-[color:var(--background)] px-4 py-3 text-sm shadow-sm outline-none focus:border-black dark:border-zinc-800 dark:focus:border-white disabled:opacity-50"
              />
            </label>
            <label className="block text-sm font-medium">
              Fat (g)
              <input
                type="number"
                placeholder="60"
                min="0"
                value={formData.targetFat}
                onChange={(e) => setFormData({ ...formData, targetFat: e.target.value })}
                disabled={isLoading}
                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-[color:var(--background)] px-4 py-3 text-sm shadow-sm outline-none focus:border-black dark:border-zinc-800 dark:focus:border-white disabled:opacity-50"
              />
            </label>
          </div>
        )}

        {/* Timeline */}
        <div className="grid grid-cols-2 gap-4">
          <label className="block text-sm font-medium">
            Start Date *
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              disabled={isLoading}
              className="mt-2 w-full rounded-2xl border border-zinc-200 bg-[color:var(--background)] px-4 py-3 text-sm shadow-sm outline-none focus:border-black dark:border-zinc-800 dark:focus:border-white disabled:opacity-50"
            />
          </label>
          <label className="block text-sm font-medium">
            Target Date *
            <input
              type="date"
              value={formData.targetDate}
              onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
              disabled={isLoading}
              className="mt-2 w-full rounded-2xl border border-zinc-200 bg-[color:var(--background)] px-4 py-3 text-sm shadow-sm outline-none focus:border-black dark:border-zinc-800 dark:focus:border-white disabled:opacity-50"
            />
          </label>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex h-12 flex-1 items-center justify-center rounded-full border border-zinc-200 text-sm font-semibold dark:border-zinc-800 disabled:opacity-50 hover:bg-zinc-50 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex h-12 flex-1 items-center justify-center rounded-full bg-[color:var(--foreground)] text-sm font-semibold text-[color:var(--background)] disabled:opacity-50 hover:opacity-90"
        >
          {isLoading ? 'Saving...' : initialData ? 'Update Goal' : 'Create Goal'}
        </button>
      </div>
    </form>
  );
}
