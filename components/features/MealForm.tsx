'use client';

import { useState, FormEvent } from 'react';
import { X } from 'lucide-react';
import { Meal } from '@/lib/types/firestore';
import { getErrorMessage } from '@/lib/utils/errorMessages';

// Helper to format Date to datetime-local string in user's local timezone
const formatDateToLocalString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

interface MealFormProps {
  onSubmit: (data: Omit<Meal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
  initialData?: Meal;
  isLoading?: boolean;
}

export default function MealForm({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
}: MealFormProps) {
  const [formData, setFormData] = useState({
    mealName: initialData?.mealName || '',
    mealType: (initialData?.mealType || 'other') as 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other',
    items: initialData?.items || '',
    calories: initialData?.calories?.toString() || '',
    protein: initialData?.protein?.toString() || '',
    carbs: initialData?.carbs?.toString() || '',
    fat: initialData?.fat?.toString() || '',
    notes: initialData?.notes || '',
    date: initialData?.date
      ? formatDateToLocalString(new Date(initialData.date))
      : formatDateToLocalString(new Date()),
  });

  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.mealName || !formData.calories) {
      setError('Meal name and calories are required');
      return;
    }

    if (parseInt(formData.calories) < 0) {
      setError('Calories must be a positive number');
      return;
    }

    try {
      // Parse date from datetime-local format
      const [datePart, timePart] = formData.date.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hour, minute] = timePart.split(':').map(Number);

      const dateObj = new Date(year, month - 1, day, hour, minute, 0, 0);

      // Ensure valid date
      if (isNaN(dateObj.getTime())) {
        setError('Invalid date/time');
        return;
      }

      await onSubmit({
        mealName: formData.mealName.trim(),
        mealType: formData.mealType,
        items: formData.items.trim(),
        calories: parseInt(formData.calories),
        protein: formData.protein ? parseFloat(formData.protein) : undefined,
        carbs: formData.carbs ? parseFloat(formData.carbs) : undefined,
        fat: formData.fat ? parseFloat(formData.fat) : undefined,
        notes: formData.notes?.trim() || undefined,
        date: dateObj,
      });
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save meal'));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-[color:var(--foreground)]">
          {initialData ? 'Edit Meal' : 'Add Meal'}
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
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-xs font-medium">
            Meal Name *
            <input
              type="text"
              placeholder="e.g., Breakfast"
              value={formData.mealName}
              onChange={(e) => setFormData({ ...formData, mealName: e.target.value })}
              disabled={isLoading}
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-[color:var(--background)] px-3 py-2 text-sm shadow-sm outline-none focus:border-black dark:border-zinc-800 disabled:opacity-50"
            />
          </label>

          <label className="block text-xs font-medium">
            Meal Type
            <select
              value={formData.mealType}
              onChange={(e) => setFormData({ ...formData, mealType: e.target.value as 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other' })}
              disabled={isLoading}
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-[color:var(--background)] px-3 py-2 text-sm shadow-sm outline-none focus:border-black dark:border-zinc-800 disabled:opacity-50"
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
              <option value="other">Other</option>
            </select>
          </label>
        </div>

        <label className="block text-xs font-medium">
          Food Items
          <textarea
            placeholder="e.g., Chicken breast, Rice, Broccoli"
            rows={2}
            value={formData.items}
            onChange={(e) => setFormData({ ...formData, items: e.target.value })}
            disabled={isLoading}
            className="mt-1 w-full rounded-lg border border-zinc-200 bg-[color:var(--background)] px-3 py-2 text-sm shadow-sm outline-none focus:border-black dark:border-zinc-800 disabled:opacity-50"
          />
        </label>

        <label className="block text-xs font-medium">
          Calories *
          <input
            type="number"
            placeholder="500"
            min="0"
            value={formData.calories}
            onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
            disabled={isLoading}
            className="mt-1 w-full rounded-lg border border-zinc-200 bg-[color:var(--background)] px-3 py-2 text-sm shadow-sm outline-none focus:border-black dark:border-zinc-800 disabled:opacity-50"
          />
        </label>

        <div className="grid grid-cols-3 gap-2">
          <label className="block text-xs font-medium">
            Protein (g)
            <input
              type="number"
              placeholder="25"
              min="0"
              step="0.5"
              value={formData.protein}
              onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
              disabled={isLoading}
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-[color:var(--background)] px-2 py-2 text-sm shadow-sm outline-none focus:border-black dark:border-zinc-800 disabled:opacity-50"
            />
          </label>

          <label className="block text-xs font-medium">
            Carbs (g)
            <input
              type="number"
              placeholder="50"
              min="0"
              step="0.5"
              value={formData.carbs}
              onChange={(e) => setFormData({ ...formData, carbs: e.target.value })}
              disabled={isLoading}
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-[color:var(--background)] px-2 py-2 text-sm shadow-sm outline-none focus:border-black dark:border-zinc-800 disabled:opacity-50"
            />
          </label>

          <label className="block text-xs font-medium">
            Fat (g)
            <input
              type="number"
              placeholder="15"
              min="0"
              step="0.5"
              value={formData.fat}
              onChange={(e) => setFormData({ ...formData, fat: e.target.value })}
              disabled={isLoading}
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-[color:var(--background)] px-2 py-2 text-sm shadow-sm outline-none focus:border-black dark:border-zinc-800 disabled:opacity-50"
            />
          </label>
        </div>

        <label className="block text-xs font-medium">
          Date & Time
          <input
            type="datetime-local"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            disabled={isLoading}
            className="mt-1 w-full rounded-lg border border-zinc-200 bg-[color:var(--background)] px-3 py-2 text-sm shadow-sm outline-none focus:border-black dark:border-zinc-800 disabled:opacity-50"
          />
        </label>

        <label className="block text-xs font-medium">
          Notes
          <textarea
            placeholder="Add any notes..."
            rows={2}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            disabled={isLoading}
            className="mt-1 w-full rounded-lg border border-zinc-200 bg-[color:var(--background)] px-3 py-2 text-sm shadow-sm outline-none focus:border-black dark:border-zinc-800 disabled:opacity-50"
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
