'use client';

import { Meal } from '@/lib/types/firestore';
import MealCard from './MealCard';
import { Apple } from 'lucide-react';
import { ListSkeleton } from '../ui/Skeleton';

interface MealListProps {
  meals: Meal[];
  onEdit: (meal: Meal) => void;
  onDelete: (mealId: string) => void;
  isLoading?: boolean;
}

export default function MealList({
  meals,
  onEdit,
  onDelete,
  isLoading = false,
}: MealListProps) {
  // Group meals by date
  const groupedMeals: Record<string, Meal[]> = {};
  meals.forEach((meal) => {
    const date = new Date(meal.date).toLocaleDateString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    if (!groupedMeals[date]) {
      groupedMeals[date] = [];
    }
    groupedMeals[date].push(meal);
  });

  // Calculate daily totals
  const getDayTotals = (dayMeals: Meal[]) => {
    return {
      calories: dayMeals.reduce((sum, m) => sum + (m.calories || 0), 0),
      protein: dayMeals.reduce((sum, m) => sum + (m.protein || 0), 0),
      carbs: dayMeals.reduce((sum, m) => sum + (m.carbs || 0), 0),
      fat: dayMeals.reduce((sum, m) => sum + (m.fat || 0), 0),
    };
  };

  if (isLoading) {
    return <ListSkeleton count={3} type="meal" />;
  }

  if (meals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 py-12 dark:border-zinc-700 dark:bg-zinc-900">
        <Apple className="mb-4 h-12 w-12 text-zinc-400" />
        <p className="text-center text-sm font-medium text-[color:var(--muted-foreground)]">
          No meals logged yet
        </p>
        <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">
          Start tracking your nutrition by adding your first meal
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedMeals).map(([date, dayMeals]) => {
        const totals = getDayTotals(dayMeals);
        return (
          <div key={date}>
            {/* Date header with daily totals */}
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-[color:var(--foreground)]">{date}</h3>
              <div className="flex gap-2 text-xs">
                <div className="rounded-full bg-zinc-100 px-2.5 py-1 dark:bg-zinc-800">
                  <span className="font-medium text-[color:var(--foreground)]">
                    {totals.calories}
                  </span>
                  <span className="ml-1 text-[color:var(--muted-foreground)]">kcal</span>
                </div>
                {totals.protein > 0 && (
                  <div className="rounded-full bg-blue-100 px-2.5 py-1 dark:bg-blue-900/30">
                    <span className="font-medium text-blue-700 dark:text-blue-300">
                      {totals.protein.toFixed(1)}g
                    </span>
                    <span className="ml-1 text-blue-600 dark:text-blue-400">P</span>
                  </div>
                )}
                {totals.carbs > 0 && (
                  <div className="rounded-full bg-amber-100 px-2.5 py-1 dark:bg-amber-900/30">
                    <span className="font-medium text-amber-700 dark:text-amber-300">
                      {totals.carbs.toFixed(1)}g
                    </span>
                    <span className="ml-1 text-amber-600 dark:text-amber-400">C</span>
                  </div>
                )}
                {totals.fat > 0 && (
                  <div className="rounded-full bg-red-100 px-2.5 py-1 dark:bg-red-900/30">
                    <span className="font-medium text-red-700 dark:text-red-300">
                      {totals.fat.toFixed(1)}g
                    </span>
                    <span className="ml-1 text-red-600 dark:text-red-400">F</span>
                  </div>
                )}
              </div>
            </div>

            {/* Meals for this day */}
            <div className="space-y-2">
              {dayMeals.map((meal) => (
                <MealCard
                  key={meal.id}
                  meal={meal}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
