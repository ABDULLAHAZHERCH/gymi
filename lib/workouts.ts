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
  orderBy,
  limit,
  where,
  Timestamp,
} from 'firebase/firestore';
import { Workout } from './types/firestore';
import { getErrorMessage } from './utils/errorMessages';
import { cachedFetch, cacheInvalidate } from './cache';

/**
 * Workout Service Layer
 * Handles all CRUD operations for workouts
 */

// Helper to convert Firestore timestamp to Date
const convertTimestamps = (data: any): Omit<Workout, 'id'> => {
  // Helper to safely convert date, preserving local timezone
  const parseDate = (dateValue: any): Date => {
    if (!dateValue) return new Date();
    // If it's a Firestore Timestamp, convert it
    if (typeof dateValue.toDate === 'function') return dateValue.toDate();
    // If it's already a Date, return as-is
    if (dateValue instanceof Date) return dateValue;
    // If it's a string, parse it as local time (not UTC)
    if (typeof dateValue === 'string') {
      const [datePart, timePart] = dateValue.split('T');
      if (datePart && timePart) {
        const [year, month, day] = datePart.split('-').map(Number);
        const [hour, minute] = timePart.split(':').map(Number);
        return new Date(year, month - 1, day, hour, minute, 0, 0);
      }
      return new Date(dateValue);
    }
    return new Date();
  };

  return {
    exercise: data.exercise?.trim() || '',
    sets: Number(data.sets) || 0,
    reps: Number(data.reps) || 0,
    weight: Number(data.weight) || 0,
    duration: data.duration ? Number(data.duration) : undefined,
    notes: data.notes?.trim() || undefined,
    date: parseDate(data.date),
    createdAt: parseDate(data.createdAt),
    updatedAt: parseDate(data.updatedAt),
  };
};

/**
 * Add a new workout
 */
export async function addWorkout(
  uid: string,
  workoutData: Omit<Workout, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const workoutsRef = collection(db, 'users', uid, 'workouts');
    
    // Ensure date is a valid Date object
    const dateValue = workoutData.date instanceof Date ? workoutData.date : new Date(workoutData.date);
    
    const docRef = await addDoc(workoutsRef, {
      exercise: workoutData.exercise?.trim() || '',
      sets: Number(workoutData.sets) || 0,
      reps: Number(workoutData.reps) || 0,
      weight: Number(workoutData.weight) || 0,
      duration: workoutData.duration ? Number(workoutData.duration) : null,
      notes: workoutData.notes?.trim() || null,
      date: Timestamp.fromDate(dateValue),
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
    });
    cacheInvalidate(`workouts:${uid}`, `stats:${uid}`, `recent:${uid}`);
    return docRef.id;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to add workout'));
  }
}

/**
 * Get all workouts for a user (sorted by date, newest first)
 */
export async function getWorkouts(uid: string, maxLimit = 100): Promise<Workout[]> {
  return cachedFetch(`workouts:${uid}:${maxLimit}`, async () => {
    try {
      const workoutsRef = collection(db, 'users', uid, 'workouts');
      const q = query(workoutsRef, orderBy('date', 'desc'), limit(maxLimit));
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...convertTimestamps(data),
        };
      });
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to fetch workouts'));
    }
  });
}

/**
 * Get a single workout by ID
 */
export async function getWorkout(uid: string, workoutId: string): Promise<Workout | null> {
  try {
    const workoutRef = doc(db, 'users', uid, 'workouts', workoutId);
    const snapshot = await getDoc(workoutRef);

    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.data();
    return {
      id: snapshot.id,
      ...convertTimestamps(data),
    };
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to fetch workout'));
  }
}

/**
 * Update an existing workout
 */
export async function updateWorkout(
  uid: string,
  workoutId: string,
  updates: Partial<Omit<Workout, 'id' | 'createdAt'>>
): Promise<void> {
  try {
    const workoutRef = doc(db, 'users', uid, 'workouts', workoutId);
    
    const updateData: any = {
      updatedAt: Timestamp.fromDate(new Date()),
    };

    // Map and validate each field
    if (updates.exercise !== undefined) updateData.exercise = updates.exercise?.trim() || '';
    if (updates.sets !== undefined) updateData.sets = Number(updates.sets) || 0;
    if (updates.reps !== undefined) updateData.reps = Number(updates.reps) || 0;
    if (updates.weight !== undefined) updateData.weight = Number(updates.weight) || 0;
    if (updates.duration !== undefined) updateData.duration = updates.duration ? Number(updates.duration) : null;
    if (updates.notes !== undefined) updateData.notes = updates.notes?.trim() || null;
    
    // Convert date if provided
    if (updates.date) {
      const dateValue = updates.date instanceof Date ? updates.date : new Date(updates.date);
      updateData.date = Timestamp.fromDate(dateValue);
    }

    await updateDoc(workoutRef, updateData);
    cacheInvalidate(`workouts:${uid}`, `stats:${uid}`, `recent:${uid}`);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to update workout'));
  }
}

/**
 * Delete a workout
 */
export async function deleteWorkout(uid: string, workoutId: string): Promise<void> {
  try {
    const workoutRef = doc(db, 'users', uid, 'workouts', workoutId);
    await deleteDoc(workoutRef);
    cacheInvalidate(`workouts:${uid}`, `stats:${uid}`, `recent:${uid}`);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to delete workout'));
  }
}

/**
 * Get workouts for a specific date range
 */
export async function getWorkoutsByDateRange(
  uid: string,
  startDate: Date,
  endDate: Date
): Promise<Workout[]> {
  try {
    const workoutsRef = collection(db, 'users', uid, 'workouts');
    const q = query(
      workoutsRef,
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate)),
      orderBy('date', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...convertTimestamps(data),
      };
    });
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to fetch workouts'));
  }
}

/**
 * Get recent workouts (last N entries)
 */
export async function getRecentWorkouts(uid: string, count = 5): Promise<Workout[]> {
  try {
    const workoutsRef = collection(db, 'users', uid, 'workouts');
    const q = query(workoutsRef, orderBy('date', 'desc'), limit(count));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...convertTimestamps(data),
      };
    });
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to fetch workouts'));
  }
}
