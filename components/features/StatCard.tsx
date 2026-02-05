'use client';

import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
  children?: ReactNode;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  className = '',
  children,
}: StatCardProps) {
  return (
    <div
      className={`rounded-2xl border border-zinc-200 bg-[color:var(--background)] p-4 shadow-sm dark:border-zinc-800 ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-[color:var(--muted-foreground)]">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold text-[color:var(--foreground)]">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">
              {subtitle}
            </p>
          )}
          {trend && trendValue && (
            <div
              className={`mt-2 flex items-center gap-1 text-xs font-medium ${
                trend === 'up'
                  ? 'text-green-600 dark:text-green-400'
                  : trend === 'down'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              <span>{trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}</span>
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="text-3xl">
            {icon}
          </div>
        )}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
