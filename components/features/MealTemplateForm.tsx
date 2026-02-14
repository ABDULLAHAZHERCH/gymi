'use client';

import { useState, FormEvent } from 'react';
import { X } from 'lucide-react';
import { MealTemplate } from '@/lib/mealTemplates';

interface MealTemplateFormProps {
  onSubmit: (data: Omit<MealTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
  initialData?: MealTemplate;
  isLoading?: boolean;
}

export default function MealTemplateForm({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
}: MealTemplateFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    items: initialData?.items || '',
    mealType: initialData?.mealType || 'breakfast' as const,
    calories: initialData?.calories?.toString() || '',
    protein: initialData?.protein?.toString() || '',
    carbs: initialData?.carbs?.toString() || '',
    fat: initialData?.fat?.toString() || '',
    notes: initialData?.notes || '',
  });

  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name.trim()) {
      setError('Template name is required');
      return;
    }

    if (!formData.items.trim()) {
      setError('Food items are required');
      return;
    }

    if (!formData.calories || parseInt(formData.calories) <= 0) {
      setError('Calories must be greater than 0');
      return;
    }

    try {
      await onSubmit({
        name: formData.name.trim(),
        items: formData.items.trim(),
        mealType: formData.mealType,
        calories: parseInt(formData.calories),
        protein: formData.protein ? parseFloat(formData.protein) : undefined,
        carbs: formData.carbs ? parseFloat(formData.carbs) : undefined,
        fat: formData.fat ? parseFloat(formData.fat) : undefined,
        notes: formData.notes?.trim() || undefined,
      });
    } catch (err: any) {
      setError('Failed to save template');
    }
  };

  return (
    <div className="w-full max-w-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-[color:var(--foreground)]">
          {initialData ? 'Edit Template' : 'New Meal Template'}
        </h2>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Template Name */}
        <div>
          <label className="block text-sm font-medium text-[color:var(--foreground)] mb-2">
            Template Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Protein Shake, Greek Salad"
            className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:border-[color:var(--foreground)]"
            required
          />
        </div>

        {/* Food Items */}
        <div>
          <label className="block text-sm font-medium text-[color:var(--foreground)] mb-2">
            Food Items
          </label>
          <textarea
            value={formData.items}
            onChange={(e) => setFormData({ ...formData, items: e.target.value })}
            placeholder="e.g., 2 eggs, 100g chicken breast, 1 cup rice"
            rows={3}
            className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:border-[color:var(--foreground)]"
            required
          />
        </div>

        {/* Meal Type */}
        <div>
          <label className="block text-sm font-medium text-[color:var(--foreground)] mb-2">
            Meal Type
          </label>
          <select
            value={formData.mealType}
            onChange={(e) => setFormData({ ...formData, mealType: e.target.value as any })}
            className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:border-[color:var(--foreground)]"
          >
            <option value="breakfast">🍳 Breakfast</option>
            <option value="lunch">🍱 Lunch</option>
            <option value="dinner">🍽️ Dinner</option>
            <option value="snack">🍎 Snack</option>
            <option value="other">🍴 Other</option>
          </select>
        </div>

        {/* Calories */}
        <div>
          <label className="block text-sm font-medium text-[color:var(--foreground)] mb-2">
            Calories
          </label>
          <input
            type="number"
            value={formData.calories}
            onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
            placeholder="500"
            min="0"
            className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:border-[color:var(--foreground)]"
            required
          />
        </div>

        {/* Macros Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-[color:var(--foreground)] mb-2">
              Protein (g)
            </label>
            <input
              type="number"
              value={formData.protein}
              onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
              placeholder="20"
              min="0"
              step="0.1"
              className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:border-[color:var(--foreground)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[color:var(--foreground)] mb-2">
              Carbs (g)
            </label>
            <input
              type="number"
              value={formData.carbs}
              onChange={(e) => setFormData({ ...formData, carbs: e.target.value })}
              placeholder="30"
              min="0"
              step="0.1"
              className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:border-[color:var(--foreground)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[color:var(--foreground)] mb-2">
              Fat (g)
            </label>
            <input
              type="number"
              value={formData.fat}
              onChange={(e) => setFormData({ ...formData, fat: e.target.value })}
              placeholder="10"
              min="0"
              step="0.1"
              className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:border-[color:var(--foreground)]"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-[color:var(--foreground)] mb-2">
            Notes (Optional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Any additional notes..."
            rows={2}
            className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:border-[color:var(--foreground)]"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-6 py-3 border border-zinc-300 dark:border-zinc-600 text-[color:var(--foreground)] rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-6 py-3 bg-[color:var(--foreground)] text-[color:var(--background)] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : initialData ? 'Update' : 'Create'} Template
          </button>
        </div>
      </form>
    </div>
  );
}
