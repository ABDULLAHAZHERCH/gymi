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
import { Meal } from './types/firestore';

/**
 * Meals Service Layer
 * Handles all CRUD operations for meals
 */

// Helper to convert Firestore timestamp to Date
const convertTimestamps = (data: any): Omit<Meal, 'id'> => {
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
    mealName: data.mealName?.trim() || '',
    mealType: data.mealType || 'other',
    items: data.items?.trim() || '',
    calories: Number(data.calories) || 0,
    protein: data.protein ? Number(data.protein) : undefined,
    carbs: data.carbs ? Number(data.carbs) : undefined,
    fat: data.fat ? Number(data.fat) : undefined,
    notes: data.notes?.trim() || undefined,
    date: parseDate(data.date),
    createdAt: parseDate(data.createdAt),
    updatedAt: parseDate(data.updatedAt),
  };
};

/**
 * Add a new meal
 */
export async function addMeal(
  uid: string,
  mealData: Omit<Meal, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const mealsRef = collection(db, 'users', uid, 'meals');

    // Ensure date is a valid Date object
    const dateValue = mealData.date instanceof Date ? mealData.date : new Date(mealData.date);

    const docRef = await addDoc(mealsRef, {
      mealName: mealData.mealName?.trim() || '',
      mealType: mealData.mealType || 'other',
      items: mealData.items?.trim() || '',
      calories: Number(mealData.calories) || 0,
      protein: mealData.protein ? Number(mealData.protein) : null,
      carbs: mealData.carbs ? Number(mealData.carbs) : null,
      fat: mealData.fat ? Number(mealData.fat) : null,
      notes: mealData.notes?.trim() || null,
      date: Timestamp.fromDate(dateValue),
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
    });
    return docRef.id;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to add meal');
  }
}

/**
 * Get all meals for a user (sorted by date, newest first)
 */
export async function getMeals(uid: string, maxLimit = 100): Promise<Meal[]> {
  try {
    const mealsRef = collection(db, 'users', uid, 'meals');
    const q = query(mealsRef, orderBy('date', 'desc'), limit(maxLimit));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...convertTimestamps(data),
      };
    });
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch meals');
  }
}

/**
 * Get a single meal by ID
 */
export async function getMeal(uid: string, mealId: string): Promise<Meal | null> {
  try {
    const mealRef = doc(db, 'users', uid, 'meals', mealId);
    const snapshot = await getDoc(mealRef);

    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.data();
    return {
      id: snapshot.id,
      ...convertTimestamps(data),
    };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch meal');
  }
}

/**
 * Get meals for a specific date
 */
export async function getMealsByDate(uid: string, date: Date): Promise<Meal[]> {
  try {
    const mealsRef = collection(db, 'users', uid, 'meals');
    
    // Create start of day and end of day timestamps
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const q = query(
      mealsRef,
      where('date', '>=', Timestamp.fromDate(startOfDay)),
      where('date', '<=', Timestamp.fromDate(endOfDay)),
      orderBy('date', 'asc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...convertTimestamps(data),
      };
    });
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch meals by date');
  }
}

/**
 * Update an existing meal
 */
export async function updateMeal(
  uid: string,
  mealId: string,
  updates: Partial<Omit<Meal, 'id' | 'createdAt'>>
): Promise<void> {
  try {
    const mealRef = doc(db, 'users', uid, 'meals', mealId);

    const updateData: any = {
      updatedAt: Timestamp.fromDate(new Date()),
    };

    // Map and validate each field
    if (updates.mealName !== undefined) updateData.mealName = updates.mealName?.trim() || '';
    if (updates.mealType !== undefined) updateData.mealType = updates.mealType || 'other';
    if (updates.items !== undefined) updateData.items = updates.items?.trim() || '';
    if (updates.calories !== undefined) updateData.calories = Number(updates.calories) || 0;
    if (updates.protein !== undefined) updateData.protein = updates.protein ? Number(updates.protein) : null;
    if (updates.carbs !== undefined) updateData.carbs = updates.carbs ? Number(updates.carbs) : null;
    if (updates.fat !== undefined) updateData.fat = updates.fat ? Number(updates.fat) : null;
    if (updates.notes !== undefined) updateData.notes = updates.notes?.trim() || null;

    // Convert date if provided
    if (updates.date) {
      const dateValue = updates.date instanceof Date ? updates.date : new Date(updates.date);
      updateData.date = Timestamp.fromDate(dateValue);
    }

    await updateDoc(mealRef, updateData);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to update meal');
  }
}

/**
 * Delete a meal
 */
export async function deleteMeal(uid: string, mealId: string): Promise<void> {
  try {
    const mealRef = doc(db, 'users', uid, 'meals', mealId);
    await deleteDoc(mealRef);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to delete meal');
  }
}

/**
 * Get total calories for a specific date
 */
export async function getTodayCalories(uid: string, date: Date = new Date()): Promise<number> {
  try {
    const meals = await getMealsByDate(uid, date);
    return meals.reduce((total, meal) => total + (meal.calories || 0), 0);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to calculate today calories');
  }
}

/**
 * Get macro totals for a specific date
 */
export async function getDayMacros(uid: string, date: Date = new Date()) {
  try {
    const meals = await getMealsByDate(uid, date);
    return {
      calories: meals.reduce((total, meal) => total + (meal.calories || 0), 0),
      protein: meals.reduce((total, meal) => total + (meal.protein || 0), 0),
      carbs: meals.reduce((total, meal) => total + (meal.carbs || 0), 0),
      fat: meals.reduce((total, meal) => total + (meal.fat || 0), 0),
    };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch day macros');
  }
}
