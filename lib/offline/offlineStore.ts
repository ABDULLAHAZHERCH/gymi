import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Workout, Meal, Goal, WeightLog } from '@/lib/types/firestore';

/**
 * IndexedDB Schema for offline data storage
 */
interface GYMIDb extends DBSchema {
  workouts: {
    key: string;
    value: Workout & { uid: string; syncStatus: 'pending' | 'synced' };
    indexes: { 'by-uid': string; 'by-date': number };
  };
  meals: {
    key: string;
    value: Meal & { uid: string; syncStatus: 'pending' | 'synced' };
    indexes: { 'by-uid': string; 'by-date': number };
  };
  goals: {
    key: string;
    value: Goal & { uid: string; syncStatus: 'pending' | 'synced' };
    indexes: { 'by-uid': string };
  };
  weightLogs: {
    key: string;
    value: WeightLog & { uid: string; syncStatus: 'pending' | 'synced' };
    indexes: { 'by-uid': string; 'by-date': number };
  };
  syncQueue: {
    key: string;
    value: {
      id: string;
      uid: string;
      type: 'create' | 'update' | 'delete';
      collection: 'workouts' | 'meals' | 'goals' | 'weightLogs';
      docId: string;
      data: any;
      timestamp: number;
      retries: number;
      maxRetries: number;
      error?: string;
    };
    indexes: { 'by-uid': string; 'by-timestamp': number };
  };
}

let db: IDBPDatabase<GYMIDb> | null = null;

/**
 * Initialize IndexedDB
 */
export async function initOfflineStore(): Promise<IDBPDatabase<GYMIDb>> {
  if (db) return db;

  db = await openDB<GYMIDb>('gymi-offline', 1, {
    upgrade(db) {
      // Workouts store
      if (!db.objectStoreNames.contains('workouts')) {
        const workoutStore = db.createObjectStore('workouts', { keyPath: 'id' });
        workoutStore.createIndex('by-uid', 'uid');
        workoutStore.createIndex('by-date', 'date');
      }

      // Meals store
      if (!db.objectStoreNames.contains('meals')) {
        const mealStore = db.createObjectStore('meals', { keyPath: 'id' });
        mealStore.createIndex('by-uid', 'uid');
        mealStore.createIndex('by-date', 'date');
      }

      // Goals store
      if (!db.objectStoreNames.contains('goals')) {
        const goalStore = db.createObjectStore('goals', { keyPath: 'id' });
        goalStore.createIndex('by-uid', 'uid');
      }

      // Weight logs store
      if (!db.objectStoreNames.contains('weightLogs')) {
        const weightStore = db.createObjectStore('weightLogs', { keyPath: 'id' });
        weightStore.createIndex('by-uid', 'uid');
        weightStore.createIndex('by-date', 'date');
      }

      // Sync queue store
      if (!db.objectStoreNames.contains('syncQueue')) {
        const queueStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
        queueStore.createIndex('by-uid', 'uid');
        queueStore.createIndex('by-timestamp', 'timestamp');
      }
    },
  });

  return db;
}

// ============================================================
// WORKOUTS
// ============================================================

export async function addWorkoutOffline(
  uid: string,
  data: Omit<Workout, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const database = await initOfflineStore();
  const id = `offline-${Date.now()}-${Math.random()}`;
  const now = new Date();

  const workout: Workout & { uid: string; syncStatus: 'pending' | 'synced' } = {
    ...data,
    id,
    uid,
    createdAt: now,
    updatedAt: now,
    syncStatus: 'pending',
  };

  await database.add('workouts', workout);
  return id;
}

export async function getWorkoutsOffline(uid: string): Promise<Workout[]> {
  const database = await initOfflineStore();
  const workouts = await database.getAllFromIndex('workouts', 'by-uid', uid);
  return workouts
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .map(({ syncStatus, ...w }) => w);
}

export async function updateWorkoutOffline(
  uid: string,
  workoutId: string,
  updates: Partial<Omit<Workout, 'id' | 'createdAt'>>
): Promise<void> {
  const database = await initOfflineStore();
  const workout = await database.get('workouts', workoutId);

  if (!workout || workout.uid !== uid) {
    throw new Error('Workout not found');
  }

  await database.put('workouts', {
    ...workout,
    ...updates,
    updatedAt: new Date(),
    syncStatus: 'pending',
  });
}

export async function deleteWorkoutOffline(uid: string, workoutId: string): Promise<void> {
  const database = await initOfflineStore();
  const workout = await database.get('workouts', workoutId);

  if (!workout || workout.uid !== uid) {
    throw new Error('Workout not found');
  }

  await database.delete('workouts', workoutId);
}

// ============================================================
// MEALS
// ============================================================

export async function addMealOffline(
  uid: string,
  data: Omit<Meal, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const database = await initOfflineStore();
  const id = `offline-${Date.now()}-${Math.random()}`;
  const now = new Date();

  const meal: Meal & { uid: string; syncStatus: 'pending' | 'synced' } = {
    ...data,
    id,
    uid,
    createdAt: now,
    updatedAt: now,
    syncStatus: 'pending',
  };

  await database.add('meals', meal);
  return id;
}

export async function getMealsOffline(uid: string): Promise<Meal[]> {
  const database = await initOfflineStore();
  const meals = await database.getAllFromIndex('meals', 'by-uid', uid);
  return meals
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .map(({ syncStatus, ...m }) => m);
}

export async function updateMealOffline(
  uid: string,
  mealId: string,
  updates: Partial<Omit<Meal, 'id' | 'createdAt'>>
): Promise<void> {
  const database = await initOfflineStore();
  const meal = await database.get('meals', mealId);

  if (!meal || meal.uid !== uid) {
    throw new Error('Meal not found');
  }

  await database.put('meals', {
    ...meal,
    ...updates,
    updatedAt: new Date(),
    syncStatus: 'pending',
  });
}

export async function deleteMealOffline(uid: string, mealId: string): Promise<void> {
  const database = await initOfflineStore();
  const meal = await database.get('meals', mealId);

  if (!meal || meal.uid !== uid) {
    throw new Error('Meal not found');
  }

  await database.delete('meals', mealId);
}

// ============================================================
// WEIGHT LOGS
// ============================================================

export async function addWeightLogOffline(
  uid: string,
  data: Omit<WeightLog, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const database = await initOfflineStore();
  const id = `offline-${Date.now()}-${Math.random()}`;
  const now = new Date();

  const log: WeightLog & { uid: string; syncStatus: 'pending' | 'synced' } = {
    ...data,
    id,
    uid,
    createdAt: now,
    updatedAt: now,
    syncStatus: 'pending',
  };

  await database.add('weightLogs', log);
  return id;
}

export async function getWeightLogsOffline(uid: string): Promise<WeightLog[]> {
  const database = await initOfflineStore();
  const logs = await database.getAllFromIndex('weightLogs', 'by-uid', uid);
  return logs
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .map(({ syncStatus, ...l }) => l);
}

// ============================================================
// SYNC QUEUE
// ============================================================

export async function addToSyncQueue(
  uid: string,
  type: 'create' | 'update' | 'delete',
  collection: 'workouts' | 'meals' | 'goals' | 'weightLogs',
  docId: string,
  data: any
): Promise<string> {
  const database = await initOfflineStore();
  const id = `sync-${Date.now()}-${Math.random()}`;

  const queueItem: GYMIDb['syncQueue']['value'] = {
    id,
    uid,
    type,
    collection,
    docId,
    data,
    timestamp: Date.now(),
    retries: 0,
    maxRetries: 3,
  };

  await database.add('syncQueue', queueItem);
  return id;
}

export async function getSyncQueue(uid: string): Promise<GYMIDb['syncQueue']['value'][]> {
  const database = await initOfflineStore();
  return database.getAllFromIndex('syncQueue', 'by-uid', uid);
}

export async function removeSyncQueueItem(id: string): Promise<void> {
  const database = await initOfflineStore();
  await database.delete('syncQueue', id);
}

export async function updateSyncQueueItem(
  id: string,
  updates: Partial<GYMIDb['syncQueue']['value']>
): Promise<void> {
  const database = await initOfflineStore();
  const item = await database.get('syncQueue', id);
  if (item) {
    await database.put('syncQueue', { ...item, ...updates });
  }
}

export async function clearSyncQueue(uid: string): Promise<void> {
  const database = await initOfflineStore();
  const items = await database.getAllFromIndex('syncQueue', 'by-uid', uid);
  for (const item of items) {
    await database.delete('syncQueue', item.id);
  }
}

// ============================================================
// UTILITIES
// ============================================================

export async function clearAllOfflineData(uid: string): Promise<void> {
  const database = await initOfflineStore();

  const workouts = await database.getAllFromIndex('workouts', 'by-uid', uid);
  for (const w of workouts) {
    await database.delete('workouts', w.id);
  }

  const meals = await database.getAllFromIndex('meals', 'by-uid', uid);
  for (const m of meals) {
    await database.delete('meals', m.id);
  }

  const logs = await database.getAllFromIndex('weightLogs', 'by-uid', uid);
  for (const l of logs) {
    await database.delete('weightLogs', l.id);
  }

  await clearSyncQueue(uid);
}

export async function closeOfflineStore(): Promise<void> {
  if (db) {
    db.close();
    db = null;
  }
}
