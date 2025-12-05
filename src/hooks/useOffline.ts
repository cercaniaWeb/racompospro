import { useEffect } from 'react';
import { useSyncStore } from '@/store/syncStore';
import { isOnline, syncOfflineData, initOnlineDetection } from '@/lib/offline/syncQueue';

export const useOffline = () => {
  const { isOnline: isAppOnline, isSyncing, lastSync, offlineQueue, setOnlineStatus, startSync } = useSyncStore();

  useEffect(() => {
    // Initialize online/offline detection
    initOnlineDetection();

    // Set initial online status
    setOnlineStatus(navigator.onLine);

    // Listen for online/offline events
    const handleOnline = () => setOnlineStatus(true);
    const handleOffline = () => setOnlineStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Sync data when coming back online
    if (navigator.onLine && offlineQueue.length > 0) {
      startSync();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnlineStatus, startSync, offlineQueue.length]);

  return {
    isOnline: isAppOnline,
    isSyncing,
    lastSync,
    offlineQueue,
    syncData: startSync,
    checkOnlineStatus: () => navigator.onLine
  };
};