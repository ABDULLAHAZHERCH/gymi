import { createNotification, getNotifications } from './notifications';
import { NotificationType } from './types/firestore';
import { calculateStreaks, gatherAchievementStats } from './achievements';
import { getWorkouts } from './workouts';
import { getGoals } from './goals';

/**
 * Notification Triggers
 * Centralized logic that checks conditions and creates notifications.
 * Called after key user actions (workout CRUD, meal CRUD, dashboard load, etc.)
 */

// ============================================================
// DEDUP HELPER
// ============================================================

/**
 * Check if a notification of a given type already exists today.
 * Prevents duplicate notifications (e.g., two "streak warning" in one day).
 */
async function hasNotificationToday(
  uid: string,
  type: NotificationType,
  extraMatch?: string
): Promise<boolean> {
  try {
    const notifications = await getNotifications(uid, 50);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return notifications.some((n) => {
      const created = new Date(n.createdAt);
      created.setHours(0, 0, 0, 0);
      const sameDay = created.getTime() === today.getTime();
      const sameType = n.type === type;
      if (extraMatch) {
        return sameDay && sameType && n.title.includes(extraMatch);
      }
      return sameDay && sameType;
    });
  } catch {
    return false;
  }
}

// ============================================================
// WORKOUT TRIGGERS
// ============================================================

/**
 * Run after a workout is added/updated.
 * Checks: streak milestones, workout count milestones, personal records.
 */
export async function triggerWorkoutNotifications(uid: string): Promise<void> {
  try {
    const stats = await gatherAchievementStats(uid);

    // Streak milestones — notify at 7, 14, 30, 60, 100
    const streakMilestones = [7, 14, 30, 60, 100];
    for (const milestone of streakMilestones) {
      if (stats.currentStreak === milestone) {
        const exists = await hasNotificationToday(uid, 'streak', `${milestone}-day`);
        if (!exists) {
          await createNotification(uid, {
            type: 'streak',
            title: `${milestone}-Day Streak! 🔥`,
            message: `You've logged workouts for ${milestone} consecutive days. Keep it up!`,
            icon: '🔥',
            read: false,
            linkTo: '/achievements',
          });
        }
        break; // only one streak notification
      }
    }

    // Workout count milestones — 10, 25, 50, 100
    const countMilestones = [10, 25, 50, 100];
    for (const milestone of countMilestones) {
      if (stats.totalWorkouts === milestone) {
        const exists = await hasNotificationToday(uid, 'milestone', `${milestone} workouts`);
        if (!exists) {
          await createNotification(uid, {
            type: 'milestone',
            title: `${milestone} Workouts! ⭐`,
            message: `You've completed ${milestone} total workouts. Incredible dedication!`,
            icon: '⭐',
            read: false,
            linkTo: '/achievements',
          });
        }
        break;
      }
    }

    // Personal record check — heaviest lift across all exercises
    if (stats.heaviestLift >= 100) {
      const workouts = await getWorkouts(uid, 5);
      const latest = workouts[0];
      if (latest && latest.weight >= 100) {
        const exists = await hasNotificationToday(uid, 'personal_record');
        if (!exists) {
          await createNotification(uid, {
            type: 'personal_record',
            title: 'New Personal Record! 🏅',
            message: `${latest.exercise}: ${latest.weight}kg — that's a new PR!`,
            icon: '🏅',
            read: false,
            linkTo: '/workouts',
          });
        }
      }
    }
  } catch (error) {
    console.error('Error triggering workout notifications:', error);
  }
}

// ============================================================
// MEAL TRIGGERS
// ============================================================

/**
 * Run after a meal is added. Lightweight — just checks daily calorie goal.
 */
export async function triggerMealNotifications(
  uid: string,
  todayCalories: number,
  targetCalories?: number
): Promise<void> {
  try {
    if (targetCalories && todayCalories >= targetCalories) {
      const exists = await hasNotificationToday(uid, 'goal_completed', 'calorie');
      if (!exists) {
        await createNotification(uid, {
          type: 'goal_completed',
          title: 'Daily Calorie Goal Met! ✅',
          message: `You've hit ${todayCalories} kcal today — matching your ${targetCalories} kcal target.`,
          icon: '✅',
          read: false,
          linkTo: '/nutrition',
        });
      }
    }
  } catch (error) {
    console.error('Error triggering meal notifications:', error);
  }
}

// ============================================================
// DASHBOARD TRIGGERS (run on home page load)
// ============================================================

/**
 * Run on dashboard load. Checks:
 * - Weekly summary (Monday, first load of the week)
 * - Streak warnings (evening, if no workout today)
 * - Inactivity (3+ days without any workout)
 */
export async function triggerDashboardNotifications(uid: string): Promise<void> {
  try {
    const now = new Date();
    const workouts = await getWorkouts(uid, 100);

    // ── Weekly Summary (Monday) ──
    if (now.getDay() === 1) {
      const exists = await hasNotificationToday(uid, 'weekly_summary');
      if (!exists) {
        // Count workouts from last 7 days
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekWorkouts = workouts.filter(
          (w) => new Date(w.date) >= weekAgo
        ).length;

        await createNotification(uid, {
          type: 'weekly_summary',
          title: 'Weekly Summary 📊',
          message: `Last week: ${weekWorkouts} workout${weekWorkouts !== 1 ? 's' : ''} logged. Keep pushing!`,
          icon: '📊',
          read: false,
          linkTo: '/home',
        });
      }
    }

    // ── Streak Warning (after 5pm, no workout today) ──
    if (now.getHours() >= 17) {
      const workoutDates = workouts.map((w) => w.date);
      const { currentStreak } = calculateStreaks(workoutDates);

      if (currentStreak >= 3) {
        // Check if user already worked out today
        const todayStr = formatDateStr(now);
        const workedOutToday = workouts.some(
          (w) => formatDateStr(new Date(w.date)) === todayStr
        );

        if (!workedOutToday) {
          const exists = await hasNotificationToday(uid, 'streak_warning');
          if (!exists) {
            await createNotification(uid, {
              type: 'streak_warning',
              title: "Don't Break Your Streak! ⚠️",
              message: `You're on a ${currentStreak}-day streak. Log a workout today to keep it alive!`,
              icon: '⚠️',
              read: false,
              linkTo: '/workouts',
            });
          }
        }
      }
    }

    // ── Inactivity (3+ days without workout) ──
    if (workouts.length > 0) {
      const lastWorkout = new Date(workouts[0].date);
      const daysSince = Math.floor(
        (now.getTime() - lastWorkout.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSince >= 3) {
        const exists = await hasNotificationToday(uid, 'inactivity');
        if (!exists) {
          await createNotification(uid, {
            type: 'inactivity',
            title: 'We Miss You! 👋',
            message: `It's been ${daysSince} days since your last workout. Let's get back on track!`,
            icon: '👋',
            read: false,
            linkTo: '/workouts',
          });
        }
      }
    }

    // ── Goal Deadline Approaching (within 3 days) ──
    try {
      const goals = await getGoals(uid);
      const activeGoals = goals.filter((g) => g.status === 'active');

      for (const goal of activeGoals) {
        const deadline = new Date(goal.targetDate);
        const daysLeft = Math.floor(
          (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysLeft >= 0 && daysLeft <= 3) {
          const exists = await hasNotificationToday(uid, 'goal_deadline', goal.title);
          if (!exists) {
            await createNotification(uid, {
              type: 'goal_deadline',
              title: 'Goal Deadline Approaching 🎯',
              message: `"${goal.title}" ends in ${daysLeft === 0 ? 'today' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''}`}!`,
              icon: '🎯',
              read: false,
              linkTo: '/progress',
            });
          }
        }
      }
    } catch {
      // goals fetch may fail — non-critical
    }
  } catch (error) {
    console.error('Error triggering dashboard notifications:', error);
  }
}

// ============================================================
// GOAL TRIGGERS
// ============================================================

/**
 * Run after a goal is completed.
 */
export async function triggerGoalCompletedNotification(
  uid: string,
  goalTitle: string
): Promise<void> {
  try {
    const exists = await hasNotificationToday(uid, 'goal_completed', goalTitle);
    if (!exists) {
      await createNotification(uid, {
        type: 'goal_completed',
        title: 'Goal Achieved! ✅',
        message: `You completed "${goalTitle}". Set a new goal to keep progressing!`,
        icon: '✅',
        read: false,
        linkTo: '/progress',
      });
    }
  } catch (error) {
    console.error('Error triggering goal notification:', error);
  }
}

// ============================================================
// WELCOME TRIGGER
// ============================================================

/**
 * Run after onboarding completes.
 */
export async function triggerWelcomeNotification(uid: string): Promise<void> {
  try {
    const exists = await hasNotificationToday(uid, 'welcome');
    if (!exists) {
      await createNotification(uid, {
        type: 'welcome',
        title: 'Welcome to GYMI! 🎉',
        message: 'Start by logging your first workout or meal. We\'re here to help you reach your goals!',
        icon: '🎉',
        read: false,
        linkTo: '/workouts',
      });
    }
  } catch (error) {
    console.error('Error triggering welcome notification:', error);
  }
}

// ============================================================
// ACHIEVEMENT TRIGGER
// ============================================================

/**
 * Create a notification for a newly unlocked achievement.
 */
export async function triggerAchievementNotification(
  uid: string,
  achievementTitle: string,
  achievementIcon: string
): Promise<void> {
  try {
    const exists = await hasNotificationToday(uid, 'achievement', achievementTitle);
    if (!exists) {
      await createNotification(uid, {
        type: 'achievement',
        title: `Achievement Unlocked! ${achievementIcon}`,
        message: `You earned "${achievementTitle}". Check your achievements page!`,
        icon: achievementIcon,
        read: false,
        linkTo: '/achievements',
      });
    }
  } catch (error) {
    console.error('Error triggering achievement notification:', error);
  }
}

// ============================================================
// HELPERS
// ============================================================

function formatDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
