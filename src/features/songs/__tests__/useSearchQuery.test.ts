/**
 * @file useSearchQuery.test.ts
 * @description Tests for useSearchQuery hook
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { useSearchQuery } from '../hooks/useSearchQuery';
// SearchFilters type is not used in this test file

// Mock react-router-dom
const mockSetSearchParams = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useSearchParams: () => [mockSearchParams, mockSetSearchParams]
  };
});

// Create test wrapper with BrowserRouter
const createWrapper = () => {
  return ({ children }: { children: React.ReactNode }) => (
    React.createElement(BrowserRouter, {}, children)
  );
};

describe('useSearchQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockSearchParams.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Basic functionality', () => {
    it('should initialize with default filters', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useSearchQuery(), { wrapper });

      expect(result.current.filters.query).toBe('');
      expect(result.current.filters.page).toBe(1);
      expect(result.current.filters.limit).toBe(20);
      expect(result.current.filters.sortBy).toBe('relevance');
    });

    it('should initialize with custom default filters', () => {
      const wrapper = createWrapper();
      const defaultFilters = { query: 'test', difficulty: ['beginner'] as const };
      
      const { result } = renderHook(
        () => useSearchQuery({ defaultFilters }),
        { wrapper }
      );

      expect(result.current.filters.query).toBe('test');
      expect(result.current.filters.difficulty).toEqual(['beginner']);
    });
  });

  describe('Query management', () => {
    it('should update query with setQuery', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useSearchQuery(), { wrapper });

      act(() => {
        result.current.setQuery('Amazing Grace');
      });

      expect(result.current.filters.query).toBe('Amazing Grace');
    });

    it('should debounce query changes with correct delay', async () => {
      const onSearch = vi.fn();
      const wrapper = createWrapper();
      
      const { result } = renderHook(
        () => useSearchQuery({ debounceDelay: 300, onSearch }),
        { wrapper }
      );

      // Set query multiple times quickly
      act(() => {
        result.current.setQuery('A');
      });
      act(() => {
        result.current.setQuery('Am');
      });
      act(() => {
        result.current.setQuery('Amazing');
      });

      // Should not call onSearch immediately
      expect(onSearch).not.toHaveBeenCalled();

      // Advance timers by 299ms - should still not call
      act(() => {
        vi.advanceTimersByTime(299);
      });
      expect(onSearch).not.toHaveBeenCalled();

      // Advance timers by 1ms more (total 300ms) - should call now
      act(() => {
        vi.advanceTimersByTime(1);
      });

      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledTimes(1);
        expect(onSearch).toHaveBeenCalledWith(
          expect.objectContaining({ query: 'Amazing' })
        );
      });
    });

    it('should clear query properly', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useSearchQuery(), { wrapper });

      act(() => {
        result.current.setQuery('test');
      });
      expect(result.current.filters.query).toBe('test');

      act(() => {
        result.current.setQuery('');
      });
      expect(result.current.filters.query).toBe('');
    });
  });

  describe('Filter management', () => {
    it('should update individual filters', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useSearchQuery(), { wrapper });

      act(() => {
        result.current.updateFilter('key', ['G', 'C']);
      });

      expect(result.current.filters.key).toEqual(['G', 'C']);
    });

    it('should update multiple filters at once', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useSearchQuery(), { wrapper });

      act(() => {
        result.current.updateFilters({
          key: ['G'],
          difficulty: ['beginner'],
          tempo: [80, 120]
        });
      });

      expect(result.current.filters.key).toEqual(['G']);
      expect(result.current.filters.difficulty).toEqual(['beginner']);
      expect(result.current.filters.tempo).toEqual([80, 120]);
    });

    it('should clear individual filters', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useSearchQuery(), { wrapper });

      act(() => {
        result.current.updateFilter('key', ['G', 'C']);
      });
      expect(result.current.filters.key).toEqual(['G', 'C']);

      act(() => {
        result.current.clearFilter('key');
      });
      expect(result.current.filters.key).toBeUndefined();
    });

    it('should clear all filters', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useSearchQuery(), { wrapper });

      act(() => {
        result.current.updateFilters({
          query: 'test',
          key: ['G'],
          difficulty: ['beginner']
        });
      });

      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.filters.query).toBe('');
      expect(result.current.filters.key).toBeUndefined();
      expect(result.current.filters.difficulty).toBeUndefined();
    });

    it('should reset page when non-page filters change', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useSearchQuery(), { wrapper });

      act(() => {
        result.current.updateFilter('page', 5);
      });
      expect(result.current.filters.page).toBe(5);

      act(() => {
        result.current.updateFilter('key', ['G']);
      });
      
      // Page should reset to 1 when other filters change
      expect(result.current.filters.page).toBe(1);
    });

    it('should not reset page when page itself changes', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useSearchQuery(), { wrapper });

      act(() => {
        result.current.updateFilter('page', 3);
      });

      expect(result.current.filters.page).toBe(3);
    });
  });

  describe('URL synchronization', () => {
    it('should sync filters to URL when syncWithUrl is true', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useSearchQuery({ syncWithUrl: true }),
        { wrapper }
      );

      act(() => {
        result.current.setQuery('Amazing Grace');
      });

      expect(mockSetSearchParams).toHaveBeenCalled();
    });

    it('should not sync to URL when syncWithUrl is false', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useSearchQuery({ syncWithUrl: false }),
        { wrapper }
      );

      act(() => {
        result.current.setQuery('Amazing Grace');
      });

      expect(mockSetSearchParams).not.toHaveBeenCalled();
    });

    it('should generate shareable URL', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useSearchQuery(), { wrapper });

      act(() => {
        result.current.updateFilters({
          query: 'Amazing Grace',
          key: ['G'],
          difficulty: ['beginner']
        });
      });

      const shareableUrl = result.current.getShareableUrl();
      expect(shareableUrl).toContain('query=Amazing%20Grace');
      expect(shareableUrl).toContain('key=G');
      expect(shareableUrl).toContain('difficulty=beginner');
    });

    it('should load filters from URL', () => {
      // Setup URL params
      mockSearchParams.set('query', 'Amazing Grace');
      mockSearchParams.set('key', 'G,C');
      mockSearchParams.set('difficulty', 'beginner,intermediate');

      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useSearchQuery({ syncWithUrl: true }),
        { wrapper }
      );

      expect(result.current.filters.query).toBe('Amazing Grace');
      expect(result.current.filters.key).toEqual(['G', 'C']);
      expect(result.current.filters.difficulty).toEqual(['beginner', 'intermediate']);
    });

    it('should handle tempo range in URL', () => {
      mockSearchParams.set('tempo', '80-120');

      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useSearchQuery({ syncWithUrl: true }),
        { wrapper }
      );

      expect(result.current.filters.tempo).toEqual([80, 120]);
    });

    it('should handle invalid URL params gracefully', () => {
      mockSearchParams.set('page', 'invalid');
      mockSearchParams.set('limit', '-5');
      mockSearchParams.set('tempo', 'invalid-range');

      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useSearchQuery({ syncWithUrl: true }),
        { wrapper }
      );

      // Should fallback to defaults for invalid values
      expect(result.current.filters.page).toBe(1);
      expect(result.current.filters.limit).toBe(20);
      expect(result.current.filters.tempo).toBeUndefined();
    });
  });

  describe('Search callbacks', () => {
    it('should call onSearch callback with correct filters', async () => {
      const onSearch = vi.fn();
      const wrapper = createWrapper();
      
      const { result } = renderHook(
        () => useSearchQuery({ onSearch }),
        { wrapper }
      );

      act(() => {
        result.current.setQuery('Amazing Grace');
      });

      // Wait for debounce
      act(() => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledWith(
          expect.objectContaining({ query: 'Amazing Grace' })
        );
      });
    });

    it('should not debounce non-query filter changes', async () => {
      const onSearch = vi.fn();
      const wrapper = createWrapper();
      
      const { result } = renderHook(
        () => useSearchQuery({ onSearch }),
        { wrapper }
      );

      act(() => {
        result.current.updateFilter('key', ['G']);
      });

      // Should call immediately without debounce for non-query changes
      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledWith(
          expect.objectContaining({ key: ['G'] })
        );
      });
    });

    it('should trigger initial search with meaningful filters', async () => {
      const onSearch = vi.fn();
      mockSearchParams.set('query', 'Amazing Grace');
      
      const wrapper = createWrapper();
      
      renderHook(
        () => useSearchQuery({ syncWithUrl: true, onSearch }),
        { wrapper }
      );

      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledWith(
          expect.objectContaining({ query: 'Amazing Grace' })
        );
      });
    });
  });

  describe('Custom debounce delay', () => {
    it('should respect custom debounce delay', async () => {
      const onSearch = vi.fn();
      const wrapper = createWrapper();
      
      const { result } = renderHook(
        () => useSearchQuery({ debounceDelay: 500, onSearch }),
        { wrapper }
      );

      act(() => {
        result.current.setQuery('test');
      });

      // Should not call after 300ms
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(onSearch).not.toHaveBeenCalled();

      // Should call after 500ms
      act(() => {
        vi.advanceTimersByTime(200);
      });

      await waitFor(() => {
        expect(onSearch).toHaveBeenCalled();
      });
    });
  });
});