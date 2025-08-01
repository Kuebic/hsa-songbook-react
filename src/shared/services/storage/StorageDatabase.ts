/**
 * @file StorageDatabase.ts
 * @description Low-level IndexedDB database operations and setup
 */

import { openDB } from 'idb';
import type { IDBPDatabase, IDBPTransaction } from 'idb';
import type { StorageConfig } from '../../types/storage.types';

/**
 * Handles low-level IndexedDB database operations
 */
export class StorageDatabase {
  private db: IDBPDatabase | null = null;
  private isInit = false;

  constructor(private config: StorageConfig) {}

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
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
      throw error;
    }
  }

  /**
   * Check if database is initialized
   */
  isInitialized(): boolean {
    return this.isInit && this.db !== null;
  }

  /**
   * Get the database instance
   */
  getDatabase(): IDBPDatabase | null {
    return this.db;
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

  /**
   * Get a single item from a store
   */
  async get<T>(storeName: string, key: string): Promise<T | undefined> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.get(storeName, key);
  }

  /**
   * Get all items from a store
   */
  async getAll<T>(storeName: string): Promise<T[]> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.getAll(storeName);
  }

  /**
   * Put an item into a store
   */
  async put<T>(storeName: string, item: T): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.put(storeName, item);
  }

  /**
   * Delete an item from a store
   */
  async delete(storeName: string, key: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.delete(storeName, key);
  }

  /**
   * Clear all items from a store
   */
  async clear(storeName: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.clear(storeName);
  }

  /**
   * Count items in a store
   */
  async count(storeName: string): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.count(storeName);
  }

  /**
   * Get items by index
   */
  async getByIndex<T>(storeName: string, indexName: string, key: string): Promise<T[]> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.getAllFromIndex(storeName, indexName, key);
  }

  /**
   * Execute a transaction
   */
  async transaction<T>(
    storeNames: string | string[],
    mode: 'readonly' | 'readwrite',
    callback: (tx: IDBPTransaction<unknown, string[], 'readonly' | 'readwrite'>) => Promise<T>
  ): Promise<T> {
    if (!this.db) throw new Error('Database not initialized');
    const tx = this.db.transaction(storeNames, mode);
    return await callback(tx);
  }

  /**
   * Setup database schema during upgrade
   */
  private setupDatabase(db: IDBPDatabase): void {
    // Create songs store
    if (!db.objectStoreNames.contains(this.config.stores.songs)) {
      const songsStore = db.createObjectStore(this.config.stores.songs, {
        keyPath: 'id'
      });
      
      // Create indexes for songs
      this.config.indexes.songs?.forEach(index => {
        songsStore.createIndex(index.name, index.keyPath, { 
          unique: index.unique ?? false 
        });
      });
    }

    // Create setlists store
    if (!db.objectStoreNames.contains(this.config.stores.setlists)) {
      const setlistsStore = db.createObjectStore(this.config.stores.setlists, {
        keyPath: 'id'
      });
      
      // Create indexes for setlists
      this.config.indexes.setlists?.forEach(index => {
        setlistsStore.createIndex(index.name, index.keyPath, { 
          unique: index.unique ?? false 
        });
      });
    }

    // Create preferences store
    if (!db.objectStoreNames.contains(this.config.stores.preferences)) {
      const preferencesStore = db.createObjectStore(this.config.stores.preferences, {
        keyPath: 'id'
      });
      
      // Create indexes for preferences
      this.config.indexes.preferences?.forEach(index => {
        preferencesStore.createIndex(index.name, index.keyPath, { 
          unique: index.unique ?? false 
        });
      });
    }

    // Create sync queue store
    if (!db.objectStoreNames.contains(this.config.stores.syncQueue)) {
      const syncStore = db.createObjectStore(this.config.stores.syncQueue, {
        keyPath: 'id'
      });
      
      // Create indexes for sync operations
      this.config.indexes.syncQueue?.forEach(index => {
        syncStore.createIndex(index.name, index.keyPath, { 
          unique: index.unique ?? false 
        });
      });
    }

    // Create storage stats store
    if (!db.objectStoreNames.contains(this.config.stores.storageStats)) {
      db.createObjectStore(this.config.stores.storageStats, {
        keyPath: 'id'
      });
    }
  }
}