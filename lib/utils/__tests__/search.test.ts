import {
  searchWorkouts,
  searchMeals,
  filterWorkouts,
  filterMeals,
  getUniqueExercises,
  getSearchSuggestions,
} from '../search';
import { Workout, Meal } from '@/lib/types/firestore';
import { FilterOptions } from '@/components/features/FilterPanel';

/* ------------------------------------------------------------------ */
/*  Fixtures                                                            */
/* ------------------------------------------------------------------ */

const now = new Date();

const mockWorkouts: Workout[] = [
  {
    id: '1',
    exercise: 'Bench Press',
    sets: 3,
    reps: 10,
    weight: 80,
    date: new Date('2025-03-01'),
    notes: 'Felt strong',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: '2',
    exercise: 'Squat',
    sets: 4,
    reps: 8,
    weight: 100,
    date: new Date('2025-03-05'),
    createdAt: now,
    updatedAt: now,
  },
  {
    id: '3',
    exercise: 'Deadlift',
    sets: 3,
    reps: 5,
    weight: 120,
    date: new Date('2025-03-10'),
    notes: 'PR attempt',
    createdAt: now,
    updatedAt: now,
  },
];

const mockMeals: Meal[] = [
  {
    id: '1',
    mealName: 'Breakfast',
    items: 'eggs, toast, avocado',
    mealType: 'breakfast',
    calories: 450,
    protein: 30,
    date: new Date('2025-03-01'),
    createdAt: now,
    updatedAt: now,
  },
  {
    id: '2',
    mealName: 'Lunch',
    items: 'chicken salad, rice',
    mealType: 'lunch',
    calories: 600,
    protein: 45,
    notes: 'High protein',
    date: new Date('2025-03-05'),
    createdAt: now,
    updatedAt: now,
  },
  {
    id: '3',
    mealName: 'Dinner',
    items: 'salmon, vegetables',
    mealType: 'dinner',
    calories: 550,
    protein: 40,
    date: new Date('2025-03-10'),
    createdAt: now,
    updatedAt: now,
  },
];

/* ------------------------------------------------------------------ */
/*  Tests                                                               */
/* ------------------------------------------------------------------ */

describe('search.ts', () => {
  // ── Workout Search ──

  describe('searchWorkouts', () => {
    it('returns all workouts when query is empty', () => {
      expect(searchWorkouts(mockWorkouts, '')).toHaveLength(3);
      expect(searchWorkouts(mockWorkouts, '  ')).toHaveLength(3);
    });

    it('filters workouts by exercise name', () => {
      const results = searchWorkouts(mockWorkouts, 'bench');
      expect(results).toHaveLength(1);
      expect(results[0].exercise).toBe('Bench Press');
    });

    it('is case-insensitive', () => {
      expect(searchWorkouts(mockWorkouts, 'SQUAT')).toHaveLength(1);
    });

    it('returns empty when no match', () => {
      expect(searchWorkouts(mockWorkouts, 'yoga')).toHaveLength(0);
    });
  });

  // ── Meal Search ──

  describe('searchMeals', () => {
    it('returns all meals when query is empty', () => {
      expect(searchMeals(mockMeals, '')).toHaveLength(3);
    });

    it('searches by meal name', () => {
      const results = searchMeals(mockMeals, 'breakfast');
      expect(results).toHaveLength(1);
      expect(results[0].mealName).toBe('Breakfast');
    });

    it('searches by food items', () => {
      const results = searchMeals(mockMeals, 'chicken');
      expect(results).toHaveLength(1);
      expect(results[0].items).toContain('chicken');
    });
  });

  // ── Workout Filters ──

  describe('filterWorkouts', () => {
    it('returns all when no filters applied', () => {
      const filters: FilterOptions = {};
      expect(filterWorkouts(mockWorkouts, filters)).toHaveLength(3);
    });

    it('filters by date range (start only)', () => {
      const filters: FilterOptions = {
        dateRange: { start: '2025-03-04', end: '' },
      };
      const results = filterWorkouts(mockWorkouts, filters);
      expect(results).toHaveLength(2); // March 5 and March 10
    });

    it('filters by date range (start and end)', () => {
      const filters: FilterOptions = {
        dateRange: { start: '2025-03-04', end: '2025-03-06' },
      };
      const results = filterWorkouts(mockWorkouts, filters);
      expect(results).toHaveLength(1); // Only March 5
    });

    it('filters by hasNotes', () => {
      const filters: FilterOptions = { hasNotes: true };
      const results = filterWorkouts(mockWorkouts, filters);
      expect(results).toHaveLength(2); // Bench Press and Deadlift
    });
  });

  // ── Meal Filters ──

  describe('filterMeals', () => {
    it('filters by meal type', () => {
      const filters: FilterOptions = { mealTypes: ['breakfast'] };
      const results = filterMeals(mockMeals, filters);
      expect(results).toHaveLength(1);
    });

    it('filters by calorie range', () => {
      const filters: FilterOptions = {
        calorieRange: { min: 500, max: 700 },
      };
      const results = filterMeals(mockMeals, filters);
      expect(results).toHaveLength(2); // Lunch (600) and Dinner (550)
    });

    it('filters by hasNotes', () => {
      const filters: FilterOptions = { hasNotes: true };
      const results = filterMeals(mockMeals, filters);
      expect(results).toHaveLength(1); // Only Lunch
    });
  });

  // ── Utilities ──

  describe('getUniqueExercises', () => {
    it('returns sorted unique exercise names', () => {
      const result = getUniqueExercises(mockWorkouts);
      expect(result).toEqual(['Bench Press', 'Deadlift', 'Squat']);
    });

    it('returns empty array for empty input', () => {
      expect(getUniqueExercises([])).toEqual([]);
    });
  });

  describe('getSearchSuggestions', () => {
    const recent = ['Bench Press', 'Squat', 'Deadlift', 'Pull Up', 'Row'];

    it('returns recent searches when query empty', () => {
      const result = getSearchSuggestions(recent, '');
      expect(result).toHaveLength(5);
    });

    it('filters suggestions by current query', () => {
      const result = getSearchSuggestions(recent, 'sq');
      expect(result).toEqual(['Squat']);
    });

    it('respects limit', () => {
      const result = getSearchSuggestions(recent, '', 2);
      expect(result).toHaveLength(2);
    });
  });
});
