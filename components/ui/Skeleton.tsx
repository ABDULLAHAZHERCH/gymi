export function WorkoutCardSkeleton() {
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Exercise name */}
          <div className="h-5 bg-zinc-200 dark:bg-zinc-700 rounded w-32 mb-2"></div>
          {/* Date */}
          <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-24 mb-3"></div>
          {/* Stats */}
          <div className="flex gap-4">
            <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-16"></div>
            <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-16"></div>
            <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-16"></div>
          </div>
        </div>
        {/* Action buttons */}
        <div className="flex gap-2">
          <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
          <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
        </div>
      </div>
    </div>
  );
}

export function MealCardSkeleton() {
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Meal name */}
          <div className="h-5 bg-zinc-200 dark:bg-zinc-700 rounded w-40 mb-2"></div>
          {/* Date */}
          <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-24 mb-3"></div>
          {/* Macros */}
          <div className="flex gap-2">
            <div className="h-6 bg-zinc-200 dark:bg-zinc-700 rounded w-20"></div>
            <div className="h-6 bg-zinc-200 dark:bg-zinc-700 rounded w-20"></div>
            <div className="h-6 bg-zinc-200 dark:bg-zinc-700 rounded w-20"></div>
          </div>
        </div>
        {/* Action buttons */}
        <div className="flex gap-2">
          <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
          <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
        </div>
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 animate-pulse">
      <div className="flex items-start justify-between mb-2">
        <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-20"></div>
        <div className="h-5 w-5 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
      </div>
      <div className="h-8 bg-zinc-200 dark:bg-zinc-700 rounded w-16 mb-1"></div>
      <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-24"></div>
    </div>
  );
}

export function ActivityItemSkeleton() {
  return (
    <div className="flex items-start gap-3 py-3 animate-pulse">
      {/* Icon */}
      <div className="h-10 w-10 bg-zinc-200 dark:bg-zinc-700 rounded-full flex-shrink-0"></div>
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2"></div>
      </div>
    </div>
  );
}

export function ListSkeleton({ 
  count = 3, 
  type = 'workout' 
}: { 
  count?: number; 
  type?: 'workout' | 'meal' | 'stat' | 'activity' 
}) {
  const SkeletonComponent = 
    type === 'workout' ? WorkoutCardSkeleton :
    type === 'meal' ? MealCardSkeleton :
    type === 'stat' ? StatCardSkeleton :
    ActivityItemSkeleton;

  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonComponent key={i} />
      ))}
    </div>
  );
}
