import { getWorkouts, getWorkoutsByDateRange } from './workouts';
import { getMeals } from './meals';
import { getWeightLogs } from './weightLogs';
import { getActiveGoals } from './goals';
import { calculateStreaks } from './achievements';
import { Workout, Meal, WeightLog, Goal } from './types/firestore';
import { UnitSystem, displayWeightChange } from './utils/units';

/**
 * Reports & Insights Service
 * Generates weekly/monthly summaries and smart recommendations
 */

// ============================================================
// TYPES
// ============================================================

export interface WeeklyWorkoutReport {
  period: string;
  startDate: Date;
  endDate: Date;
  totalWorkouts: number;
  totalSets: number;
  totalReps: number;
  totalVolume: number; // sets × reps × weight
  favoriteExercise: string | null;
  exerciseBreakdown: Record<string, number>;
  averagePerDay: number;
  comparedToLastWeek: number; // +/- percentage
}

export interface WeeklyNutritionReport {
  period: string;
  startDate: Date;
  endDate: Date;
  totalMeals: number;
  totalCalories: number;
  avgCaloriesPerDay: number;
  avgProtein: number;
  avgCarbs: number;
  avgFat: number;
  mealTypeBreakdown: Record<string, number>;
  daysLogged: number;
}

export interface MonthlyReport {
  period: string;
  workout: WeeklyWorkoutReport;
  nutrition: WeeklyNutritionReport;
  weightChange: number;
  goalsProgress: Array<{ title: string; type: string; progress: number }>;
  streakInfo: { current: number; longest: number };
}

export interface Insight {
  id: string;
  type: 'streak' | 'milestone' | 'trend' | 'recommendation' | 'alert';
  icon: string;
  message: string;
  priority: number; // 1 = highest
}

// ============================================================
// WEEKLY REPORTS
// ============================================================

/**
 * Generate a weekly workout report
 */
export async function getWeeklyWorkoutReport(uid: string): Promise<WeeklyWorkoutReport> {
  const now = new Date();
  const startOfWeek = getStartOfWeek(now);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  // Previous week for comparison
  const prevStart = new Date(startOfWeek);
  prevStart.setDate(prevStart.getDate() - 7);
  const prevEnd = new Date(startOfWeek);
  prevEnd.setMilliseconds(-1);

  const allWorkouts = await getWorkouts(uid, 500);

  const thisWeek = allWorkouts.filter(
    (w) => new Date(w.date) >= startOfWeek && new Date(w.date) <= endOfWeek
  );
  const lastWeek = allWorkouts.filter(
    (w) => new Date(w.date) >= prevStart && new Date(w.date) <= prevEnd
  );

  // Exercise breakdown
  const exerciseBreakdown: Record<string, number> = {};
  let totalSets = 0;
  let totalReps = 0;
  let totalVolume = 0;

  for (const w of thisWeek) {
    exerciseBreakdown[w.exercise] = (exerciseBreakdown[w.exercise] || 0) + 1;
    totalSets += w.sets;
    totalReps += w.reps;
    totalVolume += w.sets * w.reps * w.weight;
  }

  const favoriteExercise =
    Object.keys(exerciseBreakdown).length > 0
      ? Object.entries(exerciseBreakdown).sort((a, b) => b[1] - a[1])[0][0]
      : null;

  const comparedToLastWeek =
    lastWeek.length > 0
      ? Math.round(((thisWeek.length - lastWeek.length) / lastWeek.length) * 100)
      : thisWeek.length > 0
      ? 100
      : 0;

  return {
    period: `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`,
    startDate: startOfWeek,
    endDate: endOfWeek,
    totalWorkouts: thisWeek.length,
    totalSets,
    totalReps,
    totalVolume,
    favoriteExercise,
    exerciseBreakdown,
    averagePerDay: Math.round((thisWeek.length / 7) * 10) / 10,
    comparedToLastWeek,
  };
}

/**
 * Generate a weekly nutrition report
 */
export async function getWeeklyNutritionReport(uid: string): Promise<WeeklyNutritionReport> {
  const now = new Date();
  const startOfWeek = getStartOfWeek(now);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const allMeals = await getMeals(uid, 500);

  const thisWeek = allMeals.filter(
    (m) => new Date(m.date) >= startOfWeek && new Date(m.date) <= endOfWeek
  );

  const mealTypeBreakdown: Record<string, number> = {};
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;

  const uniqueDays = new Set<string>();

  for (const m of thisWeek) {
    mealTypeBreakdown[m.mealType] = (mealTypeBreakdown[m.mealType] || 0) + 1;
    totalCalories += m.calories;
    totalProtein += m.protein || 0;
    totalCarbs += m.carbs || 0;
    totalFat += m.fat || 0;
    uniqueDays.add(toDateString(m.date));
  }

  const daysLogged = uniqueDays.size;

  return {
    period: `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`,
    startDate: startOfWeek,
    endDate: endOfWeek,
    totalMeals: thisWeek.length,
    totalCalories,
    avgCaloriesPerDay: daysLogged > 0 ? Math.round(totalCalories / daysLogged) : 0,
    avgProtein: daysLogged > 0 ? Math.round(totalProtein / daysLogged) : 0,
    avgCarbs: daysLogged > 0 ? Math.round(totalCarbs / daysLogged) : 0,
    avgFat: daysLogged > 0 ? Math.round(totalFat / daysLogged) : 0,
    mealTypeBreakdown,
    daysLogged,
  };
}

// ============================================================
// MONTHLY REPORT
// ============================================================

/**
 * Generate a comprehensive monthly report
 */
export async function getMonthlyReport(uid: string): Promise<MonthlyReport> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const [allWorkouts, allMeals, weightLogs, goals] = await Promise.all([
    getWorkouts(uid, 1000),
    getMeals(uid, 1000),
    getWeightLogs(uid, 100),
    getActiveGoals(uid),
  ]);

  const monthWorkouts = allWorkouts.filter(
    (w) => new Date(w.date) >= startOfMonth && new Date(w.date) <= endOfMonth
  );
  const monthMeals = allMeals.filter(
    (m) => new Date(m.date) >= startOfMonth && new Date(m.date) <= endOfMonth
  );

  // Workout summary
  const exerciseBreakdown: Record<string, number> = {};
  let totalSets = 0, totalReps = 0, totalVolume = 0;
  for (const w of monthWorkouts) {
    exerciseBreakdown[w.exercise] = (exerciseBreakdown[w.exercise] || 0) + 1;
    totalSets += w.sets;
    totalReps += w.reps;
    totalVolume += w.sets * w.reps * w.weight;
  }
  const favoriteExercise = Object.keys(exerciseBreakdown).length > 0
    ? Object.entries(exerciseBreakdown).sort((a, b) => b[1] - a[1])[0][0]
    : null;

  // Nutrition summary
  const mealTypeBreakdown: Record<string, number> = {};
  let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0;
  const mealDays = new Set<string>();
  for (const m of monthMeals) {
    mealTypeBreakdown[m.mealType] = (mealTypeBreakdown[m.mealType] || 0) + 1;
    totalCalories += m.calories;
    totalProtein += m.protein || 0;
    totalCarbs += m.carbs || 0;
    totalFat += m.fat || 0;
    mealDays.add(toDateString(m.date));
  }
  const daysLogged = mealDays.size;

  // Weight change
  const monthWeights = weightLogs
    .filter((l) => new Date(l.date) >= startOfMonth && new Date(l.date) <= endOfMonth)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const weightChange =
    monthWeights.length >= 2
      ? monthWeights[monthWeights.length - 1].weight - monthWeights[0].weight
      : 0;

  // Streaks
  const workoutDates = allWorkouts.map((w) => w.date);
  const { currentStreak, longestStreak } = calculateStreaks(workoutDates);

  // Goals progress
  const goalsProgress = goals.map((g) => ({
    title: g.title,
    type: g.type,
    progress: g.currentValue ? Math.round((g.currentValue / getGoalTarget(g)) * 100) : 0,
  }));

  const daysInMonth = endOfMonth.getDate();

  return {
    period: `${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`,
    workout: {
      period: `${formatDate(startOfMonth)} - ${formatDate(endOfMonth)}`,
      startDate: startOfMonth,
      endDate: endOfMonth,
      totalWorkouts: monthWorkouts.length,
      totalSets,
      totalReps,
      totalVolume,
      favoriteExercise,
      exerciseBreakdown,
      averagePerDay: Math.round((monthWorkouts.length / daysInMonth) * 10) / 10,
      comparedToLastWeek: 0,
    },
    nutrition: {
      period: `${formatDate(startOfMonth)} - ${formatDate(endOfMonth)}`,
      startDate: startOfMonth,
      endDate: endOfMonth,
      totalMeals: monthMeals.length,
      totalCalories,
      avgCaloriesPerDay: daysLogged > 0 ? Math.round(totalCalories / daysLogged) : 0,
      avgProtein: daysLogged > 0 ? Math.round(totalProtein / daysLogged) : 0,
      avgCarbs: daysLogged > 0 ? Math.round(totalCarbs / daysLogged) : 0,
      avgFat: daysLogged > 0 ? Math.round(totalFat / daysLogged) : 0,
      mealTypeBreakdown,
      daysLogged,
    },
    weightChange,
    goalsProgress,
    streakInfo: { current: currentStreak, longest: longestStreak },
  };
}

// ============================================================
// SMART INSIGHTS
// ============================================================

/**
 * Generate personalized insights based on user data
 */
export async function getInsights(uid: string, unitSystem: UnitSystem = 'metric'): Promise<Insight[]> {
  const [allWorkouts, allMeals, weightLogs] = await Promise.all([
    getWorkouts(uid, 500),
    getMeals(uid, 500),
    getWeightLogs(uid, 50),
  ]);

  const insights: Insight[] = [];
  const now = new Date();

  // ── Streak Insights ──
  const workoutDates = allWorkouts.map((w) => w.date);
  const { currentStreak } = calculateStreaks(workoutDates);

  if (currentStreak >= 7) {
    insights.push({
      id: 'streak-active',
      type: 'streak',
      icon: '🔥',
      message: `You're on a ${currentStreak}-day workout streak! Keep it up!`,
      priority: 1,
    });
  }

  // ── Milestone Insights ──
  const totalWorkouts = allWorkouts.length;
  const milestones = [10, 25, 50, 100, 200];
  for (const m of milestones) {
    if (totalWorkouts >= m && totalWorkouts < m + 5) {
      insights.push({
        id: `milestone-${m}`,
        type: 'milestone',
        icon: '🏆',
        message: `You've completed ${totalWorkouts} workouts. Incredible!`,
        priority: 2,
      });
      break;
    }
  }

  // ── Weight Trend Insights ──
  if (weightLogs.length >= 3) {
    const sorted = [...weightLogs].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const recent = sorted.slice(-3);
    const trend = recent[recent.length - 1].weight - recent[0].weight;

    if (trend < -0.5) {
      insights.push({
        id: 'weight-down',
        type: 'trend',
        icon: '📉',
        message: `Your weight is trending down (${displayWeightChange(trend, unitSystem)}). Stay consistent!`,
        priority: 3,
      });
    } else if (trend > 0.5) {
      insights.push({
        id: 'weight-up',
        type: 'trend',
        icon: '📈',
        message: `Your weight increased by ${displayWeightChange(trend, unitSystem)} recently.`,
        priority: 3,
      });
    }
  }

  // ── Inactivity Alert ──
  if (allWorkouts.length > 0) {
    const lastWorkout = new Date(allWorkouts[0].date); // sorted desc
    const daysSince = Math.floor((now.getTime() - lastWorkout.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSince >= 3 && daysSince < 7) {
      insights.push({
        id: 'inactive-short',
        type: 'alert',
        icon: '⏰',
        message: `You haven't logged a workout in ${daysSince} days. Let's get back on track!`,
        priority: 2,
      });
    } else if (daysSince >= 7) {
      insights.push({
        id: 'inactive-long',
        type: 'alert',
        icon: '💤',
        message: `It's been ${daysSince} days since your last workout. Every day is a chance to restart!`,
        priority: 1,
      });
    }
  }

  // ── Favorite Exercise ──
  if (allWorkouts.length >= 5) {
    const exerciseCounts: Record<string, number> = {};
    for (const w of allWorkouts) {
      exerciseCounts[w.exercise] = (exerciseCounts[w.exercise] || 0) + 1;
    }
    const [favExercise, count] = Object.entries(exerciseCounts).sort(
      (a, b) => b[1] - a[1]
    )[0];
    insights.push({
      id: 'fav-exercise',
      type: 'recommendation',
      icon: '💪',
      message: `Your favorite exercise is ${favExercise} (${count} times).`,
      priority: 4,
    });
  }

  // ── Most Active Day ──
  if (allWorkouts.length >= 7) {
    const dayCount: Record<string, number> = {};
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    for (const w of allWorkouts) {
      const day = dayNames[new Date(w.date).getDay()];
      dayCount[day] = (dayCount[day] || 0) + 1;
    }
    const [bestDay] = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0];
    insights.push({
      id: 'best-day',
      type: 'recommendation',
      icon: '📅',
      message: `You're most active on ${bestDay}s.`,
      priority: 5,
    });
  }

  // ── Macro Balance ──
  const recentMeals = allMeals.slice(0, 14); // last 14 meals
  if (recentMeals.length >= 5) {
    const avgProtein = recentMeals.reduce((s, m) => s + (m.protein || 0), 0) / recentMeals.length;
    if (avgProtein > 0 && avgProtein < 50) {
      insights.push({
        id: 'low-protein',
        type: 'recommendation',
        icon: '🥩',
        message: `Your average protein intake is ${Math.round(avgProtein)}g per meal. Consider increasing it for muscle recovery.`,
        priority: 3,
      });
    }
  }

  // Sort by priority
  insights.sort((a, b) => a.priority - b.priority);

  return insights;
}

// ============================================================
// HELPERS
// ============================================================

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as start
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function toDateString(date: Date): string {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getGoalTarget(goal: Goal): number {
  switch (goal.type) {
    case 'weight':
      return goal.targetWeight || 1;
    case 'workout_frequency':
      return goal.targetWorkoutsPerWeek || 1;
    case 'calories':
      return goal.targetCaloriesPerDay || 1;
    case 'macros':
      return goal.targetProtein || 1;
    default:
      return 1;
  }
}
