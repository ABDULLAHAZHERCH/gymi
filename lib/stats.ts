import { db } from './firebase';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { Workout, Meal } from './types/firestore';
import { getWorkouts, getWorkoutsByDateRange } from './workouts';
import { getMeals, getMealsByDate, getDayMacros } from './meals';

/**
 * Stats Service Layer
 * Handles data aggregation for dashboards and analytics
 */

/**
 * Get total workout count for this week
 */
export async function getWeeklyWorkoutCount(uid: string): Promise<number> {
  try {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const workouts = await getWorkoutsByDateRange(uid, weekAgo, now);
    return workouts.length;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to get weekly workout count');
  }
}

/**
 * Get total calories logged for today
 */
export async function getTodayCalories(uid: string): Promise<number> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const meals = await getMealsByDate(uid, today);
    return meals.reduce((total, meal) => total + (meal.calories || 0), 0);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to get today calories');
  }
}

/**
 * Get today's macro breakdown
 */
export async function getTodayMacros(uid: string) {
  try {
    return await getDayMacros(uid, new Date());
  } catch (error: any) {
    throw new Error(error.message || 'Failed to get today macros');
  }
}

/**
 * Get most frequently logged exercises (favorite exercises)
 */
export async function getFavoriteExercises(uid: string, limit: number = 5) {
  try {
    const allWorkouts = await getWorkouts(uid, 1000); // Get all workouts

    // Count exercise frequency
    const exerciseCounts: Record<string, number> = {};
    allWorkouts.forEach((workout) => {
      exerciseCounts[workout.exercise] = (exerciseCounts[workout.exercise] || 0) + 1;
    });

    // Sort by frequency and return top N
    return Object.entries(exerciseCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([exercise, count]) => ({
        exercise,
        count,
      }));
  } catch (error: any) {
    throw new Error(error.message || 'Failed to get favorite exercises');
  }
}

/**
 * Get recent entries (workouts & meals combined)
 */
export async function getRecentEntries(uid: string, count: number = 5) {
  try {
    const [workouts, meals] = await Promise.all([
      getWorkouts(uid, count),
      getMeals(uid, count),
    ]);

    // Combine and sort by date
    const entries = [
      ...workouts.map((w) => ({
        type: 'workout' as const,
        id: w.id,
        title: w.exercise,
        subtitle: `${w.sets}x${w.reps}${w.weight ? ` @ ${w.weight}kg` : ''}`,
        date: w.date,
        icon: '💪',
      })),
      ...meals.map((m) => ({
        type: 'meal' as const,
        id: m.id,
        title: m.mealName,
        subtitle: `${m.calories} kcal${m.protein ? ` • ${m.protein}g P` : ''}`,
        date: m.date,
        icon: '🍽️',
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, count);

    return entries;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to get recent entries');
  }
}

/**
 * Get weekly workout streak
 */
export async function getWorkoutStreak(uid: string): Promise<number> {
  try {
    const allWorkouts = await getWorkouts(uid, 1000);

    if (allWorkouts.length === 0) return 0;

    // Sort by date descending (newest first)
    const sorted = [...allWorkouts].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Track consecutive days with workouts
    let streak = 0;
    let lastDate = new Date();
    lastDate.setHours(0, 0, 0, 0);

    for (const workout of sorted) {
      const workoutDate = new Date(workout.date);
      workoutDate.setHours(0, 0, 0, 0);

      // Check if this workout is within 1 day of the last date
      const daysDiff = Math.floor(
        (lastDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff === 0) {
        // Same day, skip (don't count multiple workouts same day)
        continue;
      } else if (daysDiff === 1) {
        // Consecutive day
        streak++;
        lastDate = workoutDate;
      } else {
        // Streak broken
        break;
      }
    }

    // If we found at least one workout, add 1 to count current day
    if (sorted.length > 0) {
      const mostRecentDate = new Date(sorted[0].date);
      mostRecentDate.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor(
        (today.getTime() - mostRecentDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff === 0 || daysDiff === 1) {
        streak += 1;
      }
    }

    return streak;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to get workout streak');
  }
}

/**
 * Get monthly stats overview
 */
export async function getMonthlyStats(uid: string) {
  try {
    const now = new Date();
    const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);

    const [workouts, allMeals, weeklyCount] = await Promise.all([
      getWorkoutsByDateRange(uid, monthAgo, now),
      getMeals(uid, 1000),
      getWeeklyWorkoutCount(uid),
    ]);

    // Calculate total calories this month
    const monthMeals = allMeals.filter((meal) => {
      const mealDate = new Date(meal.date);
      return mealDate >= monthAgo && mealDate <= now;
    });

    const totalCalories = monthMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
    const avgCaloriesPerDay = monthMeals.length > 0 ? Math.round(totalCalories / 30) : 0;

    return {
      totalWorkouts: workouts.length,
      totalCalories,
      avgCaloriesPerDay,
      weeklyWorkouts: weeklyCount,
      uniqueExercises: new Set(workouts.map((w) => w.exercise)).size,
    };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to get monthly stats');
  }
}

/**
 * Get comprehensive dashboard data
 */
export async function getDashboardStats(uid: string) {
  try {
    const [
      weeklyCount,
      todayCalories,
      todayMacros,
      favoriteExercises,
      recentEntries,
      streak,
      monthlyStats,
    ] = await Promise.all([
      getWeeklyWorkoutCount(uid),
      getTodayCalories(uid),
      getTodayMacros(uid),
      getFavoriteExercises(uid, 3),
      getRecentEntries(uid, 5),
      getWorkoutStreak(uid),
      getMonthlyStats(uid),
    ]);

    return {
      weeklyWorkouts: weeklyCount,
      todayCalories,
      todayMacros,
      favoriteExercises,
      recentEntries,
      workoutStreak: streak,
      monthlyStats,
    };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to get dashboard stats');
  }
}
