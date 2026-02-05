'use client';

import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import {
  Exercise,
  EXERCISE_DATABASE,
  MuscleGroup,
  Equipment,
  searchExercises,
  getExercisesByMuscleGroup,
  getExercisesByCategory,
  getExercisesByDifficulty,
  getExercisesByEquipment,
} from '@/lib/data/exercises';
import ExerciseDetailModal from '@/components/features/ExerciseDetailModal';
import SearchBar from '@/components/ui/SearchBar';
import FilterChip from '@/components/ui/FilterChip';

const MUSCLE_GROUPS: MuscleGroup[] = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'abs',
  'quads',
  'hamstrings',
  'glutes',
  'calves',
];

const CATEGORIES: Exercise['category'][] = ['strength', 'cardio', 'flexibility', 'sports'];

const DIFFICULTIES: Exercise['difficulty'][] = ['beginner', 'intermediate', 'advanced'];

interface ExerciseLibraryProps {
  onSelectExercise?: (exercise: Exercise) => void;
  selectionMode?: boolean;
}

export default function ExerciseLibrary({
  onSelectExercise,
  selectionMode = false,
}: ExerciseLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Exercise['category'] | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Exercise['difficulty'] | null>(
    null
  );
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filter exercises
  let filteredExercises = EXERCISE_DATABASE;

  if (searchQuery) {
    filteredExercises = searchExercises(searchQuery);
  }

  if (selectedMuscle) {
    filteredExercises = filteredExercises.filter((ex) =>
      ex.muscleGroups.includes(selectedMuscle)
    );
  }

  if (selectedCategory) {
    filteredExercises = filteredExercises.filter((ex) => ex.category === selectedCategory);
  }

  if (selectedDifficulty) {
    filteredExercises = filteredExercises.filter((ex) => ex.difficulty === selectedDifficulty);
  }

  const clearFilters = () => {
    setSelectedMuscle(null);
    setSelectedCategory(null);
    setSelectedDifficulty(null);
    setSearchQuery('');
  };

  const hasActiveFilters = selectedMuscle || selectedCategory || selectedDifficulty || searchQuery;

  return (
    <div className="space-y-4">
      {/* Search */}
      <SearchBar
        placeholder="Search exercises..."
        value={searchQuery}
        onChange={setSearchQuery}
        onClear={() => setSearchQuery('')}
      />

      {/* Filter Toggle */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
            hasActiveFilters
              ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100'
              : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700'
          }`}
        >
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filters</span>
          {hasActiveFilters && (
            <span className="px-1.5 py-0.5 text-xs bg-white/20 rounded-full">Active</span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="p-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg space-y-4">
          {/* Muscle Groups */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Muscle Group
            </label>
            <div className="flex flex-wrap gap-2">
              {MUSCLE_GROUPS.map((muscle) => (
                <FilterChip
                  key={muscle}
                  label={muscle.charAt(0).toUpperCase() + muscle.slice(1)}
                  active={selectedMuscle === muscle}
                  onToggle={() => setSelectedMuscle(selectedMuscle === muscle ? null : muscle)}
                  variant="outlined"
                />
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((category) => (
                <FilterChip
                  key={category}
                  label={category.charAt(0).toUpperCase() + category.slice(1)}
                  active={selectedCategory === category}
                  onToggle={() =>
                    setSelectedCategory(selectedCategory === category ? null : category)
                  }
                  variant="outlined"
                />
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Difficulty
            </label>
            <div className="flex flex-wrap gap-2">
              {DIFFICULTIES.map((difficulty) => (
                <FilterChip
                  key={difficulty}
                  label={difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                  active={selectedDifficulty === difficulty}
                  onToggle={() =>
                    setSelectedDifficulty(selectedDifficulty === difficulty ? null : difficulty)
                  }
                  variant="outlined"
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results count */}
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {filteredExercises.length} exercise{filteredExercises.length !== 1 ? 's' : ''} found
      </p>

      {/* Exercise List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredExercises.map((exercise) => (
          <button
            key={exercise.id}
            onClick={() => setSelectedExercise(exercise)}
            className="p-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:border-zinc-900 dark:hover:border-zinc-100 transition-colors text-left"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  {exercise.name}
                </h3>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                  {exercise.description}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {exercise.muscleGroups.slice(0, 3).map((mg) => (
                    <span
                      key={mg}
                      className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 rounded text-xs capitalize"
                    >
                      {mg}
                    </span>
                  ))}
                  {exercise.muscleGroups.length > 3 && (
                    <span className="px-2 py-0.5 text-zinc-400 text-xs">
                      +{exercise.muscleGroups.length - 3}
                    </span>
                  )}
                </div>
              </div>
              <span
                className={`flex-shrink-0 px-2 py-0.5 rounded text-xs font-medium ${
                  exercise.difficulty === 'beginner'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : exercise.difficulty === 'intermediate'
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                }`}
              >
                {exercise.difficulty.charAt(0).toUpperCase() + exercise.difficulty.slice(1)}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Empty State */}
      {filteredExercises.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-zinc-600 dark:text-zinc-400">
            No exercises found matching your criteria
          </p>
          <button
            onClick={clearFilters}
            className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {selectedExercise && (
        <ExerciseDetailModal
          exercise={selectedExercise}
          onClose={() => setSelectedExercise(null)}
          onSelect={selectionMode ? onSelectExercise : undefined}
        />
      )}
    </div>
  );
}
