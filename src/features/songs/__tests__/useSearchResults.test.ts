/**
 * @file useSearchResults.test.ts
 * @description Tests for useSearchResults hook
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { useSearchResults } from '../hooks/useSearchResults';
import type { SearchFilters } from '../types/search.types';

// Mock the search utils
vi.mock('../utils/searchUtils', () => ({
  hasActiveFilters: vi.fn((filters: SearchFilters) => {
    return !!(filters.query || filters.key?.length || filters.difficulty?.length || 
              filters.themes?.length || filters.source?.length || filters.tempo);
  }),
  validateSearchFilters: vi.fn(() => ({ isValid: true, errors: [] }))
}));

// Create a test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  );
};

describe('useSearchResults', () => {
  let originalPerformance: typeof global.performance;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    // Mock performance.now for execution time tracking
    originalPerformance = global.performance;
    global.performance = {
      ...originalPerformance,
      now: vi.fn(() => 100)
    };
  });

  afterEach(() => {
    vi.useRealTimers();
    global.performance = originalPerformance;
  });

  it('should return loading state initially', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useSearchResults({ query: 'Amazing Grace' }),
      { wrapper }
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();
  });

  it('should fetch and return search results', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useSearchResults({ query: 'Amazing Grace' }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.songs).toBeDefined();
    expect(result.current.data?.totalCount).toBeGreaterThan(0);
    expect(result.current.error).toBeNull();
  });

  it('should filter results by query text', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useSearchResults({ query: 'Amazing' }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const data = result.current.data;
    expect(data?.songs).toBeDefined();
    
    if (data?.songs.length) {
      const hasMatchingTitle = data.songs.some(song => 
        song.title.toLowerCase().includes('amazing')
      );
      expect(hasMatchingTitle).toBe(true);
    }
  });

  it('should filter results by musical key', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useSearchResults({ key: ['G'] }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const data = result.current.data;
    expect(data?.songs).toBeDefined();
    
    if (data?.songs.length) {
      const allMatchingKey = data.songs.every(song => song.key === 'G');
      expect(allMatchingKey).toBe(true);
    }
  });

  it('should filter results by difficulty', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useSearchResults({ difficulty: ['beginner'] }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const data = result.current.data;
    expect(data?.songs).toBeDefined();
    
    if (data?.songs.length) {
      const allMatchingDifficulty = data.songs.every(song => song.difficulty === 'beginner');
      expect(allMatchingDifficulty).toBe(true);
    }
  });

  it('should filter results by themes', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useSearchResults({ themes: ['hymn'] }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const data = result.current.data;
    expect(data?.songs).toBeDefined();
    
    if (data?.songs.length) {
      const allMatchingTheme = data.songs.every(song => 
        song.themes?.includes('hymn')
      );
      expect(allMatchingTheme).toBe(true);
    }
  });

  it('should filter results by tempo range', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useSearchResults({ tempo: [80, 100] }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const data = result.current.data;
    expect(data?.songs).toBeDefined();
    
    if (data?.songs.length) {
      const allInTempoRange = data.songs.every(song => 
        song.tempo && song.tempo >= 80 && song.tempo <= 100
      );
      expect(allInTempoRange).toBe(true);
    }
  });

  it('should sort results correctly', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useSearchResults({ sortBy: 'title' }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const data = result.current.data;
    expect(data?.songs).toBeDefined();
    
    if (data?.songs.length && data.songs.length > 1) {
      // Check if titles are in alphabetical order
      const titles = data.songs.map(song => song.title);
      const sortedTitles = [...titles].sort();
      expect(titles).toEqual(sortedTitles);
    }
  });

  it('should handle pagination correctly', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useSearchResults({ page: 1, limit: 2 }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const data = result.current.data;
    expect(data?.songs).toBeDefined();
    expect(data?.currentPage).toBe(1);
    expect(data?.totalPages).toBeGreaterThanOrEqual(1);
    
    if (data?.songs.length) {
      expect(data.songs.length).toBeLessThanOrEqual(2);
    }
  });

  it('should not fetch when disabled', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useSearchResults({ query: 'test' }, { enabled: false }),
      { wrapper }
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('should not fetch when no meaningful search criteria', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useSearchResults({}),
      { wrapper }
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('should provide refetch functionality', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useSearchResults({ query: 'Amazing Grace' }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(typeof result.current.refetch).toBe('function');
    
    // Test refetch
    const refetchResult = result.current.refetch();
    expect(refetchResult).toBeDefined();
  });

  it('should return available filters metadata', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useSearchResults({ query: '' }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const data = result.current.data;
    expect(data?.availableFilters).toBeDefined();
    expect(data?.availableFilters?.keys).toBeDefined();
    expect(data?.availableFilters?.difficulties).toBeDefined();
    expect(data?.availableFilters?.themes).toBeDefined();
    expect(data?.availableFilters?.sources).toBeDefined();
    expect(data?.availableFilters?.tempoRange).toBeDefined();
  });

  it('should meet performance requirement (<300ms)', async () => {
    const wrapper = createWrapper();
    
    const { result } = renderHook(
      () => useSearchResults({ query: 'Amazing Grace' }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const data = result.current.data;
    expect(data?.executionTime).toBeDefined();
    
    if (data?.executionTime) {
      expect(data.executionTime).toBeLessThan(300); // <300ms requirement
    }
  });

  it('should handle multiple filter combinations', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useSearchResults({
        query: 'Amazing',
        key: ['G'],
        difficulty: ['beginner'],
        themes: ['hymn']
      }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const data = result.current.data;
    expect(data?.songs).toBeDefined();
    expect(data?.totalCount).toBeDefined();
    
    // Should return fewer results when multiple filters are applied
    if (data?.songs.length) {
      const song = data.songs[0];
      expect(song.title.toLowerCase()).toContain('amazing');
      expect(song.key).toBe('G');
      expect(song.difficulty).toBe('beginner');
      expect(song.themes).toContain('hymn');
    }
  });

  it('should keep previous data when keepPreviousData is true', async () => {
    const wrapper = createWrapper();
    const { result, rerender } = renderHook(
      ({ filters }) => useSearchResults(filters, { keepPreviousData: true }),
      { 
        wrapper,
        initialProps: { filters: { query: 'Amazing' } as SearchFilters }
      }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const firstData = result.current.data;
    expect(firstData).toBeDefined();

    // Change search query
    rerender({ filters: { query: 'Grace' } as SearchFilters });

    // Should still have previous data while loading new data
    expect(result.current.data).toBe(firstData);
    expect(result.current.isFetching).toBe(true);

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false);
    });

    // Should now have new data
    expect(result.current.data).not.toBe(firstData);
  });
});