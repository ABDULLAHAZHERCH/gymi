'use client';

import { useState } from 'react';
import { X, Info, Dumbbell } from 'lucide-react';
import { Exercise } from '@/lib/data/exercises';

interface ExerciseDetailModalProps {
  exercise: Exercise;
  onClose: () => void;
  onSelect?: (exercise: Exercise) => void;
}

const muscleGroupEmoji: Record<string, string> = {
  chest: '💪',
  back: '🦸',
  shoulders: '🏋️',
  biceps: '💪',
  triceps: '💪',
  forearms: '🤝',
  abs: '🦴',
  obliques: '〰️',
  quads: '🦵',
  hamstrings: '🦵',
  glutes: '🍑',
  calves: '🦶',
  'full-body': '🏃',
  cardio: '❤️',
};

const difficultyColor = {
  beginner: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  intermediate: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  advanced: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
};

export default function ExerciseDetailModal({
  exercise,
  onClose,
  onSelect,
}: ExerciseDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-900 rounded-lg shadow-xl">
        {/* Header */}
        <div className="sticky top-0 flex items-start justify-between p-6 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {exercise.name}
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {exercise.description}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Meta Info */}
          <div className="flex flex-wrap gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                difficultyColor[exercise.difficulty]
              }`}
            >
              {exercise.difficulty.charAt(0).toUpperCase() + exercise.difficulty.slice(1)}
            </span>
            <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs font-medium text-zinc-700 dark:text-zinc-300 capitalize">
              {exercise.category}
            </span>
          </div>

          {/* Muscle Groups */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              Target Muscles
            </h3>
            <div className="flex flex-wrap gap-2">
              {exercise.muscleGroups.map((mg) => (
                <span
                  key={mg}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium"
                >
                  <span>{muscleGroupEmoji[mg]}</span>
                  <span className="capitalize">{mg.replace('-', ' ')}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Equipment */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              Required Equipment
            </h3>
            <div className="flex flex-wrap gap-2">
              {exercise.equipment.map((eq) => (
                <span
                  key={eq}
                  className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-full text-xs capitalize"
                >
                  {eq.replace('-', ' ')}
                </span>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
              How to Perform
            </h3>
            <ol className="space-y-2">
              {exercise.instructions.map((instruction, idx) => (
                <li key={idx} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full text-xs font-medium">
                    {idx + 1}
                  </span>
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">
                    {instruction}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {/* Tips */}
          {exercise.tips && exercise.tips.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Pro Tips
              </h3>
              <ul className="space-y-2">
                {exercise.tips.map((tip, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="text-zinc-400">•</span>
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">
                      {tip}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Video Link */}
          {exercise.videoUrl && (
            <div>
              <a
                href={exercise.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Watch Video Tutorial
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        {onSelect && (
          <div className="sticky bottom-0 p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => {
                onSelect(exercise);
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors font-medium"
            >
              <Dumbbell className="w-5 h-5" />
              Use This Exercise
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
