/**
 * @file searchUtils.test.ts
 * @description Tests for search utility functions
 */

import { describe, it, expect } from 'vitest';
import {
  hasActiveFilters,
  getActiveFilterCount,
  createFilterChips,
  validateSearchFilters
} from '../utils/searchUtils';
import type { SearchFilters } from '../types/search.types';

describe('searchUtils', () => {
  describe('hasActiveFilters', () => {
    it('should return false for empty filters', () => {
      const filters: SearchFilters = {};
      expect(hasActiveFilters(filters)).toBe(false);
    });

    it('should return false for default filters only', () => {
      const filters: SearchFilters = {
        query: '',
        page: 1,
        limit: 20,
        sortBy: 'relevance'
      };
      expect(hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when query is present', () => {
      const filters: SearchFilters = { query: 'Amazing Grace' };
      expect(hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when key filters are present', () => {
      const filters: SearchFilters = { key: ['G', 'C'] };
      expect(hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when difficulty filters are present', () => {
      const filters: SearchFilters = { difficulty: ['beginner'] };
      expect(hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when theme filters are present', () => {
      const filters: SearchFilters = { themes: ['hymn'] };
      expect(hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when source filters are present', () => {
      const filters: SearchFilters = { source: ['CCLI'] };
      expect(hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when tempo filter is present', () => {
      const filters: SearchFilters = { tempo: [80, 120] };
      expect(hasActiveFilters(filters)).toBe(true);
    });

    it('should return false for empty arrays', () => {
      const filters: SearchFilters = {
        key: [],
        difficulty: [],
        themes: [],
        source: []
      };
      expect(hasActiveFilters(filters)).toBe(false);
    });

    it('should return true for any combination of active filters', () => {
      const filters: SearchFilters = {
        query: 'test',
        key: ['G'],
        difficulty: ['beginner'],
        themes: ['hymn']
      };
      expect(hasActiveFilters(filters)).toBe(true);
    });
  });

  describe('getActiveFilterCount', () => {
    it('should return 0 for empty filters', () => {
      const filters: SearchFilters = {};
      expect(getActiveFilterCount(filters)).toBe(0);
    });

    it('should return 0 for default filters only', () => {
      const filters: SearchFilters = {
        query: '',
        page: 1,
        limit: 20,
        sortBy: 'relevance'
      };
      expect(getActiveFilterCount(filters)).toBe(0);
    });

    it('should count query as 1 filter', () => {
      const filters: SearchFilters = { query: 'Amazing Grace' };
      expect(getActiveFilterCount(filters)).toBe(1);
    });

    it('should count array filters as 1 filter each', () => {
      const filters: SearchFilters = {
        key: ['G', 'C'],
        difficulty: ['beginner', 'intermediate', 'advanced']
      };
      expect(getActiveFilterCount(filters)).toBe(2); // key filter + difficulty filter
    });

    it('should count tempo as 1 filter', () => {
      const filters: SearchFilters = { tempo: [80, 120] };
      expect(getActiveFilterCount(filters)).toBe(1);
    });

    it('should count all active filters correctly', () => {
      const filters: SearchFilters = {
        query: 'test',           // 1
        key: ['G', 'C'],         // 1
        difficulty: ['beginner'], // 1
        themes: ['hymn', 'worship'], // 1
        source: ['CCLI'],        // 1
        tempo: [80, 120]         // 1
      };
      expect(getActiveFilterCount(filters)).toBe(6);
    });

    it('should not count empty arrays', () => {
      const filters: SearchFilters = {
        query: 'test',
        key: [],
        difficulty: [],
        themes: ['hymn']
      };
      expect(getActiveFilterCount(filters)).toBe(2); // query + themes
    });

    it('should count non-relevance sortBy as active filter', () => {
      const filters: SearchFilters = { sortBy: 'title' };
      expect(getActiveFilterCount(filters)).toBe(1);
    });

    it('should not count relevance sortBy as active filter', () => {
      const filters: SearchFilters = { sortBy: 'relevance' };
      expect(getActiveFilterCount(filters)).toBe(0);
    });
  });

  describe('createFilterChips', () => {
    it('should return empty array for no active filters', () => {
      const filters: SearchFilters = {};
      const chips = createFilterChips(filters);
      expect(chips).toEqual([]);
    });

    it('should create chip for query', () => {
      const filters: SearchFilters = { query: 'Amazing Grace' };
      const chips = createFilterChips(filters);
      
      expect(chips).toHaveLength(1);
      expect(chips[0]).toEqual({
        key: 'query',
        label: 'Search',
        value: 'Amazing Grace',
        onRemove: expect.any(Function)
      });
    });

    it('should create chips for key filters', () => {
      const filters: SearchFilters = { key: ['G', 'C'] };
      const chips = createFilterChips(filters);
      
      expect(chips).toHaveLength(2);
      expect(chips[0]).toEqual({
        key: 'key-G',
        label: 'Key',
        value: 'G',
        onRemove: expect.any(Function)
      });
      expect(chips[1]).toEqual({
        key: 'key-C',
        label: 'Key',
        value: 'C',
        onRemove: expect.any(Function)
      });
    });

    it('should create chips for difficulty filters', () => {
      const filters: SearchFilters = { difficulty: ['beginner', 'advanced'] };
      const chips = createFilterChips(filters);
      
      expect(chips).toHaveLength(2);
      expect(chips[0]).toEqual({
        key: 'difficulty-beginner',
        label: 'Difficulty',
        value: 'beginner',
        onRemove: expect.any(Function)
      });
      expect(chips[1]).toEqual({
        key: 'difficulty-advanced',
        label: 'Difficulty',
        value: 'advanced',
        onRemove: expect.any(Function)
      });
    });

    it('should create chips for theme filters', () => {
      const filters: SearchFilters = { themes: ['hymn'] };
      const chips = createFilterChips(filters);
      
      expect(chips).toHaveLength(1);
      expect(chips[0]).toEqual({
        key: 'theme-hymn',
        label: 'Theme',
        value: 'hymn',
        onRemove: expect.any(Function)
      });
    });

    it('should create chips for source filters', () => {
      const filters: SearchFilters = { source: ['CCLI'] };
      const chips = createFilterChips(filters);
      
      expect(chips).toHaveLength(1);
      expect(chips[0]).toEqual({
        key: 'source-CCLI',
        label: 'Source',
        value: 'CCLI',
        onRemove: expect.any(Function)
      });
    });

    it('should create chip for tempo range', () => {
      const filters: SearchFilters = { tempo: [80, 120] };
      const chips = createFilterChips(filters);
      
      expect(chips).toHaveLength(1);
      expect(chips[0]).toEqual({
        key: 'tempo',
        label: 'Tempo',
        value: '80-120 BPM',
        onRemove: expect.any(Function)
      });
    });

    it('should create chips for all filter types', () => {
      const filters: SearchFilters = {
        query: 'test',
        key: ['G'],
        difficulty: ['beginner'],
        themes: ['hymn'],
        source: ['CCLI'],
        tempo: [80, 120],
        sortBy: 'title'
      };
      const chips = createFilterChips(filters);
      
      expect(chips).toHaveLength(7);
      
      // Check keys are present
      const keys = chips.map(chip => chip.key);
      expect(keys).toContain('query');
      expect(keys).toContain('key-G');
      expect(keys).toContain('difficulty-beginner');
      expect(keys).toContain('theme-hymn');
      expect(keys).toContain('source-CCLI');
      expect(keys).toContain('tempo');
      expect(keys).toContain('sortBy');
    });

    it('should not create chips for empty arrays', () => {
      const filters: SearchFilters = {
        key: [],
        difficulty: [],
        themes: [],
        source: []
      };
      const chips = createFilterChips(filters);
      expect(chips).toEqual([]);
    });

    it('should test onRemove functions work correctly', () => {
      const filters: SearchFilters = {
        query: 'test',
        key: ['G', 'C']
      };
      const chips = createFilterChips(filters);
      
      // Test query removal
      const queryChip = chips.find(chip => chip.key === 'query');
      expect(queryChip?.onRemove()).toEqual({ query: '' });
      
      // Test key removal
      const keyGChip = chips.find(chip => chip.key === 'key-G');
      expect(keyGChip?.onRemove()).toEqual({ key: ['C'] });
    });
  });

  describe('validateSearchFilters', () => {
    it('should validate empty filters as valid', () => {
      const filters: SearchFilters = {};
      const result = validateSearchFilters(filters);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should validate basic filters as valid', () => {
      const filters: SearchFilters = {
        query: 'Amazing Grace',
        key: ['G', 'C'],
        difficulty: ['beginner'],
        sortBy: 'title'
      };
      const result = validateSearchFilters(filters);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject invalid page numbers', () => {
      const filters: SearchFilters = { page: 0 };
      const result = validateSearchFilters(filters);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Page number must be between 1 and 1000');
    });

    it('should reject page numbers that are too high', () => {
      const filters: SearchFilters = { page: 1001 };
      const result = validateSearchFilters(filters);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Page number must be between 1 and 1000');
    });

    it('should reject invalid limit numbers', () => {
      const filters: SearchFilters = { limit: -5 };
      const result = validateSearchFilters(filters);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Results per page must be between 1 and 100');
    });

    it('should reject limit numbers that are too high', () => {
      const filters: SearchFilters = { limit: 150 };
      const result = validateSearchFilters(filters);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Results per page must be between 1 and 100');
    });

    it('should reject invalid tempo ranges - min >= max', () => {
      const filters: SearchFilters = { tempo: [120, 120] }; // min equals max
      const result = validateSearchFilters(filters);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Tempo range must be between 60-200 BPM with min < max');
    });

    it('should reject invalid tempo ranges - values out of range', () => {
      const filters: SearchFilters = { tempo: [10, 500] };
      const result = validateSearchFilters(filters);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Tempo range must be between 60-200 BPM with min < max');
    });

    it('should reject valid tempo ranges that are backward', () => {
      const filters: SearchFilters = { tempo: [150, 80] }; // max < min
      const result = validateSearchFilters(filters);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Tempo range must be between 60-200 BPM with min < max');
    });

    it('should accept valid tempo ranges', () => {
      const filters: SearchFilters = { tempo: [80, 120] };
      const result = validateSearchFilters(filters);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should accumulate multiple validation errors', () => {
      const filters: SearchFilters = {
        page: -1,
        limit: 200,
        tempo: [500, 600]
      };
      const result = validateSearchFilters(filters);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3);
      expect(result.errors).toContain('Page number must be between 1 and 1000');
      expect(result.errors).toContain('Results per page must be between 1 and 100');
      expect(result.errors).toContain('Tempo range must be between 60-200 BPM with min < max');
    });

    it('should validate arrays as valid (no specific validation)', () => {
      const filters: SearchFilters = {
        key: [],
        difficulty: [],
        themes: [],
        source: []
      };
      const result = validateSearchFilters(filters);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject query strings that are too long', () => {
      const longQuery = 'a'.repeat(101); // More than 100 chars
      const filters: SearchFilters = { query: longQuery };
      const result = validateSearchFilters(filters);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Search query must be less than 100 characters');
    });

    it('should accept query strings within limit', () => {
      const validQuery = 'a'.repeat(100); // Exactly 100 chars
      const filters: SearchFilters = { query: validQuery };
      const result = validateSearchFilters(filters);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should allow any theme values (no specific validation)', () => {
      const filters: SearchFilters = {
        themes: ['hymn', 'worship', 'contemporary', 'praise', 'christmas']
      };
      const result = validateSearchFilters(filters);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });
});