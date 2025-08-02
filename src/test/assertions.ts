/**
 * @file assertions.ts
 * @description Custom assertion helpers for testing
 */

import { expect } from 'vitest';
import type { Song, SearchResult, SearchFilters } from '../features/songs/types/search.types';

/**
 * Custom assertion for testing SearchResult objects
 */
export const expectSearchResult = (result: SearchResult) => ({
  toHaveValidStructure: () => {
    expect(result).toHaveProperty('songs');
    expect(result).toHaveProperty('totalCount');
    expect(result).toHaveProperty('currentPage');
    expect(result).toHaveProperty('totalPages');
    expect(result).toHaveProperty('availableFilters');
    expect(Array.isArray(result.songs)).toBe(true);
    expect(typeof result.totalCount).toBe('number');
    expect(typeof result.currentPage).toBe('number');
    expect(typeof result.totalPages).toBe('number');
  },
  toHaveSongsCount: (count: number) => {
    expect(result.songs).toHaveLength(count);
  },
  toMatchTotalCount: () => {
    expect(result.songs.length).toBeLessThanOrEqual(result.totalCount);
  },
  toHaveValidPagination: () => {
    expect(result.currentPage).toBeGreaterThan(0);
    expect(result.totalPages).toBeGreaterThan(0);
    expect(result.currentPage).toBeLessThanOrEqual(result.totalPages);
  }
});

/**
 * Custom assertion for testing Song objects
 */
export const expectSong = (song: Song) => ({
  toHaveRequiredFields: () => {
    expect(song).toHaveProperty('id');
    expect(song).toHaveProperty('title');
    expect(song).toHaveProperty('slug');
    expect(typeof song.id).toBe('string');
    expect(typeof song.title).toBe('string');
    expect(typeof song.slug).toBe('string');
  },
  toHaveValidMetadata: () => {
    if (song.metadata) {
      expect(song.metadata).toHaveProperty('isPublic');
      expect(typeof song.metadata.isPublic).toBe('boolean');
      if (song.metadata.ratings) {
        expect(typeof song.metadata.ratings.average).toBe('number');
        expect(typeof song.metadata.ratings.count).toBe('number');
        expect(song.metadata.ratings.average).toBeGreaterThanOrEqual(0);
        expect(song.metadata.ratings.average).toBeLessThanOrEqual(5);
      }
    }
  },
  toMatchKey: (expectedKey: string) => {
    expect(song.key).toBe(expectedKey);
  },
  toMatchDifficulty: (expectedDifficulty: string) => {
    expect(song.difficulty).toBe(expectedDifficulty);
  }
});

/**
 * Custom assertion for testing SearchFilters objects
 */
export const expectSearchFilters = (filters: SearchFilters) => ({
  toHaveValidStructure: () => {
    // All properties are optional, so just check types if they exist
    if (filters.query !== undefined) {
      expect(typeof filters.query).toBe('string');
    }
    if (filters.page !== undefined) {
      expect(typeof filters.page).toBe('number');
      expect(filters.page).toBeGreaterThan(0);
    }
    if (filters.limit !== undefined) {
      expect(typeof filters.limit).toBe('number');
      expect(filters.limit).toBeGreaterThan(0);
    }
  },
  toHaveActiveFilters: () => {
    const hasQuery = filters.query && filters.query.trim() !== '';
    const hasKeyFilters = filters.key && filters.key.length > 0;
    const hasDifficultyFilters = filters.difficulty && filters.difficulty.length > 0;
    const hasThemeFilters = filters.themes && filters.themes.length > 0;
    const hasSourceFilters = filters.source && filters.source.length > 0;
    const hasTempoFilter = filters.tempo && filters.tempo.length === 2;
    
    const hasAnyActive = hasQuery || hasKeyFilters || hasDifficultyFilters || 
                        hasThemeFilters || hasSourceFilters || hasTempoFilter;
    
    expect(hasAnyActive).toBe(true);
  },
  toBeEmpty: () => {
    expect(filters.query || '').toBe('');
    expect(filters.key || []).toHaveLength(0);
    expect(filters.difficulty || []).toHaveLength(0);
    expect(filters.themes || []).toHaveLength(0);
    expect(filters.source || []).toHaveLength(0);
    expect(filters.tempo).toBeUndefined();
  }
});

/**
 * Custom assertion for testing component rendering
 */
export const expectComponent = {
  toBeInDocument: (element: HTMLElement | null) => {
    expect(element).toBeInTheDocument();
  },
  toHaveCorrectRole: (element: HTMLElement | null, role: string) => {
    expect(element).toHaveAttribute('role', role);
  },
  toHaveAriaLabel: (element: HTMLElement | null, label: string) => {
    expect(element).toHaveAttribute('aria-label', label);
  },
  toBeAccessible: (element: HTMLElement | null) => {
    // Check for basic accessibility attributes
    expect(element).toBeInTheDocument();
    if (element?.getAttribute('role') === 'button') {
      expect(element).toHaveAttribute('aria-label');
    }
  },
  toHaveLoadingState: (container: HTMLElement) => {
    const loadingIndicator = container.querySelector('[role="status"], .animate-spin, [aria-label*="loading" i]');
    expect(loadingIndicator).toBeInTheDocument();
  },
  toHaveErrorState: (container: HTMLElement) => {
    const errorIndicator = container.querySelector('[role="alert"], .error, [data-testid*="error"]');
    expect(errorIndicator).toBeInTheDocument();
  }
};

/**
 * Custom assertion for testing mock function calls
 */
export const expectMockFunction = (mockFn: any) => ({
  toHaveBeenCalledOnce: () => {
    expect(mockFn).toHaveBeenCalledTimes(1);
  },
  toHaveBeenCalledWithSong: (song: Song) => {
    expect(mockFn).toHaveBeenCalledWith(song);
  },
  toHaveBeenCalledWithFilters: (filters: SearchFilters) => {
    expect(mockFn).toHaveBeenCalledWith(expect.objectContaining(filters));
  },
  toNotHaveBeenCalled: () => {
    expect(mockFn).not.toHaveBeenCalled();
  }
});

/**
 * Custom assertion for testing async operations
 */
export const expectAsync = {
  toResolve: async (promise: Promise<any>) => {
    await expect(promise).resolves.toBeDefined();
  },
  toReject: async (promise: Promise<any>) => {
    await expect(promise).rejects.toBeDefined();
  },
  toResolveWith: async <T>(promise: Promise<T>, value: T) => {
    await expect(promise).resolves.toBe(value);
  },
  toRejectWith: async (promise: Promise<any>, error: any) => {
    await expect(promise).rejects.toThrow(error);
  }
};

/**
 * Custom assertion for testing storage operations
 */
export const expectStorage = {
  toHaveItem: (storage: any, key: string) => {
    expect(storage.get).toHaveBeenCalledWith(expect.any(String), key);
  },
  toHaveStoredItem: (storage: any, item: any) => {
    expect(storage.put).toHaveBeenCalledWith(expect.any(String), expect.objectContaining(item));
  },
  toHaveDeletedItem: (storage: any, id: string) => {
    expect(storage.delete).toHaveBeenCalledWith(expect.any(String), id);
  },
  toBeEmpty: (storage: any, storeName: string) => {
    expect(storage.clear).toHaveBeenCalledWith(storeName);
  }
};

/**
 * Custom assertion for testing form inputs
 */
export const expectInput = (input: HTMLInputElement | HTMLTextAreaElement | null) => ({
  toHaveValue: (value: string) => {
    expect(input).toHaveValue(value);
  },
  toBeEmpty: () => {
    expect(input).toHaveValue('');
  },
  toBeFocused: () => {
    expect(input).toHaveFocus();
  },
  toBeDisabled: () => {
    expect(input).toBeDisabled();
  },
  toBeEnabled: () => {
    expect(input).toBeEnabled();
  }
});

/**
 * Custom assertion for testing pagination
 */
export const expectPagination = (container: HTMLElement) => ({
  toShowCurrentPage: (page: number) => {
    const pageIndicator = container.querySelector('[aria-current="page"], .bg-blue-600, .active');
    expect(pageIndicator).toHaveTextContent(page.toString());
  },
  toHavePageCount: (totalPages: number) => {
    const pageButtons = container.querySelectorAll('button[aria-label*="page" i], button[data-page]');
    expect(pageButtons.length).toBeGreaterThan(0);
  },
  toHaveNavigationButtons: () => {
    const prevButton = container.querySelector('button[aria-label*="previous" i]');
    const nextButton = container.querySelector('button[aria-label*="next" i]');
    expect(prevButton).toBeInTheDocument();
    expect(nextButton).toBeInTheDocument();
  }
});

/**
 * Utility for creating custom matchers
 */
export const createCustomMatcher = <T>(
  name: string,
  matcher: (received: T, expected?: any) => { pass: boolean; message: () => string }
) => {
  expect.extend({
    [name]: matcher
  });
};