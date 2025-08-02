/**
 * @file performance.test.ts
 * @description Tests for storage statistics, quota management, and performance monitoring
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { StorageStats, QuotaInfo } from '../../types/storage.types';
import { OfflineStorage } from '../../services/offlineStorage';
import { createMockIndexedDB, createMockCachedSong, createMockSetlist } from '../../../test/factories/typeSafeMockFactory';

vi.mock('idb', () => ({
  openDB: vi.fn(),
}));

// Mock performance API
Object.defineProperty(global, 'performance', {
  writable: true,
  value: {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByType: vi.fn(() => []),
  },
});

describe('OfflineStorage - Performance', () => {
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

  describe('Storage Statistics', () => {
    it('should calculate storage statistics', async () => {
      const songs = [
        createMockCachedSong({ id: 'song-1', documentSize: 1024 }),
        createMockCachedSong({ id: 'song-2', documentSize: 2048 })
      ];
      const setlists = [
        createMockCachedSetlist({ id: 'setlist-1' })
      ];

      mockDB.getAll
        .mockResolvedValueOnce(songs)
        .mockResolvedValueOnce(setlists)
        .mockResolvedValueOnce([]); // preferences

      const stats = await offlineStorage.getStorageStats();
      
      expect(stats.success).toBe(true);
      expect(stats.data).toEqual(expect.objectContaining({
        totalItems: 3,
        itemsByType: {
          songs: 2,
          setlists: 1,
          preferences: 0
        },
        totalSize: expect.any(Number),
        averageItemSize: expect.any(Number)
      }));
    });

    it('should calculate storage size by category', async () => {
      const largeSong = createMockCachedSong({ 
        id: 'large-song', 
        documentSize: 10 * 1024 * 1024 // 10MB
      });
      const smallSong = createMockCachedSong({ 
        id: 'small-song', 
        documentSize: 1024 // 1KB
      });

      mockDB.getAll.mockResolvedValueOnce([largeSong, smallSong]);

      const stats = await offlineStorage.getStorageStats();
      
      expect(stats.success).toBe(true);
      expect(stats.data.sizeByType.songs).toBe(10 * 1024 * 1024 + 1024);
    });

    it('should track storage growth over time', async () => {
      const songs = [createMockCachedSong({ id: 'song-1' })];
      mockDB.getAll.mockResolvedValueOnce(songs);

      const stats1 = await offlineStorage.getStorageStats();
      
      // Add more data
      const moreSongs = [...songs, createMockCachedSong({ id: 'song-2' })];
      mockDB.getAll.mockResolvedValueOnce(moreSongs);

      const stats2 = await offlineStorage.getStorageStats();
      
      expect(stats2.data.totalItems).toBeGreaterThan(stats1.data.totalItems);
    });

    it('should calculate cache hit ratio', async () => {
      // Mock cache access patterns
      await offlineStorage.getSong('song-1'); // Cache miss
      await offlineStorage.getSong('song-1'); // Cache hit
      await offlineStorage.getSong('song-2'); // Cache miss
      await offlineStorage.getSong('song-1'); // Cache hit

      const stats = await offlineStorage.getCacheStats();
      
      expect(stats.success).toBe(true);
      expect(stats.data.hitRatio).toBeCloseTo(0.5); // 2 hits out of 4 requests
    });

    it('should track most accessed items', async () => {
      const song1 = createMockCachedSong({ id: 'song-1' });
      const song2 = createMockCachedSong({ id: 'song-2' });
      
      mockDB.get
        .mockResolvedValueOnce(song1)
        .mockResolvedValueOnce(song1)
        .mockResolvedValueOnce(song2);

      // Access song-1 twice, song-2 once
      await offlineStorage.getSong('song-1');
      await offlineStorage.getSong('song-1');
      await offlineStorage.getSong('song-2');

      const stats = await offlineStorage.getAccessStats();
      
      expect(stats.success).toBe(true);
      expect(stats.data.mostAccessed[0]).toEqual(expect.objectContaining({
        id: 'song-1',
        accessCount: 2
      }));
    });

    it('should calculate data freshness metrics', async () => {
      const oldSong = createMockCachedSong({ 
        id: 'old-song',
        cachedAt: Date.now() - (7 * 24 * 60 * 60 * 1000) // 7 days old
      });
      const newSong = createMockCachedSong({ 
        id: 'new-song',
        cachedAt: Date.now() - (1 * 60 * 60 * 1000) // 1 hour old
      });

      mockDB.getAll.mockResolvedValueOnce([oldSong, newSong]);

      const stats = await offlineStorage.getDataFreshnessStats();
      
      expect(stats.success).toBe(true);
      expect(stats.data.averageAge).toBeGreaterThan(0);
      expect(stats.data.staleItems).toBe(1); // oldSong is stale
    });
  });

  describe('Quota Management', () => {
    beforeEach(() => {
      // Mock storage quota API
      vi.spyOn(navigator.storage, 'estimate').mockResolvedValue({
        quota: 100 * 1024 * 1024, // 100MB
        usage: 50 * 1024 * 1024   // 50MB
      });
    });

    it('should check storage quota', async () => {
      const quota = await offlineStorage.checkStorageQuota();
      
      expect(quota.success).toBe(true);
      expect(quota.data).toEqual(expect.objectContaining({
        quota: 100 * 1024 * 1024,
        usage: 50 * 1024 * 1024,
        available: 50 * 1024 * 1024,
        percentUsed: 50
      }));
    });

    it('should warn when approaching quota limit', async () => {
      vi.spyOn(navigator.storage, 'estimate').mockResolvedValue({
        quota: 100 * 1024 * 1024,
        usage: 90 * 1024 * 1024 // 90% used
      });

      const eventListener = vi.fn();
      offlineStorage.addEventListener('quotaWarning', eventListener);

      await offlineStorage.checkStorageQuota();

      expect(eventListener).toHaveBeenCalledWith(expect.objectContaining({
        type: 'quotaWarning',
        percentUsed: 90
      }));
    });

    it('should estimate space needed for operation', async () => {
      const largeSong = createMockCachedSong({ 
        id: 'large-song',
        documentSize: 20 * 1024 * 1024 // 20MB
      });

      const estimate = await offlineStorage.estimateSpaceNeeded('saveSong', largeSong);
      
      expect(estimate.success).toBe(true);
      expect(estimate.data.estimatedSize).toBeGreaterThan(20 * 1024 * 1024);
      expect(estimate.data.wouldExceedQuota).toBe(false);
    });

    it('should detect when operation would exceed quota', async () => {
      vi.spyOn(navigator.storage, 'estimate').mockResolvedValue({
        quota: 100 * 1024 * 1024,
        usage: 95 * 1024 * 1024 // 95% used
      });

      const largeSong = createMockCachedSong({ 
        id: 'large-song',
        documentSize: 10 * 1024 * 1024 // 10MB - would exceed quota
      });

      const estimate = await offlineStorage.estimateSpaceNeeded('saveSong', largeSong);
      
      expect(estimate.success).toBe(true);
      expect(estimate.data.wouldExceedQuota).toBe(true);
    });

    it('should suggest cleanup when quota is exceeded', async () => {
      vi.spyOn(navigator.storage, 'estimate').mockResolvedValue({
        quota: 100 * 1024 * 1024,
        usage: 98 * 1024 * 1024 // 98% used
      });

      const suggestions = await offlineStorage.getCleanupSuggestions();
      
      expect(suggestions.success).toBe(true);
      expect(suggestions.data.recommendations).toContain('cleanup_old_items');
      expect(suggestions.data.estimatedSpaceRecoverable).toBeGreaterThan(0);
    });

    it('should persist quota information', async () => {
      const quota = await offlineStorage.checkStorageQuota();
      
      expect(quota.success).toBe(true);
      expect(mockDB.put).toHaveBeenCalledWith('metadata', expect.objectContaining({
        type: 'quota_info',
        data: expect.objectContaining({
          quota: expect.any(Number),
          usage: expect.any(Number)
        })
      }));
    });
  });

  describe('Performance Monitoring', () => {
    it('should measure operation performance', async () => {
      const mockSong = createMockCachedSong({ id: 'song-1' });
      
      const result = await offlineStorage.saveSong(mockSong);
      
      expect(result.success).toBe(true);
      expect(result.metadata?.performanceMetrics).toEqual(expect.objectContaining({
        operationType: 'saveSong',
        duration: expect.any(Number),
        timestamp: expect.any(Number)
      }));
    });

    it('should track performance trends', async () => {
      const songs = Array.from({ length: 10 }, (_, i) => 
        createMockCachedSong({ id: `song-${i}` })
      );

      // Perform multiple operations
      for (const song of songs) {
        await offlineStorage.saveSong(song);
      }

      const trends = await offlineStorage.getPerformanceTrends();
      
      expect(trends.success).toBe(true);
      expect(trends.data.saveSong).toEqual(expect.objectContaining({
        averageDuration: expect.any(Number),
        operationCount: 10,
        trend: expect.any(String) // 'improving', 'stable', or 'degrading'
      }));
    });

    it('should detect performance degradation', async () => {
      const eventListener = vi.fn();
      offlineStorage.addEventListener('performanceDegradation', eventListener);

      // Mock slow operations
      mockDB.put.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve('song-1'), 3000))
      );

      const mockSong = createMockCachedSong({ id: 'song-1' });
      await offlineStorage.saveSong(mockSong);

      expect(eventListener).toHaveBeenCalledWith(expect.objectContaining({
        type: 'performanceDegradation',
        operation: 'saveSong',
        duration: expect.any(Number)
      }));
    });

    it('should optimize query performance', async () => {
      const songs = Array.from({ length: 1000 }, (_, i) => 
        createMockCachedSong({ 
          id: `song-${i}`,
          title: `Song ${i}`,
          key: i % 2 === 0 ? 'C' : 'G'
        })
      );
      mockDB.getAll.mockResolvedValueOnce(songs);

      const startTime = performance.now();
      const result = await offlineStorage.searchSongs({ key: 'C' });
      const endTime = performance.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
    });

    it('should cache frequently accessed data', async () => {
      const popularSong = createMockCachedSong({ id: 'popular-song' });
      mockDB.get.mockResolvedValue(popularSong);

      // Access the same song multiple times
      await offlineStorage.getSong('popular-song');
      await offlineStorage.getSong('popular-song');
      await offlineStorage.getSong('popular-song');

      // Should only call database once due to caching
      expect(mockDB.get).toHaveBeenCalledTimes(1);
    });

    it('should manage memory usage efficiently', async () => {
      const initialMemory = await offlineStorage.getMemoryUsage();
      
      // Load many items
      const songs = Array.from({ length: 100 }, (_, i) => 
        createMockCachedSong({ id: `song-${i}` })
      );
      mockDB.getAll.mockResolvedValueOnce(songs);
      await offlineStorage.getAllSongs();

      const afterLoadMemory = await offlineStorage.getMemoryUsage();
      expect(afterLoadMemory.usage).toBeGreaterThan(initialMemory.usage);

      // Clear cache
      await offlineStorage.clearMemoryCache();

      const afterClearMemory = await offlineStorage.getMemoryUsage();
      expect(afterClearMemory.usage).toBeLessThan(afterLoadMemory.usage);
    });

    it('should report performance metrics', async () => {
      // Perform various operations
      const song = createMockCachedSong({ id: 'song-1' });
      await offlineStorage.saveSong(song);
      await offlineStorage.getSong('song-1');
      await offlineStorage.getAllSongs();

      const metrics = await offlineStorage.getPerformanceReport();
      
      expect(metrics.success).toBe(true);
      expect(metrics.data).toEqual(expect.objectContaining({
        operationCounts: expect.objectContaining({
          saveSong: 1,
          getSong: 1,
          getAllSongs: 1
        }),
        averageDurations: expect.objectContaining({
          saveSong: expect.any(Number),
          getSong: expect.any(Number),
          getAllSongs: expect.any(Number)
        }),
        totalOperations: 3,
        reportGeneratedAt: expect.any(Number)
      }));
    });

    it('should benchmark against performance targets', async () => {
      const targets = {
        saveSong: 100, // 100ms target
        getSong: 50,   // 50ms target
        getAllSongs: 500 // 500ms target
      };

      const benchmark = await offlineStorage.benchmarkPerformance(targets);
      
      expect(benchmark.success).toBe(true);
      expect(benchmark.data.results).toEqual(expect.objectContaining({
        saveSong: expect.objectContaining({
          actualDuration: expect.any(Number),
          target: 100,
          meetsTarget: expect.any(Boolean)
        })
      }));
    });

    it('should provide performance optimization suggestions', async () => {
      // Simulate suboptimal performance
      mockDB.getAll.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve([]), 2000))
      );

      await offlineStorage.getAllSongs();

      const suggestions = await offlineStorage.getOptimizationSuggestions();
      
      expect(suggestions.success).toBe(true);
      expect(suggestions.data.suggestions).toContain('enable_indexing');
      expect(suggestions.data.estimatedImprovement).toBeGreaterThan(0);
    });
  });

  describe('Resource Management', () => {
    it('should manage connection pool', async () => {
      const connections = await offlineStorage.getConnectionInfo();
      
      expect(connections.success).toBe(true);
      expect(connections.data).toEqual(expect.objectContaining({
        activeConnections: expect.any(Number),
        maxConnections: expect.any(Number),
        poolUtilization: expect.any(Number)
      }));
    });

    it('should cleanup idle connections', async () => {
      await offlineStorage.cleanupIdleConnections();
      
      const connections = await offlineStorage.getConnectionInfo();
      expect(connections.data.idleConnections).toBe(0);
    });

    it('should monitor resource leaks', async () => {
      const initialResources = await offlineStorage.getResourceUsage();
      
      // Simulate resource-intensive operations
      const songs = Array.from({ length: 100 }, (_, i) => 
        createMockCachedSong({ id: `song-${i}` })
      );
      await offlineStorage.saveSongsBatch(songs);

      const finalResources = await offlineStorage.getResourceUsage();
      
      // Resources should be properly cleaned up
      expect(finalResources.data.unclosedConnections).toBe(0);
      expect(finalResources.data.memoryLeakDetected).toBe(false);
    });
  });
});