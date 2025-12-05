import { create } from 'zustand';

interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSync: Date | null;
  offlineQueue: any[];
  setOnlineStatus: (isOnline: boolean) => void;
  startSync: () => Promise<void>;
  addToOfflineQueue: (operation: any) => void;
  clearOfflineQueue: () => void;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
  isSyncing: false,
  lastSync: null,
  offlineQueue: [],

  setOnlineStatus: (isOnline) => set({ isOnline }),

  startSync: async () => {
    set({ isSyncing: true });
    
    // In a real implementation, this would sync offline operations to the server
    console.log('Starting sync operation...');
    
    // Simulate sync process
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    set({ 
      isSyncing: false, 
      lastSync: new Date(),
      offlineQueue: []
    });
  },

  addToOfflineQueue: (operation) => {
    set((state) => ({
      offlineQueue: [...state.offlineQueue, operation]
    }));
  },

  clearOfflineQueue: () => set({ offlineQueue: [] }),
}));