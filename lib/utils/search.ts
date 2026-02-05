import { Workout } from '@/lib/types/firestore';
import { Meal } from '@/lib/types/firestore';
import { FilterOptions } from '@/components/features/FilterPanel';

/**
 * Search workouts by exercise name
 */
export function searchWorkouts(workouts: Workout[], query: string): Workout[] {
  if (!query.trim()) return workouts;

  const lowerQuery = query.toLowerCase();
  return workouts.filter((workout) =>
    workout.exercise.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Search meals by name or food items
 */
export function searchMeals(meals: Meal[], query: string): Meal[] {
  if (!query.trim()) return meals;

  const lowerQuery = query.toLowerCase();
  return meals.filter(
    (meal) =>
      meal.mealName.toLowerCase().includes(lowerQuery) ||
      meal.items.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Filter workouts based on filter options
 */
export function filterWorkouts(
  workouts: Workout[],
  filters: FilterOptions
): Workout[] {
  let filtered = [...workouts];

  // Date range filter
  if (filters.dateRange?.start || filters.dateRange?.end) {
    filtered = filtered.filter((workout) => {
      const workoutDate = new Date(workout.date);
      const start = filters.dateRange?.start
        ? new Date(filters.dateRange.start)
        : null;
      const end = filters.dateRange?.end
        ? new Date(filters.dateRange.end)
        : null;

      if (start && workoutDate < start) return false;
      if (end) {
        // Include the entire end date
        const endOfDay = new Date(end);
        endOfDay.setHours(23, 59, 59, 999);
        if (workoutDate > endOfDay) return false;
      }

      return true;
    });
  }

  // Has notes filter
  if (filters.hasNotes) {
    filtered = filtered.filter((workout) => workout.notes && workout.notes.trim().length > 0);
  }

  return filtered;
}

/**
 * Filter meals based on filter options
 */
export function filterMeals(meals: Meal[], filters: FilterOptions): Meal[] {
  let filtered = [...meals];

  // Date range filter
  if (filters.dateRange?.start || filters.dateRange?.end) {
    filtered = filtered.filter((meal) => {
      const mealDate = new Date(meal.date);
      const start = filters.dateRange?.start
        ? new Date(filters.dateRange.start)
        : null;
      const end = filters.dateRange?.end
        ? new Date(filters.dateRange.end)
        : null;

      if (start && mealDate < start) return false;
      if (end) {
        // Include the entire end date
        const endOfDay = new Date(end);
        endOfDay.setHours(23, 59, 59, 999);
        if (mealDate > endOfDay) return false;
      }

      return true;
    });
  }

  // Meal type filter
  if (filters.mealTypes && filters.mealTypes.length > 0) {
    filtered = filtered.filter((meal) =>
      filters.mealTypes?.includes(meal.mealType)
    );
  }

  // Calorie range filter
  if (filters.calorieRange) {
    filtered = filtered.filter((meal) => {
      const calories = meal.calories;
      const min = filters.calorieRange?.min;
      const max = filters.calorieRange?.max;

      if (min !== undefined && calories < min) return false;
      if (max !== undefined && calories > max) return false;

      return true;
    });
  }

  // Has notes filter
  if (filters.hasNotes) {
    filtered = filtered.filter((meal) => meal.notes && meal.notes.trim().length > 0);
  }

  return filtered;
}

/**
 * Combine search and filter for workouts
 */
export function searchAndFilterWorkouts(
  workouts: Workout[],
  query: string,
  filters: FilterOptions
): Workout[] {
  const searched = searchWorkouts(workouts, query);
  return filterWorkouts(searched, filters);
}

/**
 * Combine search and filter for meals
 */
export function searchAndFilterMeals(
  meals: Meal[],
  query: string,
  filters: FilterOptions
): Meal[] {
  const searched = searchMeals(meals, query);
  return filterMeals(searched, filters);
}

/**
 * Get unique exercise names from workouts (for autocomplete)
 */
export function getUniqueExercises(workouts: Workout[]): string[] {
  const exercises = new Set(workouts.map((w) => w.exercise));
  return Array.from(exercises).sort();
}

/**
 * Get recent search suggestions
 */
export function getSearchSuggestions(
  recentSearches: string[],
  currentQuery: string,
  limit: number = 5
): string[] {
  if (!currentQuery.trim()) return recentSearches.slice(0, limit);

  const lowerQuery = currentQuery.toLowerCase();
  return recentSearches
    .filter((search) => search.toLowerCase().includes(lowerQuery))
    .slice(0, limit);
}
