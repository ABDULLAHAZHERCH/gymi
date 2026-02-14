import { useEffect, useState, useCallback, useRef } from 'react';
import { initOfflineStore } from '@/lib/offline/offlineStore';

/**
 * Hook to manage offline state and service worker registration
 */
export function useOffline() {
  const [isOnline, setIsOnline] = useState(true);
  const [swReady, setSwReady] = useState(false);
  const [swWaitingReady, setSwWaitingReady] = useState(false);
  const swRef = useRef<ServiceWorkerRegistration | null>(null);

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

  // Monitor online/offline state
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

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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
    updateSW,
  };
}
