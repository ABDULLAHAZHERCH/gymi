/**
 * Workout Program Generation Service (Template Library + Database-Backed)
 * - Uses deterministic templates for each goal (no AI dependency)
 * - Resolves exercise details from EXERCISE_DATABASE
 * - Produces consistent day/session programs
 */

import {
  ProgramMetadata,
  WorkoutProgram,
  ProgramExercise,
  WorkoutSession,
  WorkoutDay,
} from '@/lib/types/firestore';
import { EXERCISE_DATABASE, Exercise } from '@/lib/data/exercises';
import { getProgramTemplate } from '@/lib/data/programTemplates';

function cloneDeep<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function resolveExercise(exerciseName: string): Exercise | null {
  let found = EXERCISE_DATABASE.find((ex) => ex.name.toLowerCase() === exerciseName.toLowerCase());
  if (found) return found;

  found = EXERCISE_DATABASE.find((ex) => ex.name.toLowerCase().includes(exerciseName.toLowerCase()));
  if (found) return found;

  found = EXERCISE_DATABASE.find((ex) => exerciseName.toLowerCase().includes(ex.name.toLowerCase()));
  if (found) return found;

  return null;
}

function resolveProgramExercise(spec: {
  exerciseName: string;
  sets: number;
  reps: string;
  restSeconds: number;
}): ProgramExercise {
  const dbExercise = resolveExercise(spec.exerciseName);

  if (!dbExercise) {
    return {
      exerciseId: `custom-${spec.exerciseName.toLowerCase().replace(/\s+/g, '-')}`,
      name: spec.exerciseName,
      muscleGroups: [],
      sets: spec.sets,
      reps: spec.reps,
      restSeconds: spec.restSeconds,
      notes: 'Exercise not found in database - verify name.',
    };
  }

  return {
    exerciseId: dbExercise.id,
    name: dbExercise.name,
    muscleGroups: dbExercise.muscleGroups,
    sets: spec.sets,
    reps: spec.reps,
    restSeconds: spec.restSeconds,
    intensity: dbExercise.difficulty,
  };
}

function getEquipmentList(access: ProgramMetadata['equipmentAccess']): Exercise['equipment'] {
  const lists: Record<ProgramMetadata['equipmentAccess'], Exercise['equipment']> = {
    full_gym: ['barbell', 'dumbbell', 'machine', 'cable', 'bench', 'pull-up-bar', 'bodyweight'],
    home_equipment: ['dumbbell', 'resistance-band', 'pull-up-bar', 'bench', 'bodyweight'],
    minimal: ['resistance-band', 'bodyweight', 'none'],
    bodyweight_only: ['bodyweight', 'none'],
  };

  return lists[access];
}

function isExerciseAllowedByEquipment(exerciseName: string, metadata: ProgramMetadata): boolean {
  const exercise = resolveExercise(exerciseName);
  if (!exercise) {
    return true;
  }

  const allowedEquipment = getEquipmentList(metadata.equipmentAccess);
  return exercise.equipment.some((item) => allowedEquipment.includes(item));
}

function applyEquipmentAlternatives(
  exercises: Array<{ exerciseName: string; sets: number; reps: string; restSeconds: number }>,
  metadata: ProgramMetadata
): Array<{ exerciseName: string; sets: number; reps: string; restSeconds: number }> {
  const replacements: Record<string, string> = {
    'Bench Press': 'Push-Up',
    'Overhead Press': 'Push-Up',
    'Pull-Up': 'Barbell Row',
    'Deadlift': 'Lunges',
    'Leg Press': 'Squat',
    'Barbell Row': 'Push-Up',
  };

  return exercises.map((exercise) => {
    if (isExerciseAllowedByEquipment(exercise.exerciseName, metadata)) {
      return exercise;
    }

    const replacement = replacements[exercise.exerciseName];
    if (replacement && isExerciseAllowedByEquipment(replacement, metadata)) {
      return { ...exercise, exerciseName: replacement };
    }

    return { ...exercise, exerciseName: 'Push-Up' };
  });
}

function applyExperienceAdjustments(
  sets: number,
  reps: string,
  experienceLevel: ProgramMetadata['experienceLevel']
): { sets: number; reps: string } {
  if (experienceLevel === 'beginner') {
    return {
      sets: Math.max(2, sets - 1),
      reps,
    };
  }

  if (experienceLevel === 'advanced') {
    return {
      sets: Math.min(6, sets + 1),
      reps,
    };
  }

  return { sets, reps };
}

function buildDaysFromTemplate(metadata: ProgramMetadata): WorkoutDay[] {
  const template = cloneDeep(getProgramTemplate(metadata.goal));
  const templateDays = template.days;
  const requestedDays = Math.max(3, Math.min(7, metadata.daysPerWeek));

  const selectedDays: typeof templateDays = [];
  for (let i = 0; i < requestedDays; i += 1) {
    selectedDays.push(cloneDeep(templateDays[i % templateDays.length]));
  }

  return selectedDays.map((day, dayIndex) => {
    const sessions: WorkoutSession[] = (day.sessions || []).map((session, sessionIndex) => {
      const adjustedExercises = applyEquipmentAlternatives(session.exercises || [], metadata).map((exercise) => {
        const adjusted = applyExperienceAdjustments(exercise.sets, exercise.reps, metadata.experienceLevel);
        return resolveProgramExercise({
          exerciseName: exercise.exerciseName,
          sets: adjusted.sets,
          reps: adjusted.reps,
          restSeconds: exercise.restSeconds,
        });
      });

      const estimatedDuration = Math.min(
        Math.max(metadata.sessionLengthMin, session.estimatedDuration || metadata.sessionLengthMin),
        120
      );

      return {
        sessionId: `${dayIndex + 1}_${sessionIndex + 1}`,
        sequenceNumber: sessionIndex + 1,
        name: session.name,
        exercises: adjustedExercises,
        estimatedDuration,
        intensity: session.intensity,
        notes: undefined,
      };
    });

    return {
      dayNumber: dayIndex + 1,
      dayName: day.dayName,
      sessions,
    };
  });
}

function buildProgramName(metadata: ProgramMetadata): string {
  return `${metadata.goal.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} Template`;
}

function buildProgramDescription(metadata: ProgramMetadata): string {
  return `Template-based ${metadata.daysPerWeek}-day plan for ${metadata.goal.replace(/_/g, ' ')} (${metadata.experienceLevel}).`;
}

export async function generateWorkoutProgram(
  metadata: ProgramMetadata,
  userContext?: { workoutHistoryCount?: number }
): Promise<Omit<WorkoutProgram, 'id' | 'userId' | 'createdAt' | 'updatedAt'>> {
  void userContext;

  try {
    const template = getProgramTemplate(metadata.goal);
    const fullDays = buildDaysFromTemplate(metadata);

    let totalSessions = 0;
    for (const day of fullDays) {
      totalSessions += (day.sessions || []).length;
    }

    return {
      programName: template.programName || buildProgramName(metadata),
      description: template.description || buildProgramDescription(metadata),
      metadata,
      plan: {
        days: fullDays,
      },
      status: 'active',
      adherenceStats: {
        totalSessionsPlanned: totalSessions,
        totalSessionsLogged: 0,
        adherencePercent: 0,
        lastLoggedDate: undefined,
      },
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error during generation';
    throw new Error(`Failed to generate program from templates: ${errorMsg}`);
  }
}

export function validateProgram(
  program: Omit<WorkoutProgram, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!program.programName) errors.push('Program name is missing');

  const days =
    (program.plan?.days && program.plan.days.length > 0
      ? program.plan.days
      : (program.plan?.weeks || []).flatMap((week) => week.days || [])) || [];

  if (days.length === 0) {
    errors.push('Program must contain at least one day');
  }

  for (const day of days) {
    if (!day.dayNumber) errors.push('Invalid day number in program');
    if (!day.sessions || day.sessions.length === 0) {
      errors.push(`Day ${day.dayNumber} has no sessions`);
    }

    for (const session of day.sessions || []) {
      if (!session.exercises || session.exercises.length === 0) {
        errors.push(`Session ${session.name} has no exercises`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
