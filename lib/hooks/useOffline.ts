import { useEffect, useState, useCallback, useRef } from 'react';
import { initOfflineStore } from '@/lib/offline/offlineStore';
import { processSyncQueue, getSyncStatus, isSyncInProgress } from '@/lib/offline/syncManager';
import type { SyncResult } from '@/lib/offline/syncManager';

/**
 * Hook to manage offline state and service worker registration
 */
export function useOffline() {
  const [isOnline, setIsOnline] = useState(true);
  const [swReady, setSwReady] = useState(false);
  const [swWaitingReady, setSwWaitingReady] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const swRef = useRef<ServiceWorkerRegistration | null>(null);
  const uidRef = useRef<string | null>(null);

  /**
   * Set the current user ID for sync operations
   */
  const setUid = useCallback((uid: string | null) => {
    uidRef.current = uid;
  }, []);

  /**
   * Trigger sync manually
   */
  const triggerSync = useCallback(async () => {
    if (!uidRef.current || isSyncInProgress()) return;

    setIsSyncing(true);
    try {
      const result = await processSyncQueue(uidRef.current);
      setLastSyncResult(result);

      // Refresh pending count
      const status = await getSyncStatus(uidRef.current);
      setPendingCount(status.pending);

      return result;
    } catch {
      // Silently handle sync failure
    } finally {
      setIsSyncing(false);
    }
  }, []);

  /**
   * Refresh the pending sync count
   */
  const refreshPendingCount = useCallback(async () => {
    if (!uidRef.current) return;
    try {
      const status = await getSyncStatus(uidRef.current);
      setPendingCount(status.pending);
    } catch {
      // Silently ignore
    }
  }, []);

  // Register service worker (only once globally)
  useEffect(() => {
    // Initialize offline store
    initOfflineStore().catch(() => {
      // Silently handle offline store init failure
    });

    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    // Use a global flag to prevent multiple registrations
    const win = window as any;
    if (win.__gymiSwRegistered) {
      // Already registered by another hook instance — just grab the existing registration
      navigator.serviceWorker.getRegistration('/sw.js').then((reg) => {
        if (reg) {
          swRef.current = reg;
          setSwReady(true);
        }
      });
      return;
    }
    win.__gymiSwRegistered = true;

    let updateInterval: ReturnType<typeof setInterval>;

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        swRef.current = registration;
        setSwReady(true);

        // Check for updates every 5 minutes
        updateInterval = setInterval(() => {
          registration.update().catch(() => {});
        }, 300000);

        // Listen for waiting service worker
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setSwWaitingReady(true);
              }
            });
          }
        });
      })
      .catch(() => {
        // Silently handle SW registration failure
      });

    return () => {
      if (updateInterval) clearInterval(updateInterval);
    };
  }, []);

  // Monitor online/offline state and trigger sync
  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      window.dispatchEvent(new Event('offline-sync'));
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleSync = () => {
      triggerSync();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('offline-sync', handleSync);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('offline-sync', handleSync);
    };
  }, [triggerSync]);

  // Update service worker
  const updateSW = useCallback(() => {
    if (swRef.current?.waiting) {
      swRef.current.waiting.postMessage({ type: 'SKIP_WAITING' });
      setSwWaitingReady(false);
      // Reload page after update
      window.location.reload();
    }
  }, []);

  return {
    isOnline,
    swReady,
    swWaitingReady,
    isSyncing,
    pendingCount,
    lastSyncResult,
    updateSW,
    setUid,
    triggerSync,
    refreshPendingCount,
  };
}
