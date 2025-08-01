/**
 * @file StorageOperations.ts
 * @description High-level CRUD operations for storage entities
 */

import type { 
  CachedSong, 
  CachedSetlist, 
  UserPreferences,
  StorageOperationResult,
  StorageQueryOptions,
  StorageConfig,
  StorageMetadata,
  StorageEvent
} from '../../types/storage.types';
import { StorageDatabase } from './StorageDatabase';

/**
 * High-level CRUD operations for storage entities
 */
export class StorageOperations {
  constructor(
    private db: StorageDatabase,
    private config: StorageConfig,
    private emit: <T = unknown>(event: string, data: T) => void
  ) {}

  // ===============================
  // SETLIST OPERATIONS
  // ===============================

  /**
   * Save a setlist to local storage
   */
  async saveSetlist(setlist: CachedSetlist): Promise<StorageOperationResult<CachedSetlist>> {
    if (!this.db.isInitialized()) {
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
    if (!this.db.isInitialized()) {
      return this.createErrorResult('Storage not initialized');
    }

    try {
      const setlist = await this.db.get<CachedSetlist>(this.config.stores.setlists, id);
      
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
    if (!this.db.isInitialized()) {
      return this.createErrorResult('Storage not initialized');
    }

    try {
      let setlists = await this.db.getAll<CachedSetlist>(this.config.stores.setlists);
      
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
    if (!this.db.isInitialized()) {
      return this.createErrorResult('Storage not initialized');
    }

    try {
      const existing = await this.db.get<CachedSetlist>(this.config.stores.setlists, id);
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
    if (!this.db.isInitialized()) {
      return this.createErrorResult('Storage not initialized');
    }

    try {
      const existing = await this.db.get<CachedSetlist>(this.config.stores.setlists, id);
      if (!existing) {
        return this.createErrorResult(`Setlist with id '${id}' not found`);
      }

      await this.db.delete(this.config.stores.setlists, id);
      
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
    if (!this.db.isInitialized()) {
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
      };

      await this.db.put(this.config.stores.songs, updatedSong);
      
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
    if (!this.db.isInitialized()) {
      return this.createErrorResult('Storage not initialized');
    }

    try {
      const song = await this.db.get<CachedSong>(this.config.stores.songs, id);
      
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
    if (!this.db.isInitialized()) {
      return this.createErrorResult('Storage not initialized');
    }

    try {
      let songs = await this.db.getAll<CachedSong>(this.config.stores.songs);
      
      // Apply filters
      songs = this.applyQueryFilters(songs, options);
      
      return this.createSuccessResult(songs, 'list', songs.length);
    } catch (error) {
      return this.handleStorageError(error, 'list');
    }
  }

  /**
   * Track song access for analytics
   */
  async trackSongAccess(id: string): Promise<StorageOperationResult<CachedSong>> {
    if (!this.db.isInitialized()) {
      return this.createErrorResult('Storage not initialized');
    }

    try {
      const song = await this.db.get<CachedSong>(this.config.stores.songs, id);
      if (!song) {
        return this.createErrorResult(`Song with id '${id}' not found`);
      }

      const updated: CachedSong = {
        ...song,
        lastAccessedAt: Date.now(),
        accessCount: (song.accessCount || 0) + 1,
      };

      await this.db.put(this.config.stores.songs, updated);
      
      return this.createSuccessResult(updated, 'update');
    } catch (error) {
      return this.handleStorageError(error, 'update');
    }
  }

  // ===============================
  // PREFERENCES OPERATIONS
  // ===============================

  /**
   * Save user preferences
   */
  async savePreferences(preferences: UserPreferences): Promise<StorageOperationResult<UserPreferences>> {
    if (!this.db.isInitialized()) {
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
   * Get user preferences
   */
  async getPreferences(userId: string): Promise<StorageOperationResult<UserPreferences>> {
    if (!this.db.isInitialized()) {
      return this.createErrorResult('Storage not initialized');
    }

    try {
      const preferences = await this.db.get<UserPreferences>(this.config.stores.preferences, userId);
      
      if (!preferences) {
        return this.createErrorResult(`Preferences for user '${userId}' not found`);
      }

      return this.createSuccessResult(preferences, 'read');
    } catch (error) {
      return this.handleStorageError(error, 'read');
    }
  }

  // ===============================
  // HELPER METHODS
  // ===============================

  /**
   * Apply query filters to results
   */
  private applyQueryFilters<T extends StorageMetadata>(items: T[], options: StorageQueryOptions): T[] {
    let filtered = [...items];

    // Filter by sync status
    if (options.syncStatus) {
      filtered = filtered.filter(item => item.syncStatus === options.syncStatus);
    }

    // Filter by date range
    if (options.dateRange) {
      const { from, to } = options.dateRange;
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.updatedAt);
        return (!from || itemDate >= from) && (!to || itemDate <= to);
      });
    }

    // Filter by tags
    if (options.tags && options.tags.length > 0) {
      filtered = filtered.filter(item => {
        const itemTags = (item as any).tags || [];
        return options.tags!.some(tag => itemTags.includes(tag));
      });
    }

    // Search by text
    if (options.search) {
      const searchTerm = options.search.toLowerCase();
      filtered = filtered.filter(item => {
        const searchFields = [
          (item as any).name,
          (item as any).title,
          (item as any).description,
          (item as any).artist
        ].filter(Boolean);
        
        return searchFields.some(field => 
          field.toLowerCase().includes(searchTerm)
        );
      });
    }

    // Sort results
    if (options.sortBy) {
      filtered.sort((a, b) => {
        const aValue = (a as any)[options.sortBy!];
        const bValue = (b as any)[options.sortBy!];
        
        if (aValue < bValue) return options.sortOrder === 'desc' ? 1 : -1;
        if (aValue > bValue) return options.sortOrder === 'desc' ? -1 : 1;
        return 0;
      });
    }

    // Apply pagination
    if (options.limit || options.offset) {
      const offset = options.offset || 0;
      const limit = options.limit || filtered.length;
      filtered = filtered.slice(offset, offset + limit);
    }

    return filtered;
  }

  /**
   * Create success result
   */
  private createSuccessResult<T>(
    data: T,
    operation: StorageOperationResult['operation'],
    count?: number
  ): StorageOperationResult<T> {
    return {
      success: true,
      data,
      operation,
      timestamp: Date.now(),
      ...(count !== undefined && { count })
    };
  }

  /**
   * Create error result
   */
  private createErrorResult<T = never>(error: string): StorageOperationResult<T> {
    return {
      success: false,
      error,
      operation: 'unknown',
      timestamp: Date.now()
    };
  }

  /**
   * Handle storage errors
   */
  private handleStorageError(error: unknown, operation: StorageOperationResult['operation']): StorageOperationResult<never> {
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