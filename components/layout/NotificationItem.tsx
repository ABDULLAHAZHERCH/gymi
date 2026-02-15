'use client';

import { Notification } from '@/lib/types/firestore';
import { timeAgo } from '@/lib/utils/timeAgo';

type NotificationItemProps = {
  notification: Notification;
  onClick: (notification: Notification) => void;
};

export default function NotificationItem({
  notification,
  onClick,
}: NotificationItemProps) {
  const { icon, title, message, createdAt, read } = notification;

  return (
    <button
      onClick={() => onClick(notification)}
      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
        !read
          ? 'bg-blue-50/60 dark:bg-blue-950/20'
          : ''
      }`}
    >
      {/* Icon */}
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-base dark:bg-zinc-800">
        {icon}
      </span>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm leading-tight ${
            !read
              ? 'font-semibold text-[color:var(--foreground)]'
              : 'font-medium text-[color:var(--foreground)]'
          }`}
        >
          {title}
        </p>
        <p className="mt-0.5 line-clamp-2 text-xs text-[color:var(--muted-foreground)]">
          {message}
        </p>
      </div>

      {/* Time */}
      <span className="shrink-0 pt-0.5 text-[10px] text-[color:var(--muted-foreground)]">
        {timeAgo(createdAt)}
      </span>

      {/* Unread dot */}
      {!read && (
        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
      )}
    </button>
  );
}
