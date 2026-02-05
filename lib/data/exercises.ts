/**
 * Exercise Library Database
 * Comprehensive database of exercises with descriptions, muscle groups, and difficulty levels
 */

export interface Exercise {
  id: string;
  name: string;
  category: 'strength' | 'cardio' | 'flexibility' | 'sports';
  muscleGroups: MuscleGroup[];
  equipment: Equipment[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  description: string;
  instructions: string[];
  tips?: string[];
  videoUrl?: string;
  isFavorite?: boolean;
}

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'abs'
  | 'obliques'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'full-body'
  | 'cardio';

export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'kettlebell'
  | 'cable'
  | 'machine'
  | 'bodyweight'
  | 'resistance-band'
  | 'medicine-ball'
  | 'pull-up-bar'
  | 'bench'
  | 'none';

export const EXERCISE_DATABASE: Exercise[] = [
  // CHEST
  {
    id: 'bench-press',
    name: 'Bench Press',
    category: 'strength',
    muscleGroups: ['chest', 'triceps', 'shoulders'],
    equipment: ['barbell', 'bench'],
    difficulty: 'intermediate',
    description: 'Classic compound movement for building chest strength and mass.',
    instructions: [
      'Lie flat on bench with feet on floor',
      'Grip bar slightly wider than shoulder-width',
      'Lower bar to mid-chest with controlled motion',
      'Press bar up until arms are extended',
      'Keep shoulder blades retracted throughout',
    ],
    tips: [
      'Keep wrists straight and aligned with forearms',
      'Arch lower back slightly for proper form',
      'Avoid bouncing bar off chest',
    ],
  },
  {
    id: 'push-up',
    name: 'Push-Up',
    category: 'strength',
    muscleGroups: ['chest', 'triceps', 'shoulders', 'abs'],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    description: 'Fundamental bodyweight exercise for upper body strength.',
    instructions: [
      'Start in plank position with hands shoulder-width apart',
      'Lower body until chest nearly touches floor',
      'Keep core tight and body in straight line',
      'Push back up to starting position',
    ],
    tips: [
      'Keep elbows at 45-degree angle from body',
      'Breathe in on the way down, out on the way up',
      'Modify on knees if needed',
    ],
  },
  {
    id: 'dumbbell-fly',
    name: 'Dumbbell Fly',
    category: 'strength',
    muscleGroups: ['chest'],
    equipment: ['dumbbell', 'bench'],
    difficulty: 'intermediate',
    description: 'Isolation exercise targeting chest muscles with stretch emphasis.',
    instructions: [
      'Lie on bench holding dumbbells above chest',
      'Lower weights in arc motion to sides',
      'Keep slight bend in elbows throughout',
      'Bring weights back together at top',
    ],
    tips: [
      'Focus on stretch at bottom position',
      'Avoid going too heavy - form is critical',
      'Keep movements slow and controlled',
    ],
  },

  // BACK
  {
    id: 'deadlift',
    name: 'Deadlift',
    category: 'strength',
    muscleGroups: ['back', 'glutes', 'hamstrings', 'forearms'],
    equipment: ['barbell'],
    difficulty: 'advanced',
    description: 'King of compound exercises, builds total body strength.',
    instructions: [
      'Stand with feet hip-width apart, bar over mid-foot',
      'Bend down and grip bar outside legs',
      'Keep back straight, chest up, shoulders back',
      'Drive through heels to lift bar',
      'Fully extend hips and knees at top',
      'Lower bar with control',
    ],
    tips: [
      'Keep bar close to body throughout lift',
      'Engage lats to protect lower back',
      'Practice form with light weight first',
    ],
  },
  {
    id: 'pull-up',
    name: 'Pull-Up',
    category: 'strength',
    muscleGroups: ['back', 'biceps', 'forearms'],
    equipment: ['pull-up-bar'],
    difficulty: 'intermediate',
    description: 'Excellent upper back and bicep builder using bodyweight.',
    instructions: [
      'Hang from bar with overhand grip',
      'Pull body up until chin clears bar',
      'Lower with control to full extension',
      'Keep core engaged throughout',
    ],
    tips: [
      'Avoid swinging or kipping',
      'Focus on pulling elbows down and back',
      'Use resistance bands for assistance if needed',
    ],
  },
  {
    id: 'barbell-row',
    name: 'Barbell Row',
    category: 'strength',
    muscleGroups: ['back', 'biceps', 'forearms'],
    equipment: ['barbell'],
    difficulty: 'intermediate',
    description: 'Compound pulling movement for thick, strong back.',
    instructions: [
      'Bend forward at hips with slight knee bend',
      'Grip bar at shoulder width',
      'Pull bar to lower chest/upper abs',
      'Squeeze shoulder blades together at top',
      'Lower with control',
    ],
    tips: [
      'Keep torso at 45-degree angle',
      'Lead pull with elbows, not hands',
      'Avoid using momentum',
    ],
  },

  // SHOULDERS
  {
    id: 'overhead-press',
    name: 'Overhead Press',
    category: 'strength',
    muscleGroups: ['shoulders', 'triceps'],
    equipment: ['barbell'],
    difficulty: 'intermediate',
    description: 'Fundamental shoulder builder and strength indicator.',
    instructions: [
      'Stand with feet shoulder-width apart',
      'Hold bar at shoulder height',
      'Press bar overhead until arms fully extended',
      'Lower back to shoulders with control',
    ],
    tips: [
      'Keep core tight for stability',
      'Avoid leaning back excessively',
      'Bar path should be straight vertical',
    ],
  },
  {
    id: 'lateral-raise',
    name: 'Lateral Raise',
    category: 'strength',
    muscleGroups: ['shoulders'],
    equipment: ['dumbbell'],
    difficulty: 'beginner',
    description: 'Isolation exercise for shoulder width and definition.',
    instructions: [
      'Stand holding dumbbells at sides',
      'Raise weights to shoulder height',
      'Keep slight bend in elbows',
      'Lower with control',
    ],
    tips: [
      'Lead with elbows, not hands',
      'Avoid swinging or using momentum',
      'Stop at shoulder height',
    ],
  },

  // ARMS
  {
    id: 'barbell-curl',
    name: 'Barbell Curl',
    category: 'strength',
    muscleGroups: ['biceps', 'forearms'],
    equipment: ['barbell'],
    difficulty: 'beginner',
    description: 'Classic bicep mass builder.',
    instructions: [
      'Stand holding bar with underhand grip',
      'Keep elbows at sides',
      'Curl bar to shoulder height',
      'Lower with control',
    ],
    tips: [
      'Avoid swinging or using momentum',
      'Keep wrists straight',
      'Focus on squeezing biceps at top',
    ],
  },
  {
    id: 'tricep-dip',
    name: 'Tricep Dip',
    category: 'strength',
    muscleGroups: ['triceps', 'chest', 'shoulders'],
    equipment: ['bodyweight'],
    difficulty: 'intermediate',
    description: 'Effective bodyweight tricep builder.',
    instructions: [
      'Grip parallel bars and lift body',
      'Lower until upper arms parallel to ground',
      'Press back up to starting position',
      'Keep torso upright for tricep emphasis',
    ],
    tips: [
      'Lean forward for more chest activation',
      'Keep elbows tucked close to body',
      'Add weight when bodyweight becomes easy',
    ],
  },

  // LEGS
  {
    id: 'squat',
    name: 'Squat',
    category: 'strength',
    muscleGroups: ['quads', 'glutes', 'hamstrings'],
    equipment: ['barbell'],
    difficulty: 'intermediate',
    description: 'King of leg exercises, builds lower body strength and mass.',
    instructions: [
      'Bar on upper back, feet shoulder-width apart',
      'Descend by bending knees and hips',
      'Go down until thighs parallel to floor',
      'Drive through heels to stand',
    ],
    tips: [
      'Keep chest up and back straight',
      'Knees should track over toes',
      'Depth is more important than weight',
    ],
  },
  {
    id: 'leg-press',
    name: 'Leg Press',
    category: 'strength',
    muscleGroups: ['quads', 'glutes', 'hamstrings'],
    equipment: ['machine'],
    difficulty: 'beginner',
    description: 'Machine-based leg builder with reduced balance requirement.',
    instructions: [
      'Sit in machine with back against pad',
      'Place feet on platform shoulder-width apart',
      'Lower platform with control',
      'Press back up without locking knees',
    ],
    tips: [
      'Keep lower back pressed against pad',
      'Avoid locking out knees at top',
      'Foot position affects muscle emphasis',
    ],
  },
  {
    id: 'lunges',
    name: 'Lunges',
    category: 'strength',
    muscleGroups: ['quads', 'glutes', 'hamstrings'],
    equipment: ['bodyweight', 'dumbbell'],
    difficulty: 'beginner',
    description: 'Unilateral leg exercise for balance and strength.',
    instructions: [
      'Step forward with one leg',
      'Lower until both knees at 90 degrees',
      'Push back to starting position',
      'Alternate legs',
    ],
    tips: [
      'Keep torso upright',
      'Front knee should not pass toes',
      'Add dumbbells for progression',
    ],
  },

  // CORE
  {
    id: 'plank',
    name: 'Plank',
    category: 'strength',
    muscleGroups: ['abs', 'obliques'],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    description: 'Isometric core strengthener.',
    instructions: [
      'Support body on forearms and toes',
      'Keep body in straight line from head to heels',
      'Engage core and hold position',
      'Breathe normally',
    ],
    tips: [
      'Avoid sagging hips',
      'Keep neck neutral',
      'Start with shorter holds and build up',
    ],
  },
  {
    id: 'russian-twist',
    name: 'Russian Twist',
    category: 'strength',
    muscleGroups: ['obliques', 'abs'],
    equipment: ['bodyweight', 'medicine-ball'],
    difficulty: 'intermediate',
    description: 'Rotational core exercise for oblique development.',
    instructions: [
      'Sit with knees bent, feet off floor',
      'Lean back slightly',
      'Rotate torso side to side',
      'Touch ground beside hip each rotation',
    ],
    tips: [
      'Move with control, not momentum',
      'Keep chest up',
      'Add weight for progression',
    ],
  },

  // CARDIO
  {
    id: 'running',
    name: 'Running',
    category: 'cardio',
    muscleGroups: ['cardio', 'quads', 'hamstrings', 'calves'],
    equipment: ['none'],
    difficulty: 'beginner',
    description: 'Classic cardiovascular exercise.',
    instructions: [
      'Maintain steady pace',
      'Land on midfoot',
      'Keep upper body relaxed',
      'Breathe rhythmically',
    ],
    tips: [
      'Start with intervals if new',
      'Proper footwear is essential',
      'Warm up before, cool down after',
    ],
  },
  {
    id: 'burpees',
    name: 'Burpees',
    category: 'cardio',
    muscleGroups: ['full-body', 'cardio'],
    equipment: ['bodyweight'],
    difficulty: 'intermediate',
    description: 'Full-body conditioning exercise.',
    instructions: [
      'Start standing',
      'Drop to plank position',
      'Perform push-up',
      'Jump feet to hands',
      'Explosive jump up',
    ],
    tips: [
      'Pace yourself',
      'Modify by removing jump',
      'Great for HIIT workouts',
    ],
  },
];

/**
 * Get exercises by muscle group
 */
export function getExercisesByMuscleGroup(muscleGroup: MuscleGroup): Exercise[] {
  return EXERCISE_DATABASE.filter((ex) => ex.muscleGroups.includes(muscleGroup));
}

/**
 * Get exercises by category
 */
export function getExercisesByCategory(category: Exercise['category']): Exercise[] {
  return EXERCISE_DATABASE.filter((ex) => ex.category === category);
}

/**
 * Get exercises by difficulty
 */
export function getExercisesByDifficulty(difficulty: Exercise['difficulty']): Exercise[] {
  return EXERCISE_DATABASE.filter((ex) => ex.difficulty === difficulty);
}

/**
 * Get exercises by equipment
 */
export function getExercisesByEquipment(equipment: Equipment): Exercise[] {
  return EXERCISE_DATABASE.filter((ex) => ex.equipment.includes(equipment));
}

/**
 * Search exercises by name
 */
export function searchExercises(query: string): Exercise[] {
  if (!query.trim()) return EXERCISE_DATABASE;

  const lowerQuery = query.toLowerCase();
  return EXERCISE_DATABASE.filter((ex) =>
    ex.name.toLowerCase().includes(lowerQuery) ||
    ex.description.toLowerCase().includes(lowerQuery) ||
    ex.muscleGroups.some((mg) => mg.includes(lowerQuery))
  );
}

/**
 * Get exercise by ID
 */
export function getExerciseById(id: string): Exercise | undefined {
  return EXERCISE_DATABASE.find((ex) => ex.id === id);
}
