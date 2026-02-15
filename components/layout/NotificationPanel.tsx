'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { getNotifications, markAsRead, markAllAsRead } from '@/lib/notifications';
import { Notification } from '@/lib/types/firestore';
import NotificationItem from './NotificationItem';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';

type NotificationPanelProps = {
  onClose: () => void;
  onReadChange: () => void;
};

export default function NotificationPanel({
  onClose,
  onReadChange,
}: NotificationPanelProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch notifications on mount
  useEffect(() => {
    if (!user) return;

    const fetch = async () => {
      try {
        const data = await getNotifications(user.uid, 20);
        setNotifications(data);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [user]);

  const handleClick = async (notification: Notification) => {
    if (!user) return;

    // Mark as read
    if (!notification.read) {
      try {
        await markAsRead(user.uid, notification.id);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, read: true, readAt: new Date() } : n
          )
        );
        onReadChange();
      } catch {
        // non-critical
      }
    }

    // Navigate if linkTo is set
    if (notification.linkTo) {
      router.push(notification.linkTo);
    }

    onClose();
  };

  const handleMarkAllRead = async () => {
    if (!user) return;

    try {
      await markAllAsRead(user.uid);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true, readAt: new Date() }))
      );
      onReadChange();
    } catch {
      // non-critical
    }
  };

  const hasUnread = notifications.some((n) => !n.read);

  return (
    <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-zinc-200 bg-[color:var(--background)] shadow-lg dark:border-zinc-800 sm:w-96">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <h3 className="text-sm font-semibold text-[color:var(--foreground)]">
          Notifications
        </h3>
        {hasUnread && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs font-medium text-blue-500 transition-colors hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="space-y-1 p-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800"
              />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <Bell className="h-8 w-8 text-zinc-300 dark:text-zinc-600" />
            <p className="text-sm text-[color:var(--muted-foreground)]">
              No notifications yet
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
            {notifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onClick={handleClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
