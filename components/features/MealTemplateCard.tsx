'use client';

import { BookmarkPlus, Trash2, Edit } from 'lucide-react';
import { MealTemplate } from '@/lib/mealTemplates';

interface MealTemplateCardProps {
  template: MealTemplate;
  onUse: (template: MealTemplate) => void;
  onEdit: (template: MealTemplate) => void;
  onDelete: (templateId: string) => void;
}

const mealTypeEmoji = {
  breakfast: '🍳',
  lunch: '🍱',
  dinner: '🍽️',
  snack: '🍎',
  other: '🍴',
};

export default function MealTemplateCard({
  template,
  onUse,
  onEdit,
  onDelete,
}: MealTemplateCardProps) {
  return (
    <div className="p-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">{mealTypeEmoji[template.mealType]}</span>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              {template.name}
            </h3>
          </div>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
            {template.items}
          </p>
        </div>
        <span className="flex-shrink-0 px-2 py-0.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 rounded text-xs capitalize">
          {template.mealType}
        </span>
      </div>

      {/* Macros */}
      <div className="flex items-center gap-3 mb-3">
        <div className="text-sm">
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {template.calories}
          </span>
          <span className="text-zinc-500 dark:text-zinc-400"> cal</span>
        </div>
        {template.protein !== undefined && (
          <div className="text-sm">
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {template.protein}g
            </span>
            <span className="text-zinc-500 dark:text-zinc-400"> protein</span>
          </div>
        )}
        {template.carbs !== undefined && (
          <div className="text-sm">
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {template.carbs}g
            </span>
            <span className="text-zinc-500 dark:text-zinc-400"> carbs</span>
          </div>
        )}
        {template.fat !== undefined && (
          <div className="text-sm">
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {template.fat}g
            </span>
            <span className="text-zinc-500 dark:text-zinc-400"> fat</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onUse(template)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors text-sm font-medium"
        >
          <BookmarkPlus className="w-4 h-4" />
          Use Template
        </button>
        <button
          onClick={() => onEdit(template)}
          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
          aria-label="Edit template"
        >
          <Edit className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
        </button>
        <button
          onClick={() => onDelete(template.id)}
          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          aria-label="Delete template"
        >
          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
        </button>
      </div>
    </div>
  );
}
