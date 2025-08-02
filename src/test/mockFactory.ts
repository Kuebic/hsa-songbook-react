/**
 * @file mockFactory.ts
 * @description Centralized factory for creating test mocks and fixtures
 */

import { vi } from 'vitest';
import type { 
  Song, 
  SearchResult, 
  SearchFilters,
  AvailableFilters 
} from '../features/songs/types/search.types';
import type { 
  CachedSong, 
  CachedSetlist, 
  UserPreferences,
  StorageMetadata 
} from '../shared/types/storage.types';

/**
 * Factory for creating mock Song objects
 */
export const createMockSong = (overrides: Partial<Song> = {}): Song => ({
  id: '1',
  title: 'Amazing Grace',
  artist: 'Traditional',
  slug: 'amazing-grace',
  key: 'G',
  tempo: 90,
  difficulty: 'beginner',
  themes: ['hymn', 'worship'],
  source: 'Traditional Hymnal',
  lyrics: 'Amazing grace, how sweet the sound that saved a wretch like me...',
  metadata: {
    isPublic: true,
    ratings: { average: 4.8, count: 120 },
    views: 1500
  },
  documentSize: 1024,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  ...overrides
});

/**
 * Factory for creating multiple mock songs
 */
export const createMockSongs = (count: number, overrides: Partial<Song>[] = []): Song[] => {
  return Array.from({ length: count }, (_, index) => 
    createMockSong({
      id: `song-${index + 1}`,
      title: `Song ${index + 1}`,
      slug: `song-${index + 1}`,
      ...overrides[index]
    })
  );
};

/**
 * Factory for creating mock SearchResult objects
 */
export const createMockSearchResult = (overrides: Partial<SearchResult> = {}): SearchResult => {
  const songs = overrides.songs || [createMockSong()];
  return {
    songs,
    totalCount: songs.length,
    currentPage: 1,
    totalPages: 1,
    availableFilters: createMockAvailableFilters(),
    executionTime: 150,
    ...overrides
  };
};

/**
 * Factory for creating mock AvailableFilters objects
 */
export const createMockAvailableFilters = (overrides: Partial<AvailableFilters> = {}): AvailableFilters => ({
  keys: [
    { value: 'G', label: 'G', count: 5 },
    { value: 'C', label: 'C', count: 3 },
    { value: 'D', label: 'D', count: 2 }
  ],
  difficulties: [
    { value: 'beginner', label: 'Beginner', count: 4 },
    { value: 'intermediate', label: 'Intermediate', count: 3 },
    { value: 'advanced', label: 'Advanced', count: 1 }
  ],
  themes: [
    { value: 'hymn', label: 'Hymn', count: 6 },
    { value: 'worship', label: 'Worship', count: 4 },
    { value: 'contemporary', label: 'Contemporary', count: 2 }
  ],
  sources: [
    { value: 'Traditional Hymnal', label: 'Traditional Hymnal', count: 5 },
    { value: 'CCLI', label: 'CCLI', count: 3 }
  ],
  tempoRange: [60, 180],
  ...overrides
});

/**
 * Factory for creating mock SearchFilters objects
 */
export const createMockSearchFilters = (overrides: Partial<SearchFilters> = {}): SearchFilters => ({
  query: '',
  key: [],
  tempo: undefined,
  difficulty: [],
  themes: [],
  source: [],
  sortBy: 'relevance',
  page: 1,
  limit: 20,
  ...overrides
});

/**
 * Factory for creating mock CachedSong objects
 */
export const createMockCachedSong = (overrides: Partial<CachedSong> = {}): CachedSong => ({
  id: 'cached-song-1',
  title: 'Cached Song',
  artist: 'Test Artist',
  slug: 'cached-song',
  key: 'G',
  tempo: 90,
  difficulty: 'beginner',
  themes: ['worship'],
  source: 'Local Cache',
  lyrics: 'Cached song lyrics...',
  metadata: {
    isPublic: true,
    ratings: { average: 4.5, count: 10 },
    views: 100
  },
  documentSize: 512,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  cachedAt: Date.now(),
  cacheVersion: 1,
  ...overrides
});

/**
 * Factory for creating mock CachedSetlist objects
 */
export const createMockCachedSetlist = (overrides: Partial<CachedSetlist> = {}): CachedSetlist => ({
  id: 'cached-setlist-1',
  name: 'Test Setlist',
  description: 'A test setlist',
  songIds: ['song-1', 'song-2'],
  metadata: {
    isPublic: true,
    tags: ['worship', 'sunday'],
    lastUsed: Date.now()
  },
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  cachedAt: Date.now(),
  cacheVersion: 1,
  ...overrides
});

/**
 * Factory for creating mock UserPreferences objects
 */
export const createMockUserPreferences = (overrides: Partial<UserPreferences> = {}): UserPreferences => ({
  theme: 'light',
  fontSize: 14,
  autoTranspose: false,
  defaultKey: 'C',
  displaySettings: {
    showChords: true,
    showLyrics: true,
    compactMode: false
  },
  cacheSettings: {
    maxCacheSize: 100 * 1024 * 1024, // 100MB
    autoCleanup: true,
    retentionDays: 30
  },
  ...overrides
});

/**
 * Factory for creating mock StorageMetadata objects
 */
export const createMockStorageMetadata = (overrides: Partial<StorageMetadata> = {}): StorageMetadata => ({
  id: 'metadata-1',
  type: 'song',
  size: 1024,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  version: 1,
  checksum: 'abc123',
  ...overrides
});

/**
 * Factory for creating mock IndexedDB database
 */
export const createMockIndexedDB = () => {
  const stores = new Map<string, Map<string, any>>();

  return {
    put: vi.fn((storeName: string, data: any) => {
      if (!stores.has(storeName)) stores.set(storeName, new Map());
      stores.get(storeName)!.set(data.id, { ...data, updatedAt: Date.now() });
      return Promise.resolve(data.id);
    }),
    get: vi.fn((storeName: string, id: string) => {
      const store = stores.get(storeName);
      return Promise.resolve(store?.get(id) || undefined);
    }),
    getAll: vi.fn((storeName: string) => {
      const store = stores.get(storeName);
      return Promise.resolve(store ? Array.from(store.values()) : []);
    }),
    getAllKeys: vi.fn((storeName: string) => {
      const store = stores.get(storeName);
      return Promise.resolve(store ? Array.from(store.keys()) : []);
    }),
    delete: vi.fn((storeName: string, id: string) => {
      const store = stores.get(storeName);
      const deleted = store?.delete(id) || false;
      return Promise.resolve(deleted);
    }),
    clear: vi.fn((storeName: string) => {
      stores.set(storeName, new Map());
      return Promise.resolve();
    }),
    count: vi.fn((storeName: string) => {
      const store = stores.get(storeName);
      return Promise.resolve(store?.size || 0);
    }),
    transaction: vi.fn(() => ({
      store: {
        put: vi.fn(),
        get: vi.fn(),
        delete: vi.fn(),
      },
      done: Promise.resolve(),
    })),
    objectStoreNames: {
      contains: vi.fn(() => true),
    },
    createObjectStore: vi.fn(() => ({
      createIndex: vi.fn(),
    })),
    close: vi.fn(),
    // Internal access for testing
    _stores: stores,
  };
};

/**
 * Factory for creating mock router utilities
 */
export const createMockRouter = () => {
  const mockSetSearchParams = vi.fn();
  const mockSearchParams = new URLSearchParams();

  return {
    setSearchParams: mockSetSearchParams,
    searchParams: mockSearchParams,
    clearSearchParams: () => {
      for (const key of Array.from(mockSearchParams.keys())) {
        mockSearchParams.delete(key);
      }
    }
  };
};

/**
 * Utility for creating mock event handlers
 */
export const createMockEventHandlers = () => ({
  onSongSelect: vi.fn(),
  onToggleFavorite: vi.fn(),
  onShareSong: vi.fn(),
  onPreviewSong: vi.fn(),
  onPageChange: vi.fn(),
  onPageSizeChange: vi.fn(),
  onRetry: vi.fn(),
  onSearch: vi.fn(),
  onFiltersChange: vi.fn(),
});

/**
 * Utility for creating mock component props
 */
export const createMockComponentProps = <T extends Record<string, any>>(
  defaults: T,
  overrides: Partial<T> = {}
): T => ({
  ...defaults,
  ...overrides
});