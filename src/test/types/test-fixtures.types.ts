/**
 * @file test-fixtures.types.ts
 * @description Type-safe interfaces for test fixtures and mock objects
 */

import type { ISong } from '../../../server/models/types';
import type { SearchFilters, SearchResult, AvailableFilters } from '../../features/songs/types/search.types';
import type { CachedSong, CachedSetlist, UserPreferences } from '../../shared/types/storage.types';
import type { SyncOperation } from '../../shared/stores/sync-queue-store';

/**
 * Test-specific mock interfaces
 */

export interface MockSearchFilters extends Partial<SearchFilters> {
  // Allow null values for testing invalid states
  query?: string | null;
  key?: string[] | null;
  tempo?: [number, number] | null;
  difficulty?: ('beginner' | 'intermediate' | 'advanced')[] | null;
  themes?: string[] | null;
  source?: string[] | null;
  sortBy?: SearchFilters['sortBy'] | null;
  page?: number | null;
  limit?: number | null;
}

export interface MockSong extends Partial<ISong> {
  // Required fields for testing
  id: string;
  title: string;
  // Allow null values for testing edge cases
  artist?: string | null;
  key?: string | null;
  tempo?: number | null;
  difficulty?: ('beginner' | 'intermediate' | 'advanced') | null;
  tags?: string[] | null;
}

export interface MockCachedSong extends Partial<CachedSong> {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  syncStatus: 'synced' | 'pending' | 'conflict' | 'error';
  version: number;
  tags: string[];
  fileSize: number;
  accessCount: number;
  lastAccessedAt: number;
  isFavorite: boolean;
}

export interface MockSetlist extends Partial<CachedSetlist> {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  syncStatus: 'synced' | 'pending' | 'conflict' | 'error';
  version: number;
  songs: Array<{
    songId: string;
    order: number;
    transpose?: number;
    notes?: string;
  }>;
  tags: string[];
  isPublic: boolean;
  usageCount: number;
  createdBy: string;
}

export interface MockUserPreferences extends Partial<UserPreferences> {
  id: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
  syncStatus: 'synced' | 'pending' | 'conflict' | 'error';
  version: number;
  theme: 'light' | 'dark' | 'auto';
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  fontFamily: 'system' | 'serif' | 'mono';
  chordStyle: 'above' | 'inline' | 'block';
  showChordDiagrams: boolean;
  transposeDisplayKey: boolean;
}

export interface MockSearchResult extends Partial<SearchResult> {
  songs: MockSong[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  availableFilters: MockAvailableFilters;
  executionTime?: number;
}

export interface MockAvailableFilters extends Partial<AvailableFilters> {
  keys: Array<{ value: string; count: number; label?: string }>;
  difficulties: Array<{ value: string; count: number; label?: string }>;
  themes: Array<{ value: string; count: number; label?: string }>;
  sources: Array<{ value: string; count: number; label?: string }>;
  tempoRanges: Array<{ min: number; max: number; count: number; label?: string }>;
}

export interface MockSyncOperation extends Partial<SyncOperation> {
  id: string;
  type: 'create' | 'update' | 'delete';
  resource: 'song' | 'setlist' | 'preferences';
  resourceId: string;
  data: Record<string, unknown>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: number;
  updatedAt: number;
  retryCount: number;
  maxRetries: number;
  lastError?: string;
}

/**
 * Test storage operation types
 */
export interface TestStorageOperation<T = Record<string, unknown>> {
  storeName: string;
  operation: 'put' | 'get' | 'delete' | 'clear' | 'getAll' | 'getAllKeys';
  data?: T;
  id?: string;
  result?: T | T[] | string[] | boolean;
}

export interface MockIndexedDBStore<T = Record<string, unknown>> {
  data: Map<string, T>;
  put: (data: T & { id: string }) => Promise<string>;
  get: (id: string) => Promise<T | undefined>;
  getAll: () => Promise<T[]>;
  getAllKeys: () => Promise<string[]>;
  delete: (id: string) => Promise<boolean>;
  clear: () => Promise<void>;
  count: () => Promise<number>;
}

export interface MockIndexedDB {
  stores: Map<string, MockIndexedDBStore>;
  createStore: <T>(name: string) => MockIndexedDBStore<T>;
  getStore: <T>(name: string) => MockIndexedDBStore<T> | undefined;
  deleteStore: (name: string) => boolean;
  close: () => void;
}

/**
 * Test assertion types
 */
export interface TestAssertionOptions {
  timeout?: number;
  interval?: number;
  message?: string;
}

export interface TestExpectation<T> {
  toBe: (expected: T) => void;
  toEqual: (expected: T) => void;
  toContain: (expected: Partial<T>) => void;
  toHaveLength: (expected: number) => void;
  toBeDefined: () => void;
  toBeUndefined: () => void;
  toBeNull: () => void;
  toBeTruthy: () => void;
  toBeFalsy: () => void;
}

export interface AsyncTestExpectation<T> extends TestExpectation<T> {
  toResolve: () => Promise<void>;
  toReject: () => Promise<void>;
  toResolveWith: (expected: T) => Promise<void>;
  toRejectWith: (error: Error | string) => Promise<void>;
}

/**
 * Test utility types
 */
export type TestFunctionMock<TArgs extends unknown[] = unknown[], TReturn = unknown> = {
  (...args: TArgs): TReturn;
  mockReturnValue: (value: TReturn) => void;
  mockResolvedValue: (value: TReturn) => void;
  mockRejectedValue: (error: Error) => void;
  mockImplementation: (fn: (...args: TArgs) => TReturn) => void;
  mockClear: () => void;
  mockReset: () => void;
  mockRestore: () => void;
  calls: TArgs[];
  results: Array<{ type: 'return' | 'throw'; value: TReturn | Error }>;
};

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type TestOverrides<T> = DeepPartial<T> & {
  // Allow null values for testing invalid states
  [K in keyof T]?: T[K] | null;
};

/**
 * Validation test types
 */
export interface ValidationTestCase<TInput, TOutput> {
  name: string;
  input: TInput;
  expected: TOutput;
  shouldPass: boolean;
  description?: string;
}

export interface ValidationTestSuite<TInput, TOutput> {
  suiteName: string;
  cases: ValidationTestCase<TInput, TOutput>[];
  setup?: () => void | Promise<void>;
  tearDown?: () => void | Promise<void>;
}

/**
 * Performance test types
 */
export interface PerformanceTestMetrics {
  executionTime: number;
  memoryUsage?: number;
  operationsPerSecond?: number;
  throughput?: number;
}

export interface PerformanceTestCase<T> {
  name: string;
  operation: () => Promise<T> | T;
  expectedMetrics: Partial<PerformanceTestMetrics>;
  iterations?: number;
  warmupIterations?: number;
}

/**
 * Integration test types
 */
export interface IntegrationTestEnvironment {
  mockDatabase: MockIndexedDB;
  mockServiceWorker: TestFunctionMock;
  mockNetworkRequests: Map<string, TestFunctionMock>;
  cleanup: () => Promise<void>;
}

export interface IntegrationTestScenario<TResult> {
  name: string;
  setup: (env: IntegrationTestEnvironment) => Promise<void>;
  execute: (env: IntegrationTestEnvironment) => Promise<TResult>;
  verify: (result: TResult, env: IntegrationTestEnvironment) => Promise<void> | void;
  cleanup?: (env: IntegrationTestEnvironment) => Promise<void>;
}