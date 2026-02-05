'use client';

interface RecentEntry {
  type: 'workout' | 'meal';
  id: string;
  title: string;
  subtitle: string;
  date: Date;
  icon: string;
}

interface RecentActivityProps {
  entries: RecentEntry[];
  isLoading?: boolean;
}

export default function RecentActivity({
  entries,
  isLoading = false,
}: RecentActivityProps) {
  const formatTime = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-700"
          />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 py-8 dark:border-zinc-700 dark:bg-zinc-900">
        <p className="text-sm font-medium text-[color:var(--muted-foreground)]">
          No recent activity
        </p>
        <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">
          Start logging workouts or meals to see activity here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <div
          key={`${entry.type}-${entry.id}`}
          className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-[color:var(--background)] p-3 dark:border-zinc-800"
        >
          <div className="text-lg">{entry.icon}</div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-[color:var(--foreground)] truncate">
              {entry.title}
            </p>
            <p className="text-xs text-[color:var(--muted-foreground)]">
              {entry.subtitle}
            </p>
          </div>
          <p className="whitespace-nowrap text-xs text-[color:var(--muted-foreground)]">
            {formatTime(entry.date)}
          </p>
        </div>
      ))}
    </div>
  );
}
