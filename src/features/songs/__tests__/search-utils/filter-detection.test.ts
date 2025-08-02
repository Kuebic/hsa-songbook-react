/**
 * @file filter-detection.test.ts
 * @description Tests for search filter detection utilities - hasActiveFilters and getActiveFilterCount
 */

import { describe, it, expect } from 'vitest';
import { hasActiveFilters, getActiveFilterCount } from '../../utils/searchUtils';
import type { SearchFilters } from '../../types/search.types';
import { createMockSearchFilters } from '../../../../test/factories/typeSafeMockFactory';
import type { MockSearchFilters } from '../../../../test/types/test-fixtures.types';
import { expectSearchFilters } from '../../../../test/utils/typeSafeAssertions';

describe('Search Utils - Filter Detection', () => {
  describe('hasActiveFilters', () => {
    it('should return false for empty filters', () => {
      const filters: SearchFilters = {};
      expect(hasActiveFilters(filters)).toBe(false);
    });

    it('should return false for default filters only', () => {
      const filters = createMockSearchFilters({
        query: '',
        page: 1,
        limit: 20,
        sortBy: 'relevance'
      });
      expect(hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when query is present', () => {
      const filters = createMockSearchFilters({ query: 'Amazing Grace' });
      expect(hasActiveFilters(filters)).toBe(true);
      expectSearchFilters(filters).toHaveActiveFilters();
    });

    it('should return false for empty query string', () => {
      const filters = createMockSearchFilters({ query: '' });
      expect(hasActiveFilters(filters)).toBe(false);
    });

    it('should return false for whitespace-only query', () => {
      const filters = createMockSearchFilters({ query: '   ' });
      expect(hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when key filters are present', () => {
      const filters = createMockSearchFilters({ key: ['G', 'C'] });
      expect(hasActiveFilters(filters)).toBe(true);
    });

    it('should return false when key filter is empty array', () => {
      const filters = createMockSearchFilters({ key: [] });
      expect(hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when difficulty filters are present', () => {
      const filters = createMockSearchFilters({ difficulty: ['beginner'] });
      expect(hasActiveFilters(filters)).toBe(true);
    });

    it('should return false when difficulty filter is empty array', () => {
      const filters = createMockSearchFilters({ difficulty: [] });
      expect(hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when theme filters are present', () => {
      const filters = createMockSearchFilters({ themes: ['hymn'] });
      expect(hasActiveFilters(filters)).toBe(true);
    });

    it('should return false when themes filter is empty array', () => {
      const filters = createMockSearchFilters({ themes: [] });
      expect(hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when source filters are present', () => {
      const filters = createMockSearchFilters({ source: ['CCLI'] });
      expect(hasActiveFilters(filters)).toBe(true);
    });

    it('should return false when source filter is empty array', () => {
      const filters = createMockSearchFilters({ source: [] });
      expect(hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when tempo filter is present', () => {
      const filters = createMockSearchFilters({ tempo: [80, 120] });
      expect(hasActiveFilters(filters)).toBe(true);
    });

    it('should return false when tempo filter is undefined', () => {
      const filters = createMockSearchFilters({ tempo: undefined });
      expect(hasActiveFilters(filters)).toBe(false);
    });

    it('should return false for empty arrays', () => {
      const filters = createMockSearchFilters({
        key: [],
        difficulty: [],
        themes: [],
        source: []
      });
      expect(hasActiveFilters(filters)).toBe(false);
      expectSearchFilters(filters).toBeEmpty();
    });

    it('should return true for any combination of active filters', () => {
      const filters = createMockSearchFilters({
        query: 'test',
        key: ['G'],
        difficulty: ['beginner'],
        themes: ['hymn']
      });
      expect(hasActiveFilters(filters)).toBe(true);
    });

    it('should handle null and undefined filter values', () => {
      const filters = createMockSearchFilters({
        query: null,
        key: undefined,
        difficulty: null,
        themes: undefined,
        source: null,
        tempo: undefined
      });
      expect(hasActiveFilters(filters)).toBe(false);
    });

    it('should ignore navigation-related filters', () => {
      const filters = createMockSearchFilters({
        page: 5,
        limit: 50,
        sortBy: 'title'
      });
      expect(hasActiveFilters(filters)).toBe(false);
    });

    it('should handle mixed active and inactive filters', () => {
      const filters = createMockSearchFilters({
        query: 'test',
        key: [], // Empty - not active
        difficulty: ['beginner'], // Active
        themes: [], // Empty - not active
        page: 2, // Navigation - ignored
        limit: 30 // Navigation - ignored
      });
      expect(hasActiveFilters(filters)).toBe(true);
    });

    it('should handle filters with falsy values', () => {
      const filters: SearchFilters = {
        query: '',
        key: [],
        difficulty: [],
        themes: [],
        source: [],
        tempo: undefined,
        page: 0, // Falsy but should be ignored
        limit: 0, // Falsy but should be ignored
        sortBy: '' as unknown as MockSearchFilters['sortBy'] // Falsy but should be ignored
      };
      expect(hasActiveFilters(filters)).toBe(false);
    });

    it('should be case-sensitive for query strings', () => {
      const filters1 = createMockSearchFilters({ query: 'Test' });
      const filters2 = createMockSearchFilters({ query: 'test' });
      
      expect(hasActiveFilters(filters1)).toBe(true);
      expect(hasActiveFilters(filters2)).toBe(true);
      // Both should be active regardless of case
    });

    it('should handle very long filter arrays', () => {
      const longKeyArray = Array.from({ length: 100 }, (_, i) => `key-${i}`);
      const filters = createMockSearchFilters({ key: longKeyArray });
      expect(hasActiveFilters(filters)).toBe(true);
    });

    it('should handle single-element arrays', () => {
      const filters = createMockSearchFilters({
        key: ['G'],
        difficulty: ['beginner'],
        themes: ['hymn'],
        source: ['CCLI']
      });
      expect(hasActiveFilters(filters)).toBe(true);
    });

    it('should handle tempo range edge cases', () => {
      const filters1 = createMockSearchFilters({ tempo: [0, 0] });
      const filters2 = createMockSearchFilters({ tempo: [60, 60] }); // Same min/max
      const filters3 = createMockSearchFilters({ tempo: [-1, 1000] }); // Extreme values
      
      expect(hasActiveFilters(filters1)).toBe(true);
      expect(hasActiveFilters(filters2)).toBe(true);
      expect(hasActiveFilters(filters3)).toBe(true);
    });
  });

  describe('getActiveFilterCount', () => {
    it('should return 0 for empty filters', () => {
      const filters: SearchFilters = {};
      expect(getActiveFilterCount(filters)).toBe(0);
    });

    it('should return 0 for default filters only', () => {
      const filters = createMockSearchFilters({
        query: '',
        page: 1,
        limit: 20,
        sortBy: 'relevance'
      });
      expect(getActiveFilterCount(filters)).toBe(0);
    });

    it('should count query as 1 filter', () => {
      const filters = createMockSearchFilters({ query: 'Amazing Grace' });
      expect(getActiveFilterCount(filters)).toBe(1);
    });

    it('should count each filter type separately', () => {
      const filters = createMockSearchFilters({
        query: 'test',
        key: ['G'],
        difficulty: ['beginner'],
        themes: ['hymn'],
        source: ['CCLI'],
        tempo: [80, 120]
      });
      expect(getActiveFilterCount(filters)).toBe(6);
    });

    it('should not count empty arrays', () => {
      const filters = createMockSearchFilters({
        key: [],
        difficulty: [],
        themes: [],
        source: []
      });
      expect(getActiveFilterCount(filters)).toBe(0);
    });

    it('should count multiple values in same filter as 1', () => {
      const filters = createMockSearchFilters({
        key: ['G', 'C', 'D'], // Multiple keys still count as 1 filter
        difficulty: ['beginner', 'intermediate'] // Multiple difficulties still count as 1 filter
      });
      expect(getActiveFilterCount(filters)).toBe(2);
    });

    it('should ignore navigation filters in count', () => {
      const filters = createMockSearchFilters({
        query: 'test',
        page: 5,
        limit: 50,
        sortBy: 'title'
      });
      expect(getActiveFilterCount(filters)).toBe(1); // Only query counts
    });

    it('should handle null and undefined values', () => {
      const filters = createMockSearchFilters({
        query: null,
        key: undefined,
        difficulty: null,
        themes: undefined,
        source: null,
        tempo: undefined
      });
      expect(getActiveFilterCount(filters)).toBe(0);
    });

    it('should handle mixed active and inactive filters', () => {
      const filters = createMockSearchFilters({
        query: 'test', // Active (1)
        key: ['G'], // Active (1)
        difficulty: [], // Not active
        themes: ['hymn'], // Active (1)
        source: [], // Not active
        tempo: [80, 120] // Active (1)
      });
      expect(getActiveFilterCount(filters)).toBe(4);
    });

    it('should handle empty string query', () => {
      const filters = createMockSearchFilters({
        query: '', // Should not count
        key: ['G'] // Should count
      });
      expect(getActiveFilterCount(filters)).toBe(1);
    });

    it('should handle whitespace-only query', () => {
      const filters = createMockSearchFilters({
        query: '   ', // Should not count
        difficulty: ['beginner'] // Should count
      });
      expect(getActiveFilterCount(filters)).toBe(1);
    });

    it('should handle very large filter combinations', () => {
      const filters = createMockSearchFilters({
        query: 'test',
        key: Array.from({ length: 50 }, (_, i) => `key-${i}`),
        difficulty: ['beginner', 'intermediate', 'advanced'],
        themes: Array.from({ length: 20 }, (_, i) => `theme-${i}`),
        source: Array.from({ length: 10 }, (_, i) => `source-${i}`),
        tempo: [60, 180]
      });
      expect(getActiveFilterCount(filters)).toBe(6); // Each filter type counts once
    });

    it('should be consistent with hasActiveFilters', () => {
      const testCases = [
        createMockSearchFilters({}),
        createMockSearchFilters({ query: 'test' }),
        createMockSearchFilters({ key: ['G'] }),
        createMockSearchFilters({ difficulty: [] }),
        createMockSearchFilters({ query: 'test', key: ['G'], tempo: [80, 120] }),
        createMockSearchFilters({ page: 5, limit: 20 }) // Navigation only
      ];

      testCases.forEach(filters => {
        const hasActive = hasActiveFilters(filters);
        const count = getActiveFilterCount(filters);
        
        if (hasActive) {
          expect(count).toBeGreaterThan(0);
        } else {
          expect(count).toBe(0);
        }
      });
    });

    it('should handle edge cases consistently', () => {
      const edgeCases = [
        { filters: createMockSearchFilters({ tempo: [0, 0] }), expectedCount: 1 },
        { filters: createMockSearchFilters({ key: [''] }), expectedCount: 1 }, // Empty string in array
        { filters: createMockSearchFilters({ query: '0' }), expectedCount: 1 }, // Falsy but valid query
        { filters: createMockSearchFilters({ difficulty: [''] as unknown as MockSearchFilters['difficulty'] }), expectedCount: 1 } // Empty string difficulty
      ];

      edgeCases.forEach(({ filters, expectedCount }) => {
        expect(getActiveFilterCount(filters)).toBe(expectedCount);
      });
    });

    it('should handle performance with many filters', () => {
      const startTime = performance.now();
      
      const filters = createMockSearchFilters({
        query: 'performance test',
        key: Array.from({ length: 1000 }, (_, i) => `key-${i}`),
        difficulty: Array.from({ length: 100 }, (_, i) => `diff-${i}`) as unknown as MockSearchFilters['difficulty'],
        themes: Array.from({ length: 500 }, (_, i) => `theme-${i}`),
        source: Array.from({ length: 200 }, (_, i) => `source-${i}`),
        tempo: [1, 999]
      });
      
      const count = getActiveFilterCount(filters);
      const endTime = performance.now();
      
      expect(count).toBe(6);
      expect(endTime - startTime).toBeLessThan(10); // Should be fast
    });
  });

  describe('Filter Detection Integration', () => {
    it('should work correctly with realistic filter scenarios', () => {
      // Scenario 1: New user with no filters
      const emptyFilters = createMockSearchFilters({});
      expect(hasActiveFilters(emptyFilters)).toBe(false);
      expect(getActiveFilterCount(emptyFilters)).toBe(0);

      // Scenario 2: User searching for a song
      const searchFilters = createMockSearchFilters({ query: 'Amazing Grace' });
      expect(hasActiveFilters(searchFilters)).toBe(true);
      expect(getActiveFilterCount(searchFilters)).toBe(1);

      // Scenario 3: User applying multiple filters
      const complexFilters = createMockSearchFilters({
        query: 'worship',
        key: ['G', 'C'],
        difficulty: ['beginner'],
        themes: ['hymn', 'worship'],
        tempo: [80, 120]
      });
      expect(hasActiveFilters(complexFilters)).toBe(true);
      expect(getActiveFilterCount(complexFilters)).toBe(5);

      // Scenario 4: User clearing filters one by one
      const partiallyCleared = createMockSearchFilters({
        query: '', // Cleared
        key: ['G'], // Still active
        difficulty: [], // Cleared
        themes: ['hymn'], // Still active
        tempo: undefined // Cleared
      });
      expect(hasActiveFilters(partiallyCleared)).toBe(true);
      expect(getActiveFilterCount(partiallyCleared)).toBe(2);
    });

    it('should handle filter state changes correctly', () => {
      // Start with empty filters
      let filters = createMockSearchFilters({});
      expect(hasActiveFilters(filters)).toBe(false);
      expect(getActiveFilterCount(filters)).toBe(0);

      // Add a query
      filters = { ...filters, query: 'test' };
      expect(hasActiveFilters(filters)).toBe(true);
      expect(getActiveFilterCount(filters)).toBe(1);

      // Add key filter
      filters = { ...filters, key: ['G'] };
      expect(hasActiveFilters(filters)).toBe(true);
      expect(getActiveFilterCount(filters)).toBe(2);

      // Clear query but keep key
      filters = { ...filters, query: '' };
      expect(hasActiveFilters(filters)).toBe(true);
      expect(getActiveFilterCount(filters)).toBe(1);

      // Clear all filters
      filters = { ...filters, key: [] };
      expect(hasActiveFilters(filters)).toBe(false);
      expect(getActiveFilterCount(filters)).toBe(0);
    });

    it('should maintain consistency across different input formats', () => {
      const testData = [
        // Different ways to represent empty/inactive filters
        { filters: {}, expected: { hasActive: false, count: 0 } },
        { filters: { query: '' }, expected: { hasActive: false, count: 0 } },
        { filters: { key: [] }, expected: { hasActive: false, count: 0 } },
        { filters: { query: '', key: [], difficulty: [] }, expected: { hasActive: false, count: 0 } },
        
        // Different ways to represent active filters
        { filters: { query: 'test' }, expected: { hasActive: true, count: 1 } },
        { filters: { key: ['G'] }, expected: { hasActive: true, count: 1 } },
        { filters: { tempo: [80, 120] }, expected: { hasActive: true, count: 1 } },
        
        // Mixed scenarios
        { filters: { query: 'test', key: [] }, expected: { hasActive: true, count: 1 } },
        { filters: { query: '', key: ['G'] }, expected: { hasActive: true, count: 1 } }
      ];

      testData.forEach(({ filters, expected }) => {
        expect(hasActiveFilters(filters)).toBe(expected.hasActive);
        expect(getActiveFilterCount(filters)).toBe(expected.count);
      });
    });
  });
});