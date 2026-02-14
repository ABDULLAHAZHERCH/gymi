import { db } from './firebase';
import {
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  orderBy,
  where,
  Timestamp,
  limit,
} from 'firebase/firestore';
import { Achievement } from './types/firestore';
import { getWorkouts } from './workouts';
import { getMeals } from './meals';
import { getErrorMessage } from './utils/errorMessages';
import { getWeightLogs } from './weightLogs';

/**
 * Achievements Service Layer
 * Handles achievement tracking, streak calculation, and milestone checking
 */

// ============================================================
// ACHIEVEMENT DEFINITIONS
// ============================================================

export interface AchievementDefinition {
  type: Achievement['type'];
  title: string;
  description: string;
  icon: string;
  milestone: number;
  check: (stats: UserAchievementStats) => boolean;
}

export interface UserAchievementStats {
  totalWorkouts: number;
  totalMeals: number;
  currentStreak: number;
  longestStreak: number;
  totalWeightChange: number;
  uniqueExercises: number;
  heaviestLift: number;
  daysWithMeals: number;
  consecutiveMealDays: number;
}

// All achievable milestones
export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  // ── Workout Streaks ──
  {
    type: 'streak',
    title: '7-Day Warrior',
    description: 'Logged workouts for 7 consecutive days',
    icon: '🔥',
    milestone: 7,
    check: (s) => s.currentStreak >= 7,
  },
  {
    type: 'streak',
    title: '14-Day Dedicated',
    description: 'Logged workouts for 14 consecutive days',
    icon: '💪',
    milestone: 14,
    check: (s) => s.currentStreak >= 14,
  },
  {
    type: 'streak',
    title: '30-Day Legend',
    description: 'Logged workouts for 30 consecutive days',
    icon: '🏆',
    milestone: 30,
    check: (s) => s.currentStreak >= 30,
  },
  {
    type: 'streak',
    title: '60-Day Unstoppable',
    description: 'Logged workouts for 60 consecutive days',
    icon: '⚡',
    milestone: 60,
    check: (s) => s.currentStreak >= 60,
  },
  {
    type: 'streak',
    title: '100-Day Champion',
    description: 'Logged workouts for 100 consecutive days',
    icon: '👑',
    milestone: 100,
    check: (s) => s.currentStreak >= 100,
  },

  // ── Workout Milestones ──
  {
    type: 'workout_count',
    title: 'First Steps',
    description: 'Completed your first 10 workouts',
    icon: '🎯',
    milestone: 10,
    check: (s) => s.totalWorkouts >= 10,
  },
  {
    type: 'workout_count',
    title: 'Quarter Century',
    description: 'Completed 25 workouts',
    icon: '🏅',
    milestone: 25,
    check: (s) => s.totalWorkouts >= 25,
  },
  {
    type: 'workout_count',
    title: 'Half Century',
    description: 'Completed 50 workouts',
    icon: '🥈',
    milestone: 50,
    check: (s) => s.totalWorkouts >= 50,
  },
  {
    type: 'workout_count',
    title: 'Century Club',
    description: 'Completed 100 workouts',
    icon: '🥇',
    milestone: 100,
    check: (s) => s.totalWorkouts >= 100,
  },

  // ── Weight Milestones ──
  {
    type: 'weight_milestone',
    title: '5kg Transformation',
    description: 'Changed your body weight by 5kg',
    icon: '⚖️',
    milestone: 5,
    check: (s) => Math.abs(s.totalWeightChange) >= 5,
  },
  {
    type: 'weight_milestone',
    title: '10kg Transformation',
    description: 'Changed your body weight by 10kg',
    icon: '🔄',
    milestone: 10,
    check: (s) => Math.abs(s.totalWeightChange) >= 10,
  },
  {
    type: 'weight_milestone',
    title: '15kg Transformation',
    description: 'Changed your body weight by 15kg',
    icon: '🌟',
    milestone: 15,
    check: (s) => Math.abs(s.totalWeightChange) >= 15,
  },

  // ── Personal Records ──
  {
    type: 'personal_record',
    title: 'Heavy Lifter',
    description: 'Lifted 100kg+ in a single exercise',
    icon: '🏋️',
    milestone: 100,
    check: (s) => s.heaviestLift >= 100,
  },

  // ── Calorie / Meal Logging ──
  {
    type: 'workout_count', // reuse type for meal-related achievements
    title: 'Meal Tracker',
    description: 'Logged meals for 10 different days',
    icon: '🍽️',
    milestone: 10,
    check: (s) => s.daysWithMeals >= 10,
  },
  {
    type: 'workout_count',
    title: 'Nutrition Pro',
    description: 'Logged meals for 25 different days',
    icon: '📊',
    milestone: 25,
    check: (s) => s.daysWithMeals >= 25,
  },
  {
    type: 'workout_count',
    title: 'Nutrition Master',
    description: 'Logged meals for 50 different days',
    icon: '🧑‍🍳',
    milestone: 50,
    check: (s) => s.daysWithMeals >= 50,
  },
];

// ============================================================
// FIRESTORE CRUD
// ============================================================

/**
 * Unlock an achievement for a user
 */
export async function unlockAchievement(
  uid: string,
  achievement: Omit<Achievement, 'id' | 'createdAt'>
): Promise<string> {
  try {
    const achievementsRef = collection(db, 'users', uid, 'achievements');

    // Check if already unlocked (prevent duplicates)
    const existing = await getDocs(
      query(
        achievementsRef,
        where('title', '==', achievement.title)
      )
    );

    if (!existing.empty) {
      return existing.docs[0].id; // Already unlocked
    }

    const docRef = await addDoc(achievementsRef, {
      type: achievement.type,
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
      milestone: achievement.milestone,
      achievedAt: Timestamp.fromDate(achievement.achievedAt),
      createdAt: Timestamp.fromDate(new Date()),
    });

    return docRef.id;
  } catch (error) {
    console.error('Error unlocking achievement:', error);
    throw new Error(getErrorMessage(error, 'Failed to unlock achievement'));
  }
}

/**
 * Get all achievements for a user
 */
export async function getAchievements(uid: string): Promise<Achievement[]> {
  try {
    const achievementsRef = collection(db, 'users', uid, 'achievements');
    const q = query(achievementsRef, orderBy('achievedAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        type: data.type,
        title: data.title,
        description: data.description,
        icon: data.icon,
        milestone: data.milestone,
        achievedAt: data.achievedAt?.toDate?.() || new Date(),
        createdAt: data.createdAt?.toDate?.() || new Date(),
      };
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    throw new Error(getErrorMessage(error, 'Failed to fetch achievements'));
  }
}

// ============================================================
// STREAK CALCULATIONS
// ============================================================

/**
 * Calculate current and longest workout streak
 */
export function calculateStreaks(workoutDates: Date[]): {
  currentStreak: number;
  longestStreak: number;
} {
  if (workoutDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Get unique days (normalize to date strings)
  const uniqueDays = Array.from(
    new Set(workoutDates.map((d) => toDateString(d)))
  ).sort();

  if (uniqueDays.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  let longestStreak = 1;
  let currentRun = 1;

  for (let i = 1; i < uniqueDays.length; i++) {
    const prev = new Date(uniqueDays[i - 1]);
    const curr = new Date(uniqueDays[i]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      currentRun++;
      longestStreak = Math.max(longestStreak, currentRun);
    } else {
      currentRun = 1;
    }
  }

  // Check if current streak includes today or yesterday
  const today = toDateString(new Date());
  const yesterday = toDateString(new Date(Date.now() - 86400000));
  const lastDay = uniqueDays[uniqueDays.length - 1];

  // Current streak = run that ends today or yesterday
  let currentStreak = 0;
  if (lastDay === today || lastDay === yesterday) {
    currentStreak = currentRun;
  }

  return { currentStreak, longestStreak: Math.max(longestStreak, currentStreak) };
}

/**
 * Calculate consecutive days with meals logged
 */
export function calculateMealStreak(mealDates: Date[]): number {
  if (mealDates.length === 0) return 0;

  const uniqueDays = Array.from(
    new Set(mealDates.map((d) => toDateString(d)))
  ).sort();

  let streak = 1;
  for (let i = uniqueDays.length - 1; i > 0; i--) {
    const curr = new Date(uniqueDays[i]);
    const prev = new Date(uniqueDays[i - 1]);
    const diff = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }

  // Verify it ends today or yesterday
  const today = toDateString(new Date());
  const yesterday = toDateString(new Date(Date.now() - 86400000));
  const lastDay = uniqueDays[uniqueDays.length - 1];

  return lastDay === today || lastDay === yesterday ? streak : 0;
}

// ============================================================
// ACHIEVEMENT CHECKING
// ============================================================

/**
 * Gather all user stats needed for achievement checking
 */
export async function gatherAchievementStats(uid: string): Promise<UserAchievementStats> {
  const [workouts, meals, weightLogs] = await Promise.all([
    getWorkouts(uid, 1000),
    getMeals(uid, 1000),
    getWeightLogs(uid, 100),
  ]);

  // Workout stats
  const totalWorkouts = workouts.length;
  const workoutDates = workouts.map((w) => w.date);
  const { currentStreak, longestStreak } = calculateStreaks(workoutDates);
  const uniqueExercises = new Set(workouts.map((w) => w.exercise.toLowerCase())).size;
  const heaviestLift = workouts.reduce((max, w) => Math.max(max, w.weight || 0), 0);

  // Meal stats
  const totalMeals = meals.length;
  const mealDates = meals.map((m) => m.date);
  const daysWithMeals = new Set(mealDates.map((d) => toDateString(d))).size;
  const consecutiveMealDays = calculateMealStreak(mealDates);

  // Weight stats
  let totalWeightChange = 0;
  if (weightLogs.length >= 2) {
    const sorted = [...weightLogs].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    totalWeightChange = sorted[sorted.length - 1].weight - sorted[0].weight;
  }

  return {
    totalWorkouts,
    totalMeals,
    currentStreak,
    longestStreak,
    totalWeightChange,
    uniqueExercises,
    heaviestLift,
    daysWithMeals,
    consecutiveMealDays,
  };
}

/**
 * Check for newly earned achievements and unlock them
 * Returns newly unlocked achievements
 */
export async function checkForNewAchievements(uid: string): Promise<Achievement[]> {
  try {
    const [stats, existingAchievements] = await Promise.all([
      gatherAchievementStats(uid),
      getAchievements(uid),
    ]);

    const existingTitles = new Set(existingAchievements.map((a) => a.title));
    const newlyUnlocked: Achievement[] = [];

    for (const definition of ACHIEVEMENT_DEFINITIONS) {
      // Skip already unlocked achievements
      if (existingTitles.has(definition.title)) continue;

      // Check if the user qualifies
      if (definition.check(stats)) {
        const id = await unlockAchievement(uid, {
          type: definition.type,
          title: definition.title,
          description: definition.description,
          icon: definition.icon,
          milestone: definition.milestone,
          achievedAt: new Date(),
        });

        newlyUnlocked.push({
          id,
          type: definition.type,
          title: definition.title,
          description: definition.description,
          icon: definition.icon,
          milestone: definition.milestone,
          achievedAt: new Date(),
          createdAt: new Date(),
        });
      }
    }

    return newlyUnlocked;
  } catch (error) {
    console.error('Error checking achievements:', error);
    return [];
  }
}

/**
 * Get progress towards all achievements (locked + unlocked)
 */
export async function getMilestoneProgress(uid: string): Promise<
  Array<AchievementDefinition & { unlocked: boolean; unlockedAt?: Date; progress: number }>
> {
  const [stats, existingAchievements] = await Promise.all([
    gatherAchievementStats(uid),
    getAchievements(uid),
  ]);

  const unlockedMap = new Map(
    existingAchievements.map((a) => [a.title, a.achievedAt])
  );

  return ACHIEVEMENT_DEFINITIONS.map((def) => {
    const unlocked = unlockedMap.has(def.title);
    const unlockedAt = unlockedMap.get(def.title);

    // Calculate progress percentage
    let progress = 0;
    switch (def.type) {
      case 'streak':
        progress = Math.min(100, (stats.currentStreak / def.milestone) * 100);
        break;
      case 'workout_count':
        if (def.title.includes('Meal') || def.title.includes('Nutrition')) {
          progress = Math.min(100, (stats.daysWithMeals / def.milestone) * 100);
        } else {
          progress = Math.min(100, (stats.totalWorkouts / def.milestone) * 100);
        }
        break;
      case 'weight_milestone':
        progress = Math.min(100, (Math.abs(stats.totalWeightChange) / def.milestone) * 100);
        break;
      case 'personal_record':
        progress = Math.min(100, (stats.heaviestLift / def.milestone) * 100);
        break;
    }

    return {
      ...def,
      unlocked,
      unlockedAt,
      progress: unlocked ? 100 : Math.round(progress),
    };
  });
}

// ============================================================
// HELPERS
// ============================================================

function toDateString(date: Date): string {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
