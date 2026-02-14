'use client';

import { useOffline } from '@/lib/hooks/useOffline';
import { Wifi, WifiOff, RefreshCw, CloudOff } from 'lucide-react';

/**
 * Offline indicator showing connectivity status, sync state, and pending items
 */
export function OfflineIndicator() {
  const { isOnline, swWaitingReady, isSyncing, pendingCount, updateSW } = useOffline();

  // Don't show anything when online with nothing to report
  if (isOnline && !swWaitingReady && !isSyncing && pendingCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 md:bottom-4 md:left-auto md:right-4 z-50 space-y-2 md:w-80">
      {/* Offline banner */}
      {!isOnline && (
        <div className="bg-amber-500 text-white rounded-lg shadow-lg p-3 flex items-center gap-2">
          <WifiOff className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">You&apos;re offline. Changes will sync when online.</span>
        </div>
      )}

      {/* Syncing indicator */}
      {isSyncing && (
        <div className="bg-blue-500 text-white rounded-lg shadow-lg p-3 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 shrink-0 animate-spin" />
          <span className="text-sm font-medium">Syncing offline changes...</span>
        </div>
      )}

      {/* Pending items (online but items waiting to sync) */}
      {isOnline && !isSyncing && pendingCount > 0 && (
        <div className="bg-zinc-800 text-white rounded-lg shadow-lg p-3 flex items-center gap-2">
          <CloudOff className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">
            {pendingCount} item{pendingCount !== 1 ? 's' : ''} pending sync
          </span>
        </div>
      )}

      {/* Update available */}
      {swWaitingReady && (
        <div className="bg-blue-500 text-white rounded-lg shadow-lg p-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Wifi className="w-5 h-5 shrink-0" />
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
