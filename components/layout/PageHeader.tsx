'use client';

import UserMenu from './UserMenu';

type PageHeaderProps = {
  title: string;
  subtitle?: string;
};

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-10 w-full border-b border-zinc-200 bg-[color:var(--background)] px-4 py-3 backdrop-blur dark:border-zinc-800">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[color:var(--muted-foreground)]">
            GYMI
          </p>
          <h1 className="text-lg font-semibold tracking-tight text-[color:var(--foreground)]">
            {title}
          </h1>
          {subtitle ? (
            <p className="text-xs text-[color:var(--muted-foreground)]">{subtitle}</p>
          ) : null}
        </div>
        <UserMenu />
      </div>
    </header>
  );
}
