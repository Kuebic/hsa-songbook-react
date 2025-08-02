/**
 * @file core-functionality.test.ts
 * @description Tests for useSearchQuery hook core functionality and initialization
 */

import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useSearchQuery } from '../../hooks/useSearchQuery';
import { createRouterMocks, RouterWrapper } from '../../../../test/testWrappers';

// Mock react-router-dom
const routerMocks = createRouterMocks();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useSearchParams: () => [routerMocks.searchParams, routerMocks.setSearchParams]
  };
});

describe('useSearchQuery - Core Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    routerMocks.clearSearchParams();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Hook Initialization', () => {
    it('should initialize with default filters', () => {
      const { result } = renderHook(() => useSearchQuery(), { 
        wrapper: RouterWrapper 
      });

      expect(result.current.filters.query).toBe('');
      expect(result.current.filters.page).toBe(1);
      expect(result.current.filters.limit).toBe(20);
      expect(result.current.filters.sortBy).toBe('relevance');
    });

    it('should initialize with custom default filters', () => {
      const defaultFilters = { 
        query: 'test', 
        difficulty: ['beginner' as const],
        limit: 50
      };
      
      const { result } = renderHook(
        () => useSearchQuery({ defaultFilters }),
        { wrapper: RouterWrapper }
      );

      expect(result.current.filters.query).toBe('test');
      expect(result.current.filters.difficulty).toEqual(['beginner']);
      expect(result.current.filters.limit).toBe(50);
      expect(result.current.filters.page).toBe(1); // Should still use default for unspecified
    });

    it('should merge custom defaults with standard defaults', () => {
      const defaultFilters = { 
        query: 'custom',
        key: ['G', 'C']
      };
      
      const { result } = renderHook(
        () => useSearchQuery({ defaultFilters }),
        { wrapper: RouterWrapper }
      );

      expect(result.current.filters.query).toBe('custom');
      expect(result.current.filters.key).toEqual(['G', 'C']);
      expect(result.current.filters.page).toBe(1); // Default preserved
      expect(result.current.filters.limit).toBe(20); // Default preserved
      expect(result.current.filters.sortBy).toBe('relevance'); // Default preserved
    });

    it('should provide all required hook methods', () => {
      const { result } = renderHook(() => useSearchQuery(), { 
        wrapper: RouterWrapper 
      });

      expect(typeof result.current.setQuery).toBe('function');
      expect(typeof result.current.updateFilter).toBe('function');
      expect(typeof result.current.updateFilters).toBe('function');
      expect(typeof result.current.clearFilters).toBe('function');
      expect(typeof result.current.clearFilter).toBe('function');
      expect(typeof result.current.getShareableUrl).toBe('function');
      expect(typeof result.current.loadFromUrl).toBe('function');
    });

    it('should initialize without URL sync by default', () => {
      renderHook(() => useSearchQuery(), { 
        wrapper: RouterWrapper 
      });

      // Should not attempt to sync with URL initially
      expect(routerMocks.setSearchParams).not.toHaveBeenCalled();
    });

    it('should initialize with URL sync when enabled', () => {
      const { result } = renderHook(
        () => useSearchQuery({ syncWithUrl: true }),
        { wrapper: RouterWrapper }
      );

      // Should attempt to load from URL on initialization
      expect(result.current.filters).toBeDefined();
    });

    it('should handle hook options correctly', () => {
      const onSearch = vi.fn();
      const defaultFilters = { query: 'test' };
      
      const { result } = renderHook(
        () => useSearchQuery({
          debounceDelay: 500,
          syncWithUrl: true,
          defaultFilters,
          onSearch
        }),
        { wrapper: RouterWrapper }
      );

      expect(result.current.filters.query).toBe('test');
      expect(typeof result.current.setQuery).toBe('function');
    });
  });

  describe('Basic Query Management', () => {
    it('should update query with setQuery', () => {
      const { result } = renderHook(() => useSearchQuery(), { 
        wrapper: RouterWrapper 
      });

      act(() => {
        result.current.setQuery('Amazing Grace');
      });

      expect(result.current.filters.query).toBe('Amazing Grace');
    });

    it('should clear query when setting empty string', () => {
      const { result } = renderHook(() => useSearchQuery(), { 
        wrapper: RouterWrapper 
      });

      act(() => {
        result.current.setQuery('test');
      });
      expect(result.current.filters.query).toBe('test');

      act(() => {
        result.current.setQuery('');
      });
      expect(result.current.filters.query).toBe('');
    });

    it('should handle whitespace in queries', () => {
      const { result } = renderHook(() => useSearchQuery(), { 
        wrapper: RouterWrapper 
      });

      act(() => {
        result.current.setQuery('  Amazing Grace  ');
      });

      // Should preserve whitespace as entered
      expect(result.current.filters.query).toBe('  Amazing Grace  ');
    });

    it('should handle special characters in queries', () => {
      const { result } = renderHook(() => useSearchQuery(), { 
        wrapper: RouterWrapper 
      });

      const specialQuery = "Lord's Prayer & Communion (Holy)";
      
      act(() => {
        result.current.setQuery(specialQuery);
      });

      expect(result.current.filters.query).toBe(specialQuery);
    });

    it('should reset page to 1 when query changes', () => {
      const { result } = renderHook(() => useSearchQuery(), { 
        wrapper: RouterWrapper 
      });

      // Set page to something other than 1
      act(() => {
        result.current.updateFilter('page', 5);
      });
      expect(result.current.filters.page).toBe(5);

      // Change query - should reset page
      act(() => {
        result.current.setQuery('new query');
      });
      expect(result.current.filters.page).toBe(1);
      expect(result.current.filters.query).toBe('new query');
    });

    it('should handle rapid query updates', () => {
      const { result } = renderHook(() => useSearchQuery(), { 
        wrapper: RouterWrapper 
      });

      act(() => {
        result.current.setQuery('A');
        result.current.setQuery('Am');
        result.current.setQuery('Amazing');
        result.current.setQuery('Amazing Grace');
      });

      expect(result.current.filters.query).toBe('Amazing Grace');
    });
  });

  describe('Filter Updates', () => {
    it('should update individual filters', () => {
      const { result } = renderHook(() => useSearchQuery(), { 
        wrapper: RouterWrapper 
      });

      act(() => {
        result.current.updateFilter('key', ['G', 'C']);
      });

      expect(result.current.filters.key).toEqual(['G', 'C']);
    });

    it('should update multiple filters at once', () => {
      const { result } = renderHook(() => useSearchQuery(), { 
        wrapper: RouterWrapper 
      });

      act(() => {
        result.current.updateFilters({
          query: 'test',
          key: ['G'],
          difficulty: ['beginner'],
          limit: 50
        });
      });

      expect(result.current.filters.query).toBe('test');
      expect(result.current.filters.key).toEqual(['G']);
      expect(result.current.filters.difficulty).toEqual(['beginner']);
      expect(result.current.filters.limit).toBe(50);
    });

    it('should preserve unchanged filters when updating', () => {
      const { result } = renderHook(() => useSearchQuery(), { 
        wrapper: RouterWrapper 
      });

      // Set initial filters
      act(() => {
        result.current.updateFilters({
          query: 'original',
          key: ['G'],
          difficulty: ['beginner']
        });
      });

      // Update only some filters
      act(() => {
        result.current.updateFilters({
          query: 'updated',
          tempo: [80, 120]
        });
      });

      expect(result.current.filters.query).toBe('updated');
      expect(result.current.filters.key).toEqual(['G']); // Preserved
      expect(result.current.filters.difficulty).toEqual(['beginner']); // Preserved
      expect(result.current.filters.tempo).toEqual([80, 120]); // New
    });

    it('should handle undefined filter updates', () => {
      const { result } = renderHook(() => useSearchQuery(), { 
        wrapper: RouterWrapper 
      });

      act(() => {
        result.current.updateFilter('key', ['G']);
      });
      expect(result.current.filters.key).toEqual(['G']);

      act(() => {
        result.current.updateFilter('key', undefined);
      });
      expect(result.current.filters.key).toBeUndefined();
    });

    it('should handle null filter updates', () => {
      const { result } = renderHook(() => useSearchQuery(), { 
        wrapper: RouterWrapper 
      });

      act(() => {
        result.current.updateFilter('difficulty', ['beginner']);
      });
      expect(result.current.filters.difficulty).toEqual(['beginner']);

      act(() => {
        result.current.updateFilter('difficulty', null);
      });
      expect(result.current.filters.difficulty).toBeNull();
    });
  });

  describe('Filter Clearing', () => {
    it('should clear all filters', () => {
      const { result } = renderHook(() => useSearchQuery(), { 
        wrapper: RouterWrapper 
      });

      // Set some filters
      act(() => {
        result.current.updateFilters({
          query: 'test',
          key: ['G'],
          difficulty: ['beginner'],
          themes: ['hymn'],
          page: 5
        });
      });

      // Clear all filters
      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.filters.query).toBe('');
      expect(result.current.filters.key).toEqual([]);
      expect(result.current.filters.difficulty).toEqual([]);
      expect(result.current.filters.themes).toEqual([]);
      expect(result.current.filters.page).toBe(1);
      expect(result.current.filters.limit).toBe(20); // Should reset to default
      expect(result.current.filters.sortBy).toBe('relevance'); // Should reset to default
    });

    it('should clear specific filter', () => {
      const { result } = renderHook(() => useSearchQuery(), { 
        wrapper: RouterWrapper 
      });

      // Set multiple filters
      act(() => {
        result.current.updateFilters({
          query: 'test',
          key: ['G'],
          difficulty: ['beginner']
        });
      });

      // Clear only key filter
      act(() => {
        result.current.clearFilter('key');
      });

      expect(result.current.filters.query).toBe('test'); // Preserved
      expect(result.current.filters.key).toEqual([]); // Cleared
      expect(result.current.filters.difficulty).toEqual(['beginner']); // Preserved
    });

    it('should handle clearing non-existent filters', () => {
      const { result } = renderHook(() => useSearchQuery(), { 
        wrapper: RouterWrapper 
      });

      // Clear filter that was never set
      act(() => {
        result.current.clearFilter('themes');
      });

      expect(result.current.filters.themes).toEqual([]);
    });

    it('should reset to custom defaults when clearing', () => {
      const defaultFilters = { 
        query: 'default',
        limit: 50,
        sortBy: 'title' as const
      };
      
      const { result } = renderHook(
        () => useSearchQuery({ defaultFilters }),
        { wrapper: RouterWrapper }
      );

      // Change from defaults
      act(() => {
        result.current.updateFilters({
          query: 'changed',
          limit: 100,
          sortBy: 'artist'
        });
      });

      // Clear should reset to custom defaults
      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.filters.query).toBe('default');
      expect(result.current.filters.limit).toBe(50);
      expect(result.current.filters.sortBy).toBe('title');
    });
  });

  describe('State Consistency', () => {
    it('should maintain state consistency across updates', () => {
      const { result } = renderHook(() => useSearchQuery(), { 
        wrapper: RouterWrapper 
      });

      const updates = [
        { query: 'test1', key: ['G'] },
        { difficulty: ['beginner'] },
        { themes: ['hymn'], tempo: [80, 120] },
        { page: 2, limit: 50 }
      ];

      updates.forEach(update => {
        act(() => {
          result.current.updateFilters(update);
        });
      });

      // All updates should be preserved
      expect(result.current.filters.query).toBe('test1');
      expect(result.current.filters.key).toEqual(['G']);
      expect(result.current.filters.difficulty).toEqual(['beginner']);
      expect(result.current.filters.themes).toEqual(['hymn']);
      expect(result.current.filters.tempo).toEqual([80, 120]);
      expect(result.current.filters.page).toBe(2);
      expect(result.current.filters.limit).toBe(50);
    });

    it('should handle concurrent updates correctly', () => {
      const { result } = renderHook(() => useSearchQuery(), { 
        wrapper: RouterWrapper 
      });

      act(() => {
        // Simulate rapid concurrent updates
        result.current.setQuery('test');
        result.current.updateFilter('key', ['G']);
        result.current.updateFilter('difficulty', ['beginner']);
      });

      expect(result.current.filters.query).toBe('test');
      expect(result.current.filters.key).toEqual(['G']);
      expect(result.current.filters.difficulty).toEqual(['beginner']);
    });

    it('should preserve filter types correctly', () => {
      const { result } = renderHook(() => useSearchQuery(), { 
        wrapper: RouterWrapper 
      });

      act(() => {
        result.current.updateFilters({
          query: 'string',
          key: ['array', 'of', 'strings'],
          difficulty: ['typed', 'array'] as const,
          tempo: [80, 120] as [number, number],
          page: 1,
          limit: 20,
          sortBy: 'relevance' as const
        });
      });

      expect(typeof result.current.filters.query).toBe('string');
      expect(Array.isArray(result.current.filters.key)).toBe(true);
      expect(Array.isArray(result.current.filters.difficulty)).toBe(true);
      expect(Array.isArray(result.current.filters.tempo)).toBe(true);
      expect(typeof result.current.filters.page).toBe('number');
      expect(typeof result.current.filters.limit).toBe('number');
      expect(typeof result.current.filters.sortBy).toBe('string');
    });
  });

  describe('Hook Lifecycle', () => {
    it('should maintain state across re-renders', () => {
      const { result, rerender } = renderHook(() => useSearchQuery(), { 
        wrapper: RouterWrapper 
      });

      act(() => {
        result.current.setQuery('persistent');
      });

      rerender();

      expect(result.current.filters.query).toBe('persistent');
    });

    it('should update when options change', () => {
      let options = { defaultFilters: { query: 'initial' } };
      
      const { result, rerender } = renderHook(
        () => useSearchQuery(options),
        { wrapper: RouterWrapper }
      );

      expect(result.current.filters.query).toBe('initial');

      options = { defaultFilters: { query: 'updated' } };
      rerender();

      // Note: Default filters typically only apply on initial render
      // This tests that the hook handles option changes gracefully
      expect(result.current.filters.query).toBe('initial');
    });

    it('should cleanup properly on unmount', () => {
      const { unmount } = renderHook(() => useSearchQuery(), { 
        wrapper: RouterWrapper 
      });

      // Should not throw on unmount
      expect(() => unmount()).not.toThrow();
    });
  });
});