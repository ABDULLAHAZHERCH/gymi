import { db } from './firebase';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { CoachSession, CoachRepDetail } from './types/firestore';
import { getErrorMessage } from './utils/errorMessages';
import { cachedFetch, cacheInvalidate } from './cache';
import { addWorkout } from './workouts';

/**
 * AI Coach Session Service
 *
 * Persists rich coach session data (per-rep breakdown, violations, accuracy)
 * to /users/{uid}/coachSessions/{id} and writes a linked summary entry into
 * /users/{uid}/workouts/ so coach sessions surface in workout history.
 */

const EXERCISE_DISPLAY: Record<string, string> = {
  squat: 'Squat',
  pushup: 'Push-up',
  bicep_curl: 'Bicep Curl',
  alternate_bicep_curl: 'Alternate Bicep Curl',
};

const exerciseDisplayName = (key: string): string =>
  EXERCISE_DISPLAY[key] ?? key.replace(/_/g, ' ');

const parseDate = (value: any): Date => {
  if (!value) return new Date();
  if (typeof value.toDate === 'function') return value.toDate();
  if (value instanceof Date) return value;
  return new Date(value);
};

const toDoc = (data: any, id: string): CoachSession => ({
  id,
  detectedExercise: data.detectedExercise || 'unknown',
  totalReps: Number(data.totalReps) || 0,
  validReps: Number(data.validReps) || 0,
  accuracy: Number(data.accuracy) || 0,
  duration: Number(data.duration) || 0,
  avgConfidence: Number(data.avgConfidence) || 0,
  violationCounts: data.violationCounts || {},
  repBreakdown: Array.isArray(data.repBreakdown) ? data.repBreakdown : [],
  date: parseDate(data.date),
  createdAt: parseDate(data.createdAt),
});

export interface SaveCoachSessionInput {
  detectedExercise: string;
  totalReps: number;
  validReps: number;
  duration: number;
  avgConfidence: number;
  violationCounts: Record<string, number>;
  repBreakdown: CoachRepDetail[];
  date?: Date;
}

/**
 * Save a coach session and write a linked summary into workouts/.
 * Returns the new coachSessionId.
 */
export async function saveCoachSession(
  uid: string,
  input: SaveCoachSessionInput
): Promise<string> {
  if (!uid) throw new Error('Missing user id');

  const sessionDate = input.date ?? new Date();
  const accuracy = input.totalReps > 0 ? input.validReps / input.totalReps : 0;

  try {
    const sessionsRef = collection(db, 'users', uid, 'coachSessions');
    const docRef = await addDoc(sessionsRef, {
      detectedExercise: input.detectedExercise,
      totalReps: Number(input.totalReps) || 0,
      validReps: Number(input.validReps) || 0,
      accuracy,
      duration: Number(input.duration) || 0,
      avgConfidence: Number(input.avgConfidence) || 0,
      violationCounts: input.violationCounts || {},
      repBreakdown: input.repBreakdown || [],
      date: Timestamp.fromDate(sessionDate),
      createdAt: Timestamp.fromDate(new Date()),
    });

    cacheInvalidate(`coachSessions:${uid}`);

    // Cross-reference into workouts/ so the session appears in history.
    // addWorkout invalidates workout caches itself.
    try {
      await addWorkout(uid, {
        exercise: exerciseDisplayName(input.detectedExercise),
        sets: 1,
        reps: input.validReps,
        weight: 0,
        duration: Math.max(1, Math.round(input.duration / 60)),
        notes: `AI Coach session — ${input.validReps}/${input.totalReps} valid reps (${Math.round(
          accuracy * 100
        )}%)`,
        date: sessionDate,
        source: 'coach',
        coachSessionId: docRef.id,
      });
    } catch {
      // Workouts mirror is best-effort; the canonical session is already saved.
    }

    return docRef.id;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to save coach session'));
  }
}

export async function getCoachSessions(
  uid: string,
  maxLimit = 50
): Promise<CoachSession[]> {
  return cachedFetch(`coachSessions:${uid}:${maxLimit}`, async () => {
    try {
      const sessionsRef = collection(db, 'users', uid, 'coachSessions');
      const q = query(sessionsRef, orderBy('date', 'desc'), limit(maxLimit));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => toDoc(d.data(), d.id));
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to fetch coach sessions'));
    }
  });
}

export async function getCoachSession(
  uid: string,
  sessionId: string
): Promise<CoachSession | null> {
  try {
    const ref = doc(db, 'users', uid, 'coachSessions', sessionId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return toDoc(snap.data(), snap.id);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to fetch coach session'));
  }
}

export async function deleteCoachSession(
  uid: string,
  sessionId: string
): Promise<void> {
  try {
    const ref = doc(db, 'users', uid, 'coachSessions', sessionId);
    await deleteDoc(ref);
    cacheInvalidate(`coachSessions:${uid}`);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to delete coach session'));
  }
}
