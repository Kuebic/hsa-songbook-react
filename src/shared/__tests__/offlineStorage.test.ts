/**
 * @file offlineStorage.test.ts
 * @description Comprehensive tests for IndexedDB offline storage functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { 
  CachedSong, 
  CachedSetlist, 
  UserPreferences, 
  ExportData,
  StorageQueryOptions,
  CleanupConfig
} from '../types/storage.types';

// Mock IndexedDB with extended functionality
const createMockDB = () => {
  const stores = new Map();
  const indexes = new Map();
  
  return {
    put: vi.fn((storeName: string, data: any) => {
      if (!stores.has(storeName)) stores.set(storeName, new Map());
      stores.get(storeName).set(data.id, { ...data, updatedAt: Date.now() });
      return Promise.resolve(data.id);
    }),
    get: vi.fn((storeName: string, id: string) => {
      const store = stores.get(storeName);
      return Promise.resolve(store?.get(id) || undefined);
    }),
    getAll: vi.fn((storeName: string) => {
      const store = stores.get(storeName);
      return Promise.resolve(store ? Array.from(store.values()) : []);
    }),
    getAllKeys: vi.fn((storeName: string) => {
      const store = stores.get(storeName);
      return Promise.resolve(store ? Array.from(store.keys()) : []);
    }),
    delete: vi.fn((storeName: string, id: string) => {
      const store = stores.get(storeName);
      const deleted = store?.delete(id) || false;
      return Promise.resolve(deleted);
    }),
    clear: vi.fn((storeName: string) => {
      stores.set(storeName, new Map());
      return Promise.resolve();
    }),
    count: vi.fn((storeName: string) => {
      const store = stores.get(storeName);
      return Promise.resolve(store?.size || 0);
    }),
    transaction: vi.fn(() => ({
      store: {
        put: vi.fn(),
        get: vi.fn(),
        delete: vi.fn(),
      },
      done: Promise.resolve(),
    })),
    objectStoreNames: {
      contains: vi.fn(() => true),
    },
    createObjectStore: vi.fn(() => ({
      createIndex: vi.fn(),
    })),
    close: vi.fn(),
    // Add internal access to stores for testing
    _stores: stores,
    _indexes: indexes,
  };
};

vi.mock('idb', () => ({
  openDB: vi.fn(),
}));

// Import after mocking
import { OfflineStorage } from '../services/offlineStorage';

describe('OfflineStorage', () => {
  let offlineStorage: OfflineStorage;
  let mockDB: ReturnType<typeof createMockDB>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockDB = createMockDB();
    const { openDB } = await import('idb');
    vi.mocked(openDB).mockResolvedValue(mockDB as any);
    offlineStorage = new OfflineStorage();
    await offlineStorage.initialize();
  });

  afterEach(async () => {
    if (offlineStorage) {
      await offlineStorage.close();
    }
  });

  describe('Initialization', () => {
    it('should initialize database with correct schema', async () => {
      expect(offlineStorage.isInitialized()).toBe(true);
      const config = offlineStorage.getConfig();
      expect(config.dbName).toBe('hsa-songbook-offline');
      expect(config.dbVersion).toBeGreaterThan(0);
    });

    it('should handle initialization errors gracefully', async () => {
      const { openDB } = await import('idb');
      vi.mocked(openDB).mockRejectedValue(new Error('DB Error'));
      const newStorage = new OfflineStorage();
      
      await expect(newStorage.initialize()).rejects.toThrow('DB Error');
      expect(newStorage.isInitialized()).toBe(false);
    });
  });

  describe('Setlist Operations', () => {
    const mockSetlist: CachedSetlist = {
      id: 'setlist-1',
      name: 'Sunday Service',
      description: 'Morning worship setlist',
      songs: [
        {
          songId: 'song-1',
          order: 0,
          transpose: 2,
          notes: 'Start slow',
        },
        {
          songId: 'song-2', 
          order: 1,
          transpose: 0,
        }
      ],
      tags: ['worship', 'sunday'],
      isPublic: false,
      usageCount: 0,
      createdBy: 'user-123',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      syncStatus: 'synced',
      version: 1,
    };

    it('should save setlist locally', async () => {
      const result = await offlineStorage.saveSetlist(mockSetlist);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(expect.objectContaining({
        id: mockSetlist.id,
        name: mockSetlist.name,
      }));
      expect(mockDB.put).toHaveBeenCalledWith('setlists', expect.objectContaining(mockSetlist));
    });

    it('should retrieve setlist by id', async () => {
      await offlineStorage.saveSetlist(mockSetlist);
      const result = await offlineStorage.getSetlist(mockSetlist.id);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(expect.objectContaining({
        id: mockSetlist.id,
        name: mockSetlist.name,
        songs: expect.arrayContaining([
          expect.objectContaining({ songId: 'song-1', order: 0 }),
          expect.objectContaining({ songId: 'song-2', order: 1 }),
        ]),
      }));
    });

    it('should list setlists with query options', async () => {
      const setlist2 = { ...mockSetlist, id: 'setlist-2', name: 'Evening Service', tags: ['worship', 'evening'] };
      await offlineStorage.saveSetlist(mockSetlist);
      await offlineStorage.saveSetlist(setlist2);

      const queryOptions: StorageQueryOptions = {
        tags: ['evening'],
        sortBy: 'name',
        sortOrder: 'asc',
        limit: 10,
      };

      const result = await offlineStorage.getSetlists(queryOptions);
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].name).toBe('Evening Service');
    });

    it('should update existing setlist', async () => {
      await offlineStorage.saveSetlist(mockSetlist);
      
      const updatedSetlist = { 
        ...mockSetlist, 
        name: 'Updated Sunday Service',
        songs: [...mockSetlist.songs, { songId: 'song-3', order: 2, transpose: -1 }],
      };
      
      const result = await offlineStorage.updateSetlist(updatedSetlist.id, updatedSetlist);
      
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Updated Sunday Service');
      expect(result.data?.songs).toHaveLength(3);
    });

    it('should delete setlist', async () => {
      await offlineStorage.saveSetlist(mockSetlist);
      
      const result = await offlineStorage.deleteSetlist(mockSetlist.id);
      
      expect(result.success).toBe(true);
      expect(mockDB.delete).toHaveBeenCalledWith('setlists', mockSetlist.id);
    });

    it('should handle setlist not found', async () => {
      const result = await offlineStorage.getSetlist('non-existent');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('Song Operations', () => {
    const mockSong: CachedSong = {
      id: 'song-1',
      title: 'Amazing Grace',
      artist: 'Traditional',
      key: 'G',
      tempo: 120,
      tags: ['hymn', 'traditional'],
      chordSheet: 'G C G D G',
      duration: 240,
      difficulty: 'beginner',
      fileSize: 1024,
      accessCount: 5,
      lastAccessedAt: Date.now(),
      isFavorite: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      syncStatus: 'synced',
      version: 1,
    };

    it('should save song locally', async () => {
      const result = await offlineStorage.saveSong(mockSong);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(expect.objectContaining({
        id: mockSong.id,
        title: mockSong.title,
        accessCount: mockSong.accessCount,
      }));
    });

    it('should search songs by title and tags', async () => {
      const song2 = { ...mockSong, id: 'song-2', title: 'How Great Thou Art', tags: ['hymn', 'praise'] };
      await offlineStorage.saveSong(mockSong);
      await offlineStorage.saveSong(song2);

      const queryOptions: StorageQueryOptions = {
        searchTerm: 'grace',
        searchFields: ['title'],
        tags: ['hymn'],
      };

      const result = await offlineStorage.getSongs(queryOptions);
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].title).toBe('Amazing Grace');
    });

    it('should update access tracking', async () => {
      await offlineStorage.saveSong(mockSong);
      
      const result = await offlineStorage.trackSongAccess(mockSong.id);
      
      expect(result.success).toBe(true);
      expect(result.data?.accessCount).toBe(mockSong.accessCount + 1);
      expect(result.data?.lastAccessedAt).toBeGreaterThan(mockSong.lastAccessedAt);
    });
  });

  describe('User Preferences', () => {
    const mockPreferences: UserPreferences = {
      id: 'pref-user-123',
      userId: 'user-123',
      theme: 'dark',
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
      syncStatus: 'synced',
      version: 1,
    };

    it('should save user preferences', async () => {
      const result = await offlineStorage.savePreferences(mockPreferences);
      
      expect(result.success).toBe(true);
      expect(result.data?.theme).toBe('dark');
      expect(result.data?.userId).toBe('user-123');
    });

    it('should get user preferences by userId', async () => {
      await offlineStorage.savePreferences(mockPreferences);
      
      const result = await offlineStorage.getPreferences('user-123');
      
      expect(result.success).toBe(true);
      expect(result.data?.theme).toBe('dark');
      expect(result.data?.maxCacheSize).toBe(100);
    });

    it('should update specific preference values', async () => {
      await offlineStorage.savePreferences(mockPreferences);
      
      const result = await offlineStorage.updatePreferences('user-123', {
        theme: 'light',
        fontSize: 'large',
      });
      
      expect(result.success).toBe(true);
      expect(result.data?.theme).toBe('light');
      expect(result.data?.fontSize).toBe('large');
      expect(result.data?.autoSync).toBe(true); // Should preserve other values
    });
  });

  describe('Storage Statistics', () => {
    it('should calculate storage statistics', async () => {
      const mockSong: CachedSong = { 
        id: 'song1', title: 'Test', fileSize: 1024, tags: [], accessCount: 0, 
        lastAccessedAt: Date.now(), isFavorite: false, createdAt: Date.now(), 
        updatedAt: Date.now(), syncStatus: 'synced', version: 1 
      };
      const mockSetlist: CachedSetlist = { 
        id: 'setlist1', name: 'Test', songs: [], tags: [], isPublic: false, 
        usageCount: 0, createdBy: 'user1', createdAt: Date.now(), 
        updatedAt: Date.now(), syncStatus: 'synced', version: 1 
      };

      await offlineStorage.saveSong(mockSong);
      await offlineStorage.saveSetlist(mockSetlist);
      
      const result = await offlineStorage.getStorageStats();
      
      expect(result.success).toBe(true);
      expect(result.data?.totalSongs).toBe(1);
      expect(result.data?.totalSetlists).toBe(1);
      expect(result.data?.songsSize).toBeGreaterThan(0);
    });

    it('should check storage quota', async () => {
      // Mock navigator.storage
      Object.defineProperty(navigator, 'storage', {
        value: {
          estimate: vi.fn().mockResolvedValue({
            quota: 1024 * 1024 * 100, // 100MB
            usage: 1024 * 1024 * 85,  // 85MB (85%)
          }),
        },
        writable: true,
      });

      const result = await offlineStorage.checkStorageQuota();
      
      expect(result.success).toBe(true);
      expect(result.data?.percentage).toBe(85);
      expect(result.data?.warning).toBe(true);
    });
  });

  describe('Export/Import Functionality', () => {
    const mockSetlist: CachedSetlist = {
      id: 'setlist-1',
      name: 'Test Setlist',
      songs: [],
      tags: [],
      isPublic: false,
      usageCount: 0,
      createdBy: 'user-123',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      syncStatus: 'synced',
      version: 1,
    };

    it('should export all data to JSON', async () => {
      await offlineStorage.saveSetlist(mockSetlist);
      
      const result = await offlineStorage.exportData('user-123');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(expect.objectContaining({
        version: expect.any(String),
        exportedAt: expect.any(Number),
        exportedBy: 'user-123',
        setlists: expect.arrayContaining([
          expect.objectContaining({ id: 'setlist-1', name: 'Test Setlist' })
        ]),
        totalItems: expect.any(Number),
        checksum: expect.any(String),
      }));
    });

    it('should import data from JSON', async () => {
      const exportData: ExportData = {
        version: '1.0.0',
        exportedAt: Date.now(),
        exportedBy: 'user-123',
        songs: [],
        setlists: [mockSetlist],
        preferences: {
          id: 'pref-user-123',
          userId: 'user-123',
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
          syncStatus: 'synced',
          version: 1,
        },
        totalItems: 1,
        totalSize: 1024,
        checksum: 'abc123',
      };

      const result = await offlineStorage.importData(exportData);
      
      expect(result.success).toBe(true);
      expect(result.data?.setlistsImported).toBe(1);
      expect(result.data?.preferencesImported).toBe(1);
      expect(result.data?.errors).toHaveLength(0);
    });

    it('should handle import conflicts', async () => {
      // First save an existing setlist
      await offlineStorage.saveSetlist(mockSetlist);
      
      const conflictingSetlist = { 
        ...mockSetlist, 
        name: 'Updated Name',
        version: 2 
      };
      
      const exportData: ExportData = {
        version: '1.0.0',
        exportedAt: Date.now(),
        exportedBy: 'user-123',
        songs: [],
        setlists: [conflictingSetlist],
        preferences: {} as UserPreferences,
        totalItems: 1,
        totalSize: 1024,
        checksum: 'abc123',
      };

      const result = await offlineStorage.importData(exportData, { resolveConflicts: 'overwrite' });
      
      expect(result.success).toBe(true);
      expect(result.data?.conflicts).toHaveLength(1);
      expect(result.data?.conflicts?.[0].resolution).toBe('overwrite');
    });
  });

  describe('Cleanup Operations', () => {
    it('should clean up old unused data', async () => {
      const oldSong: CachedSong = {
        id: 'old-song',
        title: 'Old Song',
        tags: [],
        fileSize: 1024,
        accessCount: 0,
        lastAccessedAt: Date.now() - (40 * 24 * 60 * 60 * 1000), // 40 days ago
        isFavorite: false,
        createdAt: Date.now() - (40 * 24 * 60 * 60 * 1000),
        updatedAt: Date.now() - (40 * 24 * 60 * 60 * 1000),
        syncStatus: 'synced',
        version: 1,
      };

      await offlineStorage.saveSong(oldSong);
      
      const cleanupConfig: CleanupConfig = {
        maxAge: 365,
        maxUnusedAge: 30,
        maxCacheSize: 50,
        quotaWarningThreshold: 80,
        quotaCriticalThreshold: 95,
        autoCleanup: true,
        cleanupOnStart: false,
        cleanupInterval: 24 * 60 * 60 * 1000,
      };

      const result = await offlineStorage.cleanup(cleanupConfig);
      
      expect(result.success).toBe(true);
      expect(result.data?.deletedSongs).toBeGreaterThan(0);
    });

    it('should respect favorites during cleanup', async () => {
      const favoriteSong: CachedSong = {
        id: 'fav-song',
        title: 'Favorite Song',
        tags: [],
        fileSize: 1024,
        accessCount: 0,
        lastAccessedAt: Date.now() - (40 * 24 * 60 * 60 * 1000),
        isFavorite: true, // Should not be cleaned up
        createdAt: Date.now() - (40 * 24 * 60 * 60 * 1000),
        updatedAt: Date.now() - (40 * 24 * 60 * 60 * 1000),
        syncStatus: 'synced',
        version: 1,
      };

      await offlineStorage.saveSong(favoriteSong);
      
      const cleanupConfig: CleanupConfig = {
        maxAge: 365,
        maxUnusedAge: 30,
        maxCacheSize: 50,
        quotaWarningThreshold: 80,
        quotaCriticalThreshold: 95,
        autoCleanup: true,
        cleanupOnStart: false,
        cleanupInterval: 24 * 60 * 60 * 1000,
      };

      const result = await offlineStorage.cleanup(cleanupConfig);
      
      expect(result.success).toBe(true);
      
      // Verify favorite song was not deleted
      const songResult = await offlineStorage.getSong(favoriteSong.id);
      expect(songResult.success).toBe(true);
      expect(songResult.data?.isFavorite).toBe(true);
    });
  });

  describe('Event Handling', () => {
    it('should emit events for storage operations', async () => {
      const eventCallback = vi.fn();
      offlineStorage.on('setlist_added', eventCallback);
      
      const mockSetlist: CachedSetlist = {
        id: 'setlist-1',
        name: 'Test Setlist',
        songs: [],
        tags: [],
        isPublic: false,
        usageCount: 0,
        createdBy: 'user-123',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        syncStatus: 'synced',
        version: 1,
      };

      await offlineStorage.saveSetlist(mockSetlist);
      
      expect(eventCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'setlist_added',
          data: expect.objectContaining({ id: 'setlist-1' }),
          timestamp: expect.any(Number),
        })
      );
    });

    it('should emit quota warning events', async () => {
      const quotaCallback = vi.fn();
      offlineStorage.on('quota_warning', quotaCallback);
      
      // Mock storage estimate to trigger warning
      Object.defineProperty(navigator, 'storage', {
        value: {
          estimate: vi.fn().mockResolvedValue({
            quota: 1024 * 1024 * 100,
            usage: 1024 * 1024 * 85, // 85% usage
          }),
        },
        writable: true,
      });

      await offlineStorage.checkStorageQuota();
      
      expect(quotaCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'quota_warning',
          data: expect.objectContaining({
            percentage: 85,
            warning: true,
          }),
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle database operation failures', async () => {
      mockDB.put.mockRejectedValue(new Error('Database write failed'));
      
      const mockSetlist: CachedSetlist = {
        id: 'setlist-1',
        name: 'Test Setlist',
        songs: [],
        tags: [],
        isPublic: false,
        usageCount: 0,
        createdBy: 'user-123',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        syncStatus: 'synced',
        version: 1,
      };

      const result = await offlineStorage.saveSetlist(mockSetlist);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Database write failed');
    });

    it('should handle quota exceeded errors', async () => {
      const quotaError = new Error('QuotaExceededError');
      quotaError.name = 'QuotaExceededError';
      mockDB.put.mockRejectedValue(quotaError);
      
      const mockSong: CachedSong = {
        id: 'large-song',
        title: 'Large Song',
        tags: [],
        fileSize: 1024 * 1024 * 10, // 10MB
        accessCount: 0,
        lastAccessedAt: Date.now(),
        isFavorite: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        syncStatus: 'synced',
        version: 1,
      };

      const result = await offlineStorage.saveSong(mockSong);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('storage quota exceeded');
    });
  });
});