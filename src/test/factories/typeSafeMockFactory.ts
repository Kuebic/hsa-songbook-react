/**
 * @file typeSafeMockFactory.ts
 * @description Type-safe factory functions for creating test mocks without any types
 */

import { vi } from 'vitest';
import type {
  MockSearchFilters,
  MockSong,
  MockCachedSong,
  MockSetlist,
  MockUserPreferences,
  MockSearchResult,
  MockAvailableFilters,
  MockSyncOperation,
  MockIndexedDB,
  MockIndexedDBStore,
  TestStorageOperation,
  TestFunctionMock,
  TestOverrides
} from '../types/test-fixtures.types';

/**
 * Type-safe factory for MockSearchFilters
 */
export const createMockSearchFilters = (overrides: TestOverrides<MockSearchFilters> = {}): MockSearchFilters => ({
  query: 'amazing grace',
  key: ['G', 'C'],
  tempo: [60, 120],
  difficulty: ['beginner', 'intermediate'],
  themes: ['worship', 'hymn'],
  source: ['Traditional Hymnal'],
  sortBy: 'relevance',
  page: 1,
  limit: 20,
  ...overrides
});

/**
 * Type-safe factory for MockSong
 */
export const createMockSong = (overrides: TestOverrides<MockSong> = {}): MockSong => ({
  id: `song-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  title: 'Amazing Grace',
  artist: 'Traditional',
  key: 'G',
  tempo: 90,
  difficulty: 'beginner',
  tags: ['hymn', 'worship'],
  ...overrides
});

/**
 * Type-safe factory for multiple MockSongs
 */
export const createMockSongs = (count: number, baseOverrides: TestOverrides<MockSong> = {}): MockSong[] => {
  return Array.from({ length: count }, (_, index) => 
    createMockSong({
      ...baseOverrides,
      id: `song-${index + 1}`,
      title: `Song ${index + 1}`,
    })
  );
};

/**
 * Type-safe factory for MockCachedSong
 */
export const createMockCachedSong = (overrides: TestOverrides<MockCachedSong> = {}): MockCachedSong => {
  const now = Date.now();
  return {
    id: `cached-song-${now}`,
    title: 'Amazing Grace',
    createdAt: now,
    updatedAt: now,
    syncStatus: 'synced',
    version: 1,
    tags: ['hymn', 'worship'],
    fileSize: 1024,
    accessCount: 0,
    lastAccessedAt: now,
    isFavorite: false,
    ...overrides
  };
};

/**
 * Type-safe factory for MockSetlist
 */
export const createMockSetlist = (overrides: TestOverrides<MockSetlist> = {}): MockSetlist => {
  const now = Date.now();
  return {
    id: `setlist-${now}`,
    name: 'Sunday Morning Worship',
    createdAt: now,
    updatedAt: now,
    syncStatus: 'synced',
    version: 1,
    songs: [
      { songId: 'song-1', order: 1 },
      { songId: 'song-2', order: 2 }
    ],
    tags: ['worship', 'sunday'],
    isPublic: true,
    usageCount: 0,
    createdBy: 'user-1',
    ...overrides
  };
};

/**
 * Type-safe factory for MockUserPreferences
 */
export const createMockUserPreferences = (overrides: TestOverrides<MockUserPreferences> = {}): MockUserPreferences => {
  const now = Date.now();
  return {
    id: `preferences-${now}`,
    userId: 'user-1',
    createdAt: now,
    updatedAt: now,
    syncStatus: 'synced',
    version: 1,
    theme: 'light',
    fontSize: 'medium',
    fontFamily: 'system',
    chordStyle: 'above',
    showChordDiagrams: true,
    transposeDisplayKey: false,
    ...overrides
  };
};

/**
 * Type-safe factory for MockSearchResult
 */
export const createMockSearchResult = (overrides: TestOverrides<MockSearchResult> = {}): MockSearchResult => ({
  songs: createMockSongs(3),
  totalCount: 3,
  currentPage: 1,
  totalPages: 1,
  availableFilters: createMockAvailableFilters(),
  executionTime: 45,
  ...overrides
});

/**
 * Type-safe factory for MockAvailableFilters
 */
export const createMockAvailableFilters = (overrides: TestOverrides<MockAvailableFilters> = {}): MockAvailableFilters => ({
  keys: [
    { value: 'G', count: 5, label: 'G Major' },
    { value: 'C', count: 3, label: 'C Major' },
    { value: 'D', count: 2, label: 'D Major' }
  ],
  difficulties: [
    { value: 'beginner', count: 7, label: 'Beginner' },
    { value: 'intermediate', count: 3, label: 'Intermediate' }
  ],
  themes: [
    { value: 'worship', count: 8, label: 'Worship' },
    { value: 'hymn', count: 5, label: 'Hymn' }
  ],
  sources: [
    { value: 'Traditional Hymnal', count: 6 },
    { value: 'Modern Worship', count: 4 }
  ],
  tempoRanges: [
    { min: 60, max: 90, count: 4, label: 'Slow' },
    { min: 90, max: 120, count: 6, label: 'Medium' }
  ],
  ...overrides
});

/**
 * Type-safe factory for MockSyncOperation
 */
export const createMockSyncOperation = (overrides: TestOverrides<MockSyncOperation> = {}): MockSyncOperation => {
  const now = Date.now();
  return {
    id: `sync-op-${now}`,
    type: 'create',
    resource: 'song',
    resourceId: 'resource-1',
    data: { title: 'Test Song', artist: 'Test Artist' },
    status: 'pending',
    createdAt: now,
    updatedAt: now,
    retryCount: 0,
    maxRetries: 3,
    ...overrides
  };
};

/**
 * Type-safe IndexedDB store mock
 */
export const createMockIndexedDBStore = <T extends { id: string }>(): MockIndexedDBStore<T> => {
  const data = new Map<string, T>();

  return {
    data,
    put: vi.fn(async (item: T): Promise<string> => {
      data.set(item.id, { ...item, updatedAt: Date.now() } as T);
      return item.id;
    }),
    get: vi.fn(async (id: string): Promise<T | undefined> => {
      return data.get(id);
    }),
    getAll: vi.fn(async (): Promise<T[]> => {
      return Array.from(data.values());
    }),
    getAllKeys: vi.fn(async (): Promise<string[]> => {
      return Array.from(data.keys());
    }),
    delete: vi.fn(async (id: string): Promise<boolean> => {
      return data.delete(id);
    }),
    clear: vi.fn(async (): Promise<void> => {
      data.clear();
    }),
    count: vi.fn(async (): Promise<number> => {
      return data.size;
    })
  };
};

/**
 * Type-safe IndexedDB mock
 */
export const createMockIndexedDB = (): MockIndexedDB => {
  const stores = new Map<string, MockIndexedDBStore>();

  return {
    stores,
    createStore: <T extends { id: string }>(name: string): MockIndexedDBStore<T> => {
      const store = createMockIndexedDBStore<T>();
      stores.set(name, store as MockIndexedDBStore);
      return store;
    },
    getStore: <T extends { id: string }>(name: string): MockIndexedDBStore<T> | undefined => {
      return stores.get(name) as MockIndexedDBStore<T> | undefined;
    },
    deleteStore: (name: string): boolean => {
      return stores.delete(name);
    },
    close: vi.fn()
  };
};

/**
 * Type-safe test storage operation factory
 */
export const createTestStorageOperation = <T extends Record<string, unknown>>(
  overrides: Partial<TestStorageOperation<T>> = {}
): TestStorageOperation<T> => ({
  storeName: 'testStore',
  operation: 'put',
  ...overrides
});

/**
 * Type-safe function mock factory
 */
export const createTestFunctionMock = <TArgs extends unknown[] = unknown[], TReturn = unknown>(): TestFunctionMock<TArgs, TReturn> => {
  const mockFn = vi.fn() as TestFunctionMock<TArgs, TReturn>;
  
  // Add custom properties
  mockFn.calls = [];
  mockFn.results = [];
  
  return mockFn;
};

/**
 * Helper function to create invalid test data (for edge case testing)
 */
export const createInvalidSearchFilters = (): Record<string, unknown> => ({
  query: 123, // Invalid type
  key: 'not-array', // Invalid type
  tempo: 'invalid', // Invalid type
  difficulty: ['invalid-difficulty'], // Invalid value
  page: -1, // Invalid value
  limit: 0 // Invalid value
});

/**
 * Helper function to create edge case song data
 */
export const createEdgeCaseSong = (): Partial<MockSong> => ({
  id: '', // Empty ID
  title: '', // Empty title
  artist: null, // Null artist
  key: null, // Null key
  tempo: null, // Null tempo
  difficulty: null, // Null difficulty
  tags: null // Null tags
});

/**
 * Utility function to generate realistic test data with proper distributions
 */
export const generateRealisticTestSongs = (count: number): MockSong[] => {
  const keys = ['C', 'G', 'D', 'A', 'E', 'F', 'Bb', 'Eb'];
  const difficulties: Array<'beginner' | 'intermediate' | 'advanced'> = ['beginner', 'intermediate', 'advanced'];
  const themes = ['worship', 'hymn', 'contemporary', 'traditional', 'gospel', 'praise'];
  const artists = ['Traditional', 'Chris Tomlin', 'Hillsong', 'David Crowder', 'Matt Redman'];

  return Array.from({ length: count }, (_, index) => createMockSong({
    id: `realistic-song-${index + 1}`,
    title: `Song ${index + 1}`,
    artist: artists[index % artists.length],
    key: keys[index % keys.length],
    tempo: 60 + (index % 8) * 15, // Tempos from 60-165
    difficulty: difficulties[index % difficulties.length],
    tags: [themes[index % themes.length], themes[(index + 1) % themes.length]]
  }));
};

/**
 * Performance test helper - creates large datasets efficiently
 */
export const createLargeTestDataset = (size: number): MockSong[] => {
  const batchSize = 1000;
  const batches = Math.ceil(size / batchSize);
  const result: MockSong[] = [];

  for (let i = 0; i < batches; i++) {
    const currentBatchSize = Math.min(batchSize, size - i * batchSize);
    const batch = generateRealisticTestSongs(currentBatchSize).map((song, index) => ({
      ...song,
      id: `large-dataset-${i * batchSize + index + 1}`
    }));
    result.push(...batch);
  }

  return result;
};