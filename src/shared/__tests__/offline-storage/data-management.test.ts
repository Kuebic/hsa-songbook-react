/**
 * @file data-management.test.ts
 * @description Tests for data export, import, and cleanup operations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { ExportData, CleanupConfig } from '../../types/storage.types';
import { OfflineStorage } from '../../services/offlineStorage';
import { 
  createMockIndexedDB, 
  createMockCachedSong, 
  createMockSetlist,
  createMockUserPreferences 
} from '../../../test/factories/typeSafeMockFactory';

vi.mock('idb', () => ({
  openDB: vi.fn(),
}));

describe('OfflineStorage - Data Management', () => {
  let offlineStorage: OfflineStorage;
  let mockDB: ReturnType<typeof createMockIndexedDB>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockDB = createMockIndexedDB();
    const { openDB } = await import('idb');
    vi.mocked(openDB).mockResolvedValue(mockDB as unknown as IDBDatabase);
    offlineStorage = new OfflineStorage();
    await offlineStorage.initialize();
  });

  afterEach(async () => {
    if (offlineStorage) {
      await offlineStorage.close();
    }
  });

  describe('Export Operations', () => {
    const mockSongs = [
      createMockCachedSong({ id: 'song-1', title: 'Amazing Grace' }),
      createMockCachedSong({ id: 'song-2', title: 'How Great Thou Art' })
    ];
    
    const mockSetlists = [
      createMockSetlist({ id: 'setlist-1', name: 'Sunday Service' }),
      createMockSetlist({ id: 'setlist-2', name: 'Evening Worship' })
    ];

    const mockPreferences = createMockUserPreferences();

    it('should export all data', async () => {
      mockDB.getAll
        .mockResolvedValueOnce(mockSongs) // songs
        .mockResolvedValueOnce(mockSetlists) // setlists
        .mockResolvedValueOnce([mockPreferences]); // preferences

      const result = await offlineStorage.exportAllData();
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(expect.objectContaining({
        songs: mockSongs,
        setlists: mockSetlists,
        preferences: mockPreferences,
        exportedAt: expect.any(Number),
        version: expect.any(String)
      }));
    });

    it('should export only songs', async () => {
      mockDB.getAll.mockResolvedValueOnce(mockSongs);

      const result = await offlineStorage.exportData({ includeSongs: true });
      
      expect(result.success).toBe(true);
      expect(result.data.songs).toEqual(mockSongs);
      expect(result.data.setlists).toBeUndefined();
      expect(result.data.preferences).toBeUndefined();
    });

    it('should export only setlists', async () => {
      mockDB.getAll.mockResolvedValueOnce(mockSetlists);

      const result = await offlineStorage.exportData({ includeSetlists: true });
      
      expect(result.success).toBe(true);
      expect(result.data.setlists).toEqual(mockSetlists);
      expect(result.data.songs).toBeUndefined();
      expect(result.data.preferences).toBeUndefined();
    });

    it('should export only preferences', async () => {
      mockDB.get.mockResolvedValueOnce(mockPreferences);

      const result = await offlineStorage.exportData({ includePreferences: true });
      
      expect(result.success).toBe(true);
      expect(result.data.preferences).toEqual(mockPreferences);
      expect(result.data.songs).toBeUndefined();
      expect(result.data.setlists).toBeUndefined();
    });

    it('should export data with compression', async () => {
      mockDB.getAll.mockResolvedValueOnce(mockSongs);

      const result = await offlineStorage.exportData({ 
        includeSongs: true,
        compress: true 
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('compressed', true);
      expect(typeof result.data.compressedData).toBe('string');
    });

    it('should export data with metadata', async () => {
      mockDB.getAll.mockResolvedValueOnce(mockSongs);

      const result = await offlineStorage.exportData({ 
        includeSongs: true,
        includeMetadata: true 
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('metadata');
      expect(result.data.metadata).toEqual(expect.objectContaining({
        exportedAt: expect.any(Number),
        version: expect.any(String),
        itemCounts: expect.objectContaining({
          songs: 2
        })
      }));
    });

    it('should export filtered data by date range', async () => {
      const oldSong = createMockCachedSong({ 
        id: 'old-song',
        createdAt: new Date('2022-01-01'),
        updatedAt: new Date('2022-01-01')
      });
      const newSong = createMockCachedSong({ 
        id: 'new-song',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      });
      
      mockDB.getAll.mockResolvedValueOnce([oldSong, newSong]);

      const result = await offlineStorage.exportData({ 
        includeSongs: true,
        dateRange: {
          start: new Date('2023-01-01'),
          end: new Date('2024-12-31')
        }
      });
      
      expect(result.success).toBe(true);
      expect(result.data.songs).toHaveLength(1);
      expect(result.data.songs[0].id).toBe('new-song');
    });
  });

  describe('Import Operations', () => {
    const mockExportData: ExportData = {
      songs: [
        createMockCachedSong({ id: 'song-1', title: 'Amazing Grace' }),
        createMockCachedSong({ id: 'song-2', title: 'How Great Thou Art' })
      ],
      setlists: [
        createMockSetlist({ id: 'setlist-1', name: 'Sunday Service' })
      ],
      preferences: createMockUserPreferences(),
      exportedAt: Date.now(),
      version: '1.0.0'
    };

    it('should import all data', async () => {
      const result = await offlineStorage.importData(mockExportData);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(expect.objectContaining({
        imported: {
          songs: 2,
          setlists: 1,
          preferences: 1
        }
      }));
      expect(mockDB.put).toHaveBeenCalledTimes(4); // 2 songs + 1 setlist + 1 preferences
    });

    it('should import with merge strategy', async () => {
      // Setup existing data
      const existingSong = createMockCachedSong({ id: 'song-1', title: 'Existing Song' });
      mockDB.get.mockResolvedValueOnce(existingSong);

      const result = await offlineStorage.importData(mockExportData, {
        mergeStrategy: 'merge'
      });
      
      expect(result.success).toBe(true);
      expect(result.data.conflicts).toEqual(expect.arrayContaining([
        expect.objectContaining({
          id: 'song-1',
          type: 'song',
          action: 'merged'
        })
      ]));
    });

    it('should import with replace strategy', async () => {
      const result = await offlineStorage.importData(mockExportData, {
        mergeStrategy: 'replace'
      });
      
      expect(result.success).toBe(true);
      expect(mockDB.clear).toHaveBeenCalledWith('songs');
      expect(mockDB.clear).toHaveBeenCalledWith('setlists');
    });

    it('should import with skip strategy for conflicts', async () => {
      const existingSong = createMockCachedSong({ id: 'song-1' });
      mockDB.get.mockResolvedValueOnce(existingSong);

      const result = await offlineStorage.importData(mockExportData, {
        mergeStrategy: 'skip'
      });
      
      expect(result.success).toBe(true);
      expect(result.data.skipped).toEqual(expect.arrayContaining([
        expect.objectContaining({
          id: 'song-1',
          type: 'song'
        })
      ]));
    });

    it('should validate import data format', async () => {
      const invalidData = { invalid: 'data' };

      const result = await offlineStorage.importData(invalidData as unknown as ExportData);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid import data format');
    });

    it('should import compressed data', async () => {
      const compressedData = {
        compressed: true,
        compressedData: 'compressed-string-data',
        exportedAt: Date.now(),
        version: '1.0.0'
      };

      // Mock decompression
      vi.spyOn(offlineStorage as unknown as { decompressData: (data: string) => ExportData }, 'decompressData').mockReturnValue(mockExportData);

      const result = await offlineStorage.importData(compressedData);
      
      expect(result.success).toBe(true);
      expect(offlineStorage.decompressData).toHaveBeenCalledWith('compressed-string-data');
    });

    it('should handle import errors gracefully', async () => {
      mockDB.put.mockRejectedValueOnce(new Error('Storage full'));

      const result = await offlineStorage.importData(mockExportData);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Import failed');
    });

    it('should backup existing data before import', async () => {
      const result = await offlineStorage.importData(mockExportData, {
        createBackup: true
      });
      
      expect(result.success).toBe(true);
      expect(result.data.backupId).toBeDefined();
      // Should have created a backup export
      expect(mockDB.getAll).toHaveBeenCalled();
    });
  });

  describe('Cleanup Operations', () => {
    const oldSong = createMockCachedSong({ 
      id: 'old-song',
      cachedAt: Date.now() - (40 * 24 * 60 * 60 * 1000) // 40 days ago
    });
    
    const newSong = createMockCachedSong({ 
      id: 'new-song',
      cachedAt: Date.now() - (10 * 24 * 60 * 60 * 1000) // 10 days ago
    });

    const cleanupConfig: CleanupConfig = {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      maxItems: 100,
      preserveRecent: true,
      dryRun: false
    };

    it('should clean up old items', async () => {
      mockDB.getAll.mockResolvedValueOnce([oldSong, newSong]);
      mockDB.delete.mockResolvedValue(true);

      const result = await offlineStorage.cleanup(cleanupConfig);
      
      expect(result.success).toBe(true);
      expect(result.data.deletedItems.songs).toBe(1);
      expect(mockDB.delete).toHaveBeenCalledWith('songs', 'old-song');
      expect(mockDB.delete).not.toHaveBeenCalledWith('songs', 'new-song');
    });

    it('should perform dry run cleanup', async () => {
      mockDB.getAll.mockResolvedValueOnce([oldSong, newSong]);

      const result = await offlineStorage.cleanup({ 
        ...cleanupConfig, 
        dryRun: true 
      });
      
      expect(result.success).toBe(true);
      expect(result.data.wouldDelete.songs).toBe(1);
      expect(mockDB.delete).not.toHaveBeenCalled();
    });

    it('should respect maximum item limits', async () => {
      const manySongs = Array.from({ length: 150 }, (_, i) => 
        createMockCachedSong({ 
          id: `song-${i}`,
          cachedAt: Date.now() - (i * 60 * 1000) 
        })
      );
      mockDB.getAll.mockResolvedValueOnce(manySongs);
      mockDB.delete.mockResolvedValue(true);

      const result = await offlineStorage.cleanup({
        ...cleanupConfig,
        maxItems: 100,
        maxAge: Number.MAX_SAFE_INTEGER // Don't limit by age
      });
      
      expect(result.success).toBe(true);
      expect(result.data.deletedItems.songs).toBe(50); // Keep 100, delete 50
    });

    it('should clean up by storage size', async () => {
      const largeSongs = [
        createMockCachedSong({ id: 'song-1', documentSize: 50 * 1024 * 1024 }), // 50MB
        createMockCachedSong({ id: 'song-2', documentSize: 30 * 1024 * 1024 }), // 30MB
        createMockCachedSong({ id: 'song-3', documentSize: 10 * 1024 * 1024 })  // 10MB
      ];
      mockDB.getAll.mockResolvedValueOnce(largeSongs);
      mockDB.delete.mockResolvedValue(true);

      const result = await offlineStorage.cleanup({
        ...cleanupConfig,
        maxStorageSize: 60 * 1024 * 1024 // 60MB limit
      });
      
      expect(result.success).toBe(true);
      expect(result.data.deletedItems.songs).toBeGreaterThan(0);
      expect(result.data.freedSpace).toBeGreaterThan(0);
    });

    it('should preserve recently accessed items', async () => {
      const recentlyAccessedSong = createMockCachedSong({ 
        id: 'recent-song',
        cachedAt: Date.now() - (40 * 24 * 60 * 60 * 1000), // Old
        metadata: {
          ...createMockCachedSong().metadata,
          lastAccessed: Date.now() - (1 * 24 * 60 * 60 * 1000) // Recently accessed
        }
      });
      
      mockDB.getAll.mockResolvedValueOnce([oldSong, recentlyAccessedSong]);
      mockDB.delete.mockResolvedValue(true);

      const result = await offlineStorage.cleanup({
        ...cleanupConfig,
        preserveRecent: true
      });
      
      expect(result.success).toBe(true);
      expect(mockDB.delete).toHaveBeenCalledWith('songs', 'old-song');
      expect(mockDB.delete).not.toHaveBeenCalledWith('songs', 'recent-song');
    });

    it('should clean up orphaned data', async () => {
      const orphanedSetlist = createMockSetlist({ 
        id: 'orphaned-setlist',
        songIds: ['nonexistent-song-1', 'nonexistent-song-2']
      });
      
      mockDB.getAll
        .mockResolvedValueOnce([]) // No songs
        .mockResolvedValueOnce([orphanedSetlist]); // Setlist with missing songs
      
      mockDB.delete.mockResolvedValue(true);

      const result = await offlineStorage.cleanupOrphanedData();
      
      expect(result.success).toBe(true);
      expect(result.data.orphanedSetlists).toBe(1);
      expect(mockDB.delete).toHaveBeenCalledWith('setlists', 'orphaned-setlist');
    });

    it('should generate cleanup report', async () => {
      mockDB.getAll.mockResolvedValueOnce([oldSong, newSong]);

      const result = await offlineStorage.cleanup({
        ...cleanupConfig,
        generateReport: true
      });
      
      expect(result.success).toBe(true);
      expect(result.data.report).toBeDefined();
      expect(result.data.report).toEqual(expect.objectContaining({
        totalItemsBefore: 2,
        totalItemsAfter: 1,
        itemsDeleted: 1,
        spaceFreed: expect.any(Number)
      }));
    });

    it('should handle cleanup errors gracefully', async () => {
      mockDB.getAll.mockResolvedValueOnce([oldSong]);
      mockDB.delete.mockRejectedValueOnce(new Error('Delete failed'));

      const result = await offlineStorage.cleanup(cleanupConfig);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Cleanup failed');
    });

    it('should schedule automatic cleanup', async () => {
      const result = await offlineStorage.scheduleCleanup({
        interval: 24 * 60 * 60 * 1000, // Daily
        config: cleanupConfig
      });
      
      expect(result.success).toBe(true);
      expect(result.data.scheduledId).toBeDefined();
    });
  });
});