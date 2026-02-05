'use client';

import { WeightLog } from '@/lib/types/firestore';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

interface WeightChartProps {
  data: WeightLog[];
  targetWeight?: number;
}

export function WeightChart({ data, targetWeight }: WeightChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-center">
        <p className="text-sm text-[color:var(--muted-foreground)]">
          No weight data available. Start logging your weight!
        </p>
      </div>
    );
  }

  // Sort by date ascending
  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const weights = sortedData.map(d => d.weight);
  const maxWeight = Math.max(...weights, targetWeight || 0);
  const minWeight = Math.min(...weights, targetWeight || Infinity);
  const range = maxWeight - minWeight || 10;

  // Calculate trend
  const firstWeight = sortedData[0].weight;
  const lastWeight = sortedData[sortedData.length - 1].weight;
  const change = lastWeight - firstWeight;
  const changePercent = ((change / firstWeight) * 100).toFixed(1);

  const getTrendIcon = () => {
    if (change > 0.5) return <TrendingUp className="w-4 h-4 text-red-600 dark:text-red-400" />;
    if (change < -0.5) return <TrendingDown className="w-4 h-4 text-green-600 dark:text-green-400" />;
    return <Minus className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />;
  };

  const getTrendColor = () => {
    if (change > 0.5) return 'text-red-600 dark:text-red-400';
    if (change < -0.5) return 'text-green-600 dark:text-green-400';
    return 'text-zinc-600 dark:text-zinc-400';
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <p className="text-xs text-[color:var(--muted-foreground)]">Current</p>
          <p className="text-lg font-semibold text-[color:var(--foreground)]">{lastWeight}kg</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-[color:var(--muted-foreground)]">Change</p>
          <p className={`text-lg font-semibold flex items-center justify-center gap-1 ${getTrendColor()}`}>
            {getTrendIcon()}
            {Math.abs(change).toFixed(1)}kg
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-[color:var(--muted-foreground)]">Target</p>
          <p className="text-lg font-semibold text-[color:var(--foreground)]">
            {targetWeight ? `${targetWeight}kg` : 'Not set'}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-48 flex items-end gap-1 px-2">
        {sortedData.map((log, index) => {
          const height = ((log.weight - minWeight) / range) * 100 || 10;
          const isFirst = index === 0;
          const isLast = index === sortedData.length - 1;
          
          return (
            <div key={log.id} className="flex-1 flex flex-col items-center gap-1 group">
              <div
                className="w-full bg-blue-600 dark:bg-blue-500 rounded-t transition-all hover:bg-blue-700 dark:hover:bg-blue-600 relative"
                style={{ height: `${height}%`, minHeight: '4px' }}
              >
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-2 py-1 rounded text-xs whitespace-nowrap">
                    {log.weight}kg
                    <div className="text-zinc-400 dark:text-zinc-600 text-[10px]">
                      {new Date(log.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>
              </div>
              {(isFirst || isLast || sortedData.length <= 7) && (
                <p className="text-[10px] text-[color:var(--muted-foreground)] -rotate-45 origin-top-left mt-1">
                  {new Date(log.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </p>
              )}
            </div>
          );
        })}

        {/* Target line */}
        {targetWeight && targetWeight >= minWeight && targetWeight <= maxWeight && (
          <div
            className="absolute left-0 right-0 border-t-2 border-dashed border-green-600 dark:border-green-400"
            style={{ bottom: `${((targetWeight - minWeight) / range) * 100}%` }}
          >
            <span className="absolute right-2 -top-2 text-[10px] bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-1 rounded">
              Target
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
