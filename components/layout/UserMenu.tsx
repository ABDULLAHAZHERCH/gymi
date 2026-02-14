'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { logoutUser } from '@/lib/auth';
import { User, LogOut, Sun, Moon } from 'lucide-react';

const THEME_KEY = 'gymi-theme';

function applyTheme(mode: 'light' | 'dark') {
  const root = document.documentElement;
  if (mode === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  localStorage.setItem(THEME_KEY, mode);
}

export default function UserMenu() {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const menuRef = useRef<HTMLDivElement>(null);

  // Init theme from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY) as 'light' | 'dark' | null;
    const initial = stored ?? 'dark';
    setTheme(initial);
  }, []);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Close menu on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    if (open) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logoutUser();
      router.push('/');
    } catch {
      // Error already sanitized in service layer
    } finally {
      setLoggingOut(false);
      setOpen(false);
    }
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
  };

  if (!user) return null;

  const initials = (user.displayName || user.email || '?')
    .split(' ')
    .map((s) => s[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:ring-2 hover:ring-zinc-300 dark:hover:ring-zinc-700"
        aria-label="User menu"
        aria-expanded={open}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--foreground)] text-xs font-bold text-[color:var(--background)]">
          {initials}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-zinc-200 bg-[color:var(--background)] shadow-lg dark:border-zinc-800 z-50">
          {/* User info */}
          <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <p className="text-sm font-semibold text-[color:var(--foreground)] truncate">
              {user.displayName || 'User'}
            </p>
            <p className="text-xs text-[color:var(--muted-foreground)] truncate">
              {user.email}
            </p>
          </div>

          {/* Menu items */}
          <div className="py-1">
            {/* Account Settings */}
            <Link
              href="/account"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-[color:var(--foreground)] transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              <User className="h-4 w-4 text-[color:var(--muted-foreground)]" />
              Account Settings
            </Link>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="flex w-full items-center justify-between px-4 py-2.5 text-sm text-[color:var(--foreground)] transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              <div className="flex items-center gap-3">
                {theme === 'dark' ? (
                  <Moon className="h-4 w-4 text-[color:var(--muted-foreground)]" />
                ) : (
                  <Sun className="h-4 w-4 text-[color:var(--muted-foreground)]" />
                )}
                <span>Theme</span>
              </div>
              <div className="flex items-center gap-1 rounded-full border border-zinc-200 p-0.5 dark:border-zinc-700">
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full transition-colors ${
                    theme === 'light' ? 'bg-zinc-200 dark:bg-zinc-600' : ''
                  }`}
                >
                  <Sun className="h-3 w-3" />
                </span>
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full transition-colors ${
                    theme === 'dark' ? 'bg-zinc-200 dark:bg-zinc-600' : ''
                  }`}
                >
                  <Moon className="h-3 w-3" />
                </span>
              </div>
            </button>

            {/* Divider */}
            <div className="my-1 border-t border-zinc-200 dark:border-zinc-800" />

            {/* Logout */}
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950 disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              {loggingOut ? 'Logging out...' : 'Log out'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
