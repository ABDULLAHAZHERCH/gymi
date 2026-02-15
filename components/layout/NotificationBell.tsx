'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { getUnreadCount, deleteOldNotifications } from '@/lib/notifications';
import NotificationPanel from './NotificationPanel';

/**
 * Bell icon with unread badge. Click toggles the notification panel.
 * Polls unread count every 60 seconds.
 */
export default function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch unread count
  const refreshUnread = useCallback(async () => {
    if (!user) return;
    try {
      const count = await getUnreadCount(user.uid);
      setUnread(count);
    } catch {
      // silent
    }
  }, [user]);

  // Initial load + polling every 60s
  useEffect(() => {
    if (!user) return;

    refreshUnread();

    const interval = setInterval(refreshUnread, 60_000);
    return () => clearInterval(interval);
  }, [user, refreshUnread]);

  // Cleanup old notifications once per session
  useEffect(() => {
    if (!user) return;

    const key = 'gymi-notif-cleanup';
    const last = sessionStorage.getItem(key);
    if (!last) {
      sessionStorage.setItem(key, '1');
      deleteOldNotifications(user.uid, 30).catch(() => {});
    }
  }, [user]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  if (!user) return null;

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
        aria-expanded={open}
      >
        <Bell className="h-5 w-5 text-[color:var(--foreground)]" />

        {/* Unread badge */}
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <NotificationPanel
          onClose={() => setOpen(false)}
          onReadChange={refreshUnread}
        />
      )}
    </div>
  );
}
