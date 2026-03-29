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
import { WorkoutProgram, ProgramMetadata } from './types/firestore';
import { getErrorMessage } from './utils/errorMessages';
import { cachedFetch, cacheInvalidate } from './cache';

/**
 * Workout Program Service Layer
 * Handles CRUD operations for AI-generated workout programs
 */

// Helper to convert Firestore Timestamps to Dates
const convertTimestamps = (data: any): any => {
  const converted = { ...data };
  if (data.createdAt?.toDate) converted.createdAt = data.createdAt.toDate();
  if (data.updatedAt?.toDate) converted.updatedAt = data.updatedAt.toDate();
  if (data.startedAt?.toDate) converted.startedAt = data.startedAt.toDate();
  if (data.completedAt?.toDate) converted.completedAt = data.completedAt.toDate();
  
  // Handle adherenceStats dates if present
  if (data.adherenceStats?.lastLoggedDate?.toDate) {
    converted.adherenceStats.lastLoggedDate = data.adherenceStats.lastLoggedDate.toDate();
  }
  
  return converted;
};

// Helper to clean undefined values (Firestore rejects them)
const cleanData = (obj: any): Record<string, any> => {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
};

/**
 * Create a new workout program (typically called after Gemini generation)
 */
export async function createProgram(
  uid: string,
  data: Omit<WorkoutProgram, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const programsRef = collection(db, 'users', uid, 'workoutPrograms');
    const now = Timestamp.now();

    const docRef = await addDoc(programsRef, {
      userId: uid,
      programName: data.programName || 'Untitled Program',
      description: data.description || '',
      metadata: cleanData(data.metadata),
      plan: data.plan,
      status: data.status || 'active',
      adherenceStats: data.adherenceStats ? cleanData(data.adherenceStats) : undefined,
      startedAt: data.startedAt ? Timestamp.fromDate(data.startedAt) : null,
      completedAt: data.completedAt ? Timestamp.fromDate(data.completedAt) : null,
      createdAt: now,
      updatedAt: now,
    });

    cacheInvalidate(`programs:${uid}`, `programs:${uid}:active`);
    return docRef.id;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to create workout program'));
  }
}

/**
 * Get a single program by ID
 */
export async function getProgram(
  uid: string,
  programId: string
): Promise<WorkoutProgram | null> {
  try {
    const programRef = doc(db, 'users', uid, 'workoutPrograms', programId);
    const snapshot = await getDoc(programRef);

    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.data();
    return {
      id: snapshot.id,
      ...convertTimestamps(data),
    } as WorkoutProgram;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to fetch program'));
  }
}

/**
 * Get all programs for a user (sorted by creation date, newest first)
 */
export async function getPrograms(uid: string, maxLimit = 50): Promise<WorkoutProgram[]> {
  return cachedFetch(`programs:${uid}:${maxLimit}`, async () => {
    try {
      const programsRef = collection(db, 'users', uid, 'workoutPrograms');
      const q = query(
        programsRef,
        orderBy('createdAt', 'desc'),
        limit(maxLimit)
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...convertTimestamps(data),
        } as WorkoutProgram;
      });
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to fetch programs'));
    }
  });
}

/**
 * Get active programs for a user
 */
export async function getActivePrograms(uid: string): Promise<WorkoutProgram[]> {
  return cachedFetch(`programs:${uid}:active`, async () => {
    try {
      const programsRef = collection(db, 'users', uid, 'workoutPrograms');
      let snapshot;

      try {
        // Fast path: requires composite index (status + createdAt).
        const indexedQuery = query(
          programsRef,
          where('status', '==', 'active'),
          orderBy('createdAt', 'desc')
        );
        snapshot = await getDocs(indexedQuery);
      } catch (error) {
        const message = error instanceof Error ? error.message.toLowerCase() : '';
        const isMissingIndex = message.includes('requires an index');

        if (!isMissingIndex) {
          throw error;
        }

        // Fallback path: no composite index required.
        // Query by createdAt only, then filter status in memory.
        const fallbackQuery = query(programsRef, orderBy('createdAt', 'desc'));
        snapshot = await getDocs(fallbackQuery);
      }

      const programs = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...convertTimestamps(data),
        } as WorkoutProgram;
      });

      return programs.filter((program) => program.status === 'active');
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to fetch active programs'));
    }
  });
}

/**
 * Update a program (metadata, status, adherence stats, etc.)
 */
export async function updateProgram(
  uid: string,
  programId: string,
  updates: Partial<Omit<WorkoutProgram, 'id' | 'createdAt'>>
): Promise<void> {
  try {
    const programRef = doc(db, 'users', uid, 'workoutPrograms', programId);

    const updateData: any = {
      updatedAt: Timestamp.now(),
    };

    // Handle each field carefully
    if (updates.programName !== undefined) updateData.programName = updates.programName;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.plan !== undefined) updateData.plan = updates.plan;
    if (updates.metadata !== undefined) updateData.metadata = cleanData(updates.metadata);
    if (updates.adherenceStats !== undefined) updateData.adherenceStats = cleanData(updates.adherenceStats);
    if (updates.startedAt !== undefined) {
      updateData.startedAt = updates.startedAt ? Timestamp.fromDate(updates.startedAt) : null;
    }
    if (updates.completedAt !== undefined) {
      updateData.completedAt = updates.completedAt ? Timestamp.fromDate(updates.completedAt) : null;
    }

    await updateDoc(programRef, updateData);
    cacheInvalidate(`programs:${uid}`, `programs:${uid}:active`);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to update program'));
  }
}

/**
 * Archive a program (change status to 'archived')
 */
export async function archiveProgram(
  uid: string,
  programId: string
): Promise<void> {
  return updateProgram(uid, programId, { status: 'archived' });
}

/**
 * Mark a program as completed
 */
export async function completeProgram(
  uid: string,
  programId: string
): Promise<void> {
  return updateProgram(uid, programId, {
    status: 'completed',
    completedAt: new Date(),
  });
}

/**
 * Mark a program as active (resume)
 */
export async function activateProgram(
  uid: string,
  programId: string
): Promise<void> {
  return updateProgram(uid, programId, {
    status: 'active',
    startedAt: new Date(),
  });
}

/**
 * Delete a program
 */
export async function deleteProgram(
  uid: string,
  programId: string
): Promise<void> {
  try {
    const programRef = doc(db, 'users', uid, 'workoutPrograms', programId);
    await deleteDoc(programRef);
    cacheInvalidate(`programs:${uid}`, `programs:${uid}:active`);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to delete program'));
  }
}

/**
 * Update adherence stats for a program
 * Called when a user logs a workout against a program session
 */
export async function updateAdherence(
  uid: string,
  programId: string,
  adherenceUpdates: {
    totalSessionsLogged?: number;
    totalSessionsPlanned?: number;
    lastLoggedDate?: Date;
  }
): Promise<void> {
  try {
    const program = await getProgram(uid, programId);
    if (!program) {
      throw new Error('Program not found');
    }

    const current = program.adherenceStats || {
      totalSessionsPlanned: 0,
      totalSessionsLogged: 0,
      adherencePercent: 0,
      lastLoggedDate: undefined,
    };

    const updated = {
      totalSessionsPlanned: adherenceUpdates.totalSessionsPlanned ?? current.totalSessionsPlanned,
      totalSessionsLogged: adherenceUpdates.totalSessionsLogged ?? current.totalSessionsLogged,
      lastLoggedDate: adherenceUpdates.lastLoggedDate || current.lastLoggedDate,
      adherencePercent: 0, // Initialize, will calculate below
    };

    // Calculate adherence percentage
    updated.adherencePercent =
      updated.totalSessionsPlanned > 0
        ? Math.round((updated.totalSessionsLogged / updated.totalSessionsPlanned) * 100)
        : 0;

    await updateProgram(uid, programId, {
      adherenceStats: updated,
    });
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to update program adherence'));
  }
}

/**
 * Calculate total planned sessions in a program
 */
export function calculateTotalSessions(program: WorkoutProgram): number {
  const days =
    (program.plan?.days && program.plan.days.length > 0
      ? program.plan.days
      : (program.plan?.weeks || []).flatMap((week) => week.days || [])) || [];

  let total = 0;
  for (const day of days) {
    total += (day.sessions || []).length;
  }
  return total;
}

/**
 * Increment adherence counters when a user logs a workout from a program session.
 */
export async function logProgramSession(
  uid: string,
  programId: string
): Promise<void> {
  const program = await getProgram(uid, programId);
  if (!program) {
    throw new Error('Program not found');
  }

  const totalSessionsPlanned =
    program.adherenceStats?.totalSessionsPlanned ?? calculateTotalSessions(program);
  const totalSessionsLogged = (program.adherenceStats?.totalSessionsLogged ?? 0) + 1;

  await updateAdherence(uid, programId, {
    totalSessionsPlanned,
    totalSessionsLogged,
    lastLoggedDate: new Date(),
  });
}
