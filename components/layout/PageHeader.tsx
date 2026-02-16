'use client';

import UserMenu from './UserMenu';
import NotificationBell from './NotificationBell';

type PageHeaderProps = {
  title: string;
  subtitle?: string;
};

export default function PageHeader({ subtitle }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-10 w-full border-b border-zinc-200 bg-[color:var(--background)] px-4 py-3 backdrop-blur dark:border-zinc-800">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[color:var(--foreground)]">
            GYMI
          </p>
          {subtitle ? (
            <p className="text-xs text-[color:var(--muted-foreground)]">{subtitle}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
