'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Download, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'gymi-install-dismissed';
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;
    setIsStandalone(standalone);

    if (standalone) return;

    // Check if dismissed recently
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      if (Date.now() - dismissedAt < DISMISS_DURATION) return;
    }

    // Detect iOS
    const ua = navigator.userAgent;
    const isiOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(isiOS);

    // For iOS, show the manual instruction banner after a delay
    if (isiOS) {
      const timer = setTimeout(() => setShowBanner(true), 3000);
      return () => clearTimeout(timer);
    }

    // Check if the event was already captured globally (by the inline script
    // in root layout) before this component mounted — this is the common case
    // on mobile where the user lands on "/" then navigates to "/home" after login
    const win = window as any;
    if (win.__deferredInstallPrompt) {
      setDeferredPrompt(win.__deferredInstallPrompt as BeforeInstallPromptEvent);
      win.__deferredInstallPrompt = null;
      setTimeout(() => setShowBanner(true), 2000);
      return;
    }

    // Also listen for future events (in case it hasn't fired yet)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Clear the global reference since we captured it
      win.__deferredInstallPrompt = null;
      setTimeout(() => setShowBanner(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowBanner(false);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  }, []);

  if (isStandalone || !showBanner) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:bottom-6 md:left-auto md:right-6 md:w-80 animate-slide-up">
      <div className="rounded-2xl border border-zinc-200 bg-[color:var(--background)] p-4 shadow-2xl dark:border-zinc-800">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black text-white font-bold text-lg">
              G
            </div>
            <div>
              <p className="text-sm font-semibold text-[color:var(--foreground)]">
                Install GYMI
              </p>
              <p className="text-xs text-[color:var(--muted-foreground)] mt-0.5">
                {isIOS
                  ? 'Add to home screen for the best experience'
                  : 'Get quick access from your home screen'}
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="shrink-0 rounded-full p-1 text-[color:var(--muted-foreground)] hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3">
          {isIOS ? (
            <div className="flex items-center gap-2 rounded-xl bg-zinc-50 px-3 py-2.5 text-xs text-[color:var(--foreground)] dark:bg-zinc-900">
              <Share className="h-4 w-4 shrink-0 text-blue-500" />
              <span>
                Tap <strong>Share</strong> then <strong>&quot;Add to Home Screen&quot;</strong>
              </span>
            </div>
          ) : (
            <button
              onClick={handleInstall}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[color:var(--foreground)] px-4 py-2.5 text-sm font-semibold text-[color:var(--background)] transition-opacity hover:opacity-90"
            >
              <Download className="h-4 w-4" />
              Install App
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Wrapper so the root layout (server component) can render InstallPrompt.
 * This is a client component re-export for convenience.
 */
export function InstallPromptLoader() {
  return <InstallPrompt />;
}
