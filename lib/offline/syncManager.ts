import {
  getSyncQueue,
  removeSyncQueueItem,
  updateSyncQueueItem,
  getWorkoutsOffline,
  getMealsOffline,
  getWeightLogsOffline,
  initOfflineStore,
} from './offlineStore';

// Firebase service imports
import { addWorkout, updateWorkout, deleteWorkout } from '@/lib/workouts';
import { addMeal, updateMeal, deleteMeal } from '@/lib/meals';
import { addWeightLog } from '@/lib/weightLogs';

/**
 * Sync Manager
 * Processes the offline sync queue when the user comes back online.
 * Handles create/update/delete operations for all collections.
 */

export interface SyncResult {
  total: number;
  synced: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}

let isSyncing = false;

/**
 * Process all pending sync queue items for a user
 */
export async function processSyncQueue(uid: string): Promise<SyncResult> {
  // Prevent concurrent syncs
  if (isSyncing) {
    console.log('[SyncManager] Sync already in progress, skipping...');
    return { total: 0, synced: 0, failed: 0, errors: [] };
  }

  isSyncing = true;
  const result: SyncResult = { total: 0, synced: 0, failed: 0, errors: [] };

  try {
    const queue = await getSyncQueue(uid);
    // Sort by timestamp (oldest first for correct ordering)
    queue.sort((a, b) => a.timestamp - b.timestamp);

    result.total = queue.length;

    if (queue.length === 0) {
      console.log('[SyncManager] No pending items to sync');
      return result;
    }

    console.log(`[SyncManager] Processing ${queue.length} pending items...`);

    for (const item of queue) {
      try {
        await processQueueItem(uid, item);
        await removeSyncQueueItem(item.id);
        result.synced++;
        console.log(`[SyncManager] ✅ Synced: ${item.collection}/${item.type} (${item.docId})`);
      } catch (error: any) {
        const errorMessage = error.message || 'Unknown sync error';
        console.error(`[SyncManager] ❌ Failed: ${item.collection}/${item.type} (${item.docId})`, errorMessage);

        // Increment retry count
        const retries = (item.retries || 0) + 1;

        if (retries >= item.maxRetries) {
          // Max retries reached — mark as failed and remove from queue
          console.warn(`[SyncManager] Max retries reached for ${item.id}, removing from queue`);
          await removeSyncQueueItem(item.id);
          result.failed++;
          result.errors.push({ id: item.id, error: `Max retries exceeded: ${errorMessage}` });
        } else {
          // Update retry count and error message
          await updateSyncQueueItem(item.id, {
            retries,
            error: errorMessage,
          });
          result.failed++;
          result.errors.push({ id: item.id, error: errorMessage });
        }
      }
    }

    console.log(`[SyncManager] Sync complete: ${result.synced}/${result.total} synced, ${result.failed} failed`);
    return result;
  } finally {
    isSyncing = false;
  }
}

/**
 * Process a single sync queue item
 */
async function processQueueItem(
  uid: string,
  item: {
    type: 'create' | 'update' | 'delete';
    collection: 'workouts' | 'meals' | 'goals' | 'weightLogs';
    docId: string;
    data: any;
  }
): Promise<void> {
  const { type, collection, docId, data } = item;

  // Ensure data has proper Date objects (IDB may store them as strings)
  const parsedData = data ? parseDataDates(data) : data;

  switch (collection) {
    case 'workouts':
      await processWorkoutSync(uid, type, docId, parsedData);
      break;
    case 'meals':
      await processMealSync(uid, type, docId, parsedData);
      break;
    case 'weightLogs':
      await processWeightLogSync(uid, type, docId, parsedData);
      break;
    case 'goals':
      // Goals sync not yet implemented — skip for now
      console.warn('[SyncManager] Goals sync not implemented yet');
      break;
    default:
      throw new Error(`Unknown collection: ${collection}`);
  }
}

/**
 * Sync a workout operation to Firebase
 */
async function processWorkoutSync(
  uid: string,
  type: 'create' | 'update' | 'delete',
  docId: string,
  data: any
): Promise<void> {
  switch (type) {
    case 'create': {
      // Strip offline metadata before sending to Firebase
      const { id, uid: _uid, syncStatus, createdAt, updatedAt, ...workoutData } = data;
      await addWorkout(uid, workoutData);
      break;
    }
    case 'update': {
      // For updates, only send the changed fields
      const { id, uid: _uid, syncStatus, createdAt, ...updates } = data;
      // Only sync if it's a real Firebase doc ID (not offline-prefixed)
      if (!docId.startsWith('offline-')) {
        await updateWorkout(uid, docId, updates);
      }
      break;
    }
    case 'delete':
      // Only delete from Firebase if it's a real doc (not offline-only)
      if (!docId.startsWith('offline-')) {
        await deleteWorkout(uid, docId);
      }
      break;
  }
}

/**
 * Sync a meal operation to Firebase
 */
async function processMealSync(
  uid: string,
  type: 'create' | 'update' | 'delete',
  docId: string,
  data: any
): Promise<void> {
  switch (type) {
    case 'create': {
      const { id, uid: _uid, syncStatus, createdAt, updatedAt, ...mealData } = data;
      await addMeal(uid, mealData);
      break;
    }
    case 'update': {
      const { id, uid: _uid, syncStatus, createdAt, ...updates } = data;
      if (!docId.startsWith('offline-')) {
        await updateMeal(uid, docId, updates);
      }
      break;
    }
    case 'delete':
      if (!docId.startsWith('offline-')) {
        await deleteMeal(uid, docId);
      }
      break;
  }
}

/**
 * Sync a weight log operation to Firebase
 */
async function processWeightLogSync(
  uid: string,
  type: 'create' | 'update' | 'delete',
  docId: string,
  data: any
): Promise<void> {
  switch (type) {
    case 'create': {
      const { id, uid: _uid, syncStatus, createdAt, updatedAt, ...logData } = data;
      await addWeightLog(uid, logData);
      break;
    }
    case 'update':
    case 'delete':
      // Weight logs are typically append-only; update/delete sync can be added later
      console.warn(`[SyncManager] Weight log ${type} not fully implemented`);
      break;
  }
}

/**
 * Ensure date fields are proper Date objects
 * IndexedDB may serialize dates as strings
 */
function parseDataDates(data: any): any {
  const parsed = { ...data };
  const dateFields = ['date', 'createdAt', 'updatedAt', 'startDate', 'targetDate', 'completedAt'];

  for (const field of dateFields) {
    if (parsed[field] && !(parsed[field] instanceof Date)) {
      parsed[field] = new Date(parsed[field]);
    }
  }

  return parsed;
}

/**
 * Get current sync status info
 */
export async function getSyncStatus(uid: string): Promise<{
  pending: number;
  failed: number;
  lastError?: string;
}> {
  const queue = await getSyncQueue(uid);

  const failed = queue.filter((item) => item.retries > 0);
  const lastError = failed.length > 0 ? failed[failed.length - 1].error : undefined;

  return {
    pending: queue.length,
    failed: failed.length,
    lastError,
  };
}

/**
 * Check if syncing is currently in progress
 */
export function isSyncInProgress(): boolean {
  return isSyncing;
}
