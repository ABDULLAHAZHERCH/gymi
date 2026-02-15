'use client';

import { Goal } from '@/lib/types/firestore';
import { Target, Calendar, TrendingUp, Edit, Trash2, CheckCircle } from 'lucide-react';
import { useUnits } from '@/components/providers/UnitProvider';
import { displayWeight } from '@/lib/utils/units';

interface GoalCardProps {
  goal: Goal;
  progress?: number;
  onEdit: (goal: Goal) => void;
  onDelete: (goalId: string) => void;
  onComplete: (goalId: string) => void;
}

export default function GoalCard({ goal, progress = 0, onEdit, onDelete, onComplete }: GoalCardProps) {
  const { unitSystem } = useUnits();
  const getGoalIcon = (type: Goal['type']) => {
    switch (type) {
      case 'weight':
        return '⚖️';
      case 'workout_frequency':
        return '💪';
      case 'calories':
        return '🔥';
      case 'macros':
        return '🥗';
      default:
        return '🎯';
    }
  };

  const getStatusColor = (status: Goal['status']) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300';
      case 'completed':
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300';
      case 'abandoned':
        return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400';
      default:
        return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const daysRemaining = () => {
    const now = new Date();
    const target = new Date(goal.targetDate);
    const diff = target.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  const days = daysRemaining();

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <span className="text-2xl">{getGoalIcon(goal.type)}</span>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[color:var(--foreground)] line-clamp-1">
              {goal.title}
            </h3>
            {goal.description && (
              <p className="text-sm text-[color:var(--muted-foreground)] mt-1 line-clamp-2">
                {goal.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(goal.status)}`}>
                {goal.status}
              </span>
              {days > 0 && goal.status === 'active' && (
                <span className="text-xs text-[color:var(--muted-foreground)] flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {days} day{days !== 1 ? 's' : ''} left
                </span>
              )}
              {days <= 0 && goal.status === 'active' && (
                <span className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Overdue
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-1">
          {goal.status === 'active' && (
            <button
              onClick={() => onComplete(goal.id)}
              className="p-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400"
              title="Mark as complete"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => onEdit(goal)}
            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[color:var(--muted-foreground)]"
            title="Edit goal"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(goal.id)}
            className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
            title="Delete goal"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar (only for active goals) */}
      {goal.status === 'active' && progress >= 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[color:var(--muted-foreground)] flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Progress
            </span>
            <span className="font-medium text-[color:var(--foreground)]">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Target Info */}
      <div className="flex flex-wrap gap-2 text-xs">
        {goal.targetWeight && (
          <span className="px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-[color:var(--muted-foreground)]">
            Target: {displayWeight(goal.targetWeight, unitSystem)}
          </span>
        )}
        {goal.targetWorkoutsPerWeek && (
          <span className="px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-[color:var(--muted-foreground)]">
            {goal.targetWorkoutsPerWeek} workouts/week
          </span>
        )}
        {goal.targetCaloriesPerDay && (
          <span className="px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-[color:var(--muted-foreground)]">
            {goal.targetCaloriesPerDay} cal/day
          </span>
        )}
        {(goal.targetProtein || goal.targetCarbs || goal.targetFat) && (
          <span className="px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-[color:var(--muted-foreground)]">
            P:{goal.targetProtein || 0} C:{goal.targetCarbs || 0} F:{goal.targetFat || 0}
          </span>
        )}
      </div>

      {/* Timeline */}
      <div className="text-xs text-[color:var(--muted-foreground)] pt-1 border-t border-zinc-200 dark:border-zinc-800">
        {formatDate(goal.startDate)} → {formatDate(goal.targetDate)}
      </div>
    </div>
  );
}
