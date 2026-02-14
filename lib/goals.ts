import { db } from './firebase';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  limit,
} from 'firebase/firestore';
import { Goal } from './types/firestore';
import { getErrorMessage } from './utils/errorMessages';

// Helper to convert Firestore Timestamps to Dates
const convertTimestamps = (data: any): any => {
  const converted = { ...data };
  if (data.startDate?.toDate) converted.startDate = data.startDate.toDate();
  if (data.targetDate?.toDate) converted.targetDate = data.targetDate.toDate();
  if (data.completedAt?.toDate) converted.completedAt = data.completedAt.toDate();
  if (data.createdAt?.toDate) converted.createdAt = data.createdAt.toDate();
  if (data.updatedAt?.toDate) converted.updatedAt = data.updatedAt.toDate();
  return converted;
};

/**
 * Add a new goal for a user
 */
export async function addGoal(
  uid: string,
  data: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const goalsRef = collection(db, 'users', uid, 'goals');
    const now = Timestamp.now();

    const docRef = await addDoc(goalsRef, {
      ...data,
      startDate: Timestamp.fromDate(data.startDate),
      targetDate: Timestamp.fromDate(data.targetDate),
      completedAt: data.completedAt ? Timestamp.fromDate(data.completedAt) : null,
      createdAt: now,
      updatedAt: now,
    });

    return docRef.id;
  } catch (error) {
    console.error('Error adding goal:', error);
    throw new Error(getErrorMessage(error, 'Failed to add goal'));
  }
}

/**
 * Get all goals for a user
 */
export async function getGoals(uid: string, status?: Goal['status']): Promise<Goal[]> {
  try {
    const goalsRef = collection(db, 'users', uid, 'goals');
    
    // If filtering by status, use where clause only (no orderBy to avoid index requirement)
    // We'll sort in memory instead
    let q;
    if (status) {
      q = query(goalsRef, where('status', '==', status));
    } else {
      q = query(goalsRef);
    }

    const snapshot = await getDocs(q);
    const goals = snapshot.docs.map((doc) => ({
      ...convertTimestamps(doc.data()),
      id: doc.id,
    })) as Goal[];

    // Sort by createdAt in descending order (most recent first)
    return goals.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('Error fetching goals:', error);
    throw new Error(getErrorMessage(error, 'Failed to fetch goals'));
  }
}

/**
 * Get active goals for a user
 */
export async function getActiveGoals(uid: string): Promise<Goal[]> {
  return getGoals(uid, 'active');
}

/**
 * Get a single goal by ID
 */
export async function getGoal(uid: string, goalId: string): Promise<Goal | null> {
  try {
    const docRef = doc(db, 'users', uid, 'goals', goalId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      ...convertTimestamps(docSnap.data()),
      id: docSnap.id,
    } as Goal;
  } catch (error) {
    console.error('Error fetching goal:', error);
    throw new Error(getErrorMessage(error, 'Failed to fetch goal'));
  }
}

/**
 * Update an existing goal
 */
export async function updateGoal(
  uid: string,
  goalId: string,
  updates: Partial<Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  try {
    const docRef = doc(db, 'users', uid, 'goals', goalId);
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now(),
    };

    // Convert Date objects to Timestamps
    if (updates.startDate) {
      updateData.startDate = Timestamp.fromDate(updates.startDate);
    }
    if (updates.targetDate) {
      updateData.targetDate = Timestamp.fromDate(updates.targetDate);
    }
    if (updates.completedAt) {
      updateData.completedAt = Timestamp.fromDate(updates.completedAt);
    }

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating goal:', error);
    throw new Error(getErrorMessage(error, 'Failed to update goal'));
  }
}

/**
 * Delete a goal
 */
export async function deleteGoal(uid: string, goalId: string): Promise<void> {
  try {
    const docRef = doc(db, 'users', uid, 'goals', goalId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting goal:', error);
    throw new Error(getErrorMessage(error, 'Failed to delete goal'));
  }
}

/**
 * Complete a goal (mark as completed)
 */
export async function completeGoal(uid: string, goalId: string): Promise<void> {
  try {
    await updateGoal(uid, goalId, {
      status: 'completed',
      completedAt: new Date(),
    });
  } catch (error) {
    console.error('Error completing goal:', error);
    throw new Error(getErrorMessage(error, 'Failed to complete goal'));
  }
}

/**
 * Calculate goal progress based on current data
 */
export async function calculateGoalProgress(
  uid: string,
  goal: Goal,
  currentStats: {
    currentWeight?: number;
    weeklyWorkouts?: number;
    dailyCalories?: number;
    dailyMacros?: { protein: number; carbs: number; fat: number };
  }
): Promise<number> {
  try {
    switch (goal.type) {
      case 'weight':
        if (!goal.targetWeight || !currentStats.currentWeight) return 0;
        const weightDiff = Math.abs(goal.targetWeight - currentStats.currentWeight);
        const totalWeightChange = Math.abs(goal.targetWeight - (goal.currentValue || currentStats.currentWeight));
        return totalWeightChange > 0 ? ((totalWeightChange - weightDiff) / totalWeightChange) * 100 : 0;

      case 'workout_frequency':
        if (!goal.targetWorkoutsPerWeek || !currentStats.weeklyWorkouts) return 0;
        return Math.min((currentStats.weeklyWorkouts / goal.targetWorkoutsPerWeek) * 100, 100);

      case 'calories':
        if (!goal.targetCaloriesPerDay || !currentStats.dailyCalories) return 0;
        return Math.min((currentStats.dailyCalories / goal.targetCaloriesPerDay) * 100, 100);

      case 'macros':
        if (!currentStats.dailyMacros) return 0;
        const macroProgress: number[] = [];
        
        if (goal.targetProtein) {
          macroProgress.push(Math.min((currentStats.dailyMacros.protein / goal.targetProtein) * 100, 100));
        }
        if (goal.targetCarbs) {
          macroProgress.push(Math.min((currentStats.dailyMacros.carbs / goal.targetCarbs) * 100, 100));
        }
        if (goal.targetFat) {
          macroProgress.push(Math.min((currentStats.dailyMacros.fat / goal.targetFat) * 100, 100));
        }
        
        return macroProgress.length > 0
          ? macroProgress.reduce((sum, p) => sum + p, 0) / macroProgress.length
          : 0;

      default:
        return 0;
    }
  } catch (error) {
    console.error('Error calculating goal progress:', error);
    return 0;
  }
}
