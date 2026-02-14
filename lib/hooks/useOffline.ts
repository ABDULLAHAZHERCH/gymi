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
    } catch (error) {
      console.error('[useOffline] Sync failed:', error);
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

  // Register service worker
  useEffect(() => {
    // Initialize offline store
    initOfflineStore().catch((err) => {
      console.error('Failed to init offline store:', err);
    });

    // Only register in production (browser environment)
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[useOffline] Service Worker registered:', registration);
          swRef.current = registration;
          setSwReady(true);

          // Check for updates periodically
          const interval = setInterval(() => {
            registration.update().catch((err) => {
              console.error('Failed to update SW:', err);
            });
          }, 60000); // Every minute

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

          return () => clearInterval(interval);
        })
        .catch((err) => {
          console.error('[useOffline] Service Worker registration failed:', err);
        });
    }
  }, []);

  // Monitor online/offline state and trigger sync
  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      console.log('[useOffline] Online');
      setIsOnline(true);
      // Trigger sync when coming online
      window.dispatchEvent(new Event('offline-sync'));
    };

    const handleOffline = () => {
      console.log('[useOffline] Offline');
      setIsOnline(false);
    };

    // Listen for the offline-sync event to actually process the queue
    const handleSync = () => {
      console.log('[useOffline] Sync event received');
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
