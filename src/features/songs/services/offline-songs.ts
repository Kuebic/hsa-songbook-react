/**
 * @file offline-songs.ts
 * @description Service for managing offline song caching and retrieval
 */

import { openDB, type IDBPDatabase } from 'idb';
import type { ISong } from '../../../../server/models/types';

const DB_NAME = 'hsa-songbook-offline';
const DB_VERSION = 1;
const SONGS_STORE = 'songs';
const METADATA_STORE = 'metadata';

export interface CachedSong extends ISong {
  cachedAt: number;
  lastAccessed: number;
  size: number;
}

export interface CacheMetadata {
  totalSongs: number;
  totalSize: number;
  lastCleanup: number;
}

let db: IDBPDatabase | null = null;

const initDB = async (): Promise<IDBPDatabase> => {
  if (db) return db;
  
  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Songs store
      if (!db.objectStoreNames.contains(SONGS_STORE)) {
        const songStore = db.createObjectStore(SONGS_STORE, { keyPath: '_id' });
        songStore.createIndex('cachedAt', 'cachedAt');
        songStore.createIndex('lastAccessed', 'lastAccessed');
        songStore.createIndex('title', 'title');
        songStore.createIndex('artist', 'artist');
        songStore.createIndex('themes', 'themes', { multiEntry: true });
      }
      
      // Metadata store
      if (!db.objectStoreNames.contains(METADATA_STORE)) {
        db.createObjectStore(METADATA_STORE, { keyPath: 'key' });
      }
    },
  });
  
  return db;
};

// Calculate approximate size of an object in bytes
const calculateSize = (obj: unknown): number => {
  return new Blob([JSON.stringify(obj)]).size;
};

export class OfflineSongsService {
  private static instance: OfflineSongsService;
  private maxCacheSize = 50 * 1024 * 1024; // 50MB
  private maxSongs = 500;

  private constructor() {}

  static getInstance(): OfflineSongsService {
    if (!OfflineSongsService.instance) {
      OfflineSongsService.instance = new OfflineSongsService();
    }
    return OfflineSongsService.instance;
  }

  /**
   * Cache a song for offline access
   */
  async cacheSong(song: ISong): Promise<void> {
    const database = await initDB();
    const now = Date.now();
    
    const cachedSong: CachedSong = {
      ...song,
      cachedAt: now,
      lastAccessed: now,
      size: calculateSize(song),
    };

    await database.put(SONGS_STORE, cachedSong);
    await this.updateMetadata();
    
    // Check if we need to cleanup old cache
    await this.cleanupIfNeeded();
  }

  /**
   * Cache multiple songs
   */
  async cacheSongs(songs: ISong[]): Promise<void> {
    const database = await initDB();
    const tx = database.transaction(SONGS_STORE, 'readwrite');
    const now = Date.now();

    const promises = songs.map(song => {
      const cachedSong: CachedSong = {
        ...song,
        cachedAt: now,
        lastAccessed: now,
        size: calculateSize(song),
      };
      return tx.store.put(cachedSong);
    });

    await Promise.all(promises);
    await tx.done;
    
    await this.updateMetadata();
    await this.cleanupIfNeeded();
  }

  /**
   * Get a cached song by ID
   */
  async getCachedSong(id: string): Promise<CachedSong | null> {
    const database = await initDB();
    const song = await database.get(SONGS_STORE, id);
    
    if (song) {
      // Update last accessed time
      song.lastAccessed = Date.now();
      await database.put(SONGS_STORE, song);
    }
    
    return song || null;
  }

  /**
   * Get all cached songs
   */
  async getAllCachedSongs(): Promise<CachedSong[]> {
    const database = await initDB();
    return await database.getAll(SONGS_STORE);
  }

  /**
   * Search cached songs
   */
  async searchCachedSongs(query: string): Promise<CachedSong[]> {
    const database = await initDB();
    const allSongs = await database.getAll(SONGS_STORE);
    
    if (!query.trim()) return allSongs;
    
    const searchTerm = query.toLowerCase();
    return allSongs.filter(song => 
      song.title.toLowerCase().includes(searchTerm) ||
      song.artist?.toLowerCase().includes(searchTerm) ||
      song.lyrics?.toLowerCase().includes(searchTerm) ||
      song.themes?.some((theme: string) => theme.toLowerCase().includes(searchTerm))
    );
  }

  /**
   * Check if a song is cached
   */
  async isSongCached(id: string): Promise<boolean> {
    const database = await initDB();
    const song = await database.get(SONGS_STORE, id);
    return !!song;
  }

  /**
   * Get cached song IDs
   */
  async getCachedSongIds(): Promise<string[]> {
    const database = await initDB();
    const songs = await database.getAllKeys(SONGS_STORE);
    return songs as string[];
  }

  /**
   * Remove a song from cache
   */
  async removeCachedSong(id: string): Promise<void> {
    const database = await initDB();
    await database.delete(SONGS_STORE, id);
    await this.updateMetadata();
  }

  /**
   * Clear all cached songs
   */
  async clearAllCachedSongs(): Promise<void> {
    const database = await initDB();
    await database.clear(SONGS_STORE);
    await this.updateMetadata();
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    totalSongs: number;
    totalSize: number;
    totalSizeFormatted: string;
    oldestCacheDate: Date | null;
    newestCacheDate: Date | null;
  }> {
    const database = await initDB();
    const songs = await database.getAll(SONGS_STORE);
    
    const totalSongs = songs.length;
    const totalSize = songs.reduce((sum, song) => sum + (song.size || 0), 0);
    
    const cacheTimestamps = songs.map(song => song.cachedAt).filter(Boolean);
    const oldestCacheDate = cacheTimestamps.length > 0 ? new Date(Math.min(...cacheTimestamps)) : null;
    const newestCacheDate = cacheTimestamps.length > 0 ? new Date(Math.max(...cacheTimestamps)) : null;
    
    return {
      totalSongs,
      totalSize,
      totalSizeFormatted: this.formatBytes(totalSize),
      oldestCacheDate,
      newestCacheDate,
    };
  }

  /**
   * Clean up old cached songs if needed
   */
  private async cleanupIfNeeded(): Promise<void> {
    const stats = await this.getCacheStats();
    
    // Check if cleanup is needed
    if (stats.totalSongs <= this.maxSongs && stats.totalSize <= this.maxCacheSize) {
      return;
    }

    const database = await initDB();
    const songs = await database.getAll(SONGS_STORE);
    
    // Sort by last accessed time (oldest first)
    songs.sort((a, b) => a.lastAccessed - b.lastAccessed);
    
    // Remove songs until we're under limits
    let currentSize = stats.totalSize;
    let currentCount = stats.totalSongs;
    
    for (const song of songs) {
      if (currentCount <= this.maxSongs * 0.8 && currentSize <= this.maxCacheSize * 0.8) {
        break;
      }
      
      await database.delete(SONGS_STORE, song.id || song._id);
      currentSize -= song.size || 0;
      currentCount--;
    }
    
    await this.updateMetadata();
  }

  /**
   * Update cache metadata
   */
  private async updateMetadata(): Promise<void> {
    const database = await initDB();
    const stats = await this.getCacheStats();
    
    const metadata: CacheMetadata = {
      totalSongs: stats.totalSongs,
      totalSize: stats.totalSize,
      lastCleanup: Date.now(),
    };
    
    await database.put(METADATA_STORE, { key: 'cache-stats', ...metadata });
  }

  /**
   * Format bytes to human readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Export cached songs for backup
   */
  async exportCachedSongs(): Promise<string> {
    const songs = await this.getAllCachedSongs();
    return JSON.stringify(songs, null, 2);
  }

  /**
   * Import songs from backup
   */
  async importCachedSongs(jsonData: string): Promise<void> {
    try {
      const songs = JSON.parse(jsonData) as CachedSong[];
      await this.cacheSongs(songs);
    } catch (error) {
      throw new Error('Invalid backup data format');
    }
  }
}

// Export singleton instance
export const offlineSongsService = OfflineSongsService.getInstance();