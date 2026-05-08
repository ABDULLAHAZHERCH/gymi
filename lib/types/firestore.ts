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
  weight: number; // kg (always stored in metric)
  height: number; // cm (always stored in metric)

  // Preferences
  unitSystem?: 'metric' | 'imperial'; // default: metric

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

  // Optional Program Linkage
  programId?: string;
  programSessionId?: string;
  programName?: string;
  programSessionName?: string;

  // Optional AI Coach Linkage
  source?: 'manual' | 'coach' | 'program';
  coachSessionId?: string;

  // Metadata
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

/** AI Coach Rep Detail */
export interface CoachRepDetail {
  repNumber: number;
  isValid: boolean;
  violations: string[];
  confidence: number;
  timestamp: number;
}

/** AI Coach Session - stored at /users/{uid}/coachSessions/{sessionId} */
export interface CoachSession {
  id: string;
  detectedExercise: string;
  totalReps: number;
  validReps: number;
  accuracy: number;
  duration: number;
  avgConfidence: number;
  violationCounts: Record<string, number>;
  repBreakdown: CoachRepDetail[];
  date: Date;
  createdAt: Date;
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

/** Workout Program - AI-generated personalized program */
/** Stored at /users/{uid}/workoutPrograms/{programId} */

/** Exercise within a program session */
export interface ProgramExercise {
  exerciseId: string; // Link to lib/data/exercises.ts
  name: string;
  muscleGroups: string[];
  sets: number;
  reps: string | number; // "8-12" or 10
  weight?: string; // "RPE 7-8", "65% 1RM", "bodyweight"
  duration?: number; // For cardio/core (seconds or minutes)
  intensity?: 'light' | 'moderate' | 'high' | string; // e.g., "explosive", "controlled"
  restSeconds?: number;
  notes?: string; // Form cues, alternatives
  progressionNotes?: string; // How this progresses over weeks
}

/** Single workout session within a day */
export interface WorkoutSession {
  sessionId: string; // Unique within program
  sequenceNumber: number; // Order within day
  name: string; // e.g., "Main Strength Block"
  exercises: ProgramExercise[];
  estimatedDuration: number; // minutes
  intensity: 'light' | 'moderate' | 'high';
  notes?: string; // Rest periods, form tips, etc.
  // Link to user's logged workout (if any)
  loggedWorkoutId?: string; // Reference to /users/{uid}/workouts/{id}
}

/** Single day within a week */
export interface WorkoutDay {
  dayNumber: number; // 1-7 (within week)
  dayName: string; // "Monday", "Chest Day", etc.
  sessions: WorkoutSession[];
}

/** Single week within a program */
export interface WorkoutWeek {
  weekNumber: number; // 1, 2, 3, ...
  focusAreas: string[]; // e.g., ["Chest", "Back", "Triceps"]
  days: WorkoutDay[];
  notes?: string; // e.g., "Deload week, reduce volume by 20%"
}

/** Program metadata capturing generation context */
export interface ProgramMetadata {
  goal: 'muscle_gain' | 'fat_loss' | 'strength' | 'endurance' | 'general_fitness';
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  equipmentAccess: 'full_gym' | 'home_equipment' | 'minimal' | 'bodyweight_only';
  location: 'gym' | 'home' | 'both';
  daysPerWeek: number; // 3-7
  sessionLengthMin: number; // 30-120
  injuries?: string; // "lower back", "knee", etc.
  notes?: string;
}

/** Adherence tracking for a program */
export interface ProgramAdherence {
  totalSessionsPlanned: number;
  totalSessionsLogged: number;
  adherencePercent: number; // 0-100
  lastLoggedDate?: Date;
}

/** Main Workout Program document */
export interface WorkoutProgram {
  // Identifiers & Metadata
  id: string; // Auto-generated doc ID
  userId: string; // Reference to user
  programName: string; // e.g., "6-Week Strength Build"
  description: string; // AI-generated summary
  
  // Generation Context
  metadata: ProgramMetadata;
  
  // Program Structure
  plan: {
    // New structure: direct day/session plan (no week grouping)
    days?: WorkoutDay[];
    // Backward compatibility for existing saved programs
    weeks?: WorkoutWeek[];
  };
  
  // Status & Engagement
  status: 'active' | 'completed' | 'archived';
  adherenceStats?: ProgramAdherence;
  
  // Timestamps
  createdAt: Date; // Generation date
  updatedAt: Date; // Last edit
  startedAt?: Date; // When user started following it
  completedAt?: Date; // When user completed it
}
