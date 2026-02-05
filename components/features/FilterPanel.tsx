'use client';

import { Calendar, SlidersHorizontal, X } from 'lucide-react';
import { useState } from 'react';
import FilterChip from '@/components/ui/FilterChip';

export interface FilterOptions {
  dateRange?: {
    start: string;
    end: string;
  };
  mealTypes?: string[];
  calorieRange?: {
    min?: number;
    max?: number;
  };
  exerciseTypes?: string[];
  hasNotes?: boolean;
}

interface FilterPanelProps {
  type: 'workout' | 'meal';
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  onClear: () => void;
}

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

export default function FilterPanel({
  type,
  filters,
  onFilterChange,
  onClear,
}: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hasActiveFilters =
    filters.dateRange ||
    (filters.mealTypes && filters.mealTypes.length > 0) ||
    filters.calorieRange ||
    filters.hasNotes !== undefined;

  const toggleMealType = (mealType: string) => {
    const current = filters.mealTypes || [];
    const updated = current.includes(mealType)
      ? current.filter((t) => t !== mealType)
      : [...current, mealType];
    onFilterChange({ ...filters, mealTypes: updated });
  };

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    onFilterChange({
      ...filters,
      dateRange: {
        start: field === 'start' ? value : filters.dateRange?.start || '',
        end: field === 'end' ? value : filters.dateRange?.end || '',
      },
    });
  };

  const clearDateRange = () => {
    const { dateRange, ...rest } = filters;
    onFilterChange(rest);
  };

  return (
    <div className="space-y-3">
      {/* Filter Toggle Button */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
            hasActiveFilters
              ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100'
              : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="text-sm font-medium">Filters</span>
          {hasActiveFilters && (
            <span className="px-1.5 py-0.5 text-xs bg-white/20 rounded-full">
              Active
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClear}
            className="px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Filter Options */}
      {isOpen && (
        <div className="p-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg space-y-4">
          {/* Date Range Filter */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date Range
              </label>
              {filters.dateRange && (
                <button
                  type="button"
                  onClick={clearDateRange}
                  className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-zinc-500 dark:text-zinc-400">
                  From
                </label>
                <input
                  type="date"
                  value={filters.dateRange?.start || ''}
                  onChange={(e) => handleDateRangeChange('start', e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500 dark:text-zinc-400">
                  To
                </label>
                <input
                  type="date"
                  value={filters.dateRange?.end || ''}
                  onChange={(e) => handleDateRangeChange('end', e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                />
              </div>
            </div>
          </div>

          {/* Meal Type Filter (Meals only) */}
          {type === 'meal' && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Meal Type
              </label>
              <div className="flex flex-wrap gap-2">
                {MEAL_TYPES.map((mealType) => (
                  <FilterChip
                    key={mealType}
                    label={mealType}
                    active={filters.mealTypes?.includes(mealType) || false}
                    onToggle={() => toggleMealType(mealType)}
                    variant="outlined"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Calorie Range Filter (Meals only) */}
          {type === 'meal' && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Calorie Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-zinc-500 dark:text-zinc-400">
                    Min
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={filters.calorieRange?.min || ''}
                    onChange={(e) =>
                      onFilterChange({
                        ...filters,
                        calorieRange: {
                          ...filters.calorieRange,
                          min: e.target.value ? parseInt(e.target.value) : undefined,
                        },
                      })
                    }
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 dark:text-zinc-400">
                    Max
                  </label>
                  <input
                    type="number"
                    placeholder="2000"
                    value={filters.calorieRange?.max || ''}
                    onChange={(e) =>
                      onFilterChange({
                        ...filters,
                        calorieRange: {
                          ...filters.calorieRange,
                          max: e.target.value ? parseInt(e.target.value) : undefined,
                        },
                      })
                    }
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Has Notes Filter */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.hasNotes || false}
                onChange={(e) =>
                  onFilterChange({
                    ...filters,
                    hasNotes: e.target.checked ? true : undefined,
                  })
                }
                className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
              />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">
                Has notes only
              </span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
