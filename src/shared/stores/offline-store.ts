/**
 * @file offline-store.ts
 * @description Zustand store for managing offline state and network connectivity
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface OfflineState {
  // Network status
  isOnline: boolean;
  isAppOnline: boolean; // App-specific online state (can be different from navigator.onLine)
  lastOnlineTime: Date | null;
  connectionType: string | null;
  
  // Offline capabilities
  hasOfflineData: boolean;
  cachedSongsCount: number;
  cachedSetlistsCount: number;
  
  // Storage quota tracking
  storageQuotaUsed: number; // percentage 0-100
  storageQuotaWarning: boolean;
  storageQuotaCritical: boolean;
  
  // Update status
  isUpdateAvailable: boolean;
  isUpdating: boolean;
  lastUpdateCheck: Date | null;
  
  // User preferences
  offlineMode: 'auto' | 'force-offline' | 'force-online';
  
  // Actions
  setOnlineStatus: (online: boolean) => void;
  setAppOnlineStatus: (online: boolean) => void;
  setConnectionType: (type: string | null) => void;
  setCachedCounts: (songs: number, setlists: number) => void;
  setStorageQuota: (used: number, warning: boolean, critical: boolean) => void;
  setUpdateStatus: (available: boolean, updating?: boolean) => void;
  setOfflineMode: (mode: 'auto' | 'force-offline' | 'force-online') => void;
  setLastUpdateCheck: (date: Date) => void;
  
  // Computed getters
  getNetworkStatus: () => {
    isOnline: boolean;
    isAppOnline: boolean;
    effectiveStatus: 'online' | 'offline' | 'limited';
    message: string;
  };
}

export const useOfflineStore = create<OfflineState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isAppOnline: true,
    lastOnlineTime: new Date(),
    connectionType: null,
    hasOfflineData: false,
    cachedSongsCount: 0,
    cachedSetlistsCount: 0,
    storageQuotaUsed: 0,
    storageQuotaWarning: false,
    storageQuotaCritical: false,
    isUpdateAvailable: false,
    isUpdating: false,
    lastUpdateCheck: null,
    offlineMode: 'auto',
    
    // Actions
    setOnlineStatus: (online: boolean) => {
      set((state) => ({
        isOnline: online,
        lastOnlineTime: online ? new Date() : state.lastOnlineTime,
      }));
    },
    
    setAppOnlineStatus: (online: boolean) => {
      set({ isAppOnline: online });
    },
    
    setConnectionType: (type: string | null) => {
      set({ connectionType: type });
    },
    
    setCachedCounts: (songs: number, setlists: number) => {
      set({
        cachedSongsCount: songs,
        cachedSetlistsCount: setlists,
        hasOfflineData: songs > 0 || setlists > 0,
      });
    },
    
    setStorageQuota: (used: number, warning: boolean, critical: boolean) => {
      set({
        storageQuotaUsed: used,
        storageQuotaWarning: warning,
        storageQuotaCritical: critical,
      });
    },
    
    setUpdateStatus: (available: boolean, updating = false) => {
      set({
        isUpdateAvailable: available,
        isUpdating: updating,
      });
    },
    
    setOfflineMode: (mode: 'auto' | 'force-offline' | 'force-online') => {
      set({ offlineMode: mode });
    },
    
    setLastUpdateCheck: (date: Date) => {
      set({ lastUpdateCheck: date });
    },
    
    // Computed getters
    getNetworkStatus: () => {
      const state = get();
      const { isOnline, isAppOnline, offlineMode } = state;
      
      let effectiveStatus: 'online' | 'offline' | 'limited';
      let message: string;
      
      if (offlineMode === 'force-offline') {
        effectiveStatus = 'offline';
        message = 'Offline mode enabled';
      } else if (offlineMode === 'force-online') {
        effectiveStatus = isOnline ? 'online' : 'limited';
        message = isOnline ? 'Online' : 'No internet connection';
      } else {
        // Auto mode
        if (isOnline && isAppOnline) {
          effectiveStatus = 'online';
          message = 'Online';
        } else if (!isOnline) {
          effectiveStatus = 'offline';
          message = 'No internet connection';
        } else {
          effectiveStatus = 'limited';
          message = 'Limited connectivity';
        }
      }
      
      return {
        isOnline,
        isAppOnline,
        effectiveStatus,
        message,
      };
    },
  }))
);

// Initialize network listeners when store is created
if (typeof window !== 'undefined') {
  const store = useOfflineStore.getState();
  
  // Listen for online/offline events
  const handleOnline = () => store.setOnlineStatus(true);
  const handleOffline = () => store.setOnlineStatus(false);
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // Listen for connection type changes (if supported)
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    const updateConnectionInfo = () => {
      store.setConnectionType(connection.effectiveType || connection.type || null);
    };
    
    connection.addEventListener('change', updateConnectionInfo);
    updateConnectionInfo(); // Initial update
  }
  
  // Cleanup function (though in practice this won't be called in the main app)
  const cleanup = () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
  
  // Store cleanup function for potential future use
  (window as any).__offlineStoreCleanup = cleanup;
}