/**
 * @file useOfflineStorage.ts
 * @description React hooks for IndexedDB offline storage integration
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { 
  CachedSong, 
  CachedSetlist, 
  UserPreferences, 
  StorageStats,
  StorageQuota,
  ExportData,
  ImportResult,
  StorageQueryOptions,
  CleanupConfig,
  StorageEventType,
  StorageEventCallback
} from '../types/storage.types';
import { OfflineStorage } from '../services/offlineStorage';
import { useOfflineStore } from '../stores/offline-store';

// Singleton instance
let storageInstance: OfflineStorage | null = null;

const getStorageInstance = async (): Promise<OfflineStorage> => {
  if (!storageInstance) {
    storageInstance = new OfflineStorage();
    await storageInstance.initialize();
  }
  return storageInstance;
};

// ===============================
// CORE STORAGE HOOK
// ===============================

/**
 * Main hook for offline storage operations
 */
export function useOfflineStorage() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const offlineStore = useOfflineStore();

  useEffect(() => {
    let mounted = true;

    const initializeStorage = async () => {
      try {
        await getStorageInstance();
        if (mounted) {
          setIsReady(true);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Storage initialization failed');
          setIsReady(false);
        }
      }
    };

    initializeStorage();

    return () => {
      mounted = false;
    };
  }, []);

  const operations = useMemo(() => ({
    // Setlist operations
    saveSetlist: async (setlist: CachedSetlist) => {
      const storage = await getStorageInstance();
      const result = await storage.saveSetlist(setlist);
      if (result.success) {
        // Update offline store counts
        const stats = await storage.getStorageStats();
        if (stats.success && stats.data) {
          offlineStore.setCachedCounts(stats.data.totalSongs, stats.data.totalSetlists);
        }
      }
      return result;
    },

    getSetlist: async (id: string) => {
      const storage = await getStorageInstance();
      return await storage.getSetlist(id);
    },

    getSetlists: async (options?: StorageQueryOptions) => {
      const storage = await getStorageInstance();
      return await storage.getSetlists(options);
    },

    updateSetlist: async (id: string, updates: Partial<CachedSetlist>) => {
      const storage = await getStorageInstance();
      return await storage.updateSetlist(id, updates);
    },

    deleteSetlist: async (id: string) => {
      const storage = await getStorageInstance();
      const result = await storage.deleteSetlist(id);
      if (result.success) {
        // Update offline store counts
        const stats = await storage.getStorageStats();
        if (stats.success && stats.data) {
          offlineStore.setCachedCounts(stats.data.totalSongs, stats.data.totalSetlists);
        }
      }
      return result;
    },

    // Song operations
    saveSong: async (song: CachedSong) => {
      const storage = await getStorageInstance();
      const result = await storage.saveSong(song);
      if (result.success) {
        // Update offline store counts
        const stats = await storage.getStorageStats();
        if (stats.success && stats.data) {
          offlineStore.setCachedCounts(stats.data.totalSongs, stats.data.totalSetlists);
        }
      }
      return result;
    },

    getSong: async (id: string) => {
      const storage = await getStorageInstance();
      return await storage.getSong(id);
    },

    getSongs: async (options?: StorageQueryOptions) => {
      const storage = await getStorageInstance();
      return await storage.getSongs(options);
    },

    trackSongAccess: async (id: string) => {
      const storage = await getStorageInstance();
      return await storage.trackSongAccess(id);
    },

    // Preferences operations
    savePreferences: async (preferences: UserPreferences) => {
      const storage = await getStorageInstance();
      return await storage.savePreferences(preferences);
    },

    getPreferences: async (userId: string) => {
      const storage = await getStorageInstance();
      return await storage.getPreferences(userId);
    },

    updatePreferences: async (userId: string, updates: Partial<UserPreferences>) => {
      const storage = await getStorageInstance();
      return await storage.updatePreferences(userId, updates);
    },

    // Storage management
    getStorageStats: async () => {
      const storage = await getStorageInstance();
      return await storage.getStorageStats();
    },

    checkStorageQuota: async () => {
      const storage = await getStorageInstance();
      return await storage.checkStorageQuota();
    },

    cleanup: async (config: CleanupConfig) => {
      const storage = await getStorageInstance();
      const result = await storage.cleanup(config);
      if (result.success) {
        // Update offline store counts
        const stats = await storage.getStorageStats();
        if (stats.success && stats.data) {
          offlineStore.setCachedCounts(stats.data.totalSongs, stats.data.totalSetlists);
        }
      }
      return result;
    },

    // Export/Import
    exportData: async (userId: string) => {
      const storage = await getStorageInstance();
      return await storage.exportData(userId);
    },

    importData: async (data: ExportData, options?: { resolveConflicts?: 'keep_existing' | 'overwrite' | 'create_new' }) => {
      const storage = await getStorageInstance();
      const result = await storage.importData(data, options);
      if (result.success) {
        // Update offline store counts
        const stats = await storage.getStorageStats();
        if (stats.success && stats.data) {
          offlineStore.setCachedCounts(stats.data.totalSongs, stats.data.totalSetlists);
        }
      }
      return result;
    },

    // Event handling
    addEventListener: async (eventType: StorageEventType, callback: StorageEventCallback) => {
      const storage = await getStorageInstance();
      storage.on(eventType, callback);
    },

    removeEventListener: async (eventType: StorageEventType, callback: StorageEventCallback) => {
      const storage = await getStorageInstance();
      storage.off(eventType, callback);
    },
  }), [offlineStore]);

  return {
    isReady,
    error,
    ...operations,
  };
}

// ===============================
// SPECIALIZED HOOKS
// ===============================

/**
 * Hook for managing setlists
 */
export function useSetlists(userId?: string, options?: StorageQueryOptions) {
  const [setlists, setSetlists] = useState<CachedSetlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const storage = useOfflineStorage();

  const loadSetlists = useCallback(async () => {
    if (!storage.isReady) return;

    try {
      setLoading(true);
      setError(null);

      const queryOptions: StorageQueryOptions = {
        ...options,
        ...(userId && { searchFields: ['createdBy'], searchTerm: userId }),
      };

      const result = await storage.getSetlists(queryOptions);
      
      if (result.success) {
        setSetlists(result.data || []);
      } else {
        setError(result.error || 'Failed to load setlists');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [storage, userId, options]);

  useEffect(() => {
    loadSetlists();
  }, [loadSetlists]);

  const saveSetlist = useCallback(async (setlist: CachedSetlist) => {
    const result = await storage.saveSetlist(setlist);
    if (result.success) {
      await loadSetlists(); // Refresh list
    }
    return result;
  }, [storage, loadSetlists]);

  const updateSetlist = useCallback(async (id: string, updates: Partial<CachedSetlist>) => {
    const result = await storage.updateSetlist(id, updates);
    if (result.success) {
      await loadSetlists(); // Refresh list
    }
    return result;
  }, [storage, loadSetlists]);

  const deleteSetlist = useCallback(async (id: string) => {
    const result = await storage.deleteSetlist(id);
    if (result.success) {
      await loadSetlists(); // Refresh list
    }
    return result;
  }, [storage, loadSetlists]);

  return {
    setlists,
    loading,
    error,
    refresh: loadSetlists,
    saveSetlist,
    updateSetlist,
    deleteSetlist,
  };
}

/**
 * Hook for managing songs
 */
export function useSongs(options?: StorageQueryOptions) {
  const [songs, setSongs] = useState<CachedSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const storage = useOfflineStorage();

  const loadSongs = useCallback(async () => {
    if (!storage.isReady) return;

    try {
      setLoading(true);
      setError(null);

      const result = await storage.getSongs(options);
      
      if (result.success) {
        setSongs(result.data || []);
      } else {
        setError(result.error || 'Failed to load songs');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [storage, options]);

  useEffect(() => {
    loadSongs();
  }, [loadSongs]);

  const saveSong = useCallback(async (song: CachedSong) => {
    const result = await storage.saveSong(song);
    if (result.success) {
      await loadSongs(); // Refresh list
    }
    return result;
  }, [storage, loadSongs]);

  const trackAccess = useCallback(async (id: string) => {
    const result = await storage.trackSongAccess(id);
    if (result.success && result.data) {
      // Update the local song in state
      setSongs(prev => prev.map(song => 
        song.id === id ? result.data! : song
      ));
    }
    return result;
  }, [storage]);

  return {
    songs,
    loading,
    error,
    refresh: loadSongs,
    saveSong,
    trackAccess,
  };
}

/**
 * Hook for managing user preferences
 */
export function useUserPreferences(userId: string) {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const storage = useOfflineStorage();

  const loadPreferences = useCallback(async () => {
    if (!storage.isReady || !userId) return;

    try {
      setLoading(true);
      setError(null);

      const result = await storage.getPreferences(userId);
      
      if (result.success) {
        setPreferences(result.data || null);
      } else {
        // If preferences don't exist, that's OK - we'll create them when saved
        if (result.error?.includes('not found')) {
          setPreferences(null);
        } else {
          setError(result.error || 'Failed to load preferences');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [storage, userId]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
    if (!userId) return { success: false, error: 'User ID required' };

    let result;
    
    if (preferences) {
      // Update existing preferences
      result = await storage.updatePreferences(userId, updates);
    } else {
      // Create new preferences
      const newPreferences: UserPreferences = {
        id: `pref-${userId}`,
        userId,
        theme: 'light',
        fontSize: 'medium',
        fontFamily: 'system',
        chordStyle: 'above',
        showChordDiagrams: true,
        transposeDisplayKey: false,
        defaultSetlistView: 'grid',
        showSongDurations: true,
        showTranspositions: true,
        autoSync: true,
        syncOnlyOnWifi: false,
        maxCacheSize: 100,
        cacheRetentionDays: 30,
        preloadFavorites: true,
        syncNotifications: true,
        updateNotifications: true,
        defaultExportFormat: 'json',
        includeChordsInExport: true,
        includeLyricsInExport: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        syncStatus: 'pending',
        version: 1,
        ...updates,
      };
      
      result = await storage.savePreferences(newPreferences);
    }
    
    if (result.success) {
      setPreferences(result.data || null);
    }
    
    return result;
  }, [storage, userId, preferences]);

  return {
    preferences,
    loading,
    error,
    updatePreferences,
    refresh: loadPreferences,
  };
}

/**
 * Hook for storage statistics and quota monitoring
 */
export function useStorageStats() {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [quota, setQuota] = useState<StorageQuota | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const storage = useOfflineStorage();
  const offlineStore = useOfflineStore();

  const loadStats = useCallback(async () => {
    if (!storage.isReady) return;

    try {
      setLoading(true);
      setError(null);

      const [statsResult, quotaResult] = await Promise.all([
        storage.getStorageStats(),
        storage.checkStorageQuota(),
      ]);
      
      if (statsResult.success) {
        setStats(statsResult.data || null);
        // Update offline store
        if (statsResult.data) {
          offlineStore.setCachedCounts(
            statsResult.data.totalSongs, 
            statsResult.data.totalSetlists
          );
        }
      }
      
      if (quotaResult.success) {
        setQuota(quotaResult.data || null);
      }
      
      if (!statsResult.success || !quotaResult.success) {
        setError(statsResult.error || quotaResult.error || 'Failed to load stats');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [storage, offlineStore]);

  useEffect(() => {
    loadStats();
    
    // Set up periodic quota checks
    const interval = setInterval(loadStats, 5 * 60 * 1000); // Every 5 minutes
    
    return () => clearInterval(interval);
  }, [loadStats]);

  const performCleanup = useCallback(async (config: CleanupConfig) => {
    const result = await storage.cleanup(config);
    if (result.success) {
      await loadStats(); // Refresh stats after cleanup
    }
    return result;
  }, [storage, loadStats]);

  return {
    stats,
    quota,
    loading,
    error,
    refresh: loadStats,
    performCleanup,
    isQuotaWarning: quota?.warning || false,
    isQuotaCritical: (quota?.percentage ?? 0) >= 95,
  };
}

/**
 * Hook for export/import operations
 */
export function useDataPortability(userId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const storage = useOfflineStorage();

  const exportData = useCallback(async (): Promise<ExportData | null> => {
    if (!storage.isReady || !userId) return null;

    try {
      setLoading(true);
      setError(null);

      const result = await storage.exportData(userId);
      
      if (result.success) {
        return result.data || null;
      } else {
        setError(result.error || 'Export failed');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [storage, userId]);

  const importData = useCallback(async (
    data: ExportData, 
    options?: { resolveConflicts?: 'keep_existing' | 'overwrite' | 'create_new' }
  ): Promise<ImportResult | null> => {
    if (!storage.isReady) return null;

    try {
      setLoading(true);
      setError(null);

      const result = await storage.importData(data, options);
      
      if (result.success) {
        return result.data || null;
      } else {
        setError(result.error || 'Import failed');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [storage]);

  const downloadExport = useCallback(async (filename?: string) => {
    const data = await exportData();
    if (!data) return false;

    try {
      const blob = new Blob([JSON.stringify(data, null, 2)], { 
        type: 'application/json' 
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `hsa-songbook-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
      return false;
    }
  }, [exportData]);

  return {
    loading,
    error,
    exportData,
    importData,
    downloadExport,
  };
}

/**
 * Hook for storage event listening
 */
export function useStorageEvents(eventType: StorageEventType, callback: StorageEventCallback) {
  const storage = useOfflineStorage();

  useEffect(() => {
    if (!storage.isReady) return;

    let isSubscribed = true;

    const setupListener = async () => {
      if (isSubscribed) {
        await storage.addEventListener(eventType, callback);
      }
    };

    const cleanupListener = async () => {
      await storage.removeEventListener(eventType, callback);
    };

    setupListener();

    return () => {
      isSubscribed = false;
      cleanupListener();
    };
  }, [storage, eventType, callback]);
}