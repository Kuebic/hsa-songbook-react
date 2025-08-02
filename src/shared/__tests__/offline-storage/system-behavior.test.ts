/**
 * @file system-behavior.test.ts
 * @description Tests for event handling and error scenarios in offline storage
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { StorageEvent } from '../../types/storage.types';
import { OfflineStorage } from '../../services/offlineStorage';
import { createMockIndexedDB, createMockCachedSong } from '../../../test/factories/typeSafeMockFactory';

vi.mock('idb', () => ({
  openDB: vi.fn(),
}));

describe('OfflineStorage - System Behavior', () => {
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

  describe('Event Handling', () => {
    it('should emit events on data changes', async () => {
      const eventListener = vi.fn();
      offlineStorage.addEventListener('dataChanged', eventListener);

      const mockSong = createMockCachedSong({ id: 'song-1' });
      await offlineStorage.saveSong(mockSong);

      expect(eventListener).toHaveBeenCalledWith(expect.objectContaining({
        type: 'dataChanged',
        operation: 'create',
        entityType: 'song',
        entityId: 'song-1'
      }));
    });

    it('should emit storage quota warning events', async () => {
      const eventListener = vi.fn();
      offlineStorage.addEventListener('quotaWarning', eventListener);

      // Mock storage quota check
      vi.spyOn(navigator.storage, 'estimate').mockResolvedValue({
        quota: 1000000,
        usage: 900000 // 90% usage
      });

      await offlineStorage.checkStorageQuota();

      expect(eventListener).toHaveBeenCalledWith(expect.objectContaining({
        type: 'quotaWarning',
        usage: 900000,
        quota: 1000000,
        percentUsed: 90
      }));
    });

    it('should emit sync events', async () => {
      const eventListener = vi.fn();
      offlineStorage.addEventListener('syncStarted', eventListener);
      offlineStorage.addEventListener('syncCompleted', eventListener);

      await offlineStorage.syncWithServer();

      expect(eventListener).toHaveBeenCalledWith(expect.objectContaining({
        type: 'syncStarted'
      }));
      expect(eventListener).toHaveBeenCalledWith(expect.objectContaining({
        type: 'syncCompleted',
        itemsSynced: expect.any(Number)
      }));
    });

    it('should emit error events', async () => {
      const eventListener = vi.fn();
      offlineStorage.addEventListener('error', eventListener);

      mockDB.put.mockRejectedValueOnce(new Error('Storage error'));
      const mockSong = createMockCachedSong({ id: 'song-1' });
      
      const result = await offlineStorage.saveSong(mockSong);

      expect(result.success).toBe(false);
      expect(eventListener).toHaveBeenCalledWith(expect.objectContaining({
        type: 'error',
        error: expect.any(Error),
        operation: 'saveSong'
      }));
    });

    it('should remove event listeners', async () => {
      const eventListener = vi.fn();
      offlineStorage.addEventListener('dataChanged', eventListener);
      offlineStorage.removeEventListener('dataChanged', eventListener);

      const mockSong = createMockCachedSong({ id: 'song-1' });
      await offlineStorage.saveSong(mockSong);

      expect(eventListener).not.toHaveBeenCalled();
    });

    it('should handle multiple listeners for the same event', async () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      
      offlineStorage.addEventListener('dataChanged', listener1);
      offlineStorage.addEventListener('dataChanged', listener2);

      const mockSong = createMockCachedSong({ id: 'song-1' });
      await offlineStorage.saveSong(mockSong);

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });

    it('should emit batch operation events', async () => {
      const eventListener = vi.fn();
      offlineStorage.addEventListener('batchOperationStarted', eventListener);
      offlineStorage.addEventListener('batchOperationCompleted', eventListener);

      const songs = [
        createMockCachedSong({ id: 'song-1' }),
        createMockCachedSong({ id: 'song-2' })
      ];

      await offlineStorage.saveSongsBatch(songs);

      expect(eventListener).toHaveBeenCalledWith(expect.objectContaining({
        type: 'batchOperationStarted',
        operation: 'saveSongsBatch',
        itemCount: 2
      }));
      expect(eventListener).toHaveBeenCalledWith(expect.objectContaining({
        type: 'batchOperationCompleted',
        operation: 'saveSongsBatch',
        successCount: 2,
        failureCount: 0
      }));
    });

    it('should emit cleanup events', async () => {
      const eventListener = vi.fn();
      offlineStorage.addEventListener('cleanupStarted', eventListener);
      offlineStorage.addEventListener('cleanupCompleted', eventListener);

      const oldSong = createMockCachedSong({ 
        id: 'old-song',
        cachedAt: Date.now() - (40 * 24 * 60 * 60 * 1000)
      });
      mockDB.getAll.mockResolvedValueOnce([oldSong]);
      mockDB.delete.mockResolvedValue(true);

      await offlineStorage.cleanup({
        maxAge: 30 * 24 * 60 * 60 * 1000,
        dryRun: false
      });

      expect(eventListener).toHaveBeenCalledWith(expect.objectContaining({
        type: 'cleanupStarted'
      }));
      expect(eventListener).toHaveBeenCalledWith(expect.objectContaining({
        type: 'cleanupCompleted',
        itemsDeleted: expect.any(Number)
      }));
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      const { openDB } = await import('idb');
      vi.mocked(openDB).mockRejectedValue(new Error('Cannot open database'));

      const newStorage = new OfflineStorage();
      const result = await newStorage.initialize();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot open database');
      expect(newStorage.isInitialized()).toBe(false);
    });

    it('should handle storage quota exceeded errors', async () => {
      mockDB.put.mockRejectedValueOnce(new DOMException('QuotaExceededError'));
      
      const mockSong = createMockCachedSong({ id: 'song-1' });
      const result = await offlineStorage.saveSong(mockSong);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Storage quota exceeded');
    });

    it('should handle transaction errors', async () => {
      mockDB.transaction.mockReturnValueOnce({
        store: {
          put: vi.fn().mockRejectedValue(new Error('Transaction failed')),
          get: vi.fn(),
          delete: vi.fn(),
        },
        done: Promise.reject(new Error('Transaction failed'))
      });

      const mockSong = createMockCachedSong({ id: 'song-1' });
      const result = await offlineStorage.saveSong(mockSong);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Transaction failed');
    });

    it('should handle corrupted data errors', async () => {
      mockDB.get.mockResolvedValueOnce({
        id: 'song-1',
        // Missing required fields - corrupted data
        corruptedField: 'invalid'
      });

      const result = await offlineStorage.getSong('song-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Corrupted data');
    });

    it('should handle version mismatch errors', async () => {
      const { openDB } = await import('idb');
      vi.mocked(openDB).mockRejectedValue(new DOMException('VersionError'));

      const newStorage = new OfflineStorage();
      const result = await newStorage.initialize();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Database version mismatch');
    });

    it('should retry failed operations', async () => {
      mockDB.put
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce('song-1'); // Success on third try

      const mockSong = createMockCachedSong({ id: 'song-1' });
      const result = await offlineStorage.saveSong(mockSong);

      expect(result.success).toBe(true);
      expect(mockDB.put).toHaveBeenCalledTimes(3);
    });

    it('should handle maximum retry attempts exceeded', async () => {
      mockDB.put.mockRejectedValue(new Error('Persistent error'));

      const mockSong = createMockCachedSong({ id: 'song-1' });
      const result = await offlineStorage.saveSong(mockSong);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Maximum retry attempts exceeded');
    });

    it('should handle concurrent operation conflicts', async () => {
      const mockSong = createMockCachedSong({ id: 'song-1' });
      
      // Simulate concurrent saves
      const promise1 = offlineStorage.saveSong(mockSong);
      const promise2 = offlineStorage.saveSong({ ...mockSong, title: 'Updated Title' });

      const [result1, result2] = await Promise.all([promise1, promise2]);

      expect(result1.success || result2.success).toBe(true);
      // One should succeed, the other might fail with conflict error
    });

    it('should handle database lock errors', async () => {
      mockDB.transaction.mockImplementationOnce(() => {
        throw new DOMException('Database is locked', 'InvalidStateError');
      });

      const mockSong = createMockCachedSong({ id: 'song-1' });
      const result = await offlineStorage.saveSong(mockSong);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Database is locked');
    });

    it('should handle invalid data validation errors', async () => {
      const invalidSong = {
        id: '', // Empty ID - invalid
        title: '', // Empty title - invalid
        // Missing required fields
      };

      const result = await offlineStorage.saveSong(invalidSong as unknown as CachedSong);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Validation failed');
    });

    it('should handle cleanup operation errors', async () => {
      mockDB.getAll.mockRejectedValueOnce(new Error('Cannot read data'));

      const result = await offlineStorage.cleanup({
        maxAge: 30 * 24 * 60 * 60 * 1000,
        dryRun: false
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cleanup failed');
    });

    it('should gracefully degrade when IndexedDB is unavailable', async () => {
      // Mock IndexedDB as completely unavailable
      vi.mocked(require('idb').openDB).mockImplementation(() => {
        throw new Error('IndexedDB not supported');
      });

      const newStorage = new OfflineStorage();
      const result = await newStorage.initialize();

      expect(result.success).toBe(false);
      expect(result.error).toContain('IndexedDB not supported');
      
      // Should still be able to work in memory-only mode
      expect(newStorage.isMemoryOnlyMode()).toBe(true);
    });

    it('should handle storage corruption recovery', async () => {
      mockDB.get.mockRejectedValueOnce(new DOMException('DataError'));
      
      const result = await offlineStorage.recoverFromCorruption();

      expect(result.success).toBe(true);
      expect(result.data.recoveryActions).toContain('database_recreated');
    });

    it('should log error details for debugging', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockDB.put.mockRejectedValueOnce(new Error('Test error'));

      const mockSong = createMockCachedSong({ id: 'song-1' });
      await offlineStorage.saveSong(mockSong);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('OfflineStorage error'),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Performance Monitoring', () => {
    it('should track operation performance', async () => {
      const mockSong = createMockCachedSong({ id: 'song-1' });
      const result = await offlineStorage.saveSong(mockSong);

      expect(result.success).toBe(true);
      expect(result.metadata?.performanceMetrics).toEqual(expect.objectContaining({
        operationType: 'saveSong',
        duration: expect.any(Number),
        timestamp: expect.any(Number)
      }));
    });

    it('should detect slow operations', async () => {
      const eventListener = vi.fn();
      offlineStorage.addEventListener('slowOperation', eventListener);

      // Mock a slow operation
      mockDB.put.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve('song-1'), 2000))
      );

      const mockSong = createMockCachedSong({ id: 'song-1' });
      await offlineStorage.saveSong(mockSong);

      expect(eventListener).toHaveBeenCalledWith(expect.objectContaining({
        type: 'slowOperation',
        operation: 'saveSong',
        duration: expect.any(Number)
      }));
    });

    it('should track memory usage', async () => {
      const memoryBefore = await offlineStorage.getMemoryUsage();
      
      const songs = Array.from({ length: 100 }, (_, i) => 
        createMockCachedSong({ id: `song-${i}` })
      );
      await offlineStorage.saveSongsBatch(songs);

      const memoryAfter = await offlineStorage.getMemoryUsage();
      
      expect(memoryAfter.usage).toBeGreaterThan(memoryBefore.usage);
    });
  });
});