/**
 * Firestore Database Schema Types
 * Define all data structures for GYMI backend
 */

/** User Profile - stored at /users/{uid} */
export interface UserProfile {
  // Basic Info
  name: string;
  email: string;
  // avatar?: string; // REMOVED - Storage not available without Blaze plan

  // Fitness Info
  goal: 'Build strength' | 'Lose weight' | 'Improve endurance' | 'Stay consistent';
  weight: number; // kg
  height: number; // cm

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

/** Workout Entry - stored at /users/{uid}/workouts/{workoutId} */
export interface Workout {
  // Exercise Info
  exercise: string; // e.g., "Bench Press", "Deadlift"
  sets: number;
  reps: number;
  weight: number; // kg
  
  // Additional Info
  duration?: number; // minutes
  notes?: string;
  date: Date;

  // Metadata
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Meal Entry - stored at /users/{uid}/meals/{mealId} */
export interface Meal {
  // Meal Info
  mealName: string; // e.g., "Breakfast", "Lunch"
  items: string; // comma-separated or free text food items
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other';
  
  // Macros
  calories: number;
  protein?: number; // grams (optional)
  carbs?: number; // grams (optional)
  fat?: number; // grams (optional)

  // Additional Info
  notes?: string;
  date: Date;

  // Metadata
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Summary Stats - computed from workouts & meals */
export interface UserStats {
  totalWorkouts: number;
  totalExercises: number;
  totalCaloriesLogged: number;
  avgWeightPerExercise: Record<string, number>; // { "Bench Press": 80 }
}

/** Goal - stored at /users/{uid}/goals/{goalId} */
export interface Goal {
  // Goal Info
  type: 'weight' | 'workout_frequency' | 'calories' | 'macros';
  title: string;
  description?: string;
  
  // Target Values (type-specific)
  targetWeight?: number; // kg (for weight goals)
  targetWorkoutsPerWeek?: number; // (for workout frequency goals)
  targetCaloriesPerDay?: number; // (for calorie goals)
  targetProtein?: number; // g (for macro goals)
  targetCarbs?: number; // g (for macro goals)
  targetFat?: number; // g (for macro goals)
  
  // Timeline
  startDate: Date;
  targetDate: Date; // deadline
  
  // Status
  status: 'active' | 'completed' | 'abandoned';
  completedAt?: Date;
  
  // Progress Tracking
  currentValue?: number; // current progress
  
  // Metadata
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Weight Log - stored at /users/{uid}/weightLogs/{logId} */
export interface WeightLog {
  weight: number; // kg
  date: Date;
  notes?: string;
  
  // Metadata
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Achievement - stored at /users/{uid}/achievements/{achievementId} */
export interface Achievement {
  type: 'streak' | 'workout_count' | 'weight_milestone' | 'personal_record';
  title: string;
  description: string;
  icon: string; // emoji or icon name
  
  // Achievement Data
  milestone: number; // e.g., 7 for 7-day streak
  achievedAt: Date;
  
  // Metadata
  id: string;
  createdAt: Date;
}

/** Notification types */
export type NotificationType =
  | 'achievement'
  | 'streak'
  | 'streak_warning'
  | 'goal_deadline'
  | 'goal_completed'
  | 'weekly_summary'
  | 'personal_record'
  | 'inactivity'
  | 'welcome'
  | 'milestone';

/** Notification - stored at /users/{uid}/notifications/{notificationId} */
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  icon: string; // emoji
  read: boolean;
  linkTo?: string; // route to navigate on click
  createdAt: Date;
  readAt?: Date;
}
