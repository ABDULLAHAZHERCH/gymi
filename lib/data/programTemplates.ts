import { ProgramMetadata } from '@/lib/types/firestore';

export interface ProgramTemplateExercise {
  exerciseName: string;
  sets: number;
  reps: string;
  restSeconds: number;
}

export interface ProgramTemplateSession {
  name: string;
  estimatedDuration: number;
  intensity: 'light' | 'moderate' | 'high';
  exercises: ProgramTemplateExercise[];
}

export interface ProgramTemplateDay {
  dayName: string;
  sessions: ProgramTemplateSession[];
}

export interface ProgramTemplate {
  programName: string;
  description: string;
  days: ProgramTemplateDay[];
}

export const PROGRAM_TEMPLATE_GOALS: ProgramMetadata['goal'][] = [
  'muscle_gain',
  'fat_loss',
  'strength',
  'endurance',
  'general_fitness',
];

export function formatGoalLabel(goal: ProgramMetadata['goal']): string {
  return goal.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

const TEMPLATE_LIBRARY: Record<ProgramMetadata['goal'], ProgramTemplate> = {
  muscle_gain: {
    programName: 'Muscle Gain Builder',
    description: 'A balanced hypertrophy split focused on progressive volume and quality reps.',
    days: [
      {
        dayName: 'Push Day',
        sessions: [
          {
            name: 'Push Hypertrophy',
            estimatedDuration: 60,
            intensity: 'moderate',
            exercises: [
              { exerciseName: 'Bench Press', sets: 4, reps: '8-12', restSeconds: 90 },
              { exerciseName: 'Overhead Press', sets: 3, reps: '8-12', restSeconds: 90 },
              { exerciseName: 'Dumbbell Fly', sets: 3, reps: '10-15', restSeconds: 60 },
              { exerciseName: 'Lateral Raise', sets: 3, reps: '12-15', restSeconds: 60 },
              { exerciseName: 'Tricep Dip', sets: 3, reps: '10-15', restSeconds: 60 },
            ],
          },
        ],
      },
      {
        dayName: 'Pull Day',
        sessions: [
          {
            name: 'Pull Hypertrophy',
            estimatedDuration: 60,
            intensity: 'moderate',
            exercises: [
              { exerciseName: 'Pull-Up', sets: 4, reps: '6-10', restSeconds: 90 },
              { exerciseName: 'Barbell Row', sets: 4, reps: '8-12', restSeconds: 90 },
              { exerciseName: 'Deadlift', sets: 3, reps: '5-8', restSeconds: 120 },
              { exerciseName: 'Barbell Curl', sets: 3, reps: '10-15', restSeconds: 60 },
              { exerciseName: 'Plank', sets: 3, reps: '30-45', restSeconds: 45 },
            ],
          },
        ],
      },
      {
        dayName: 'Leg Day',
        sessions: [
          {
            name: 'Lower Body Hypertrophy',
            estimatedDuration: 60,
            intensity: 'moderate',
            exercises: [
              { exerciseName: 'Squat', sets: 4, reps: '8-12', restSeconds: 120 },
              { exerciseName: 'Leg Press', sets: 3, reps: '10-15', restSeconds: 90 },
              { exerciseName: 'Lunges', sets: 3, reps: '10-12', restSeconds: 60 },
              { exerciseName: 'Plank', sets: 3, reps: '30-45', restSeconds: 45 },
            ],
          },
        ],
      },
      {
        dayName: 'Upper Mix',
        sessions: [
          {
            name: 'Upper Volume',
            estimatedDuration: 55,
            intensity: 'moderate',
            exercises: [
              { exerciseName: 'Bench Press', sets: 3, reps: '8-10', restSeconds: 90 },
              { exerciseName: 'Barbell Row', sets: 3, reps: '8-10', restSeconds: 90 },
              { exerciseName: 'Overhead Press', sets: 3, reps: '8-10', restSeconds: 90 },
              { exerciseName: 'Barbell Curl', sets: 2, reps: '10-12', restSeconds: 60 },
              { exerciseName: 'Tricep Dip', sets: 2, reps: '10-12', restSeconds: 60 },
            ],
          },
        ],
      },
    ],
  },
  fat_loss: {
    programName: 'Fat Loss Conditioning Plan',
    description: 'A high-consistency plan combining resistance work and conditioning to support fat loss.',
    days: [
      {
        dayName: 'Full Body Strength',
        sessions: [
          {
            name: 'Compound Circuit',
            estimatedDuration: 50,
            intensity: 'moderate',
            exercises: [
              { exerciseName: 'Squat', sets: 3, reps: '10-12', restSeconds: 60 },
              { exerciseName: 'Push-Up', sets: 3, reps: '12-15', restSeconds: 45 },
              { exerciseName: 'Barbell Row', sets: 3, reps: '10-12', restSeconds: 60 },
              { exerciseName: 'Lunges', sets: 3, reps: '10-12', restSeconds: 45 },
              { exerciseName: 'Plank', sets: 3, reps: '30-45', restSeconds: 30 },
            ],
          },
        ],
      },
      {
        dayName: 'Conditioning',
        sessions: [
          {
            name: 'Cardio Intervals',
            estimatedDuration: 40,
            intensity: 'high',
            exercises: [
              { exerciseName: 'Running', sets: 6, reps: '2-3', restSeconds: 60 },
              { exerciseName: 'Burpees', sets: 4, reps: '10-15', restSeconds: 45 },
              { exerciseName: 'Russian Twist', sets: 3, reps: '20-30', restSeconds: 30 },
              { exerciseName: 'Plank', sets: 3, reps: '30-45', restSeconds: 30 },
            ],
          },
        ],
      },
      {
        dayName: 'Upper Body',
        sessions: [
          {
            name: 'Upper Burn',
            estimatedDuration: 50,
            intensity: 'moderate',
            exercises: [
              { exerciseName: 'Bench Press', sets: 3, reps: '10-12', restSeconds: 60 },
              { exerciseName: 'Pull-Up', sets: 3, reps: '6-10', restSeconds: 60 },
              { exerciseName: 'Overhead Press', sets: 3, reps: '10-12', restSeconds: 60 },
              { exerciseName: 'Barbell Curl', sets: 2, reps: '12-15', restSeconds: 45 },
              { exerciseName: 'Tricep Dip', sets: 2, reps: '12-15', restSeconds: 45 },
            ],
          },
        ],
      },
      {
        dayName: 'Lower Body',
        sessions: [
          {
            name: 'Lower Burn',
            estimatedDuration: 50,
            intensity: 'moderate',
            exercises: [
              { exerciseName: 'Deadlift', sets: 3, reps: '8-10', restSeconds: 90 },
              { exerciseName: 'Leg Press', sets: 3, reps: '12-15', restSeconds: 60 },
              { exerciseName: 'Lunges', sets: 3, reps: '12-15', restSeconds: 45 },
              { exerciseName: 'Running', sets: 4, reps: '2', restSeconds: 45 },
            ],
          },
        ],
      },
    ],
  },
  strength: {
    programName: 'Strength Foundation Plan',
    description: 'A compound-lift focused program centered on lower rep ranges and longer rest periods.',
    days: [
      {
        dayName: 'Squat Focus',
        sessions: [
          {
            name: 'Lower Strength',
            estimatedDuration: 65,
            intensity: 'high',
            exercises: [
              { exerciseName: 'Squat', sets: 5, reps: '3-6', restSeconds: 150 },
              { exerciseName: 'Deadlift', sets: 3, reps: '3-5', restSeconds: 180 },
              { exerciseName: 'Leg Press', sets: 3, reps: '6-8', restSeconds: 120 },
              { exerciseName: 'Plank', sets: 3, reps: '30-45', restSeconds: 45 },
            ],
          },
        ],
      },
      {
        dayName: 'Bench Focus',
        sessions: [
          {
            name: 'Upper Strength',
            estimatedDuration: 60,
            intensity: 'high',
            exercises: [
              { exerciseName: 'Bench Press', sets: 5, reps: '3-6', restSeconds: 150 },
              { exerciseName: 'Overhead Press', sets: 4, reps: '4-6', restSeconds: 120 },
              { exerciseName: 'Pull-Up', sets: 4, reps: '4-8', restSeconds: 90 },
              { exerciseName: 'Barbell Row', sets: 4, reps: '4-8', restSeconds: 120 },
            ],
          },
        ],
      },
      {
        dayName: 'Deadlift Focus',
        sessions: [
          {
            name: 'Posterior Chain Strength',
            estimatedDuration: 60,
            intensity: 'high',
            exercises: [
              { exerciseName: 'Deadlift', sets: 5, reps: '3-5', restSeconds: 180 },
              { exerciseName: 'Barbell Row', sets: 4, reps: '4-6', restSeconds: 120 },
              { exerciseName: 'Lunges', sets: 3, reps: '6-8', restSeconds: 90 },
              { exerciseName: 'Plank', sets: 3, reps: '30-45', restSeconds: 45 },
            ],
          },
        ],
      },
      {
        dayName: 'Accessory Strength',
        sessions: [
          {
            name: 'Support Lifts',
            estimatedDuration: 50,
            intensity: 'moderate',
            exercises: [
              { exerciseName: 'Overhead Press', sets: 4, reps: '5-8', restSeconds: 90 },
              { exerciseName: 'Bench Press', sets: 4, reps: '5-8', restSeconds: 90 },
              { exerciseName: 'Barbell Curl', sets: 3, reps: '8-10', restSeconds: 60 },
              { exerciseName: 'Tricep Dip', sets: 3, reps: '8-10', restSeconds: 60 },
            ],
          },
        ],
      },
    ],
  },
  endurance: {
    programName: 'Endurance Performance Plan',
    description: 'A conditioning-forward program to improve stamina and sustained output.',
    days: [
      {
        dayName: 'Steady Cardio',
        sessions: [
          {
            name: 'Aerobic Base',
            estimatedDuration: 45,
            intensity: 'light',
            exercises: [
              { exerciseName: 'Running', sets: 1, reps: '30-45', restSeconds: 0 },
              { exerciseName: 'Plank', sets: 3, reps: '30-45', restSeconds: 30 },
              { exerciseName: 'Russian Twist', sets: 3, reps: '20-30', restSeconds: 30 },
            ],
          },
        ],
      },
      {
        dayName: 'Interval Day',
        sessions: [
          {
            name: 'HIIT Intervals',
            estimatedDuration: 40,
            intensity: 'high',
            exercises: [
              { exerciseName: 'Running', sets: 8, reps: '1-2', restSeconds: 45 },
              { exerciseName: 'Burpees', sets: 4, reps: '12-15', restSeconds: 45 },
              { exerciseName: 'Push-Up', sets: 3, reps: '12-20', restSeconds: 30 },
            ],
          },
        ],
      },
      {
        dayName: 'Muscular Endurance',
        sessions: [
          {
            name: 'Full Body Circuit',
            estimatedDuration: 45,
            intensity: 'moderate',
            exercises: [
              { exerciseName: 'Lunges', sets: 3, reps: '15-20', restSeconds: 30 },
              { exerciseName: 'Push-Up', sets: 3, reps: '15-20', restSeconds: 30 },
              { exerciseName: 'Barbell Row', sets: 3, reps: '12-15', restSeconds: 45 },
              { exerciseName: 'Russian Twist', sets: 3, reps: '20-30', restSeconds: 30 },
            ],
          },
        ],
      },
      {
        dayName: 'Recovery Cardio',
        sessions: [
          {
            name: 'Low Intensity Session',
            estimatedDuration: 35,
            intensity: 'light',
            exercises: [
              { exerciseName: 'Running', sets: 1, reps: '20-30', restSeconds: 0 },
              { exerciseName: 'Plank', sets: 2, reps: '30-45', restSeconds: 30 },
            ],
          },
        ],
      },
    ],
  },
  general_fitness: {
    programName: 'General Fitness Balanced Plan',
    description: 'A practical full-body plan for overall health, strength, and consistency.',
    days: [
      {
        dayName: 'Full Body A',
        sessions: [
          {
            name: 'Strength Basics',
            estimatedDuration: 55,
            intensity: 'moderate',
            exercises: [
              { exerciseName: 'Squat', sets: 3, reps: '8-12', restSeconds: 90 },
              { exerciseName: 'Bench Press', sets: 3, reps: '8-12', restSeconds: 90 },
              { exerciseName: 'Barbell Row', sets: 3, reps: '8-12', restSeconds: 90 },
              { exerciseName: 'Plank', sets: 3, reps: '30-45', restSeconds: 45 },
            ],
          },
        ],
      },
      {
        dayName: 'Conditioning',
        sessions: [
          {
            name: 'Fitness Conditioning',
            estimatedDuration: 40,
            intensity: 'moderate',
            exercises: [
              { exerciseName: 'Running', sets: 1, reps: '20-30', restSeconds: 0 },
              { exerciseName: 'Burpees', sets: 3, reps: '10-12', restSeconds: 45 },
              { exerciseName: 'Russian Twist', sets: 3, reps: '20-30', restSeconds: 30 },
            ],
          },
        ],
      },
      {
        dayName: 'Full Body B',
        sessions: [
          {
            name: 'Strength Mix',
            estimatedDuration: 55,
            intensity: 'moderate',
            exercises: [
              { exerciseName: 'Deadlift', sets: 3, reps: '6-10', restSeconds: 120 },
              { exerciseName: 'Overhead Press', sets: 3, reps: '8-12', restSeconds: 90 },
              { exerciseName: 'Pull-Up', sets: 3, reps: '6-10', restSeconds: 90 },
              { exerciseName: 'Lunges', sets: 3, reps: '10-12', restSeconds: 60 },
            ],
          },
        ],
      },
      {
        dayName: 'Optional Recovery',
        sessions: [
          {
            name: 'Light Session',
            estimatedDuration: 30,
            intensity: 'light',
            exercises: [
              { exerciseName: 'Push-Up', sets: 2, reps: '10-15', restSeconds: 45 },
              { exerciseName: 'Plank', sets: 2, reps: '30-45', restSeconds: 30 },
            ],
          },
        ],
      },
    ],
  },
};

export function getProgramTemplate(goal: ProgramMetadata['goal']): ProgramTemplate {
  return TEMPLATE_LIBRARY[goal];
}
