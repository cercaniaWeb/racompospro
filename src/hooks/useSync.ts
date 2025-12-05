import { useEffect } from 'react';
import { useSyncStore } from '@/store/syncStore';
import { syncOfflineData } from '@/lib/offline/syncQueue';

export const useSync = () => {
  const { isOnline, isSyncing, lastSync, offlineQueue, setOnlineStatus, startSync, addToOfflineQueue, clearOfflineQueue } = useSyncStore();

  useEffect(() => {
    // Update online status based on navigator
    setOnlineStatus(navigator.onLine);

    const handleOnline = () => {
      setOnlineStatus(true);
      // Automatically sync when coming online
      if (offlineQueue.length > 0) {
        startSync();
      }
    };

    const handleOffline = () => {
      setOnlineStatus(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnlineStatus, startSync, offlineQueue.length]);

  return {
    isOnline,
    isSyncing,
    lastSync,
    offlineQueue,
    addToOfflineQueue,
    clearOfflineQueue,
    syncData: startSync,
  };
};