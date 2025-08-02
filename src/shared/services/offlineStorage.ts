/**
 * @file offlineStorage.ts
 * @description Core IndexedDB storage service for offline data management
 */

import { openDB } from 'idb';
import type { IDBPDatabase } from 'idb';
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
  StorageEvent,
  StorageEventType,
  StorageEventCallback,
  StorageMetadata
} from '../types/storage.types';

export class OfflineStorage {
  private db: IDBPDatabase | null = null;
  private isInit = false;
  private eventListeners = new Map<StorageEventType, StorageEventCallback<any>[]>();
  
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
    // Auto-initialize on construction
    this.initialize().catch(console.error);
  }

  /**
   * Initialize the IndexedDB database
   */
  async initialize(): Promise<void> {
    if (this.isInit) return;

    try {
      this.db = await openDB(this.config.dbName, this.config.dbVersion, {
        upgrade: (db) => {
          this.setupDatabase(db);
        },
      });
      
      this.isInit = true;
      
      // Initialize storage stats if not exists
      await this.initializeStorageStats();
      
    } catch (error) {
      console.error('Failed to initialize offline storage:', error);
      throw error;
    }
  }

  /**
   * Check if storage is initialized
   */
  isInitialized(): boolean {
    return this.isInit && this.db !== null;
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
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isInit = false;
    }
  }

  // ===============================
  // SETLIST OPERATIONS
  // ===============================

  /**
   * Save a setlist to local storage
   */
  async saveSetlist(setlist: CachedSetlist): Promise<StorageOperationResult<CachedSetlist>> {
    if (!this.isInit || !this.db) {
      return this.createErrorResult('Storage not initialized');
    }

    try {
      const now = Date.now();
      const updatedSetlist: CachedSetlist = {
        ...setlist,
        updatedAt: now,
        // Ensure all required fields are present
        createdAt: setlist.createdAt || now,
        syncStatus: setlist.syncStatus || 'pending',
        version: setlist.version || 1,
      };

      await this.db.put(this.config.stores.setlists, updatedSetlist);
      
      // Update storage stats
      await this.updateStorageStats();
      
      // Emit event
      this.emit('setlist_added', updatedSetlist);
      
      return this.createSuccessResult(updatedSetlist, 'create');
    } catch (error) {
      return this.handleStorageError(error, 'create');
    }
  }

  /**
   * Get a setlist by ID
   */
  async getSetlist(id: string): Promise<StorageOperationResult<CachedSetlist>> {
    if (!this.isInit || !this.db) {
      return this.createErrorResult('Storage not initialized');
    }

    try {
      const setlist = await this.db.get(this.config.stores.setlists, id);
      
      if (!setlist) {
        return this.createErrorResult(`Setlist with id '${id}' not found`);
      }

      return this.createSuccessResult(setlist, 'read');
    } catch (error) {
      return this.handleStorageError(error, 'read');
    }
  }

  /**
   * Get setlists with query options
   */
  async getSetlists(options: StorageQueryOptions = {}): Promise<StorageOperationResult<CachedSetlist[]>> {
    if (!this.isInit || !this.db) {
      return this.createErrorResult('Storage not initialized');
    }

    try {
      let setlists = await this.db.getAll(this.config.stores.setlists);
      
      // Apply filters
      setlists = this.applyQueryFilters(setlists, options);
      
      return this.createSuccessResult(setlists, 'list', setlists.length);
    } catch (error) {
      return this.handleStorageError(error, 'list');
    }
  }

  /**
   * Update a setlist
   */
  async updateSetlist(id: string, updates: Partial<CachedSetlist>): Promise<StorageOperationResult<CachedSetlist>> {
    if (!this.isInit || !this.db) {
      return this.createErrorResult('Storage not initialized');
    }

    try {
      const existing = await this.db.get(this.config.stores.setlists, id);
      if (!existing) {
        return this.createErrorResult(`Setlist with id '${id}' not found`);
      }

      const updated: CachedSetlist = {
        ...existing,
        ...updates,
        id, // Ensure ID cannot be changed
        updatedAt: Date.now(),
        version: existing.version + 1,
      };

      await this.db.put(this.config.stores.setlists, updated);
      
      // Update storage stats
      await this.updateStorageStats();
      
      // Emit event
      this.emit('setlist_updated', updated);
      
      return this.createSuccessResult(updated, 'update');
    } catch (error) {
      return this.handleStorageError(error, 'update');
    }
  }

  /**
   * Delete a setlist
   */
  async deleteSetlist(id: string): Promise<StorageOperationResult<boolean>> {
    if (!this.isInit || !this.db) {
      return this.createErrorResult('Storage not initialized');
    }

    try {
      const existing = await this.db.get(this.config.stores.setlists, id);
      if (!existing) {
        return this.createErrorResult(`Setlist with id '${id}' not found`);
      }

      await this.db.delete(this.config.stores.setlists, id);
      
      // Update storage stats
      await this.updateStorageStats();
      
      // Emit event
      this.emit('setlist_deleted', { id });
      
      return this.createSuccessResult(true, 'delete');
    } catch (error) {
      return this.handleStorageError(error, 'delete');
    }
  }

  // ===============================
  // SONG OPERATIONS
  // ===============================

  /**
   * Save a song to local storage
   */
  async saveSong(song: CachedSong): Promise<StorageOperationResult<CachedSong>> {
    if (!this.isInit || !this.db) {
      return this.createErrorResult('Storage not initialized');
    }

    try {
      const now = Date.now();
      const updatedSong: CachedSong = {
        ...song,
        updatedAt: now,
        createdAt: song.createdAt || now,
        syncStatus: song.syncStatus || 'pending',
        version: song.version || 1,
        lastAccessedAt: song.lastAccessedAt || now,
        accessCount: song.accessCount || 0,
        isFavorite: song.isFavorite || false,
      };

      await this.db.put(this.config.stores.songs, updatedSong);
      
      // Update storage stats
      await this.updateStorageStats();
      
      // Emit event
      this.emit('song_added', updatedSong);
      
      return this.createSuccessResult(updatedSong, 'create');
    } catch (error) {
      return this.handleStorageError(error, 'create');
    }
  }

  /**
   * Get a song by ID
   */
  async getSong(id: string): Promise<StorageOperationResult<CachedSong>> {
    if (!this.isInit || !this.db) {
      return this.createErrorResult('Storage not initialized');
    }

    try {
      const song = await this.db.get(this.config.stores.songs, id);
      
      if (!song) {
        return this.createErrorResult(`Song with id '${id}' not found`);
      }

      return this.createSuccessResult(song, 'read');
    } catch (error) {
      return this.handleStorageError(error, 'read');
    }
  }

  /**
   * Get songs with query options
   */
  async getSongs(options: StorageQueryOptions = {}): Promise<StorageOperationResult<CachedSong[]>> {
    if (!this.isInit || !this.db) {
      return this.createErrorResult('Storage not initialized');
    }

    try {
      let songs = await this.db.getAll(this.config.stores.songs);
      
      // Apply filters
      songs = this.applyQueryFilters(songs, options);
      
      return this.createSuccessResult(songs, 'list', songs.length);
    } catch (error) {
      return this.handleStorageError(error, 'list');
    }
  }

  /**
   * Track song access for statistics
   */
  async trackSongAccess(id: string): Promise<StorageOperationResult<CachedSong>> {
    if (!this.isInit || !this.db) {
      return this.createErrorResult('Storage not initialized');
    }

    try {
      const song = await this.db.get(this.config.stores.songs, id);
      if (!song) {
        return this.createErrorResult(`Song with id '${id}' not found`);
      }

      const updated: CachedSong = {
        ...song,
        accessCount: song.accessCount + 1,
        lastAccessedAt: Date.now(),
        updatedAt: Date.now(),
      };

      await this.db.put(this.config.stores.songs, updated);
      
      return this.createSuccessResult(updated, 'update');
    } catch (error) {
      return this.handleStorageError(error, 'update');
    }
  }

  // ===============================
  // USER PREFERENCES
  // ===============================

  /**
   * Save user preferences
   */
  async savePreferences(preferences: UserPreferences): Promise<StorageOperationResult<UserPreferences>> {
    if (!this.isInit || !this.db) {
      return this.createErrorResult('Storage not initialized');
    }

    try {
      const now = Date.now();
      const updatedPreferences: UserPreferences = {
        ...preferences,
        updatedAt: now,
        createdAt: preferences.createdAt || now,
        syncStatus: preferences.syncStatus || 'pending',
        version: preferences.version || 1,
      };

      await this.db.put(this.config.stores.preferences, updatedPreferences);
      
      // Emit event
      this.emit('preferences_updated', updatedPreferences);
      
      return this.createSuccessResult(updatedPreferences, 'create');
    } catch (error) {
      return this.handleStorageError(error, 'create');
    }
  }

  /**
   * Get user preferences by user ID
   */
  async getPreferences(userId: string): Promise<StorageOperationResult<UserPreferences>> {
    if (!this.isInit || !this.db) {
      return this.createErrorResult('Storage not initialized');
    }

    try {
      const tx = this.db.transaction(this.config.stores.preferences, 'readonly');
      const index = tx.store.index('by_user_id');
      const preferences = await index.get(userId);
      
      if (!preferences) {
        return this.createErrorResult(`Preferences for user '${userId}' not found`);
      }

      return this.createSuccessResult(preferences, 'read');
    } catch (error) {
      return this.handleStorageError(error, 'read');
    }
  }

  /**
   * Update user preferences
   */
  async updatePreferences(userId: string, updates: Partial<UserPreferences>): Promise<StorageOperationResult<UserPreferences>> {
    if (!this.isInit || !this.db) {
      return this.createErrorResult('Storage not initialized');
    }

    try {
      const existingResult = await this.getPreferences(userId);
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

      await this.db.put(this.config.stores.preferences, updated);
      
      // Emit event
      this.emit('preferences_updated', updated);
      
      return this.createSuccessResult(updated, 'update');
    } catch (error) {
      return this.handleStorageError(error, 'update');
    }
  }

  // ===============================
  // STORAGE STATISTICS
  // ===============================

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<StorageOperationResult<StorageStats>> {
    if (!this.isInit || !this.db) {
      return this.createErrorResult('Storage not initialized');
    }

    try {
      // Get counts
      const [songCount, setlistCount, preferencesCount, syncCount] = await Promise.all([
        this.db.count(this.config.stores.songs),
        this.db.count(this.config.stores.setlists),
        this.db.count(this.config.stores.preferences),
        this.db.count(this.config.stores.syncQueue),
      ]);

      // Calculate sizes (rough estimation)
      const [songs, setlists] = await Promise.all([
        this.db.getAll(this.config.stores.songs),
        this.db.getAll(this.config.stores.setlists),
      ]);

      const songsSize = songs.reduce((total, song) => total + song.fileSize, 0);
      const setlistsSize = setlists.length * 1024; // Rough estimate
      const preferencesSize = preferencesCount * 2048; // Rough estimate
      const syncQueueSize = syncCount * 512; // Rough estimate

      // Get storage quota
      const quotaResult = await this.checkStorageQuota();
      const quota = quotaResult.success ? quotaResult.data! : {
        total: 0,
        used: 0,
        available: 0,
        percentage: 0,
        warning: false,
        lastChecked: Date.now(),
      };

      const stats: StorageStats = {
        totalSongs: songCount,
        totalSetlists: setlistCount,
        totalPreferences: preferencesCount,
        totalSyncOperations: syncCount,
        songsSize,
        setlistsSize,
        preferencesSize,
        syncQueueSize,
        cacheHitRate: 0, // Would be calculated based on actual usage
        averageAccessTime: 0, // Would be measured in real implementation
        lastCleanup: Date.now(),
        quota,
      };

      return this.createSuccessResult(stats, 'read');
    } catch (error) {
      return this.handleStorageError(error, 'read');
    }
  }

  /**
   * Check storage quota
   */
  async checkStorageQuota(): Promise<StorageOperationResult<StorageQuota>> {
    try {
      if (!navigator.storage?.estimate) {
        return this.createErrorResult('Storage estimation not supported');
      }

      const estimate = await navigator.storage.estimate();
      const total = estimate.quota || 0;
      const used = estimate.usage || 0;
      const available = total - used;
      const percentage = total > 0 ? Math.round((used / total) * 100) : 0;
      const warning = percentage >= 80;

      const quota: StorageQuota = {
        total,
        used,
        available,
        percentage,
        warning,
        lastChecked: Date.now(),
      };

      // Emit warning event if needed
      if (warning) {
        this.emit('quota_warning', quota);
      }

      return this.createSuccessResult(quota, 'read');
    } catch (error) {
      return this.handleStorageError(error, 'read');
    }
  }

  // ===============================
  // EXPORT/IMPORT
  // ===============================

  /**
   * Export all data
   */
  async exportData(userId: string): Promise<StorageOperationResult<ExportData>> {
    if (!this.isInit || !this.db) {
      return this.createErrorResult('Storage not initialized');
    }

    try {
      const [songs, setlists, preferences] = await Promise.all([
        this.db.getAll(this.config.stores.songs),
        this.db.getAll(this.config.stores.setlists),
        this.getPreferences(userId).then(result => result.success ? result.data : undefined),
      ]);

      const exportData: ExportData = {
        version: '1.0.0',
        exportedAt: Date.now(),
        exportedBy: userId,
        songs,
        setlists,
        preferences: preferences || {} as UserPreferences,
        totalItems: songs.length + setlists.length + (preferences ? 1 : 0),
        totalSize: songs.reduce((sum, song) => sum + song.fileSize, 0),
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
    if (!this.isInit || !this.db) {
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
      // Start transaction
      const tx = this.db.transaction([
        this.config.stores.songs,
        this.config.stores.setlists,
        this.config.stores.preferences,
      ], 'readwrite');

      // Import songs
      for (const song of data.songs) {
        try {
          const existing = await tx.objectStore(this.config.stores.songs).get(song.id);
          
          if (existing && existing.version >= song.version) {
            result.conflicts.push({
              type: 'song',
              id: song.id,
              existingVersion: existing.version,
              importedVersion: song.version,
              resolution: resolveConflicts,
            });
            
            if (resolveConflicts === 'keep_existing') {
              continue;
            }
          }

          await tx.objectStore(this.config.stores.songs).put(song);
          result.songsImported++;
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
          const existing = await tx.objectStore(this.config.stores.setlists).get(setlist.id);
          
          if (existing && existing.version >= setlist.version) {
            result.conflicts.push({
              type: 'setlist',
              id: setlist.id,
              existingVersion: existing.version,
              importedVersion: setlist.version,
              resolution: resolveConflicts,
            });
            
            if (resolveConflicts === 'keep_existing') {
              continue;
            }
          }

          await tx.objectStore(this.config.stores.setlists).put(setlist);
          result.setlistsImported++;
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
          await tx.objectStore(this.config.stores.preferences).put(data.preferences);
          result.preferencesImported = 1;
        } catch (error) {
          result.errors.push({
            type: 'preferences',
            id: data.preferences.userId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      await tx.done;

      // Update storage stats
      await this.updateStorageStats();

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
    if (!this.isInit || !this.db) {
      return this.createErrorResult('Storage not initialized');
    }

    try {
      const now = Date.now();
      const maxAgeMs = config.maxAge * 24 * 60 * 60 * 1000;
      const maxUnusedAgeMs = config.maxUnusedAge * 24 * 60 * 60 * 1000;

      let deletedSongs = 0;
      let deletedSetlists = 0;

      // Clean up old songs
      const songs = await this.db.getAll(this.config.stores.songs);
      for (const song of songs) {
        const age = now - song.createdAt;
        const unusedAge = now - song.lastAccessedAt;
        
        const shouldDelete = (
          !song.isFavorite && // Never delete favorites
          (age > maxAgeMs || unusedAge > maxUnusedAgeMs)
        );

        if (shouldDelete) {
          await this.db.delete(this.config.stores.songs, song.id);
          deletedSongs++;
        }
      }

      // Clean up old setlists
      const setlists = await this.db.getAll(this.config.stores.setlists);
      for (const setlist of setlists) {
        const age = now - setlist.createdAt;
        const unusedAge = setlist.lastUsedAt ? now - setlist.lastUsedAt : age;
        
        const shouldDelete = (
          !setlist.isPublic && // Keep public setlists
          (age > maxAgeMs || unusedAge > maxUnusedAgeMs)
        );

        if (shouldDelete) {
          await this.db.delete(this.config.stores.setlists, setlist.id);
          deletedSetlists++;
        }
      }

      // Update storage stats
      await this.updateStorageStats();

      // Emit cleanup event
      this.emit('cleanup_completed', { deletedSongs, deletedSetlists });

      return this.createSuccessResult({ deletedSongs, deletedSetlists }, 'delete');
    } catch (error) {
      return this.handleStorageError(error, 'delete');
    }
  }

  // ===============================
  // EVENT HANDLING
  // ===============================

  /**
   * Add event listener
   */
  on<T = unknown>(eventType: StorageEventType, callback: StorageEventCallback<T>): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(callback as StorageEventCallback<any>);
  }

  /**
   * Remove event listener
   */
  off<T = unknown>(eventType: StorageEventType, callback: StorageEventCallback<T>): void {
    const callbacks = this.eventListeners.get(eventType);
    if (callbacks) {
      const index = callbacks.indexOf(callback as StorageEventCallback<any>);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emit event
   */
  private emit<T = unknown>(eventType: StorageEventType, data: T): void {
    const callbacks = this.eventListeners.get(eventType);
    if (callbacks) {
      const event: StorageEvent<T> = {
        type: eventType,
        data,
        timestamp: Date.now(),
      };
      
      callbacks.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in storage event callback:', error);
        }
      });
    }
  }

  // ===============================
  // PRIVATE HELPER METHODS
  // ===============================

  /**
   * Setup database schema
   */
  private setupDatabase(db: IDBPDatabase): void {
    // Create object stores
    if (!db.objectStoreNames.contains(this.config.stores.songs)) {
      const songsStore = db.createObjectStore(this.config.stores.songs, { keyPath: 'id' });
      this.config.indexes.songs.forEach(index => {
        songsStore.createIndex(index.name, index.keyPath, { unique: index.unique });
      });
    }

    if (!db.objectStoreNames.contains(this.config.stores.setlists)) {
      const setlistsStore = db.createObjectStore(this.config.stores.setlists, { keyPath: 'id' });
      this.config.indexes.setlists.forEach(index => {
        setlistsStore.createIndex(index.name, index.keyPath, { unique: index.unique });
      });
    }

    if (!db.objectStoreNames.contains(this.config.stores.preferences)) {
      const preferencesStore = db.createObjectStore(this.config.stores.preferences, { keyPath: 'id' });
      this.config.indexes.preferences.forEach(index => {
        preferencesStore.createIndex(index.name, index.keyPath, { unique: index.unique });
      });
    }

    if (!db.objectStoreNames.contains(this.config.stores.syncQueue)) {
      const syncQueueStore = db.createObjectStore(this.config.stores.syncQueue, { keyPath: 'id' });
      this.config.indexes.syncQueue.forEach(index => {
        syncQueueStore.createIndex(index.name, index.keyPath, { unique: index.unique });
      });
    }

    if (!db.objectStoreNames.contains(this.config.stores.storageStats)) {
      db.createObjectStore(this.config.stores.storageStats, { keyPath: 'id' });
    }
  }

  /**
   * Initialize storage stats
   */
  private async initializeStorageStats(): Promise<void> {
    if (!this.db) return;
    
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
          cacheHitRate: 0,
          averageAccessTime: 0,
          lastCleanup: Date.now(),
          quota: {
            total: 0,
            used: 0,
            available: 0,
            percentage: 0,
            warning: false,
            lastChecked: Date.now(),
          },
        };
        
        await this.db.put(this.config.stores.storageStats, { id: 'main', ...initialStats });
      }
    } catch (error) {
      console.error('Failed to initialize storage stats:', error);
    }
  }

  /**
   * Update storage statistics
   */
  private async updateStorageStats(): Promise<void> {
    try {
      const statsResult = await this.getStorageStats();
      if (statsResult.success && this.db) {
        await this.db.put(this.config.stores.storageStats, { id: 'main', ...statsResult.data });
      }
    } catch (error) {
      console.error('Failed to update storage stats:', error);
    }
  }

  /**
   * Apply query filters to results
   */
  private applyQueryFilters<T extends StorageMetadata>(items: T[], options: StorageQueryOptions): T[] {
    let filtered = [...items];

    // Apply filters
    if (options.tags && options.tags.length > 0) {
      filtered = filtered.filter(item => {
        const itemTags = (item as T & { tags?: string[] }).tags || [];
        return options.tags!.some(tag => itemTags.includes(tag));
      });
    }

    if (options.syncStatus && options.syncStatus.length > 0) {
      filtered = filtered.filter(item => options.syncStatus!.includes(item.syncStatus));
    }

    if (options.dateRange) {
      const { field, start, end } = options.dateRange;
      filtered = filtered.filter(item => {
        const value = (item as Record<string, unknown>)[field];
        if (!value) return false;
        if (typeof value !== 'number') return false;
        if (start && value < start) return false;
        if (end && value > end) return false;
        return true;
      });
    }

    // Apply search
    if (options.searchTerm && options.searchFields) {
      const searchTerm = options.searchTerm.toLowerCase();
      filtered = filtered.filter(item => {
        return options.searchFields!.some(field => {
          const value = (item as Record<string, unknown>)[field];
          return value && value.toString().toLowerCase().includes(searchTerm);
        });
      });
    }

    // Apply sorting
    if (options.sortBy) {
      filtered.sort((a, b) => {
        const aValue = (a as Record<string, unknown>)[options.sortBy!];
        const bValue = (b as Record<string, unknown>)[options.sortBy!];
        
        let comparison = 0;
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.localeCompare(bValue);
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue;
        } else {
          // Fallback to string comparison
          const aStr = String(aValue);
          const bStr = String(bValue);
          comparison = aStr.localeCompare(bStr);
        }
        
        return options.sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    // Apply pagination
    if (options.offset || options.limit) {
      const start = options.offset || 0;
      const end = options.limit ? start + options.limit : undefined;
      filtered = filtered.slice(start, end);
    }

    return filtered;
  }

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
  private createErrorResult<T = never>(error: string): StorageOperationResult<T> {
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
  private handleStorageError(error: unknown, operation: StorageOperationResult['operation']): StorageOperationResult<never> {
    let errorMessage = 'Unknown storage error';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Handle specific error types
      if (error.name === 'QuotaExceededError') {
        errorMessage = 'Storage quota exceeded. Please free up space or clear old data.';
        this.emit('quota_critical', { error: errorMessage });
      }
    }

    return {
      success: false,
      error: errorMessage,
      timestamp: Date.now(),
      operation,
    } as StorageOperationResult<never>;
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