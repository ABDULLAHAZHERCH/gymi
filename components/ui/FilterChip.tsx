'use client';

import { X } from 'lucide-react';

interface FilterChipProps {
  label: string;
  active: boolean;
  onToggle: () => void;
  onRemove?: () => void;
  variant?: 'default' | 'outlined';
  className?: string;
}

export default function FilterChip({
  label,
  active,
  onToggle,
  onRemove,
  variant = 'default',
  className = '',
}: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all
        ${
          active
            ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
            : variant === 'outlined'
            ? 'border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
        }
        ${className}
      `}
    >
      {label}
      {active && onRemove && (
        <X
          className="w-3.5 h-3.5 ml-0.5"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        />
      )}
    </button>
  );
}
