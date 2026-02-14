'use client';

import { useOffline } from '@/lib/hooks/useOffline';
import { Wifi, WifiOff } from 'lucide-react';

/**
 * Offline indicator showing connectivity status
 */
export function OfflineIndicator() {
  const { isOnline, swWaitingReady, updateSW } = useOffline();

  if (isOnline && !swWaitingReady) {
    return null; // Don't show when online
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 z-50">
      {!isOnline && (
        <div className="bg-amber-500 text-white rounded-lg shadow-lg p-3 flex items-center gap-2">
          <WifiOff className="w-5 h-5" />
          <span className="text-sm font-medium">You're offline. Changes will sync when online.</span>
        </div>
      )}

      {swWaitingReady && (
        <div className="bg-blue-500 text-white rounded-lg shadow-lg p-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Wifi className="w-5 h-5" />
            <span className="text-sm font-medium">App update available</span>
          </div>
          <button
            onClick={updateSW}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs font-semibold"
          >
            Update
          </button>
        </div>
      )}
    </div>
  );
}
