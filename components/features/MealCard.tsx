'use client';

import { Meal } from '@/lib/types/firestore';
import { Edit2, Trash2, Apple } from 'lucide-react';

interface MealCardProps {
  meal: Meal;
  onEdit: (meal: Meal) => void;
  onDelete: (mealId: string) => void;
}

export default function MealCard({ meal, onEdit, onDelete }: MealCardProps) {
  const mealTypeLabel = {
    breakfast: '🌅 Breakfast',
    lunch: '☀️ Lunch',
    dinner: '🌙 Dinner',
    snack: '🍎 Snack',
    other: '🍽️ Other',
  }[meal.mealType] || meal.mealType;

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: new Date(date).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-[color:var(--background)] p-4 shadow-sm dark:border-zinc-800">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Apple className="h-5 w-5 text-orange-500" />
            <h3 className="font-semibold text-[color:var(--foreground)]">
              {meal.mealName}
            </h3>
          </div>
          <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">
            {mealTypeLabel} • {formatDate(meal.date)} at {formatTime(meal.date)}
          </p>

          {meal.items && (
            <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
              {meal.items}
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            <div className="rounded-lg bg-zinc-100 px-3 py-1 dark:bg-zinc-800">
              <p className="font-semibold text-[color:var(--foreground)]">
                {meal.calories}
              </p>
              <p className="text-xs text-[color:var(--muted-foreground)]">kcal</p>
            </div>

            {meal.protein !== undefined && (
              <div className="rounded-lg bg-blue-50 px-3 py-1 dark:bg-blue-900/30">
                <p className="font-semibold text-blue-700 dark:text-blue-300">
                  {meal.protein}g
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">protein</p>
              </div>
            )}

            {meal.carbs !== undefined && (
              <div className="rounded-lg bg-amber-50 px-3 py-1 dark:bg-amber-900/30">
                <p className="font-semibold text-amber-700 dark:text-amber-300">
                  {meal.carbs}g
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400">carbs</p>
              </div>
            )}

            {meal.fat !== undefined && (
              <div className="rounded-lg bg-red-50 px-3 py-1 dark:bg-red-900/30">
                <p className="font-semibold text-red-700 dark:text-red-300">
                  {meal.fat}g
                </p>
                <p className="text-xs text-red-600 dark:text-red-400">fat</p>
              </div>
            )}
          </div>

          {meal.notes && (
            <p className="mt-3 text-sm italic text-[color:var(--muted-foreground)]">
              {meal.notes}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onEdit(meal)}
            className="rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            title="Edit"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(meal.id)}
            className="rounded-lg p-2 hover:bg-red-50 dark:hover:bg-red-900/20"
            title="Delete"
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </button>
        </div>
      </div>
    </div>
  );
}
