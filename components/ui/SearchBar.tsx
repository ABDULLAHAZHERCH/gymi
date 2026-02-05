'use client';

import { Search, X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  className?: string;
}

export default function SearchBar({
  placeholder = 'Search...',
  value,
  onChange,
  onClear,
  className = '',
}: SearchBarProps) {
  const [focused, setFocused] = useState(false);

  const handleClear = () => {
    onChange('');
    if (onClear) onClear();
  };

  return (
    <div className={`relative ${className}`}>
      <div
        className={`flex items-center gap-2 px-4 py-3 bg-white dark:bg-zinc-800 border rounded-lg transition-all ${
          focused
            ? 'border-zinc-900 dark:border-zinc-100 ring-2 ring-zinc-900/10 dark:ring-zinc-100/10'
            : 'border-zinc-200 dark:border-zinc-700'
        }`}
      >
        <Search className="w-5 h-5 text-zinc-400 flex-shrink-0" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded transition-colors flex-shrink-0"
            aria-label="Clear search"
          >
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        )}
      </div>
    </div>
  );
}
