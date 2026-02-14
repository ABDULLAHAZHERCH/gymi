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
import { WeightLog } from './types/firestore';
import { getErrorMessage } from './utils/errorMessages';

// Helper to convert Firestore Timestamps to Dates
const convertTimestamps = (data: any): any => {
  const converted = { ...data };
  if (data.date?.toDate) converted.date = data.date.toDate();
  if (data.createdAt?.toDate) converted.createdAt = data.createdAt.toDate();
  if (data.updatedAt?.toDate) converted.updatedAt = data.updatedAt.toDate();
  return converted;
};

/**
 * Add a new weight log entry
 */
export async function addWeightLog(
  uid: string,
  data: Omit<WeightLog, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const logsRef = collection(db, 'users', uid, 'weightLogs');
    const now = Timestamp.now();

    const docRef = await addDoc(logsRef, {
      weight: data.weight,
      notes: data.notes || null,
      date: Timestamp.fromDate(data.date),
      createdAt: now,
      updatedAt: now,
    });

    return docRef.id;
  } catch (error) {
    console.error('Error adding weight log:', error);
    throw new Error(getErrorMessage(error, 'Failed to add weight log'));
  }
}

/**
 * Get all weight logs for a user
 */
export async function getWeightLogs(uid: string, limitCount: number = 100): Promise<WeightLog[]> {
  try {
    const logsRef = collection(db, 'users', uid, 'weightLogs');
    const q = query(logsRef, orderBy('date', 'desc'), limit(limitCount));

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      ...convertTimestamps(doc.data()),
      id: doc.id,
    })) as WeightLog[];
  } catch (error) {
    console.error('Error fetching weight logs:', error);
    throw new Error(getErrorMessage(error, 'Failed to fetch weight logs'));
  }
}

/**
 * Get weight logs within a date range
 */
export async function getWeightLogsByDateRange(
  uid: string,
  startDate: Date,
  endDate: Date
): Promise<WeightLog[]> {
  try {
    const logsRef = collection(db, 'users', uid, 'weightLogs');
    const q = query(
      logsRef,
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate)),
      orderBy('date', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      ...convertTimestamps(doc.data()),
      id: doc.id,
    })) as WeightLog[];
  } catch (error) {
    console.error('Error fetching weight logs by date range:', error);
    throw new Error(getErrorMessage(error, 'Failed to fetch weight logs'));
  }
}

/**
 * Get the most recent weight log
 */
export async function getLatestWeightLog(uid: string): Promise<WeightLog | null> {
  try {
    const logsRef = collection(db, 'users', uid, 'weightLogs');
    const q = query(logsRef, orderBy('date', 'desc'), limit(1));

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      ...convertTimestamps(doc.data()),
      id: doc.id,
    } as WeightLog;
  } catch (error) {
    console.error('Error fetching latest weight log:', error);
    throw new Error(getErrorMessage(error, 'Failed to fetch latest weight'));
  }
}

/**
 * Update an existing weight log
 */
export async function updateWeightLog(
  uid: string,
  logId: string,
  updates: Partial<Omit<WeightLog, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  try {
    const docRef = doc(db, 'users', uid, 'weightLogs', logId);
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now(),
    };

    if (updates.date) {
      updateData.date = Timestamp.fromDate(updates.date);
    }

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating weight log:', error);
    throw new Error(getErrorMessage(error, 'Failed to update weight log'));
  }
}

/**
 * Delete a weight log
 */
export async function deleteWeightLog(uid: string, logId: string): Promise<void> {
  try {
    const docRef = doc(db, 'users', uid, 'weightLogs', logId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting weight log:', error);
    throw new Error(getErrorMessage(error, 'Failed to delete weight log'));
  }
}

/**
 * Calculate weight change over a period
 */
export async function getWeightChange(uid: string, days: number): Promise<number | null> {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await getWeightLogsByDateRange(uid, startDate, endDate);
    
    if (logs.length < 2) {
      return null;
    }

    // Sort by date ascending to get oldest first
    const sortedLogs = [...logs].sort((a, b) => a.date.getTime() - b.date.getTime());
    const oldestWeight = sortedLogs[0].weight;
    const newestWeight = sortedLogs[sortedLogs.length - 1].weight;

    return newestWeight - oldestWeight;
  } catch (error) {
    console.error('Error calculating weight change:', error);
    return null;
  }
}
