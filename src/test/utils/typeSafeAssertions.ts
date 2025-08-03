/**
 * @file typeSafeAssertions.ts
 * @description Type-safe assertion utilities to replace any-based test helpers
 */

import { expect } from 'vitest';
import type {
  TestFunctionMock,
  TestAssertionOptions,
  MockSearchFilters,
  MockSong,
  MockSearchResult,
  MockIndexedDBStore
} from '../types/test-fixtures.types';

/**
 * Type-safe mock function expectations
 */
export const expectMockFunction = <TArgs extends unknown[] = unknown[], TReturn = unknown>(
  mockFn: TestFunctionMock<TArgs, TReturn>
) => ({
  toHaveBeenCalled: () => {
    expect(mockFn).toHaveBeenCalled();
  },
  
  toHaveBeenCalledTimes: (times: number) => {
    expect(mockFn).toHaveBeenCalledTimes(times);
  },
  
  toHaveBeenCalledWith: (...args: TArgs) => {
    expect(mockFn).toHaveBeenCalledWith(...args);
  },
  
  toHaveBeenLastCalledWith: (...args: TArgs) => {
    expect(mockFn).toHaveBeenLastCalledWith(...args);
  },
  
  toHaveReturnedWith: (value: TReturn) => {
    expect(mockFn).toHaveReturnedWith(value);
  },
  
  toHaveResolvedWith: async (value: TReturn) => {
    await expect(mockFn()).resolves.toBe(value);
  },
  
  toHaveRejectedWith: async (error: Error | string) => {
    await expect(mockFn()).rejects.toThrow(error);
  }
});

/**
 * Type-safe async operation expectations
 */
export const expectAsync = {
  toResolve: async <T>(promise: Promise<T>): Promise<T> => {
    const result = expect(promise).resolves;
    return result as T;
  },
  
  toReject: async <T>(promise: Promise<T>): Promise<void> => {
    await expect(promise).rejects.toThrow();
  },
  
  toResolveWith: async <T>(promise: Promise<T>, expected: T): Promise<void> => {
    await expect(promise).resolves.toEqual(expected);
  },
  
  toRejectWith: async <T>(promise: Promise<T>, error: Error | string): Promise<void> => {
    if (typeof error === 'string') {
      await expect(promise).rejects.toThrow(error);
    } else {
      await expect(promise).rejects.toThrow(error);
    }
  }
};

/**
 * Type-safe storage operation expectations
 */
export const expectStorage = {
  toHaveItem: <T extends { id: string }>(storage: MockIndexedDBStore<T>, id: string) => {
    expect(storage.data.has(id)).toBe(true);
  },
  
  toNotHaveItem: <T extends { id: string }>(storage: MockIndexedDBStore<T>, id: string) => {
    expect(storage.data.has(id)).toBe(false);
  },
  
  toHaveStoredItem: <T extends { id: string }>(storage: MockIndexedDBStore<T>, expectedItem: Partial<T>) => {
    const item = storage.data.get(expectedItem.id!);
    expect(item).toMatchObject(expectedItem);
  },
  
  toHaveDeletedItem: <T extends { id: string }>(storage: MockIndexedDBStore<T>, id: string) => {
    expect(storage.data.has(id)).toBe(false);
    expectMockFunction(storage.delete).toHaveBeenCalledWith(id);
  },
  
  toBeEmpty: <T extends { id: string }>(storage: MockIndexedDBStore<T>) => {
    expect(storage.data.size).toBe(0);
  },
  
  toHaveSize: <T extends { id: string }>(storage: MockIndexedDBStore<T>, expectedSize: number) => {
    expect(storage.data.size).toBe(expectedSize);
  }
};

/**
 * Type-safe search result expectations
 */
export const expectSearchResult = (result: MockSearchResult) => ({
  toHaveSongs: (expectedCount: number) => {
    expect(result.songs).toHaveLength(expectedCount);
    expect(result.totalCount).toBeGreaterThanOrEqual(expectedCount);
  },
  
  toContainSong: (song: Partial<MockSong>) => {
    expect(result.songs).toContainEqual(expect.objectContaining(song));
  },
  
  toHaveValidPagination: () => {
    expect(result.currentPage).toBeGreaterThan(0);
    expect(result.totalPages).toBeGreaterThan(0);
    expect(result.currentPage).toBeLessThanOrEqual(result.totalPages);
  },
  
  toHaveFilters: () => {
    expect(result.availableFilters).toBeDefined();
    expect(result.availableFilters.keys).toBeDefined();
    expect(result.availableFilters.difficulties).toBeDefined();
  },
  
  toHaveExecutionTime: (maxMs?: number) => {
    expect(result.executionTime).toBeDefined();
    expect(result.executionTime!).toBeGreaterThan(0);
    if (maxMs) {
      expect(result.executionTime!).toBeLessThan(maxMs);
    }
  }
});

/**
 * Type-safe search filters validation
 */
export const expectSearchFilters = (filters: MockSearchFilters) => ({
  toBeValid: () => {
    if (filters.query !== undefined && filters.query !== null) {
      expect(typeof filters.query).toBe('string');
    }
    if (filters.page !== undefined && filters.page !== null) {
      expect(filters.page).toBeGreaterThan(0);
    }
    if (filters.limit !== undefined && filters.limit !== null) {
      expect(filters.limit).toBeGreaterThan(0);
      expect(filters.limit).toBeLessThanOrEqual(100);
    }
    if (filters.tempo !== undefined && filters.tempo !== null) {
      expect(filters.tempo).toHaveLength(2);
      expect(filters.tempo[0]).toBeLessThanOrEqual(filters.tempo[1]);
    }
  },
  
  toHaveValidDifficulty: () => {
    if (filters.difficulty !== undefined && filters.difficulty !== null) {
      const validDifficulties = ['beginner', 'intermediate', 'advanced'];
      filters.difficulty.forEach(diff => {
        expect(validDifficulties).toContain(diff);
      });
    }
  },
  
  toHaveValidSortBy: () => {
    if (filters.sortBy !== undefined && filters.sortBy !== null) {
      const validSortOptions = ['relevance', 'title', 'artist', 'date', 'popularity'];
      expect(validSortOptions).toContain(filters.sortBy);
    }
  }
});

/**
 * Type-safe song validation
 */
export const expectSong = (song: MockSong) => ({
  toBeValid: () => {
    expect(song.id).toBeDefined();
    expect(song.id).not.toBe('');
    expect(song.title).toBeDefined();
    expect(song.title).not.toBe('');
  },
  
  toHaveValidKey: () => {
    if (song.key !== undefined && song.key !== null) {
      const validKeys = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];
      expect(validKeys).toContain(song.key);
    }
  },
  
  toHaveValidTempo: () => {
    if (song.tempo !== undefined && song.tempo !== null) {
      expect(song.tempo).toBeGreaterThan(0);
      expect(song.tempo).toBeLessThan(300);
    }
  },
  
  toHaveValidDifficulty: () => {
    if (song.difficulty !== undefined && song.difficulty !== null) {
      const validDifficulties = ['beginner', 'intermediate', 'advanced'];
      expect(validDifficulties).toContain(song.difficulty);
    }
  }
});

/**
 * Type-safe performance expectations
 */
export const expectPerformance = {
  toComplete: async <T>(operation: () => Promise<T>, maxTimeMs: number): Promise<T> => {
    const startTime = Date.now();
    const result = await operation();
    const endTime = Date.now();
    const executionTime = endTime - startTime;
    
    expect(executionTime).toBeLessThan(maxTimeMs);
    return result;
  },
  
  toHandleLoad: async <T>(
    operation: (load: number) => Promise<T>,
    loads: number[],
    maxTimePerItem: number
  ): Promise<T[]> => {
    const results: T[] = [];
    
    for (const load of loads) {
      const startTime = Date.now();
      const result = await operation(load);
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      const timePerItem = executionTime / load;
      
      expect(timePerItem).toBeLessThan(maxTimePerItem);
      results.push(result);
    }
    
    return results;
  }
};

/**
 * Type-safe custom matcher for complex objects
 */
export const expectComplexObject = <T extends Record<string, unknown>>(
  received: T,
  matcher: (obj: T) => { pass: boolean; message: () => string }
) => {
  const result = matcher(received);
  if (!result.pass) {
    throw new Error(result.message());
  }
};

/**
 * Type-safe array expectations with detailed error messages
 */
export const expectArray = <T>(array: T[]) => ({
  toHaveUniqueItems: (keySelector?: (item: T) => string | number) => {
    if (keySelector) {
      const keys = array.map(keySelector);
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(keys.length);
    } else {
      const uniqueItems = new Set(array);
      expect(uniqueItems.size).toBe(array.length);
    }
  },
  
  toBeOrderedBy: <K extends keyof T>(property: K, direction: 'asc' | 'desc' = 'asc') => {
    for (let i = 1; i < array.length; i++) {
      const current = array[i][property];
      const previous = array[i - 1][property];
      
      if (direction === 'asc') {
        expect(current >= previous).toBe(true);
      } else {
        expect(current <= previous).toBe(true);
      }
    }
  },
  
  toAllMatch: (predicate: (item: T) => boolean) => {
    array.forEach((item) => {
      expect(predicate(item)).toBe(true);
    });
  }
});

/**
 * Utility function to wait for async operations in tests
 */
export const waitFor = async <T>(
  operation: () => T | Promise<T>,
  options: TestAssertionOptions = {}
): Promise<T> => {
  const { timeout = 5000, interval = 100 } = options;
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      const result = await operation();
      return result;
    } catch {
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }
  
  throw new Error(`Operation did not succeed within ${timeout}ms timeout`);
};

/**
 * Type-safe test data validator
 */
export const validateTestData = {
  searchFilters: (filters: unknown): filters is MockSearchFilters => {
    if (typeof filters !== 'object' || filters === null) return false;
    const f = filters as Record<string, unknown>;
    
    // Validate query
    if (f.query !== undefined && typeof f.query !== 'string' && f.query !== null) return false;
    
    // Validate arrays
    if (f.key !== undefined && !Array.isArray(f.key) && f.key !== null) return false;
    if (f.difficulty !== undefined && !Array.isArray(f.difficulty) && f.difficulty !== null) return false;
    
    // Validate numbers
    if (f.page !== undefined && typeof f.page !== 'number' && f.page !== null) return false;
    if (f.limit !== undefined && typeof f.limit !== 'number' && f.limit !== null) return false;
    
    return true;
  },
  
  song: (song: unknown): song is MockSong => {
    if (typeof song !== 'object' || song === null) return false;
    const s = song as Record<string, unknown>;
    
    return typeof s.id === 'string' && typeof s.title === 'string';
  }
};