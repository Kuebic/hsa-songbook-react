/**
 * @file storage.types.ts
 * @description TypeScript interfaces for IndexedDB offline storage schema
 */

import type { SyncOperation } from '../stores/sync-queue-store';

// Base storage metadata
export interface StorageMetadata {
  id: string;
  createdAt: number;
  updatedAt: number;
  syncStatus: 'synced' | 'pending' | 'conflict' | 'error';
  lastSyncedAt?: number;
  version: number;
}

// Cached song data structure
export interface CachedSong extends StorageMetadata {
  title: string;
  artist?: string;
  album?: string;
  key?: string;
  tempo?: number;
  timeSignature?: string;
  genre?: string;
  tags: string[];
  lyrics?: string;
  chordSheet?: string;
  chordProContent?: string;
  duration?: number; // in seconds
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  capo?: number;
  tuning?: string;
  notes?: string;
  
  // Metadata for caching
  fileSize: number;
  mimeType?: string;
  checksum?: string;
  
  // Usage tracking
  accessCount: number;
  lastAccessedAt: number;
  isFavorite: boolean;
  
  // Server relationship
  serverId?: string;
  serverVersion?: number;
}

// Setlist item structure
export interface CachedSetlistItem {
  songId: string;
  arrangementId?: string;
  transpose?: number; // Semitones to transpose
  notes?: string; // Performance notes
  order: number;
  
  // Optional cached song data for offline viewing
  cachedSong?: CachedSong;
}

// Cached setlist data structure
export interface CachedSetlist extends StorageMetadata {
  name: string;
  description?: string;
  songs: CachedSetlistItem[];
  tags: string[];
  
  // Metadata
  isPublic: boolean;
  shareToken?: string;
  estimatedDuration?: number; // in minutes
  
  // Usage tracking
  lastUsedAt?: number;
  usageCount: number;
  
  // Server relationship
  serverId?: string;
  serverVersion?: number;
  createdBy: string; // User ID
}

// User preferences structure
export interface UserPreferences extends StorageMetadata {
  userId: string;
  
  // Display preferences
  theme: 'light' | 'dark' | 'auto';
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  fontFamily: 'system' | 'serif' | 'mono';
  
  // Chord display preferences
  chordStyle: 'above' | 'inline' | 'block';
  showChordDiagrams: boolean;
  transposeDisplayKey: boolean;
  
  // Setlist preferences
  defaultSetlistView: 'grid' | 'list' | 'compact';
  showSongDurations: boolean;
  showTranspositions: boolean;
  
  // Offline preferences
  autoSync: boolean;
  syncOnlyOnWifi: boolean;
  maxCacheSize: number; // in MB
  cacheRetentionDays: number;
  preloadFavorites: boolean;
  
  // Notification preferences
  syncNotifications: boolean;
  updateNotifications: boolean;
  
  // Export preferences
  defaultExportFormat: 'json' | 'txt' | 'pdf';
  includeChordsInExport: boolean;
  includeLyricsInExport: boolean;
}

// Storage quota information
export interface StorageQuota {
  total: number; // Total available storage in bytes
  used: number; // Currently used storage in bytes
  available: number; // Available storage in bytes
  percentage: number; // Percentage used (0-100)
  warning: boolean; // True if usage is > 80%
  lastChecked: number; // Timestamp of last quota check
}

// Storage statistics
export interface StorageStats {
  totalSongs: number;
  totalSetlists: number;
  totalPreferences: number;
  totalSyncOperations: number;
  
  // Storage breakdown by type
  songsSize: number; // bytes
  setlistsSize: number; // bytes
  preferencesSize: number; // bytes
  syncQueueSize: number; // bytes
  
  // Cache statistics
  cacheHitRate: number; // percentage
  averageAccessTime: number; // milliseconds
  lastCleanup: number; // timestamp
  
  quota: StorageQuota;
}

// Export/Import data structure
export interface ExportData {
  version: string;
  exportedAt: number;
  exportedBy: string; // User ID
  
  // Data collections
  songs: CachedSong[];
  setlists: CachedSetlist[];
  preferences: UserPreferences;
  
  // Metadata
  totalItems: number;
  totalSize: number; // bytes
  checksum: string;
}

// Import result structure
export interface ImportResult {
  success: boolean;
  message: string;
  
  // Import statistics
  songsImported: number;
  setlistsImported: number;
  preferencesImported: number;
  errors: Array<{
    type: 'song' | 'setlist' | 'preferences';
    id: string;
    error: string;
  }>;
  
  // Conflicts and resolutions
  conflicts: Array<{
    type: 'song' | 'setlist';
    id: string;
    existingVersion: number;
    importedVersion: number;
    resolution: 'keep_existing' | 'overwrite' | 'create_new';
  }>;
}

// Database schema definition
export interface OfflineDB {
  // Object stores
  songs: CachedSong;
  setlists: CachedSetlist;
  preferences: UserPreferences;
  syncQueue: SyncOperation;
  
  // Metadata stores
  storageStats: StorageStats;
  
  // Version and migration tracking
  version: number;
  lastMigration: number;
}

// Database configuration
export interface StorageConfig {
  dbName: string;
  dbVersion: number;
  
  // Store names
  stores: {
    songs: string;
    setlists: string;
    preferences: string;
    syncQueue: string;
    storageStats: string;
  };
  
  // Index configurations
  indexes: {
    songs: Array<{ name: string; keyPath: string | string[]; unique?: boolean }>;
    setlists: Array<{ name: string; keyPath: string | string[]; unique?: boolean }>;
    preferences: Array<{ name: string; keyPath: string | string[]; unique?: boolean }>;
    syncQueue: Array<{ name: string; keyPath: string | string[]; unique?: boolean }>;
  };
  
  // Performance settings
  maxCacheSize: number; // MB
  cleanupInterval: number; // milliseconds
  quotaCheckInterval: number; // milliseconds
}

// Storage operation results
export interface StorageOperationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
  operation: 'create' | 'read' | 'update' | 'delete' | 'list' | 'search';
  affectedCount?: number;
}

// Type-safe storage operation results
export type StorageSuccessResult<T> = StorageOperationResult<T> & {
  success: true;
  data: T;
  error?: never;
};

export type StorageErrorResult = StorageOperationResult<never> & {
  success: false;
  data?: never;
  error: string;
};

// Search/filter options for queries
export interface StorageQueryOptions {
  // Filtering
  tags?: string[];
  syncStatus?: ('synced' | 'pending' | 'conflict' | 'error')[];
  dateRange?: {
    field: 'createdAt' | 'updatedAt' | 'lastAccessedAt' | 'lastUsedAt';
    start?: number;
    end?: number;
  };
  
  // Sorting
  sortBy?: 'createdAt' | 'updatedAt' | 'lastAccessedAt' | 'lastUsedAt' | 'name' | 'title';
  sortOrder?: 'asc' | 'desc';
  
  // Pagination
  limit?: number;
  offset?: number;
  
  // Search
  searchTerm?: string;
  searchFields?: string[];
}

// Cleanup configuration
export interface CleanupConfig {
  // Retention policies
  maxAge: number; // days
  maxUnusedAge: number; // days for unused items
  maxCacheSize: number; // MB
  
  // Thresholds
  quotaWarningThreshold: number; // percentage (default 80)
  quotaCriticalThreshold: number; // percentage (default 95)
  
  // Cleanup triggers
  autoCleanup: boolean;
  cleanupOnStart: boolean;
  cleanupInterval: number; // milliseconds
}

// Event types for storage observers
export type StorageEventType = 
  | 'song_added' | 'song_updated' | 'song_deleted'
  | 'setlist_added' | 'setlist_updated' | 'setlist_deleted'
  | 'preferences_updated'
  | 'quota_warning' | 'quota_critical'
  | 'sync_completed' | 'sync_failed'
  | 'cleanup_completed'
  | 'storage_error';

export interface StorageEvent<T = unknown> {
  type: StorageEventType;
  data: T;
  timestamp: number;
  userId?: string;
}

// Storage observer callback
export type StorageEventCallback<T = unknown> = (event: StorageEvent<T>) => void;

// Utility types for generic constraints
export type SearchableEntity = {
  name?: string;
  title?: string;
  description?: string;
  artist?: string;
  tags?: string[];
};

export type SortableEntity = {
  name?: string;
  title?: string;
  createdAt?: number;
  updatedAt?: number;
  lastAccessedAt?: number;
  lastUsedAt?: number;
};

// Combined type for query filtering
export type QueryableEntity = StorageMetadata & Partial<SearchableEntity & SortableEntity>;

// Valid storage entity types
export type ValidStorageEntity = CachedSong | CachedSetlist | UserPreferences;

// Generic constraint for storage operations
export type StorageEntityConstraint<T> = T extends ValidStorageEntity ? T : never;