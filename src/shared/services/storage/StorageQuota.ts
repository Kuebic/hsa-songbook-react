/**
 * @file StorageQuota.ts
 * @description Storage quota management and statistics
 */

import type { 
  StorageStats,
  StorageQuota as StorageQuotaType,
  StorageOperationResult,
  StorageConfig,
  CleanupConfig,
  CachedSong,
  CachedSetlist
} from '../../types/storage.types';
import { StorageDatabase } from './StorageDatabase';
import { errorReporting } from '../errorReporting';

/**
 * Manages storage quota, statistics, and cleanup operations
 */
export class StorageQuota {
  private db: StorageDatabase;
  private config: StorageConfig;
  private emit: <T = unknown>(event: string, data: T) => void;

  constructor(
    db: StorageDatabase,
    config: StorageConfig,
    emit: <T = unknown>(event: string, data: T) => void
  ) {
    this.db = db;
    this.config = config;
    this.emit = emit;
  }

  /**
   * Get comprehensive storage statistics
   */
  async getStorageStats(): Promise<StorageOperationResult<StorageStats>> {
    if (!this.db.isInitialized()) {
      return this.createErrorResult('Storage not initialized');
    }

    try {
      // Get existing stats or create default
      let stats = await this.db.get<StorageStats>(this.config.stores.storageStats, 'main');
      
      if (!stats) {
        // Initialize default stats
        stats = {
          totalSongs: 0,
          totalSetlists: 0,
          totalPreferences: 0,
          totalSyncOperations: 0,
          songsSize: 0,
          setlistsSize: 0,
          preferencesSize: 0,
          syncQueueSize: 0,
          quota: {
            total: 0,
            used: 0,
            available: 0,
            percentage: 0,
            warning: false,
            lastChecked: Date.now()
          },
          cacheHitRate: 0,
          averageAccessTime: 0,
          lastCleanup: Date.now()
        };
        
        await this.db.put(this.config.stores.storageStats, stats);
      }

      // Update with current counts
      const [songCount, setlistCount, prefCount, syncCount] = await Promise.all([
        this.db.count(this.config.stores.songs),
        this.db.count(this.config.stores.setlists),
        this.db.count(this.config.stores.preferences),
        this.db.count(this.config.stores.syncQueue)
      ]);

      const updatedStats: StorageStats = {
        ...stats,
        totalSongs: songCount,
        totalSetlists: setlistCount,
        totalPreferences: prefCount,
        totalSyncOperations: syncCount,
        // Ensure all required fields are defined
        songsSize: stats.songsSize || 0,
        setlistsSize: stats.setlistsSize || 0,
        preferencesSize: stats.preferencesSize || 0,
        syncQueueSize: stats.syncQueueSize || 0,
        cacheHitRate: stats.cacheHitRate || 0,
        averageAccessTime: stats.averageAccessTime || 0,
        lastCleanup: stats.lastCleanup || Date.now(),
        quota: stats.quota || {
          total: 0,
          used: 0,
          available: 0,
          percentage: 0,
          warning: false,
          lastChecked: Date.now()
        }
      };

      // Update the stored stats
      await this.db.put(this.config.stores.storageStats, updatedStats);

      return this.createSuccessResult(updatedStats, 'read');
    } catch (error) {
      return this.handleStorageError(error, 'read');
    }
  }

  /**
   * Check storage quota using Storage API
   */
  async checkStorageQuota(): Promise<StorageOperationResult<StorageQuotaType>> {
    try {
      if (!navigator.storage || !navigator.storage.estimate) {
        return this.createErrorResult('Storage API not supported');
      }

      const estimate = await navigator.storage.estimate();
      const quota = estimate.quota || 0;
      const used = estimate.usage || 0;
      const available = quota - used;
      const percentage = quota > 0 ? (used / quota) * 100 : 0;
      const warning = percentage > 80; // Warn at 80% usage

      const quotaInfo: StorageQuotaType = {
        total: quota,
        used,
        available,
        percentage,
        warning,
        lastChecked: Date.now()
      };

      // Update stats with quota info
      const statsResult = await this.getStorageStats();
      if (statsResult.success && statsResult.data) {
        const updatedStats = {
          ...statsResult.data,
          quota: quotaInfo,
          updatedAt: Date.now()
        };
        await this.db.put(this.config.stores.storageStats, updatedStats);
      }

      // Emit warning if quota is high
      if (warning) {
        this.emit('quota_warning', { percentage, available, total: quota });
      }

      return this.createSuccessResult(quotaInfo, 'read');
    } catch (error) {
      return this.handleStorageError(error, 'read');
    }
  }

  /**
   * Clean up old and unused data
   */
  async cleanup(config: CleanupConfig): Promise<StorageOperationResult<{ deletedSongs: number; deletedSetlists: number }>> {
    if (!this.db.isInitialized()) {
      return this.createErrorResult('Storage not initialized');
    }

    try {
      let deletedSongs = 0;
      let deletedSetlists = 0;
      const now = Date.now();

      // Clean up old songs
      if (config.maxAge) {
        const songs = await this.db.getAll(this.config.stores.songs);
        const oldSongs = songs.filter((song: CachedSong) => {
          const age = now - (song.lastAccessedAt || song.updatedAt);
          return age > config.maxAge &&
            !song.isFavorite && // Keep favorites
            song.syncStatus === 'synced'; // Only clean synced items
        });

        for (const song of oldSongs) {
          await this.db.delete(this.config.stores.songs, song.id);
          deletedSongs++;
        }
      }

      // Clean up old setlists
      if (config.maxAge) {
        const setlists = await this.db.getAll(this.config.stores.setlists);
        const oldSetlists = setlists.filter((setlist: CachedSetlist) => {
          const age = now - (setlist.lastUsedAt || setlist.updatedAt);
          return age > config.maxAge &&
            !setlist.isPublic && // Keep public setlists
            setlist.syncStatus === 'synced'; // Only clean synced items
        });

        for (const setlist of oldSetlists) {
          await this.db.delete(this.config.stores.setlists, setlist.id);
          deletedSetlists++;
        }
      }

      // Update cleanup timestamp
      const statsResult = await this.getStorageStats();
      if (statsResult.success && statsResult.data) {
        const updatedStats = {
          ...statsResult.data,
          lastCleanup: now,
          updatedAt: now
        };
        await this.db.put(this.config.stores.storageStats, updatedStats);
      }

      // Emit cleanup event
      const result = { deletedSongs, deletedSetlists };
      this.emit('cleanup_completed', result);

      return this.createSuccessResult(result, 'delete');
    } catch (error) {
      return this.handleStorageError(error, 'delete');
    }
  }

  /**
   * Update storage statistics
   */
  async updateStorageStats(): Promise<void> {
    try {
      // This will recalculate and update the stats
      await this.getStorageStats();
    } catch (error) {
      // Use centralized error reporting instead of console.error
      errorReporting.reportStorageError(
        'Failed to update storage stats',
        error instanceof Error ? error : new Error(String(error)),
        {
          service: 'StorageQuota',
          operation: 'updateStorageStats',
        }
      );
    }
  }

  /**
   * Initialize storage stats if they don't exist
   */
  async initializeStorageStats(): Promise<void> {
    try {
      const existing = await this.db.get(this.config.stores.storageStats, 'main');
      if (!existing) {
        const initialStats: StorageStats = {
          totalSongs: 0,
          totalSetlists: 0,
          totalPreferences: 0,
          totalSyncOperations: 0,
          songsSize: 0,
          setlistsSize: 0,
          preferencesSize: 0,
          syncQueueSize: 0,
          quota: {
            total: 0,
            used: 0,
            available: 0,
            percentage: 0,
            warning: false,
            lastChecked: Date.now()
          },
          cacheHitRate: 0,
          averageAccessTime: 0,
          lastCleanup: Date.now()
        };

        await this.db.put(this.config.stores.storageStats, initialStats);
      }
    } catch (error) {
      // Use centralized error reporting instead of console.error
      errorReporting.reportStorageError(
        'Failed to initialize storage stats',
        error instanceof Error ? error : new Error(String(error)),
        {
          service: 'StorageQuota',
          operation: 'initializeStorageStats',
        }
      );
    }
  }

  /**
   * Get storage size breakdown
   */
  async getStorageSizeBreakdown(): Promise<StorageOperationResult<{
    songs: number;
    setlists: number;
    preferences: number;
    syncQueue: number;
    total: number;
  }>> {
    if (!this.db.isInitialized()) {
      return this.createErrorResult('Storage not initialized');
    }

    try {
      // Calculate approximate sizes based on JSON serialization
      const [songs, setlists, preferences, syncQueue] = await Promise.all([
        this.db.getAll(this.config.stores.songs),
        this.db.getAll(this.config.stores.setlists),
        this.db.getAll(this.config.stores.preferences),
        this.db.getAll(this.config.stores.syncQueue)
      ]);

      const songsSize = this.calculateDataSize(songs);
      const setlistsSize = this.calculateDataSize(setlists);
      const preferencesSize = this.calculateDataSize(preferences);
      const syncQueueSize = this.calculateDataSize(syncQueue);
      const total = songsSize + setlistsSize + preferencesSize + syncQueueSize;

      const breakdown = {
        songs: songsSize,
        setlists: setlistsSize,
        preferences: preferencesSize,
        syncQueue: syncQueueSize,
        total
      };

      return this.createSuccessResult(breakdown, 'read');
    } catch (error) {
      return this.handleStorageError(error, 'read');
    }
  }

  /**
   * Calculate approximate data size in bytes
   */
  private calculateDataSize(data: unknown[]): number {
    try {
      const jsonString = JSON.stringify(data);
      return new Blob([jsonString]).size;
    } catch {
      // Fallback estimation
      return data.length * 1000; // Rough estimate of 1KB per item
    }
  }

  /**
   * Create success result
   */
  private createSuccessResult<T>(
    data: T,
    operation: StorageOperationResult['operation']
  ): StorageOperationResult<T> {
    return {
      success: true,
      data,
      operation,
      timestamp: Date.now()
    };
  }

  /**
   * Create error result
   */
  private createErrorResult<T = unknown>(error: string): StorageOperationResult<T> {
    return {
      success: false,
      error,
      operation: 'read',
      timestamp: Date.now()
    };
  }

  /**
   * Handle storage errors
   */
  private handleStorageError<T = unknown>(error: unknown, operation: StorageOperationResult['operation']): StorageOperationResult<T> {
    const errorMessage = error instanceof Error ? error.message : 'Unknown storage error';
    
    // Emit error event
    this.emit('storage_error', { error: errorMessage, operation, timestamp: Date.now() });
    
    return {
      success: false,
      error: errorMessage,
      operation,
      timestamp: Date.now()
    };
  }
}