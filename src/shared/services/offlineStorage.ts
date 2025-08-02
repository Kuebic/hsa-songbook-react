/**
 * @file offlineStorage.ts
 * @description Core storage orchestrator that coordinates all storage operations
 */

import type { 
  CachedSong, 
  CachedSetlist, 
  UserPreferences, 
  StorageStats,
  StorageQuota,
  ExportData,
  ImportResult,
  StorageConfig,
  StorageOperationResult,
  StorageQueryOptions,
  CleanupConfig,
  StorageEventType,
  StorageEventCallback
} from '../types/storage.types';

import { StorageDatabase } from './storage/StorageDatabase';
import { StorageOperations } from './storage/StorageOperations';
import { StorageQuota as StorageQuotaService } from './storage/StorageQuota';
import { StorageEvents } from './storage/StorageEvents';
import { errorReporting } from './errorReporting';

/**
 * Core storage orchestrator that coordinates all storage operations
 * 
 * This class acts as a facade that delegates operations to specialized service classes:
 * - StorageDatabase: Low-level IndexedDB operations
 * - StorageOperations: High-level CRUD operations
 * - StorageQuotaService: Storage quota and cleanup management
 * - StorageEvents: Event handling system
 */
export class OfflineStorage {
  private database: StorageDatabase;
  private operations: StorageOperations;
  private quotaService: StorageQuotaService;
  private events: StorageEvents;
  
  private readonly config: StorageConfig = {
    dbName: 'hsa-songbook-offline',
    dbVersion: 1,
    stores: {
      songs: 'songs',
      setlists: 'setlists',
      preferences: 'preferences',
      syncQueue: 'sync_operations',
      storageStats: 'storage_stats',
    },
    indexes: {
      songs: [
        { name: 'by_title', keyPath: 'title' },
        { name: 'by_artist', keyPath: 'artist' },
        { name: 'by_tags', keyPath: 'tags', unique: false },
        { name: 'by_sync_status', keyPath: 'syncStatus' },
        { name: 'by_last_accessed', keyPath: 'lastAccessedAt' },
        { name: 'by_favorite', keyPath: 'isFavorite' },
        { name: 'by_server_id', keyPath: 'serverId' },
      ],
      setlists: [
        { name: 'by_name', keyPath: 'name' },
        { name: 'by_created_by', keyPath: 'createdBy' },
        { name: 'by_tags', keyPath: 'tags', unique: false },
        { name: 'by_sync_status', keyPath: 'syncStatus' },
        { name: 'by_last_used', keyPath: 'lastUsedAt' },
        { name: 'by_server_id', keyPath: 'serverId' },
        { name: 'by_public', keyPath: 'isPublic' },
      ],
      preferences: [
        { name: 'by_user_id', keyPath: 'userId', unique: true },
        { name: 'by_sync_status', keyPath: 'syncStatus' },
      ],
      syncQueue: [
        { name: 'by_status', keyPath: 'status' },
        { name: 'by_timestamp', keyPath: 'timestamp' },
        { name: 'by_type', keyPath: 'type' },
        { name: 'by_resource', keyPath: 'resource' },
      ],
    },
    maxCacheSize: 100, // MB
    cleanupInterval: 24 * 60 * 60 * 1000, // 24 hours
    quotaCheckInterval: 60 * 60 * 1000, // 1 hour
  };

  constructor() {
    // Initialize service classes
    this.events = new StorageEvents({ debug: process.env.NODE_ENV === 'development' });
    this.database = new StorageDatabase(this.config);
    // Create type-safe emit wrapper
    const emitWrapper = <T = unknown>(event: string, data: T) => {
      this.events.emit(event as StorageEventType, data);
    };
    
    this.operations = new StorageOperations(this.database, this.config, emitWrapper);
    this.quotaService = new StorageQuotaService(this.database, this.config, emitWrapper);

    // Auto-initialize on construction
    this.initialize().catch(this.handleError.bind(this));
  }

  /**
   * Private error handler for internal operations
   */
  private handleError(error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : 'Unknown storage error';
    
    // Report error using centralized service instead of console.error
    errorReporting.reportStorageError(
      `[OfflineStorage] ${errorMessage}`,
      error instanceof Error ? error : new Error(String(error)),
      {
        service: 'OfflineStorage',
        timestamp: Date.now(),
      }
    );
    
    // Emit error event for listeners
    this.events.emit('storage_error', { error: errorMessage, timestamp: Date.now() });
  }

  // ===============================
  // INITIALIZATION & CONFIG
  // ===============================

  /**
   * Initialize the IndexedDB database
   */
  async initialize(): Promise<void> {
    try {
      await this.database.initialize();
      await this.quotaService.initializeStorageStats();
    } catch (error) {
      // Use centralized error reporting instead of console.error
      errorReporting.reportStorageError(
        'Failed to initialize offline storage',
        error instanceof Error ? error : new Error(String(error)),
        {
          operation: 'initialize',
          service: 'OfflineStorage',
        }
      );
      throw error;
    }
  }

  /**
   * Check if storage is initialized
   */
  isInitialized(): boolean {
    return this.database.isInitialized();
  }

  /**
   * Get storage configuration
   */
  getConfig(): StorageConfig {
    return { ...this.config };
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    await this.database.close();
    this.events.destroy();
  }

  // ===============================
  // SETLIST OPERATIONS
  // ===============================

  /**
   * Save a setlist to local storage
   */
  async saveSetlist(setlist: CachedSetlist): Promise<StorageOperationResult<CachedSetlist>> {
    const result = await this.operations.saveSetlist(setlist);
    if (result.success) {
      await this.quotaService.updateStorageStats();
    }
    return result;
  }

  /**
   * Get a setlist by ID
   */
  async getSetlist(id: string): Promise<StorageOperationResult<CachedSetlist>> {
    return this.operations.getSetlist(id);
  }

  /**
   * Get setlists with query options
   */
  async getSetlists(options: StorageQueryOptions = {}): Promise<StorageOperationResult<CachedSetlist[]>> {
    return this.operations.getSetlists(options);
  }

  /**
   * Update a setlist
   */
  async updateSetlist(id: string, updates: Partial<CachedSetlist>): Promise<StorageOperationResult<CachedSetlist>> {
    const result = await this.operations.updateSetlist(id, updates);
    if (result.success) {
      await this.quotaService.updateStorageStats();
    }
    return result;
  }

  /**
   * Delete a setlist
   */
  async deleteSetlist(id: string): Promise<StorageOperationResult<boolean>> {
    const result = await this.operations.deleteSetlist(id);
    if (result.success) {
      await this.quotaService.updateStorageStats();
    }
    return result;
  }

  // ===============================
  // SONG OPERATIONS
  // ===============================

  /**
   * Save a song to local storage
   */
  async saveSong(song: CachedSong): Promise<StorageOperationResult<CachedSong>> {
    const result = await this.operations.saveSong(song);
    if (result.success) {
      await this.quotaService.updateStorageStats();
    }
    return result;
  }

  /**
   * Get a song by ID
   */
  async getSong(id: string): Promise<StorageOperationResult<CachedSong>> {
    return this.operations.getSong(id);
  }

  /**
   * Get songs with query options
   */
  async getSongs(options: StorageQueryOptions = {}): Promise<StorageOperationResult<CachedSong[]>> {
    return this.operations.getSongs(options);
  }

  /**
   * Track song access for statistics
   */
  async trackSongAccess(id: string): Promise<StorageOperationResult<CachedSong>> {
    return this.operations.trackSongAccess(id);
  }

  // ===============================
  // USER PREFERENCES
  // ===============================

  /**
   * Save user preferences
   */
  async savePreferences(preferences: UserPreferences): Promise<StorageOperationResult<UserPreferences>> {
    return this.operations.savePreferences(preferences);
  }

  /**
   * Get user preferences by user ID
   */
  async getPreferences(userId: string): Promise<StorageOperationResult<UserPreferences>> {
    return this.operations.getPreferences(userId);
  }

  /**
   * Update user preferences
   */
  async updatePreferences(userId: string, updates: Partial<UserPreferences>): Promise<StorageOperationResult<UserPreferences>> {
    const existingResult = await this.operations.getPreferences(userId);
    if (!existingResult.success) {
      return existingResult;
    }

    const existing = existingResult.data!;
    const updated: UserPreferences = {
      ...existing,
      ...updates,
      userId, // Ensure user ID cannot be changed
      updatedAt: Date.now(),
      version: existing.version + 1,
    };

    return this.operations.savePreferences(updated);
  }

  // ===============================
  // STORAGE STATISTICS
  // ===============================

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<StorageOperationResult<StorageStats>> {
    return this.quotaService.getStorageStats();
  }

  /**
   * Check storage quota
   */
  async checkStorageQuota(): Promise<StorageOperationResult<StorageQuota>> {
    return this.quotaService.checkStorageQuota();
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
    return this.quotaService.getStorageSizeBreakdown();
  }

  // ===============================
  // EXPORT/IMPORT
  // ===============================

  /**
   * Export all data
   */
  async exportData(userId: string): Promise<StorageOperationResult<ExportData>> {
    if (!this.database.isInitialized()) {
      return this.createErrorResult('Storage not initialized');
    }

    try {
      const [songsResult, setlistsResult, preferencesResult] = await Promise.all([
        this.operations.getSongs(),
        this.operations.getSetlists(), 
        this.operations.getPreferences(userId)
      ]);

      if (!songsResult.success || !setlistsResult.success) {
        return this.createErrorResult('Failed to retrieve data for export');
      }

      const songs = songsResult.data!;
      const setlists = setlistsResult.data!;
      const preferences = preferencesResult.success ? preferencesResult.data! : {} as UserPreferences;

      const exportData: ExportData = {
        version: '1.0.0',
        exportedAt: Date.now(),
        exportedBy: userId,
        songs,
        setlists,
        preferences,
        totalItems: songs.length + setlists.length + (preferencesResult.success ? 1 : 0),
        totalSize: songs.reduce((sum, song) => sum + (song.fileSize || 0), 0),
        checksum: this.generateChecksum(JSON.stringify({ songs, setlists, preferences })),
      };

      return this.createSuccessResult(exportData, 'read');
    } catch (error) {
      return this.handleStorageError(error, 'read');
    }
  }

  /**
   * Import data
   */
  async importData(
    data: ExportData, 
    options: { resolveConflicts?: 'keep_existing' | 'overwrite' | 'create_new' } = {}
  ): Promise<StorageOperationResult<ImportResult>> {
    if (!this.database.isInitialized()) {
      return this.createErrorResult('Storage not initialized');
    }

    const { resolveConflicts = 'keep_existing' } = options;
    const result: ImportResult = {
      success: true,
      message: 'Import completed successfully',
      songsImported: 0,
      setlistsImported: 0,
      preferencesImported: 0,
      errors: [],
      conflicts: [],
    };

    try {
      // Import songs
      for (const song of data.songs) {
        try {
          const existingResult = await this.operations.getSong(song.id);
          
          if (existingResult.success && existingResult.data!.version >= song.version) {
            result.conflicts.push({
              type: 'song',
              id: song.id,
              existingVersion: existingResult.data!.version,
              importedVersion: song.version,
              resolution: resolveConflicts,
            });
            
            if (resolveConflicts === 'keep_existing') {
              continue;
            }
          }

          const saveResult = await this.operations.saveSong(song);
          if (saveResult.success) {
            result.songsImported++;
          }
        } catch (error) {
          result.errors.push({
            type: 'song',
            id: song.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // Import setlists
      for (const setlist of data.setlists) {
        try {
          const existingResult = await this.operations.getSetlist(setlist.id);
          
          if (existingResult.success && existingResult.data!.version >= setlist.version) {
            result.conflicts.push({
              type: 'setlist',
              id: setlist.id,
              existingVersion: existingResult.data!.version,
              importedVersion: setlist.version,
              resolution: resolveConflicts,
            });
            
            if (resolveConflicts === 'keep_existing') {
              continue;
            }
          }

          const saveResult = await this.operations.saveSetlist(setlist);
          if (saveResult.success) {
            result.setlistsImported++;
          }
        } catch (error) {
          result.errors.push({
            type: 'setlist',
            id: setlist.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // Import preferences
      if (data.preferences && data.preferences.userId) {
        try {
          const saveResult = await this.operations.savePreferences(data.preferences);
          if (saveResult.success) {
            result.preferencesImported = 1;
          }
        } catch (error) {
          result.errors.push({
            type: 'preferences',
            id: data.preferences.userId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // Update storage stats
      await this.quotaService.updateStorageStats();

      return this.createSuccessResult(result, 'create');
    } catch (error) {
      result.success = false;
      result.message = error instanceof Error ? error.message : 'Import failed';
      return this.createSuccessResult(result, 'create');
    }
  }

  // ===============================
  // CLEANUP OPERATIONS
  // ===============================

  /**
   * Clean up old and unused data
   */
  async cleanup(config: CleanupConfig): Promise<StorageOperationResult<{ deletedSongs: number; deletedSetlists: number }>> {
    return this.quotaService.cleanup(config);
  }

  // ===============================
  // EVENT HANDLING
  // ===============================

  /**
   * Add event listener
   */
  on<T = unknown>(eventType: StorageEventType, callback: StorageEventCallback<T>): void {
    this.events.on(eventType, callback);
  }

  /**
   * Remove event listener
   */
  off<T = unknown>(eventType: StorageEventType, callback: StorageEventCallback<T>): void {
    this.events.off(eventType, callback);
  }

  /**
   * Add one-time event listener
   */
  once<T = unknown>(eventType: StorageEventType, callback: StorageEventCallback<T>): void {
    this.events.once(eventType, callback);
  }

  /**
   * Wait for a specific event
   */
  waitForEvent<T = unknown>(eventType: StorageEventType, timeout?: number): Promise<T> {
    return this.events.waitForEvent(eventType, timeout);
  }

  // ===============================
  // PRIVATE HELPER METHODS
  // ===============================

  /**
   * Create success result
   */
  private createSuccessResult<T>(
    data: T, 
    operation: StorageOperationResult['operation'],
    affectedCount?: number
  ): StorageOperationResult<T> {
    return {
      success: true,
      data,
      timestamp: Date.now(),
      operation,
      affectedCount,
    };
  }

  /**
   * Create error result
   */
  private createErrorResult<T = unknown>(error: string): StorageOperationResult<T> {
    return {
      success: false,
      error,
      timestamp: Date.now(),
      operation: 'read',
    };
  }

  /**
   * Handle storage errors
   */
  private handleStorageError<T = unknown>(error: unknown, operation: StorageOperationResult['operation']): StorageOperationResult<T> {
    let errorMessage = 'Unknown storage error';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Handle specific error types
      if (error.name === 'QuotaExceededError') {
        errorMessage = 'Storage quota exceeded. Please free up space or clear old data.';
        this.events.emit('quota_critical', { error: errorMessage });
      }
    }

    return {
      success: false,
      error: errorMessage,
      timestamp: Date.now(),
      operation,
    };
  }

  /**
   * Generate checksum for data validation
   */
  private generateChecksum(data: string): string {
    // Simple hash function - in production, use a proper crypto hash
    let hash = 0;
    if (data.length === 0) return hash.toString();
    
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }
}